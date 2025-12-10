// src/components/GetByIRNForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthContext';

const GetInvByIrn = () => {
  const { authToken, lastIrn, lastUserGstin } = useAuth();

  // Auto-fill from last generated invoice
  const [irn, setIrn] = useState(lastIrn || '');
  const [userGstin, setUserGstin] = useState(lastUserGstin || '');
  const [response, setResponse] = useState(null);

  // Re-sync if context changes (e.g. new invoice generated elsewhere)
  useEffect(() => {
    if (lastIrn) setIrn(lastIrn);
    if (lastUserGstin) setUserGstin(lastUserGstin);
  }, [lastIrn, lastUserGstin]);

  const endpoint = `https://stage-api.irisgst.com/irisgst/onyx/irn/getInvByIrn?irn=${encodeURIComponent(
    irn
  )}&userGstin=${encodeURIComponent(userGstin)}`;

  const headers = {
    'X-Auth-Token': authToken || 'Not logged in',
    companyId: '24',
    product: 'ONYX',
  };

  const handleFetch = async () => {
    if (!authToken) return alert('Please login first!');
    if (!irn) return alert('Enter IRN');
    if (!userGstin) return alert('Enter User GSTIN');

    setResponse(null);
    try {
      const res = await fetch(endpoint, { headers });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch invoice');
    }
  };

  return (
    <div style={containerStyle}>
      <h2>Get Invoice by IRN</h2>

      <input
        value={irn}
        onChange={(e) => setIrn(e.target.value)}
        placeholder="IRN (auto-filled from last generation)"
        style={inputStyle}
      />

      <input
        value={userGstin}
        onChange={(e) => setUserGstin(e.target.value)}
        placeholder="User GSTIN (auto-filled from last generation)"
        style={{ ...inputStyle, marginTop: '8px' }}
      />

      <div style={sectionStyle}>
        <strong>URL:</strong>
        <pre style={codeStyle}>{endpoint}</pre>
      </div>

      <div style={sectionStyle}>
        <strong>Headers:</strong>
        <pre style={codeStyle}>{JSON.stringify(headers, null, 2)}</pre>
      </div>

      <button
        onClick={handleFetch}
        disabled={!authToken || !irn || !userGstin}
        style={buttonStyle(!authToken || !irn || !userGstin)}
      >
        Fetch
      </button>

      {response && (
        <div style={{ ...sectionStyle, backgroundColor: '#e3f2fd' }}>
          <strong>Response:</strong>
          <pre style={codeStyle}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// Styles
const containerStyle = { maxWidth: 900, margin: '20px auto', padding: 20 };
const sectionStyle = { marginBottom: 20, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 6 };
const inputStyle = { width: '100%', padding: 8, marginBottom: 10, borderRadius: 4, border: '1px solid #ccc' };
const codeStyle = { background: '#fff', padding: 10, borderRadius: 4, fontFamily: 'monospace', whiteSpace: 'pre-wrap', border: '1px solid #ddd', marginTop: 8 };
const buttonStyle = (disabled) => ({
  padding: '10px 20px',
  backgroundColor: disabled ? '#ccc' : '#3498db',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: 12,
});

export default GetInvByIrn;