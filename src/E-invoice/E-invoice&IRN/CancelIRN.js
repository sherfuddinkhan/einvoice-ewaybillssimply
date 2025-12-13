// CancelIRNForm.js - Fully Auto-Populated & Transparent (IRIS GST Style)
import React, { useState, useEffect } from 'react';

const CancelIRN  = ({ previousResponse }) => {
  const STORAGE_KEY = 'iris_einvoice_shared_config';
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
 const STORAGE_KEY1  = "einvoicedata";
 console.log("STORAGE_KEY1",STORAGE_KEY1)
  const savedConfig1 = JSON.parse(localStorage.getItem(STORAGE_KEY1) || '{}');
  console.log("savedConfig",savedConfig);

  // Deduplicated IRN sourcing
  const irn = previousResponse?.irn || savedConfig?.lastGeneratedResponse?.irn || '';
  console.log("irn",irn)
  const initialGstin = previousResponse?.userGstin
    || previousResponse?.companyGstin
    || previousResponse?.gstin
    || savedConfig?.gstin
    || savedConfig?.userGstin
    || "";
  const initialCompanyCode = previousResponse?.companyUniqueCode
    || savedConfig?.companyUniqueCode
    || previousResponse?.userGstin
    || "";

  const [config, setConfig] = useState({
    proxyBase: 'http://localhost:3001',
    endpoint: '/proxy/irn/cancel',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'companyId': previousResponse?.companyId || STORAGE_KEY?.companyId || '',
      'X-Auth-Token': previousResponse?.token || STORAGE_KEY?.token || '',
      'product': 'ONYX'
    },
    body: {
      irn: irn,
      cnlRsn: '1', // 1=Wrong Entry, 2=Duplicate, 3=Order Cancelled, 4=Others
      cnlRem: 'Wrong entry',
      userGstin: initialCompanyCode
    }
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

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
            'X-Auth-Token': shared.token || '',
          }
        }));
      } catch (e) {
        console.warn('Failed to load shared config');
      }
    }
  }, []);

  const cancelIRN = async () => {
    if (!config.body.irn.trim() || config.body.irn.length !== 64) {
      alert('Please enter a valid 64-character IRN');
      return;
    }
    if (!config.body.cancelRem.trim()) {
      alert('Please enter cancellation remark');
      return;
    }
    if (!config.headers.companyId || !config.headers['X-Auth-Token']) {
      alert('Authentication required. Please set companyId and X-Auth-Token.');
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
        alert('IRN Cancelled Successfully!');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          companyId: config.headers.companyId,
          token: config.headers['X-Auth-Token']
        }));
        setConfig(prev => ({ ...prev, body: { ...prev.body, irn: '' } }));
      } else if (res.status === 401 || res.status === 403 || data.message?.includes('Unauth')) {
        alert(`Authentication failed: ${data.message || 'Invalid token/companyId'}. Please update credentials.`);
      } else {
        alert(`Cancellation failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setResponse({
        error: err.message,
        status: 'NETWORK_ERROR',
        time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      });
      alert('Network error. Check proxy server and try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateHeader = (key, value) => {
    setConfig(prev => ({
      ...prev,
      headers: { ...prev.headers, [key]: value }
    }));
  };

  const isReady = config.headers.companyId && config.headers['X-Auth-Token'] && config.body.irn && config.body.cancelRem;

  const cancelReasons = {
    '1': '1 - Wrong Entry',
    '2': '2 - Duplicate',
    '3': '3 - Order Cancelled',
    '4': '4 - Others'
  };

  // Reusable style for inputs & selects
  const inputStyle = {
    width: '100%',
    padding: '16px',
    marginTop: '10px',
    borderWidth: '3px',
    borderStyle: 'solid',
    borderColor: '#ffb74d',
    borderRadius: '12px',
    fontSize: '18px',
    fontFamily: 'monospace',
    backgroundColor: '#fffde7'
  };

  const headerInputStyle = {
    flex: 1,
    padding: '8px 12px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: '#ffb74d',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '14px',
    backgroundColor: '#fffde7',
    color: '#000',
    wordBreak: 'break-all'
  };

  return (
    <div style={{ padding: '30px', background: '#fffde7', fontFamily: 'Segoe UI, Arial, sans-serif', minHeight: '100vh' }}>
      <h1 style={{ color: '#f57f17', marginBottom: '10px', fontSize: '36px' }}>Cancel IRN (E-Invoice)</h1>
      <p style={{ color: '#666', fontSize: '16px', marginBottom: '30px' }}>
        All headers & payload visible before sending • Auto-filled from previous actions • Editable auth headers
      </p>

      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 14px 50px rgba(0,0,0,0.15)', maxWidth: '950px', margin: '0 auto' }}>
        <h2 style={{ color: '#e65100', borderBottomWidth: '4px', borderBottomStyle: 'solid', borderBottomColor: '#ffb74d', paddingBottom: '12px' }}>
          REQUEST HEADERS (Editable)
        </h2>

        <div style={{ background: '#fff8e1', padding: '25px', borderRadius: '14px', fontFamily: 'monospace', fontSize: '15px', margin: '20px 0', borderWidth: '3px', borderStyle: 'solid', borderColor: '#ffb74d' }}>
          {Object.entries(config.headers).map(([key, value]) => (
            <div key={key} style={{ margin: '14px 0', display: 'flex', alignItems: 'center' }}>
              <strong style={{ width: '170px', color: '#e65100' }}>{key}:</strong>
              {['companyId', 'X-Auth-Token'].includes(key) ? (
                <input
                  type="text"
                  value={value || ''}
                  onChange={(e) => updateHeader(key, e.target.value)}
                  placeholder={`Enter ${key}`}
                  style={headerInputStyle}
                />
              ) : (
                <span style={{ color: '#000', wordBreak: 'break-all', flex: 1, fontWeight: 'bold' }}>
                  {value || <em style={{ color: '#999' }}>Not set</em>}
                </span>
              )}
            </div>
          ))}
        </div>

        <h2 style={{ color: '#e65100', borderBottomWidth: '4px', borderBottomStyle: 'solid', borderBottomColor: '#ffb74d', paddingBottom: '12px', marginTop: '50px' }}>
          REQUEST PAYLOAD (JSON Body)
        </h2>
        <pre style={{ background: '#263238', color: '#ff9100', padding: '25px', borderRadius: '14px', fontSize: '16px', margin: '20px 0', overflow: 'auto', borderWidth: '3px', borderStyle: 'solid', borderColor: '#ffb74d' }}>
          {JSON.stringify(config.body, null, 2)}
        </pre>

        <h2 style={{ color: '#f57f17', marginTop: '50px' }}>Cancel IRN Details</h2>
        <div style={{ margin: '25px 0' }}>
          <strong>IRN (64 characters):</strong>
          <input
            value={config.body.irn}
            onChange={(e) => setConfig(prev => ({ ...prev, body: { ...prev.body, irn: e.target.value } }))}
            placeholder="Enter 64-character IRN"
            style={inputStyle}
          />
        </div>
        <div style={{ margin: '25px 0' }}>
          <strong>Cancellation Reason:</strong>
          <select
            value={config.body.cancelRsn}
            onChange={(e) => setConfig(prev => ({ ...prev, body: { ...prev.body, cancelRsn: e.target.value } }))}
            style={inputStyle}
          >
            {Object.entries(cancelReasons).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>
        </div>
        <div style={{ margin: '25px 0' }}>
          <strong>Cancellation Remark (Required):</strong>
          <input
            value={config.body.cancelRem}
            onChange={(e) => setConfig(prev => ({ ...prev, body: { ...prev.body, cancelRem: e.target.value } }))}
            placeholder="e.g., Wrong entry in invoice amount"
            style={inputStyle}
          />
        </div>

        <button
          onClick={cancelIRN}
          disabled={!isReady || loading}
          style={{
            width: '100%',
            padding: '28px',
            marginTop: '50px',
            background: (!isReady || loading) ? '#999' : '#f57f17',
            color: 'white',
            borderWidth: '0px',
            borderStyle: 'none',
            borderRadius: '18px',
            fontSize: '32px',
            fontWeight: 'bold',
            cursor: (!isReady || loading) ? 'not-allowed' : 'pointer',
            boxShadow: '0 14px 50px rgba(245,127,23,0.5)',
            transition: 'all 0.3s'
          }}
        >
          {loading ? 'Cancelling IRN...' : 'CANCEL IRN'}
        </button>
      </div>

      {response && (
        <div style={{ marginTop: '60px' }}>
          <h2 style={{ color: '#e65100', borderBottomWidth: '4px', borderBottomStyle: 'solid', borderBottomColor: '#ffb74d', paddingBottom: '12px' }}>
            RESPONSE ({response.time} IST) - Status: {response.status} {response.statusText || ''}
          </h2>
          <pre style={{ background: '#1e1e1e', color: '#ff9100', padding: '35px', borderRadius: '18px', fontSize: '16px', marginTop: '25px', borderWidth: '3px', borderStyle: 'solid', borderColor: '#ffb74d' }}>
            {JSON.stringify(response.body || response.error || response, null, 2)}
          </pre>
        </div>
      )}

      <footer style={{ marginTop: '100px', textAlign: 'center', color: '#888', fontSize: '15px' }}>
        IRIS GST ONYX • Cancel IRN • {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </footer>
    </div>
  );
};

export default CancelIRN ;
