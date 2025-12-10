// GetIrnByDocDetailsForm.js - Auto-Populated & Prioritizes Last Used for Reliable Auto-Fill
import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'iris_einvoice_shared_config';
const LAST_DOC_DETAILS_KEY = 'iris_last_used_doc_details'; // New key for last used doc details

const GetIrnByDocDetails= () => {
  const [config, setConfig] = useState({
    proxyBase: 'http://localhost:3001',
    endpoint: '/proxy/irn/getIrnByDocDetails',
    headers: {
      Accept: 'application/json',
      companyId: '',
      'X-Auth-Token': '',
      product: 'ONYX'
    },
    params: {
      docNum: '',
      docType: 'RI',
      userGstin: '',
      docDate: ''
    }
  });
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [sharedData, setSharedData] = useState(null);

  // ============================
  // LOAD SHARED VALUES FROM STORAGE (Prioritized Auto-Fill)
  // ============================
  useEffect(() => {
    let newConfig = { ...config };

    // Load main shared config for headers & GSTIN
    const saved = localStorage.getItem(STORAGE_KEY);
    let shared = null;
    if (saved) {
      try {
        shared = JSON.parse(saved);
        console.log('Shared config loaded:', shared); // Debug log
        setSharedData(shared); // Store for debug
        newConfig.headers = {
          ...newConfig.headers,
          companyId: shared.companyId || '',
          'X-Auth-Token': shared.token || ''
        };
        newConfig.params.userGstin = shared.companyUniqueCode || newConfig.params.userGstin;
      } catch (err) {
        console.warn('Failed to load shared config');
      }
    }

    // PRIORITY 1: Load last used doc details (from this form's previous success) - MOST RELIABLE FOR BOTH FIELDS
    const lastDocSaved = localStorage.getItem(LAST_DOC_DETAILS_KEY);
    let lastDocNum = newConfig.params.docNum;
    let lastDocDate = newConfig.params.docDate;
    if (lastDocSaved) {
      try {
        const lastDoc = JSON.parse(lastDocSaved);
        console.log('Last used doc details loaded:', lastDoc); // Debug log
        lastDocNum = lastDoc.docNum || newConfig.params.docNum;
        lastDocDate = lastDoc.docDate || newConfig.params.docDate;
      } catch (err) {
        console.warn('Failed to load last doc details');
      }
    }

    // PRIORITY 2: ONLY if last used is empty, fallback to lastFetchedInvoice (from other forms)
    if (!lastDocNum && shared?.lastFetchedInvoice) {
      console.log('lastFetchedInvoice fallback used:', shared.lastFetchedInvoice); // Debug
      lastDocNum = shared?.lastFetchedInvoice?.DocDtls?.No ||
                   shared?.lastFetchedInvoice?.DocDtls?.DocNum ||
                   shared?.lastFetchedInvoice?.documentNumber ||
                   shared?.lastFetchedInvoice?.DocNum ||
                   lastDocNum;
    }
    if (!lastDocDate && shared?.lastFetchedInvoice) {
      lastDocDate = shared?.lastFetchedInvoice?.DocDtls?.Dt ||
                    shared?.lastFetchedInvoice?.DocDtls?.DocDt ||
                    shared?.lastFetchedInvoice?.documentDate ||
                    shared?.lastFetchedInvoice?.DocDate ||
                    lastDocDate;
    }

    // Apply prioritized values
    newConfig.params.docNum = lastDocNum;
    newConfig.params.docDate = lastDocDate;

    setConfig(newConfig);
  }, []);

  // ==========================
  // SAVE LAST USED DOC DETAILS (after success) - ENSURE BOTH ARE SAVED
  // ==========================
  const saveLastDocDetails = (docNum, docDate) => {
    if (!docNum.trim() || !docDate.trim()) {
      console.warn('Skipping save: docNum or docDate is empty');
      return;
    }
    const lastDoc = { 
      docNum: docNum.trim(), 
      docDate: docDate.trim(), 
      timestamp: new Date().toISOString() 
    };
    localStorage.setItem(LAST_DOC_DETAILS_KEY, JSON.stringify(lastDoc));
    console.log('Saved last doc details:', lastDoc); // Debug
  };

  // ==========================
  // UPDATE PARAMS HANDLERS
  // ==========================
  const updateParam = (key, value) => {
    setConfig(prev => ({
      ...prev,
      params: {
        ...prev.params,
        [key]: value
      }
    }));
  };

  // ==========================
  // CALL API
  // ==========================
  const fetchIRN = async () => {
    const { docNum, docType, docDate, userGstin } = config.params;
    if (!docNum.trim() || !docDate.trim()) {
      alert('Please enter Document Number and Date');
      return;
    }
    setLoading(true);
    setResponse(null);
    const params = new URLSearchParams({
      docNum: encodeURIComponent(docNum.trim()),
      docType,
      userGstin,
      docDate: encodeURIComponent(docDate.trim())
    });
    const fullUrl = `${config.proxyBase}${config.endpoint}?${params.toString()}`;
    try {
      const res = await fetch(fullUrl, {
        method: 'GET',
        headers: config.headers
      });
      const data = await res.json();
      const result = {
        url: fullUrl,
        status: res.status,
        body: data,
        time: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
      };
      setResponse(result);
      if (res.ok && data.status === 'SUCCESS') {
        alert(`IRN Found: ${data.response.irn}`);
        // ⭐ SAVE LAST USED FOR NEXT AUTO-FILL (both fields)
        saveLastDocDetails(docNum, docDate);
      }
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const isReady =
    config.headers.companyId &&
    config.headers['X-Auth-Token'] &&
    config.params.docNum &&
    config.params.docDate;

  const qrCodeUrl = response?.body?.response?.qrCode
    ? `data:image/png;base64,${response.body.response.qrCode}`
    : null;

  const autoFillStatus = {
    gstin: !!config.params.userGstin,
    docNum: !!config.params.docNum,
    docDate: !!config.params.docDate
  };

  return (
    <div
      style={{
        padding: '30px',
        background: '#f3e5f5',
        fontFamily: 'Segoe UI, Arial, sans-serif',
        minHeight: '100vh'
      }}
    >
      <h1 style={{ color: '#7b1fa2', marginBottom: '10px', fontSize: '38px' }}>
        Get IRN by Document Details
      </h1>
      <p
        style={{
          color: '#666',
          fontSize: '16px',
          marginBottom: '30px'
        }}
      >
        Enter Doc No + Date → Get IRN (within 3 days of generation)
      </p>
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 14px 50px rgba(0,0,0,0.15)',
          maxWidth: '1100px',
          margin: '0 auto'
        }}
      >
        {/* ====================== AUTO-FILL STATUS ======================= */}
        <div style={{ marginBottom: '30px', padding: '15px', background: '#e8f5e8', borderRadius: '10px', border: '1px solid #4caf50' }}>
          <strong>Auto-Fill Status:</strong>
          <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
            <li>User GSTIN: {autoFillStatus.gstin ? '✅ Auto-filled' : '❌ Manual entry needed'}</li>
            <li>Document Number: {autoFillStatus.docNum ? '✅ Auto-filled (from last use)' : '❌ Manual entry needed'}</li>
            <li>Document Date: {autoFillStatus.docDate ? '✅ Auto-filled (from last use)' : '❌ Manual entry needed'}</li>
          </ul>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Prioritizes last successful fetch in this form. Falls back to prior invoice data if none.
          </p>
        </div>

        {/* ====================== DEBUG PANEL (Toggle) ======================= */}
        <button
          onClick={() => setShowDebug(!showDebug)}
          style={{
            width: '100%',
            padding: '10px',
            marginBottom: '20px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {showDebug ? 'Hide' : 'Show'} Debug: Raw Data from localStorage
        </button>
        {showDebug && (
          <div
            style={{
              background: '#1e1e1e',
              color: '#ce93d8',
              padding: '20px',
              borderRadius: '10px',
              marginBottom: '30px',
              fontSize: '12px',
              fontFamily: 'monospace',
              maxHeight: '300px',
              overflow: 'auto'
            }}
          >
            <strong>Main Shared Config:</strong>
            <pre>{sharedData ? JSON.stringify(sharedData, null, 2) : 'No data'}</pre>
            <strong>Last Used Doc Details (Key: {LAST_DOC_DETAILS_KEY}):</strong>
            <pre>{JSON.stringify(JSON.parse(localStorage.getItem(LAST_DOC_DETAILS_KEY) || {}), null, 2)}</pre>
            <p style={{ fontSize: '10px', color: '#999' }}>
              If docNum is empty here, it wasn't saved (e.g., fetch failed or empty input). Check console logs.
            </p>
          </div>
        )}

        {/* ====================== HEADERS ======================= */}
        <h2
          style={{
            color: '#4a148c',
            borderBottom: '4px solid #ba68c8',
            paddingBottom: '12px'
          }}
        >
          REQUEST HEADERS
        </h2>
        <div
          style={{
            background: '#f3e5f5',
            padding: '25px',
            borderRadius: '14px',
            fontFamily: 'monospace',
            fontSize: '15px',
            margin: '20px 0',
            border: '3px solid #ba68c8'
          }}
        >
          {Object.entries(config.headers).map(([key, value]) => (
            <div
              key={key}
              style={{ margin: '14px 0', display: 'flex' }}
            >
              <strong style={{ width: '170px', color: '#4a148c' }}>
                {key}:
              </strong>
              <span
                style={{
                  color: key.includes('Token') ? '#666' : '#000',
                  wordBreak: 'break-all',
                  flex: 1
                }}
              >
                {key.includes('Token')
                  ? value
                    ? value.slice(0, 35) + '...' + value.slice(-10)
                    : ''
                  : value || (
                      <em style={{ color: '#999' }}>Not set</em>
                    )}
              </span>
            </div>
          ))}
        </div>

        {/* ==================== FULL REQUEST URL ==================== */}
        {config.params.docNum && config.params.docDate && (
          <>
            <h2
              style={{
                color: '#4a148c',
                borderBottom: '4px solid #ba68c8',
                paddingBottom: '12px',
                marginTop: '50px'
              }}
            >
              FULL REQUEST URL (GET)
            </h2>
            <div
              style={{
                background: '#263238',
                color: '#ce93d8',
                padding: '25px',
                borderRadius: '14px',
                fontSize: '15px',
                margin: '20px 0',
                overflow: 'auto',
                border: '3px solid #ba68c8',
                wordBreak: 'break-all'
              }}
            >
              {config.proxyBase}
              {config.endpoint}?docNum=
              {encodeURIComponent(config.params.docNum)}&docType=
              {config.params.docType}&userGstin=
              {config.params.userGstin}&docDate=
              {encodeURIComponent(config.params.docDate)}
            </div>
          </>
        )}

        {/* ==================== INPUT FIELDS ==================== */}
        <h2 style={{ color: '#7b1fa2', marginTop: '50px' }}>
          Search IRN by Document Details
        </h2>
        <div style={{ margin: '25px 0' }}>
          <strong>Document Number {autoFillStatus.docNum ? '(Auto-filled ✅)' : '(Manual)'}</strong>
          <input
            value={config.params.docNum}
            onChange={(e) => updateParam('docNum', e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '10px',
              borderRadius: '12px',
              background: autoFillStatus.docNum ? '#f3e5f5' : 'white',
              border: `3px solid ${autoFillStatus.docNum ? '#4caf50' : '#ba68c8'}`,
              fontSize: '18px',
              fontFamily: 'monospace'
            }}
            placeholder="Enter or auto-filled from last IRN fetch"
          />
        </div>
        <div style={{ margin: '25px 0' }}>
          <strong>Document Type:</strong>
          <input
            value={config.params.docType}
            readOnly
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '10px',
              borderRadius: '12px',
              background: '#f3e5f5',
              border: '3px solid #ba68c8',
              fontSize: '18px',
              fontFamily: 'monospace'
            }}
          />
        </div>
        <div style={{ margin: '25px 0' }}>
          <strong>Document Date {autoFillStatus.docDate ? '(Auto-filled ✅)' : '(Manual)'}</strong>
          <input
            value={config.params.docDate}
            onChange={(e) => updateParam('docDate', e.target.value)}
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '10px',
              borderRadius: '12px',
              background: autoFillStatus.docDate ? '#f3e5f5' : 'white',
              border: `3px solid ${autoFillStatus.docDate ? '#4caf50' : '#ba68c8'}`,
              fontSize: '18px',
              fontFamily: 'monospace'
            }}
            placeholder="DD/MM/YYYY or auto-filled from last IRN fetch"
          />
        </div>
        <div style={{ margin: '25px 0' }}>
          <strong>User GSTIN {autoFillStatus.gstin ? '(Auto-filled ✅)' : '(Manual)'}</strong>
          <input
            value={config.params.userGstin}
            readOnly
            style={{
              width: '100%',
              padding: '16px',
              marginTop: '10px',
              borderRadius: '12px',
              background: '#f3e5f5',
              border: '3px solid #ba68c8',
              fontSize: '18px',
              fontFamily: 'monospace'
            }}
          />
        </div>
        <button
          onClick={fetchIRN}
          style={{
            width: '100%',
            padding: '28px',
            marginTop: '50px',
            background:
              !isReady || loading ? '#999' : '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '18px',
            fontSize: '32px',
            fontWeight: 'bold',
            cursor:
              !isReady || loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 14px 50px rgba(156,39,176,0.5)',
            transition: 'all 0.3s'
          }}
        >
          {loading
            ? 'Searching IRN...'
            : 'GET IRN BY DOC DETAILS'}
        </button>
      </div>

      {/* ==================== RESPONSE ==================== */}
      {response && (
        <div style={{ marginTop: '60px' }}>
          <h2
            style={{
              color: '#4a148c',
              borderBottom: '4px solid #ba68c8',
              paddingBottom: '12px'
            }}
          >
            API RESPONSE ({response.time} IST)
          </h2>
          <pre
            style={{
              background: '#1e1e1e',
              color:
                response.body?.status === 'SUCCESS'
                  ? '#ce93d8'
                  : '#e74c3c',
              padding: '35px',
              borderRadius: '18px',
              fontSize: '15px',
              marginTop: '25px',
              border: '3px solid #ba68c8'
            }}
          >
            {JSON.stringify(
              response.body || response,
              null,
              2
            )}
          </pre>
        </div>
      )}

      {/* ==================== IRN FOUND ==================== */}
      {response?.body?.response?.irn && (
        <div
          style={{
            marginTop: '60px',
            textAlign: 'center',
            padding: '40px',
            background: '#7b1fa2',
            borderRadius: '20px',
            color: 'white'
          }}
        >
          <h1 style={{ fontSize: '48px', margin: 0 }}>
            IRN Found!
          </h1>
          <p
            style={{
              fontSize: '28px',
              fontFamily: 'monospace',
              margin: '20px 0',
              wordBreak: 'break-all'
            }}
          >
            {response.body.response.irn}
          </p>
          <p style={{ fontSize: '18px' }}>
            Ack No: {response.body.response.ackNo} | Date:{' '}
            {response.body.response.ackDt}
          </p>
          <p style={{ fontSize: '16px', marginTop: '10px' }}>
            Details saved for next auto-fill! Reload to see both fields ✅.
          </p>
        </div>
      )}

      {/* ==================== QR CODE ==================== */}
      {qrCodeUrl && (
        <div
          style={{
            marginTop: '60px',
            textAlign: 'center'
          }}
        >
          <h2
            style={{
              color: '#7b1fa2',
              borderBottom: '4px solid #ba68c8',
              paddingBottom: '12px',
              display: 'inline-block'
            }}
          >
            Signed QR Code
          </h2>
          <div
            style={{
              marginTop: '20px',
              padding: '20px',
              background: 'white',
              borderRadius: '18px',
              display: 'inline-block',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            <img
              src={qrCodeUrl}
              alt="Signed QR Code"
              style={{
                width: '320px',
                height: '320px',
                border: '5px solid #ba68c8',
                borderRadius: '14px'
              }}
            />
          </div>
        </div>
      )}

      {/* ==================== SIGNED INVOICE JWT ==================== */}
      {response?.body?.response?.signedInvoice && (
        <div style={{ marginTop: '60px' }}>
          <h2
            style={{
              color: '#7b1fa2',
              borderBottom: '4px solid #ba68c8',
              paddingBottom: '12px'
            }}
          >
            Signed Invoice JWT (Copy to Verify)
          </h2>
          <textarea
            value={response.body.response.signedInvoice}
            readOnly
            rows={8}
            style={{
              width: '100%',
              padding: '20px',
              fontFamily: 'monospace',
              fontSize: '14px',
              background: '#263238',
              color: '#ce93d8',
              border: '3px solid #ba68c8',
              borderRadius: '14px'
            }}
          />
        </div>
      )}

      <footer
        style={{
          marginTop: '100px',
          textAlign: 'center',
          color: '#888',
          fontSize: '15px'
        }}
      >
        IRIS GST ONYX • Get IRN by Document Details •{' '}
        {new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata'
        })}{' '}
        IST
      </footer>
    </div>
  );
};

export default GetIrnByDocDetails;