import { useState } from 'react';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePostRequest = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rest/V1/mpapi/admin/sellers/4/product', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer i3c179msh3zyik4943d2cepu3l0hxezgexperapps2', // Replace with your actual token
          'Content-Type': 'application/json',
        }
      });
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("API Error:", error);
      setData({ error: "Failed to fetch data. Check console for CORS or Auth issues." });
    } finally {
      setLoading(false);
    }
  };

  // If data exists, render the "White Screen" view
  if (data) {
    return (
      <div style={{ padding: '20px', backgroundColor: 'white', color: 'black', minHeight: '100vh' }}>
        <button onClick={() => setData(null)} style={{ marginBottom: '20px' }}>← Back</button>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <button 
        onClick={handlePostRequest} 
        disabled={loading}
        style={{ padding: '15px 30px', fontSize: '16px', cursor: 'pointer' }}
      >
        {loading ? 'Processing...' : 'Post to Seller API'}
      </button>
    </div>
  );
}

export default App;