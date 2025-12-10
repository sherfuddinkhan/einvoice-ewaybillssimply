import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'iris_einvoice_shared_config';
const LAST_IRN_KEY = 'iris_last_used_irn';
const LAST_EWB_KEY = 'iris_last_ewb_details';

const GenerateEwbByIrn = () => {
  const [config, setConfig] = useState({
    proxyBase: 'http://localhost:3001',
    endpoint: '/proxy/irn/generateEwbByIrn',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'companyId': '',
      'X-Auth-Token': '',
      'product': 'ONYX'
    },
    body: {
      irn: '',
      userGstin: '',
      transMode: 'ROAD',
      vehTyp: 'R',
      transDist: 0,
      subSplyTyp: 'Supply',
      subSplyDes: '',
      transName: 'Safe and Secure',
      transDocNo: '10294',
      transDocDate: '11-11-2025',
      vehNo: 'MH20ZZ8888',
      transId: '01ACQPN4602B002',
      pobewb: null,
      paddr1: 'Basket',
      paddr2: 'JVRoad',
      ploc: 'Nainital',
      pstcd: '18',
      ppin: '781006',
      dNm: 'ANV',
      daddr1: 'MKJIO',
      daddr2: 'KLIOOPPP',
      disloc: 'Nainital',
      disstcd: '27',
      dispin: '400602',
    }
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-populate IRN, user GSTIN, and last EWB details
 useEffect(() => {
  // Fetch stored data from localStorage
  const savedAuth = localStorage.getItem(STORAGE_KEY);
  const lastIrnData = localStorage.getItem(LAST_IRN_KEY);
  const lastEwbData = localStorage.getItem(LAST_EWB_KEY);

  setConfig(prev => {
    let newBody = { ...prev.body };

    // 1️⃣ Auto-populate last used IRN
    if (lastIrnData) {
      try {
        const lastIrn = JSON.parse(lastIrnData);
        if (lastIrn?.irn) newBody.irn = lastIrn.irn;
      } catch (err) {
        console.error("Failed to parse last IRN data:", err);
      }
    }

    // 2️⃣ Auto-populate last generated EWB details, especially EwbNo
    if (lastEwbData) {
      try {
        const lastEwb = JSON.parse(lastEwbData);
        if (lastEwb?.EwbNo) newBody.ewbNo = lastEwb.EwbNo;  // Extract EwbNo
        // Optionally populate other fields from lastEwb if needed
        // newBody.EwbDt = lastEwb.EwbDt;
        // newBody.EwbValidTill = lastEwb.EwbValidTill;
      } catch (err) {
        console.error("Failed to parse last EWB data:", err);
      }
    }

    // 3️⃣ Auto-populate user GSTIN from shared config
    let headers = { ...prev.headers };
    if (savedAuth) {
      try {
        const shared = JSON.parse(savedAuth);
        newBody.userGstin = shared.companyUniqueCode || newBody.userGstin;
        headers.companyId = shared.companyId || headers.companyId;
        headers['X-Auth-Token'] = shared.token || headers['X-Auth-Token'];
      } catch (err) {
        console.error("Failed to parse shared auth data:", err);
      }
    }

    return {
      ...prev,
      body: newBody,
      headers
    };
  });
}, []);

  const generateEWB = async () => {
    if (!config.body.irn.trim()) {
      alert('Please enter IRN');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${config.proxyBase}${config.endpoint}`, {
        method: 'PUT', // API expects PUT
        headers: config.headers,
        body: JSON.stringify(config.body),
      });

      const data = await res.json();
      const result = {
        status: res.status,
        body: data,
        time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
      };
      setResponse(result);

      if (res.ok && data.status === 'SUCCESS') {
        alert('E-Way Bill Generated Successfully!');
        localStorage.setItem(LAST_EWB_KEY, JSON.stringify(config.body));
      }
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const isReady = config.headers.companyId && config.headers['X-Auth-Token'];

  // Generic input handler for body fields
  const handleBodyChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      body: { ...prev.body, [key]: value }
    }));
  };

  return (
    <div style={{ padding: '30px', background: '#fff3e0', fontFamily: 'Segoe UI, Arial, sans-serif', minHeight: '100vh' }}>
      <h1 style={{ color: '#ef6c00', marginBottom: '10px', fontSize: '32px' }}>Generate E-Way Bill by IRN</h1>
      <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>All headers & payload visible before sending • Auto-filled from previous actions</p>

      <div style={{ background: 'white', padding: '35px', borderRadius: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', maxWidth: '900px', margin: '0 auto' }}>
        {/* EDITABLE FORM */}
        <h2 style={{ color: '#e65100', marginTop: '40px' }}>Edit E-Way Bill Details</h2>
        {Object.entries(config.body).map(([key, value]) => (
          <div key={key} style={{ margin: '12px 0' }}>
            <strong>{key}:</strong>
            <input
              value={value ?? ''}
              onChange={(e) => handleBodyChange(key, e.target.value)}
              placeholder={key}
              style={{ width: '100%', padding: '12px', marginTop: '4px', borderRadius: '8px', border: '2px solid #ffb74d', fontFamily: 'monospace' }}
            />
          </div>
        ))}

        {/* ACTION BUTTON */}
        <button
          onClick={generateEWB}
          disabled={loading || !isReady || !config.body.irn}
          style={{
            width: '100%',
            padding: '24px',
            marginTop: '40px',
            background: (!isReady || !config.body.irn || loading) ? '#999' : '#ef6c00',
            color: 'white',
            border: 'none',
            borderRadius: '16px',
            fontSize: '28px',
            fontWeight: 'bold',
            cursor: (!isReady || !config.body.irn || loading) ? 'not-allowed' : 'pointer',
            boxShadow: '0 12px 35px rgba(239,108,0,0.5)'
          }}
        >
          {loading ? 'Generating E-Way Bill...' : 'GENERATE E-WAY BILL'}
        </button>
      </div>

      {/* RESPONSE */}
      {response && (
        <div style={{ marginTop: '50px' }}>
          <h2 style={{ color: '#d84315', borderBottom: '3px solid #ff8a65', paddingBottom: '10px' }}>
            RESPONSE ({response.time} IST)
          </h2>
          <pre style={{ background: '#1e1e1e', color: '#00e676', padding: '30px', borderRadius: '16px', fontSize: '15px', marginTop: '20px', border: '2px solid #00e676' }}>
            {JSON.stringify(response.body || response, null, 2)}
          </pre>
        </div>
      )}

      <footer style={{ marginTop: '80px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
        IRIS GST ONYX • Auto-populated • November 18, 2025 • {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </footer>
    </div>
  );
};

export default GenerateEwbByIrn;
