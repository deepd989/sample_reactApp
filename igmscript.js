const axios = require('axios');
const fs = require('fs');

async function fetchAndLogResolvedProducts() {
    const BASE_URL = 'https://www.experapps.xyz/rest/V1';
    const TOKEN = 'i3c179msh3zyik4943d2cepu3l0hxezg'; 
    const SESSION_ID = 'knf1i0u1ivt69d5pskuurlndoa';

    const attributeCache = new Map();
    const errorLogs = [];

    const api = axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Cookie': `PHPSESSID=${SESSION_ID}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0' // Sometimes helps with 401s on restrictive firewalls
        }
    });

    try {
        console.log('--- Initiating Seller Fetch ---');
        const sellerRes = await api.get('/mpapi/sellers?searchCriteria=""');
        const sellers = sellerRes.data.items || [];
        
        const finalOutput = [];

        for (const seller of sellers) {
            const sId = seller.seller_data?.seller_id;
            if (!sId) continue;

            try {
                const productRes = await api.get(`/mpapi/admin/sellers/${sId}/product`);
                const products = productRes.data || [];

                const resolvedProducts = [];

                for (const product of products) {
                    const labeledAttributes = {};
                    const customAttributes = product.custom_attributes || [];

                    for (const attr of customAttributes) {
                        const code = attr.attribute_code;
                        let val = attr.value;

                        // Apply "dummyvalue" fallback
                        if (
                            val === undefined || 
                            val === null || 
                            val === "" || 
                            (Array.isArray(val) && val.length === 0)
                        ) {
                            val = "dummyvalue";
                        }

                        // Resolve labels via cache
                        if (val !== "dummyvalue" && !Array.isArray(val) && !attributeCache.has(code)) {
                            try {
                                const optRes = await api.get(`/products/attributes/${code}/options`);
                                attributeCache.set(code, optRes.data);
                            } catch (e) {
                                attributeCache.set(code, null);
                            }
                        }

                        const options = attributeCache.get(code);
                        const match = options?.find(opt => String(opt.value) === String(val));
                        labeledAttributes[code] = match ? match.label : val;
                    }

                    resolvedProducts.push({
                        sku: product.sku,
                        name: product.name,
                        resolved_attributes: labeledAttributes
                    });
                }

                finalOutput.push({
                    seller_id: sId,
                    shop_url: seller.seller_data.shop_url,
                    products: resolvedProducts
                });

            } catch (sellerError) {
                errorLogs.push({
                    timestamp: new Date().toISOString(),
                    context: `Seller ID: ${sId}`,
                    status: sellerError.response?.status || 'Network Error',
                    message: sellerError.message
                });
                continue; 
            }
        }

        // Write Success Data
        fs.writeFileSync('resolved_products.json', JSON.stringify(finalOutput, null, 4));
        console.log('✔ Success: Data saved to resolved_products.json');

    } catch (globalError) {
        errorLogs.push({
            timestamp: new Date().toISOString(),
            context: 'Global Initializer',
            message: globalError.message
        });
    } finally {
        // Write Error Logs if any occurred
        if (errorLogs.length > 0) {
            fs.writeFileSync('error_log.json', JSON.stringify(errorLogs, null, 4));
            console.log('✖ Errors encountered: Details saved to error_log.json');
        }
    }
}

fetchAndLogResolvedProducts();