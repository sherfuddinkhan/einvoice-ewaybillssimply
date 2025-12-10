// GetEwbByIrnForm.js - IRN + All Fields Auto-Populated
import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'iris_einvoice_shared_config';

const GetEwbByIrn = () => {
  const [config, setConfig] = useState({
    proxyBase: 'http://localhost:3001',
    endpoint: '/proxy/irn/getEwbByIrn',
    headers: {
      'Accept': 'application/json',
      'companyId': '',
      'X-Auth-Token': '',
      'product': 'ONYX'
    },
    params: {
      irn: '',
      userGstin: '',
      updateFlag: true
    }
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-load IRN + auth + GSTIN from any previous action
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const shared = JSON.parse(saved);
        setConfig(prev => ({
          ...prev,
          headers: {
            ...prev.headers,
            companyId: shared.companyId || '',
            'X-Auth-Token': shared.token || ''
          },
          params: {
            ...prev.params,
            irn: shared.irn || prev.params.irn,           // ← IRN from Generate/Cancel/List
            userGstin: shared.companyUniqueCode || prev.params.userGstin
          }
        }));
      } catch (e) {
        console.warn('Failed to load shared config');
      }
    }
  }, []);

 const fetchEWB = async () => {
  if (!config.params.irn.trim()) {
    alert('Please enter or select an IRN');
    return;
  }

  setLoading(true);
  setResponse(null);

  const queryString = new URLSearchParams({
    irn: config.params.irn,
    userGstin: config.params.userGstin,
    updateFlag: config.params.updateFlag.toString()
  }).toString();

  const fullUrl = `${config.proxyBase}${config.endpoint}?${queryString}`;

  try {
    const res = await fetch(fullUrl, {
      method: 'GET',
      headers: config.headers
    });

    const data = await res.json();

    // Save response in state
    const result = {
      url: fullUrl,
      status: res.status,
      body: data,
      time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    };
    setResponse(result);

    // ✅ Save relevant fields to localStorage
    if (res.ok && data.status === 'SUCCESS') {
      const ewbData = {
        GenGstin: data.response.GenGstin,
        EwbNo: data.response.EwbNo,
        EwbDt: data.response.EwbDt,
        EwbValidTill: data.response.EwbValidTill
      };
      localStorage.setItem('LAST_EWB_DATA', JSON.stringify(ewbData));
      alert('E-Way Bill fetched successfully and stored!');
    }
  } catch (err) {
    setResponse({ error: err.message });
  } finally {
    setLoading(false);
  }
};


  const isReady = config.headers.companyId && config.headers['X-Auth-Token'] && config.params.irn;

  return (
    <div style={{
      padding: '30px',
      background: '#e3f2fd',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#1976d2', marginBottom: '10px', fontSize: '36px' }}>
        Get E-Way Bill by IRN
      </h1>
      <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>
        IRN auto-filled from Generate/Cancel/List • All values from previous actions
      </p>

      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '20px',
        boxShadow: '0 14px 50px rgba(0,0,0,0.15)',
        maxWidth: '950px',
        margin: '0 auto'
      }}>

        {/* ==================== REQUEST HEADERS ==================== */}
        <h2 style={{ color: '#0d47a1', borderBottom: '4px solid #42a5f5', paddingBottom: '12px' }}>
          REQUEST HEADERS
        </h2>
        <div style={{
          background: '#e3f2fd',
          padding: '25px',
          borderRadius: '14px',
          fontFamily: 'monospace',
          fontSize: '15px',
          margin: '20px 0',
          border: '3px solid #42a5f5'
        }}>
          {Object.entries(config.headers).map(([key, value]) => (
            <div key={key} style={{ margin: '14px 0', display: 'flex' }}>
              <strong style={{ width: '170px', color: '#0d47a1' }}>{key}:</strong>
              <span style={{ 
                color: key.includes('Token') ? '#666' : '#000',
                wordBreak: 'break-all',
                flex: 1
              }}>
                {key.includes('Token') 
                  ? value.slice(0, 35) + '...' + value.slice(-10)
                  : value || <em style={{ color: '#999' }}>Not set</em>
                }
              </span>
            </div>
          ))}
        </div>

        {/* ==================== FULL REQUEST URL ==================== */}
        <h2 style={{ color: '#0d47a1', borderBottom: '4px solid #42a5f5', paddingBottom: '12px', marginTop: '50px' }}>
          FULL REQUEST URL (GET)
        </h2>
        <div style={{
          background: '#263238',
          color: '#40c4ff',
          padding: '25px',
          borderRadius: '14px',
          fontSize: '15px',
          margin: '20px 0',
          overflow: 'auto',
          border: '3px solid #42a5f5',
          wordBreak: 'break-all'
        }}>
          {config.proxyBase}{config.endpoint}?irn={config.params.irn}&userGstin={config.params.userGstin}&updateFlag=true
        </div>

        {/* ==================== INPUT FORM ==================== */}
        <h2 style={{ color: '#1976d2', marginTop: '50px' }}>Fetch E-Way Bill</h2>

        <div style={{ margin: '25px 0' }}>
          <strong>IRN (Auto-filled from previous):</strong>
          <input
            value={config.params.irn}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              params: { ...prev.params, irn: e.target.value }
            }))}
            placeholder="Auto-filled after Generate/Cancel"
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '10px',
              borderRadius: '12px',
              border: '3px solid #42a5f5',
              fontSize: '18px',
              fontFamily: 'monospace',
              backgroundColor: '#e3f2fd'
            }}
          />
        </div>

        <div style={{ margin: '25px 0' }}>
          <strong>User GSTIN (Auto-filled):</strong>
          <input
            value={config.params.userGstin}
            readOnly
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '10px',
              borderRadius: '12px',
              background: '#e3f2fd',
              border: '3px solid #42a5f5',
              fontSize: '18px',
              fontFamily: 'monospace'
            }}
          />
        </div>

        <div style={{ margin: '25px 0' }}>
          <strong>Update Flag:</strong>
          <div style={{ padding: '16px', marginTop: '10px', fontSize: '18px', fontWeight: 'bold', color: '#0d47a1' }}>
            true (always refreshes latest data)
          </div>
        </div>

        <button
          onClick={fetchEWB}
          disabled={loading || !isReady}
          style={{
            width: '100%',
            padding: '28px',
            marginTop: '50px',
            background: (!isReady || loading) ? '#999' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '18px',
            fontSize: '32px',
            fontWeight: 'bold',
            cursor: (!isReady || loading) ? 'not-allowed' : 'pointer',
            boxShadow: '0 14px 50px rgba(25,118,210,0.5)',
            transition: 'all 0.3s'
          }}
        >
          {loading ? 'Fetching E-Way Bill...' : 'FETCH E-WAY BILL BY IRN'}
        </button>
      </div>

      {/* ==================== RESPONSE ==================== */}
      {response && (
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ color: '#0d47a1', borderBottom: '4px solid #42a5f5', paddingBottom: '12px' }}>
            RESPONSE ({response.time} IST)
          </h2>
          <pre style={{
            background: '#1e1e1e',
            color: '#40c4ff',
            padding: '35px',
            borderRadius: '18px',
            fontSize: '16px',
            marginTop: '25px',
            border: '3px solid #42a5f5'
          }}>
            {JSON.stringify(response.body || response, null, 2)}
          </pre>
        </div>
      )}

      <footer style={{
        marginTop: '100px',
        textAlign: 'center',
        color: '#888',
        fontSize: '15px'
      }}>
        IRIS GST ONYX • Get E-Way Bill by IRN • November 17, 2025 • {new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </footer>
    </div>
  );
};

export default GetEwbByIrn;