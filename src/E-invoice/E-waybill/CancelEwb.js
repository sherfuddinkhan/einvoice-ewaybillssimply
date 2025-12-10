import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'iris_einvoice_shared_config';
const LAST_EWB_KEY = 'iris_last_ewb_details';
const LAST_IRN_KEY = 'iris_last_used_irn';

const cancelReasons = {
  '1': 'Duplicate',
  '2': 'Data Entry Mistake',
  '3': 'Order Cancelled',
  '4': 'Others'
};

const CancelEwb = ({ previousResponse }) => {
  // Load saved EWB and IRN from localStorage
  const savedEwb = JSON.parse(localStorage.getItem(LAST_EWB_KEY) || '{}');
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

  const initialEwbNo = previousResponse?.response?.EwbNo || savedEwb?.EwbNo || '';
  const initialGstin = previousResponse?.userGstin || previousResponse?.gstin || savedConfig?.userGstin || savedConfig?.gstin || '';
  
   const initialCompanyCode = previousResponse?.companyUniqueCode
    || savedConfig?.companyUniqueCode
    || previousResponse?.userGstin
    || "";


  const [config, setConfig] = useState({
    proxyBase: 'http://localhost:3001',
    endpoint: '/proxy/irn/cancelEwb',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      companyId: previousResponse?.companyId || savedConfig?.companyId || '',
      'X-Auth-Token': previousResponse?.token || savedConfig?.token || '',
      product: 'ONYX'
    },
    body: {
      ewbNo: String(initialEwbNo),
      cnlRsn: '3',
      cnlRem: 'Order Cancelled',
      userGstin: initialCompanyCode
    }
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-load shared auth and last EWB details
  useEffect(() => {
    if (!savedConfig) return;
    setConfig(prev => ({
      ...prev,
      headers: {
        ...prev.headers,
        companyId: savedConfig.companyId || prev.headers.companyId,
        'X-Auth-Token': savedConfig.token || prev.headers['X-Auth-Token']
      },
      body: {
        ...prev.body,
        userGstin: savedConfig.userGstin || savedConfig.gstin || prev.body.userGstin,
        ewbNo: savedEwb?.EwbNo || prev.body.ewbNo
      }
    }));
  }, []);

  const cancelEWB = async () => {
    if (!config.body.ewbNo.trim() || !config.body.cnlRem.trim() || !config.headers.companyId || !config.headers['X-Auth-Token'] || !config.body.userGstin) {
      alert('Please ensure all required fields and auth are set.');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(`${config.proxyBase}${config.endpoint}`, {
        method: 'PUT',
        headers: config.headers,
        body: JSON.stringify(config.body)
      });

      const data = await res.json();
      const result = {
        status: res.status,
        statusText: res.statusText,
        body: data,
        time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      };
      setResponse(result);

      if (res.ok && data.status === 'SUCCESS') {
        alert('E-Way Bill Cancelled Successfully!');
        localStorage.setItem(LAST_EWB_KEY, JSON.stringify({ EwbNo: '' })); // Clear last EWB
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          companyId: config.headers.companyId,
          token: config.headers['X-Auth-Token'],
          userGstin: config.body.userGstin,
          gstin: config.body.userGstin
        }));
        setConfig(prev => ({ ...prev, body: { ...prev.body, ewbNo: '' } }));
      } else if ([401, 403].includes(res.status) || data.message?.toLowerCase()?.includes('unauth')) {
        alert(`Authentication failed: ${data.message || 'Invalid credentials'}.`);
      } else {
        alert(`Cancellation failed: ${data.message || 'Unknown error'}.`);
      }
    } catch (err) {
      console.error('Network error:', err);
      setResponse({ error: err.message, status: 'NETWORK_ERROR', time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) });
      alert('Network error. Check proxy server.');
    } finally {
      setLoading(false);
    }
  };

  const updateHeader = (key, value) => setConfig(prev => ({ ...prev, headers: { ...prev.headers, [key]: value } }));

  const updateBody = (key, value) => setConfig(prev => ({ ...prev, body: { ...prev.body, [key]: value } }));

  const isReady = config.headers.companyId && config.headers['X-Auth-Token'] && config.body.ewbNo && config.body.cnlRem && config.body.userGstin;

  const authHint = !config.headers.companyId ? 'Set companyId'
    : !config.headers['X-Auth-Token'] ? 'Set X-Auth-Token (valid 6hrs)'
    : !config.body.userGstin ? 'Set userGstin (15-digit)' : '';

  return (
    <div style={{ padding: '30px', background: '#ffebee', fontFamily: 'Segoe UI, Arial, sans-serif', minHeight: '100vh' }}>
      <h1 style={{ color: '#c62828', fontSize: '34px' }}>Cancel E-Way Bill</h1>
      <p style={{ color: '#666', fontSize: '16px' }}>Headers & payload auto-populated from previous actions • Editable</p>

      {authHint && <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', padding: '10px', borderRadius: '8px', marginBottom: '20px', color: '#856404' }}>
        <strong>Auth Tip:</strong> {authHint}
      </div>}

      <div style={{ background: '#fff', padding: '35px', borderRadius: '20px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', maxWidth: '900px', margin: '0 auto' }}>

        {/* HEADERS */}
        <h2 style={{ color: '#b71c1c', borderBottom: '4px solid #e57373', paddingBottom: '10px' }}>Request Headers</h2>
        {Object.entries(config.headers).map(([key, value]) => (
          <div key={key} style={{ margin: '10px 0', display: 'flex', alignItems: 'center' }}>
            <strong style={{ width: '160px' }}>{key}:</strong>
            {['companyId', 'X-Auth-Token'].includes(key) ? (
              <input type="text" value={value} onChange={e => updateHeader(key, e.target.value)}
                placeholder={`Enter ${key}`} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '2px solid #e57373' }} />
            ) : (
              <span style={{ flex: 1 }}>{value || <em style={{ color: '#999' }}>Not set</em>}</span>
            )}
          </div>
        ))}

        {/* BODY */}
        <h2 style={{ color: '#b71c1c', borderBottom: '4px solid #e57373', paddingBottom: '10px', marginTop: '30px' }}>Request Body</h2>
        <pre style={{ background: '#263238', color: '#ff5252', padding: '20px', borderRadius: '12px', fontSize: '15px', margin: '20px 0', overflow: 'auto' }}>
          {JSON.stringify(config.body, null, 2)}
        </pre>

        {/* FORM */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '20px' }}>
            <strong>EWB Number:</strong>
            <input value={config.body.ewbNo} onChange={e => updateBody('ewbNo', e.target.value)}
              placeholder="Enter EWB No" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ef5350', fontFamily: 'monospace' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <strong>Cancellation Reason:</strong>
            <select value={config.body.cnlRsn} onChange={e => updateBody('cnlRsn', e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ef5350' }}>
              {Object.entries(cancelReasons).map(([code, label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <strong>Cancellation Remark:</strong>
            <input value={config.body.cnlRem} onChange={e => updateBody('cnlRem', e.target.value)}
              placeholder="Enter remark" maxLength={100} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ef5350' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <strong>User GSTIN:</strong>
            <input value={config.body.userGstin} onChange={e => updateBody('userGstin', e.target.value)}
              placeholder="Enter GSTIN" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #ef5350', fontFamily: 'monospace' }} />
          </div>

          <button onClick={cancelEWB} disabled={!isReady || loading}
            style={{ width: '100%', padding: '24px', background: (!isReady || loading) ? '#999' : '#d32f2f', color: 'white', borderRadius: '12px', fontSize: '22px', fontWeight: 'bold', cursor: (!isReady || loading) ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Cancelling...' : 'Cancel E-Way Bill'}
          </button>
        </div>
      </div>

      {/* RESPONSE */}
      {response && (
        <div style={{ marginTop: '40px' }}>
          <h2 style={{ color: '#b71c1c' }}>Response ({response.time})</h2>
          <pre style={{ background: '#1e1e1e', color: '#ff5252', padding: '20px', borderRadius: '12px', fontSize: '15px' }}>
            {JSON.stringify(response.body || response.error || response, null, 2)}
          </pre>
        </div>
      )}

      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
        IRIS GST ONYX • Cancel E-Way Bill • {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
      </footer>
    </div>
  );
};

export default CancelEwb;
