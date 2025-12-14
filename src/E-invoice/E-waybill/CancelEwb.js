import React, { useEffect, useState } from 'react';

/* ----------------------------
   LocalStorage Keys
---------------------------- */
const STORAGE_KEY = 'iris_einvoice_response';
const STORAGE_KEY1 = 'iris_einvoice_shared_config';
const STORAGE_KEY2 = 'iris_einvoice_irn_ewabill';

/* ----------------------------
   Cancel Reasons
---------------------------- */
const CANCEL_REASONS = {
  '1': 'Duplicate',
  '2': 'Data Entry Mistake',
  '3': 'Order Cancelled',
  '4': 'Others'
};

const CancelEwb = ({ previousResponse }) => {
  /* ----------------------------
     State
  ---------------------------- */

  // IMPORTANT: lowercase headers (browser → express)
  const [headers, setHeaders] = useState({
    accept: 'application/json',
    'content-type': 'application/json',
    companyid: '',
    'x-auth-token': '',
    product: 'ONYX'
  });

  const [body, setBody] = useState({
    ewbNo: '',
    cnlRsn: '3',
    cnlRem: 'Order cancelled by buyer',
    userGstin: ''
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  /* ----------------------------
     useEffect – Auto populate
  ---------------------------- */
  useEffect(() => {
    const einvResp = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const sharedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY1) || '{}');
    const irnEwbData = JSON.parse(localStorage.getItem(STORAGE_KEY2) || '{}');
    console.log("einvResp ",einvResp)
    console.log("sharedConfig",sharedConfig)
    console.log("irnEwbData",irnEwbData)
    /* ---- Headers ---- */
    setHeaders(prev => ({
      ...prev,
      companyid:
        previousResponse?.companyId ||
        sharedConfig?.companyId ||
        '',
      'x-auth-token':
        previousResponse?.token ||
        sharedConfig?.token ||
        ''
    }));

    /* ---- Body ---- */
    setBody(prev => ({
      ...prev,
      ewbNo: irnEwbData?.data?.response?.EwbNo || '',
      userGstin:
        irnEwbData?.data?.response?.fromGstin || // BEST source
        sharedConfig?.gstin ||
        sharedConfig?.companyUniqueCode ||
        ''
    }));
  }, [previousResponse]);

  /* ----------------------------
     Helpers
  ---------------------------- */
  const updateHeader = (key, value) =>
    setHeaders(prev => ({ ...prev, [key]: value }));

  const updateBody = (key, value) =>
    setBody(prev => ({ ...prev, [key]: value }));

  const isReady =
    headers.companyid &&
    headers['x-auth-token'] &&
    body.ewbNo &&
    body.userGstin &&
    body.cnlRsn;

  /* ----------------------------
     Cancel API Call
  ---------------------------- */
  const cancelEwb = async () => {
    if (!isReady) {
      alert('Missing required fields');
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        'http://localhost:3001/proxy/irn/cancelEwb',
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(body)
        }
      );

      const data = await res.json();

      setResponse({
        status: res.status,
        body: data,
        time: new Date().toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata'
        })
      });

      if (res.ok && data.status === 'SUCCESS') {
        alert('E-Way Bill Cancelled Successfully');
      }
    } catch (err) {
      setResponse({
        status: 'NETWORK_ERROR',
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------
     UI
  ---------------------------- */
  return (
    <div style={{ padding: '30px', background: '#ffebee', minHeight: '100vh' }}>
      <h1 style={{ color: '#c62828' }}>Cancel E-Way Bill</h1>
      <p>Headers & payload auto-loaded • Editable</p>

      <div
        style={{
          background: '#fff',
          padding: '30px',
          borderRadius: '16px',
          maxWidth: '900px',
          margin: 'auto',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
        }}
      >
        {/* ---------------- Headers ---------------- */}
        <h2 style={{ borderBottom: '3px solid #ef5350' }}>
          Request Headers
        </h2>

        {['companyid', 'x-auth-token'].map(key => (
          <div key={key} style={{ margin: '12px 0' }}>
            <strong>{key}</strong>
            <input
              value={headers[key]}
              onChange={e => updateHeader(key, e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ef5350',
                borderRadius: '6px'
              }}
            />
          </div>
        ))}

        {/* ---------------- Payload Preview ---------------- */}
        <h2
          style={{
            marginTop: '30px',
            borderBottom: '3px solid #ef5350'
          }}
        >
          Request Payload
        </h2>

        <pre
          style={{
            background: '#263238',
            color: '#ff5252',
            padding: '20px',
            borderRadius: '12px',
            marginTop: '15px'
          }}
        >
          {JSON.stringify(body, null, 2)}
        </pre>

        {/* ---------------- Form ---------------- */}
        <div style={{ marginTop: '25px' }}>
          <input
            placeholder="EWB Number"
            value={body.ewbNo}
            onChange={e => updateBody('ewbNo', e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '12px' }}
          />

          <select
            value={body.cnlRsn}
            onChange={e => updateBody('cnlRsn', e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '12px' }}
          >
            {Object.entries(CANCEL_REASONS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>

          <input
            placeholder="Cancellation Remark"
            value={body.cnlRem}
            onChange={e => updateBody('cnlRem', e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '12px' }}
          />

          <input
            placeholder="User GSTIN"
            value={body.userGstin}
            onChange={e => updateBody('userGstin', e.target.value)}
            style={{ width: '100%', padding: '12px' }}
          />

          <button
            disabled={!isReady || loading}
            onClick={cancelEwb}
            style={{
              width: '100%',
              marginTop: '20px',
              padding: '18px',
              background: loading ? '#999' : '#d32f2f',
              color: '#fff',
              fontSize: '20px',
              borderRadius: '10px'
            }}
          >
            {loading ? 'Cancelling…' : 'Cancel E-Way Bill'}
          </button>
        </div>
      </div>

      {/* ---------------- Response ---------------- */}
      {response && (
        <div style={{ marginTop: '40px' }}>
          <h2>Response ({response.time})</h2>
          <pre
            style={{
              background: '#1e1e1e',
              color: '#ff5252',
              padding: '20px',
              borderRadius: '12px'
            }}
          >
            {JSON.stringify(response.body || response.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CancelEwb;
