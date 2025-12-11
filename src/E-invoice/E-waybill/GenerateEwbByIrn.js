import React, { useState, useEffect } from 'react';

// LocalStorage keys
const STORAGE_KEY = 'iris_einvoice_shared_config';
const LAST_IRN_KEY = 'iris_last_used_irn';
const LAST_EWB_KEY = 'iris_last_ewb_details';

// Utility: returns today in dd-mm-yyyy format
const todayIST = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const GenerateEwbByIrn = () => {
  const [config, setConfig] = useState({
    proxyBase: 'http://localhost:3001',
    endpoint: '/proxy/irn/generateEwbByIrn',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      companyId: '',
      'X-Auth-Token': '',
      product: 'ONYX',
    },
    body: {
      irn: '',
      userGstin: '01AAACI9260R002',
      transMode: 'ROAD',
      vehTyp: 'R',
      transDist: 150,
      subSplyTyp: 'Supply',
      subSplyDes: '',
      transName: 'Safe and Secure Transport',
      transDocNo: '9988',
      transDocDate: todayIST(),        // ✅ STATIC FIXED VALID DATE
      vehNo: 'MH20ZZ8888',
      transId: '01ACQPN4602B002',
      pobewb: null,
      paddr1: 'Warehouse Complex',
      paddr2: 'Sector 21',
      ploc: 'Mumbai',
      pstcd: '27',
      ppin: '400001',
      dNm: 'Receiver Pvt Ltd',
      daddr1: 'Market Road',
      daddr2: 'Central Plaza',
      disloc: 'Pune',
      disstcd: '27',
      dispin: '411001',
      docDate: todayIST(),            // ✅ INVOICE DATE STATIC & VALID
    },
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load Tokens, IRN, Last EWB
  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEY);
    const lastIrnData = localStorage.getItem(LAST_IRN_KEY);
    const lastEwbData = localStorage.getItem(LAST_EWB_KEY);

    setConfig(prev => {
      let updated = { ...prev };
      let b = { ...updated.body };
      let h = { ...updated.headers };

      if (lastIrnData) {
        try {
          const parsed = JSON.parse(lastIrnData);
          if (parsed.irn) b.irn = parsed.irn;
        } catch {}
      }

      if (lastEwbData) {
        try {
          const parsed = JSON.parse(lastEwbData);
          if (parsed.vehNo) b.vehNo = parsed.vehNo;
          if (parsed.transId) b.transId = parsed.transId;
        } catch {}
      }

      if (savedAuth) {
        try {
          const shared = JSON.parse(savedAuth);
          h.companyId = shared.companyId || h.companyId;
          h['X-Auth-Token'] = shared.token || h['X-Auth-Token'];
          b.userGstin = shared.companyUniqueCode || b.userGstin;
        } catch {}
      }

      updated.body = b;
      updated.headers = h;
      return updated;
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
        method: 'PUT',
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
        localStorage.setItem(LAST_EWB_KEY, JSON.stringify(data.response));
      }
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const isReady = config.headers.companyId && config.headers['X-Auth-Token'];

  const handleBodyChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      body: { ...prev.body, [key]: value },
    }));
  };

  return (
    <div style={{ padding: '30px', background: '#fff3e0', minHeight: '100vh' }}>
      <h1 style={{ color: '#ef6c00' }}>Generate E-Way Bill by IRN</h1>

      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{
          padding: '12px',
          background: isReady ? '#e8f5e9' : '#ffebee',
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <strong>Auth Status:</strong> {isReady ? 'Ready' : 'Missing token or company ID'}
        </div>

        {Object.entries(config.body).map(([key, value]) => (
          <div key={key} style={{ margin: '12px 0' }}>
            <strong>{key}:</strong>
            <input
              value={value ?? ''}
              onChange={e => handleBodyChange(key, e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #ffb74d',
                marginTop: '4px'
              }}
            />
          </div>
        ))}

        <button
          onClick={generateEWB}
          disabled={loading || !isReady}
          style={{
            width: '100%',
            padding: '18px',
            background: '#ef6c00',
            color: 'white',
            borderRadius: '12px',
            fontSize: '20px',
            marginTop: '25px'
          }}
        >
          {loading ? 'Generating EWB...' : 'GENERATE E-WAY BILL'}
        </button>
      </div>

      {response && (
        <pre style={{ background: '#222', color: '#0f0', padding: '20px', marginTop: '30px' }}>
          {JSON.stringify(response.body, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default GenerateEwbByIrn;
