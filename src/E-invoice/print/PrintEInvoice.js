import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'iris_einvoice_shared_config'; // Shared across all components

const PrintEInvoice = () => {
  const [einvId, setEinvId] = useState('');
  const [template, setTemplate] = useState('STANDARD');
  const [config, setConfig] = useState({
    proxyBase: 'http://localhost:3001',
    headers: {
      'Accept': '*/*',
      'companyId': '',
      'X-Auth-Token': '',
      'product': 'ONYX'
    }
  });

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-load saved authentication + last generated ID
  useEffect(() => {
    // 1️⃣ Load shared values
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
          }
        }));

        // 2️⃣ Auto-fill from shared response if exists
        if (shared.lastGeneratedResponse?.irn) {
          setEinvId(shared.lastGeneratedResponse.irn);
        } else if (shared.lastGeneratedResponse?.invoiceId) {
          setEinvId(shared.lastGeneratedResponse.invoiceId);
        }

      } catch (e) {
        console.warn("Failed to load shared config", e);
      }
    }

    // 3️⃣ Load ID saved from GenerateIRNForm.js (preferred)
    const lastSavedId = localStorage.getItem("iris_last_generated_id");
    if (lastSavedId) {
      setEinvId(lastSavedId); // this takes priority
    }

  }, []);

  const printInvoice = async () => {
    if (!einvId.trim()) {
      setMessage('Please enter E-Invoice ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch(
        `${config.proxyBase}/proxy/einvoice/print?template=${template}&id=${einvId}`,
        { headers: config.headers }
      );

      if (!res.ok) throw new Error('Failed to generate PDF');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `EInvoice_${einvId}_${template}_${new Date().toISOString().slice(0,10)}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);

      setMessage('PDF downloaded successfully!');

    } catch (err) {
      setMessage('Failed to download PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isAuthReady = config.headers.companyId && config.headers['X-Auth-Token'];

  return (
    <div style={{
      padding: '30px',
      background: '#e8f5e8',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#2e7d32', marginBottom: '10px' }}>Print E-Invoice PDF</h1>
      <p style={{ color: '#555', fontSize: '15px' }}>
        companyId & Token auto-filled from previous actions
      </p>

      <div style={{
        background: 'white',
        padding: '35px',
        borderRadius: '20px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        maxWidth: '700px'
      }}>
        
        {/* Header Status */}
        <h3 style={{ color: '#1b5e20' }}>Authentication Status</h3>
        <div style={{
          background: isAuthReady ? '#e8f5e8' : '#ffebee',
          padding: '15px',
          borderRadius: '12px',
          fontFamily: 'monospace',
          fontSize: '14px'
        }}>
          {isAuthReady ? (
            <>
              <div><strong>companyId:</strong> {config.headers.companyId}</div>
              <div><strong>X-Auth-Token:</strong> {config.headers['X-Auth-Token'].slice(0, 30)}...</div>
              <div style={{ color: '#1b5e20', marginTop: '8px', fontWeight: 'bold' }}>Ready to print</div>
            </>
          ) : (
            <div style={{ color: '#c62828' }}>
              Not authenticated yet. Complete any other action first.
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ marginTop: '30px' }}>

          <h3 style={{ color: '#1b5e20' }}>E-Invoice Details</h3>

          <div style={{ margin: '20px 0' }}>
            <strong>E-Invoice ID:</strong>
            <input
              type="text"
              value={einvId}
              onChange={(e) => setEinvId(e.target.value)}
              placeholder="Auto-filled from previous IRN generation"
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                borderRadius: '10px',
                border: '2px solid #ddd',
                fontSize: '18px',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <div style={{ margin: '20px 0' }}>
            <strong>Template:</strong>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '8px',
                borderRadius: '10px',
                border: '2px solid #ddd',
                fontSize: '16px'
              }}
            >
              <option value="STANDARD">Standard</option>
              <option value="DETAILED">Detailed</option>
              <option value="SIMPLE">Simple</option>
            </select>
          </div>

          <button
            onClick={printInvoice}
            disabled={loading || !isAuthReady || !einvId}
            style={{
              width: '100%',
              padding: '20px',
              background: (!isAuthReady || !einvId || loading) ? '#999' : '#2e7d32',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontSize: '24px',
              fontWeight: 'bold',
              cursor: (!isAuthReady || !einvId || loading) ? 'not-allowed' : 'pointer',
              marginTop: '20px',
              boxShadow: '0 8px 25px rgba(46,125,50,0.4)'
            }}
          >
            {loading ? 'Generating PDF...' : 'DOWNLOAD E-INVOICE PDF'}
          </button>
        </div>

        {message && (
          <div style={{
            marginTop: '25px',
            padding: '20px',
            background: message.includes('success') ? '#e8f5e8' : '#ffebee',
            borderRadius: '12px',
            fontSize: '18px',
            textAlign: 'center',
            color: message.includes('success') ? '#1b5e20' : '#c62828',
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}
      </div>

      <footer style={{
        marginTop: '60px',
        textAlign: 'center',
        color: '#888',
        fontSize: '13px'
      }}>
        IRIS GST ONYX • Auto-authenticated • {new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
      </footer>
    </div>
  );
};

export default PrintEInvoice;
