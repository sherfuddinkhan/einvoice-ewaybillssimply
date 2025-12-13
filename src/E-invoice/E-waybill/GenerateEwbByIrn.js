import React, { useState, useEffect } from 'react';

// LocalStorage keys
const STORAGE_KEY = "iris_einvoice_response";      // Used for savedResponse
const STORAGE_KEY1 = "iris_einvoice_shared_config"; // Used for savedConfig

// Utility: returns today in dd-mm-yyyy format (Retained for completeness)
const todayIST = () => {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`; 
};

// Default values for EWB fields if not found in storage
const FALLBACK_DEFAULTS = {
    irn: "5eb8ce1121003e0b0b44059d85b660d2f4f00e3587bac05e16fed14a791386cd",
    userGstin: "01AAACI9260R002",
    vehNo: "MH20ZZ8888",
    transId: "01ACQPN4602B002",
};

// Reusable Input Component for styling consistency
const LabeledInput = ({ label, value, onChange, isRequired = false, isHighlighted = false, type = 'text' }) => {
    return (
        <div style={{ marginBottom: '16px' }}>
            <label style={{ fontWeight: '600', color: '#333', fontSize: '14px', display: 'block', marginBottom: '4px' }}>
                {label} {isRequired && <span style={{ color: 'red' }}>*</span>}
            </label>
            <input
                type={type}
                value={value ?? ''}
                onChange={e => onChange(e.target.value)}
                style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #ffb74d',
                    // Highlight key dynamic fields
                    background: isHighlighted ? '#fffbe5' : 'white',
                    boxSizing: 'border-box',
                }}
            />
        </div>
    );
};

const GenerateEwbByIrn = () => {
    /* -------------------- LOCAL STORAGE DATA FETCH -------------------- */
  const savedConfig = JSON.parse(
    localStorage.getItem(STORAGE_KEY1) || "{}"
  );
  
  const savedResponse = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "{}"
  );
  
    // Derive Auth/ID values
    const initialAuthToken = savedResponse.token || savedConfig.token;
    const initialCompanyId = savedResponse.companyId || savedConfig.companyId;

    // Derive body values, prioritizing storage
    const storageIrn = savedResponse.irn || savedConfig.irn;
    const storageUserGstin = savedResponse.companyUniqueCode || savedConfig.companyUniqueCode;
    const storageVehNo = savedResponse.vehNo || savedConfig.vehNo;
    const storageTransId = savedResponse.transId || savedConfig.transId;


    /* -------------------- CONSOLIDATED REQUEST BODY DEFINITION -------------------- */
    // This defines the complete, initial state of the request body.
    const INITIAL_REQUEST_BODY = {
        // 1. Mandatory E-Invoice Reference (Prioritized from storage)
        "irn": storageIrn || FALLBACK_DEFAULTS.irn, 
        "userGstin": storageUserGstin || FALLBACK_DEFAULTS.userGstin,
        
        // 2. Transport Details
        "transMode": "ROAD",
        "vehTyp": "R",
        "transDist": 0,
        "transName": "Safe and Secure",
        "transDocNo": "10294",
        "transDocDate": "14-11-2025", 
        "vehNo": storageVehNo || FALLBACK_DEFAULTS.vehNo,
        "transId": storageTransId || FALLBACK_DEFAULTS.transId,
        
        // 3. Supply Type
        "subSplyTyp": "Supply",
        "subSplyDes": "",
        
        // 4. E-Way Bill Place/Dispatch/Delivery Details
        "pobewb": null, 
        "paddr1": "Basket",
        "paddr2": "JVRoad",
        "ploc": "Nainital",
        "pstcd": "18",      
        "ppin": "781006",
        "dNm": "ANV",
        "daddr1": "MKJIO",
        "daddr2": "KLIOOPPP",
        "disloc": "Nainital",
        "disstcd": "27",    
        "dispin": "400602"
    };
    // ---------------------------------------------------------------------------------


    /* -------------------- STATE INITIALIZATION -------------------- */
  const [config, setConfig] = useState({
    proxyBase: 'http://localhost:3001',
    endpoint: '/proxy/irn/generateEwbByIrn',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      companyId: initialCompanyId || '',
      'X-Auth-Token': initialAuthToken || '',
      product: 'ONYX',
    },
    body: INITIAL_REQUEST_BODY,
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

    /* -------------------- AUTO-FILL/UPDATE EFFECT -------------------- */
    // This effect ensures dynamic data from storage is applied, especially if storage keys are updated after mount.
    useEffect(() => {
        const sourceToken = savedResponse?.token || savedConfig?.token || "";
        const sourceCompanyId = savedResponse?.companyId || savedConfig?.companyId || "";
        
        // Re-read storage fields for reactivity
        const sourceGstin = savedResponse?.companyUniqueCode || savedConfig?.companyUniqueCode || FALLBACK_DEFAULTS.userGstin;
        const sourceIrn = savedResponse?.irn || savedConfig?.irn || FALLBACK_DEFAULTS.irn;

        setConfig(prev => ({
            ...prev,
            headers: {
                ...prev.headers,
                "X-Auth-Token": sourceToken,
                companyId: sourceCompanyId,
            },
            body: {
                ...prev.body,
                userGstin: sourceGstin,
                irn: sourceIrn, 
            }
        }));
    }, [savedResponse, savedConfig]);


    /* -------------------- API CALL FUNCTION -------------------- */
  const generateEWB = async () => {
    if (!config.body.irn || !config.body.irn.trim()) {
      alert('IRN field is empty. This endpoint requires an IRN.');
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
        // Save the successful response data back to the storage key
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
             ...savedResponse, 
             ...data.response, 
             irn: config.body.irn, 
             companyUniqueCode: config.body.userGstin 
         })); 
      }
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

    /* -------------------- RENDER -------------------- */
  const isReady = config.headers.companyId && config.headers['X-Auth-Token'];

  const handleBodyChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      body: { 
            ...prev.body, 
            [key]: value
        },
    }));
  };

  return (
    <div style={{ padding: '30px', background: '#fff3e0', minHeight: '100vh', fontFamily: "'Segoe UI', Roboto, sans-serif" }}>
      <h1 style={{ color: '#ef6c00', textAlign: 'center', marginBottom: '30px' }}>Generate E-Way Bill by IRN (Consolidated Payload)</h1>

      <div style={{ background: 'white', padding: '25px', borderRadius: '14px', maxWidth: '1200px', margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{
          padding: '12px',
          background: isReady ? '#e8f5e9' : '#ffebee',
          borderRadius: '10px',
          marginBottom: '30px',
          fontWeight: 'bold',
          color: isReady ? '#388e3c' : '#d32f2f',
        }}>
          <strong>Auth Status:</strong> {isReady ? 'Ready' : 'Missing token or company ID'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {/* ================== COLUMN 1: E-Invoice Ref & Supply ================== */}
            <div style={{ padding: '15px', border: '1px solid #ffcc80', borderRadius: '8px', background: '#fff9e6' }}>
                <h3 style={{ color: '#ef6c00', marginTop: 0 }}>Reference & Supply</h3>
                
                <LabeledInput 
                    label="IRN (Invoice Reference Number)" 
                    value={config.body.irn} 
                    onChange={v => handleBodyChange('irn', v)}
                    isRequired 
                    isHighlighted
                />
                
                <LabeledInput 
                    label="User GSTIN" 
                    value={config.body.userGstin} 
                    onChange={v => handleBodyChange('userGstin', v)}
                    isRequired 
                    isHighlighted
                />

                <LabeledInput 
                    label="Supply Type (subSplyTyp)" 
                    value={config.body.subSplyTyp} 
                    onChange={v => handleBodyChange('subSplyTyp', v)}
                />
                
                <LabeledInput 
                    label="Supply Description (subSplyDes)" 
                    value={config.body.subSplyDes} 
                    onChange={v => handleBodyChange('subSplyDes', v)}
                />
            </div>

            {/* ================== COLUMN 2: Transport Details ================== */}
            <div style={{ padding: '15px', border: '1px solid #90caf9', borderRadius: '8px', background: '#e3f2fd' }}>
                <h3 style={{ color: '#1565c0', marginTop: 0 }}>Transport Details</h3>
                
                <LabeledInput 
                    label="Vehicle Number (vehNo)" 
                    value={config.body.vehNo} 
                    onChange={v => handleBodyChange('vehNo', v)}
                />
                
                <LabeledInput 
                    label="Transporter ID (transId)" 
                    value={config.body.transId} 
                    onChange={v => handleBodyChange('transId', v)}
                />

                <LabeledInput 
                    label="Transporter Document No (transDocNo)" 
                    value={config.body.transDocNo} 
                    onChange={v => handleBodyChange('transDocNo', v)}
                />

                <LabeledInput 
                    label="Transporter Document Date (transDocDate)" 
                    value={config.body.transDocDate} 
                    onChange={v => handleBodyChange('transDocDate', v)}
                />
                
                <LabeledInput 
                    label="Mode (transMode)" 
                    value={config.body.transMode} 
                    onChange={v => handleBodyChange('transMode', v)}
                />
                
                <LabeledInput 
                    label="Vehicle Type (vehTyp)" 
                    value={config.body.vehTyp} 
                    onChange={v => handleBodyChange('vehTyp', v)}
                />
                
                <LabeledInput 
                    label="Distance (transDist)" 
                    value={config.body.transDist} 
                    onChange={v => handleBodyChange('transDist', v)}
                    type='number'
                />
            </div>

            {/* ================== COLUMN 3: Place & Delivery ================== */}
            <div style={{ padding: '15px', border: '1px solid #a5d6a7', borderRadius: '8px', background: '#e8f5e9' }}>
                <h3 style={{ color: '#388e3c', marginTop: 0 }}>Place of Dispatch/Delivery</h3>

                <h4 style={{ color: '#66bb6a', marginBottom: '8px' }}>Dispatch (p...)</h4>
                <LabeledInput label="Address 1 (paddr1)" value={config.body.paddr1} onChange={v => handleBodyChange('paddr1', v)} />
                <LabeledInput label="Address 2 (paddr2)" value={config.body.paddr2} onChange={v => handleBodyChange('paddr2', v)} />
                <LabeledInput label="Location (ploc)" value={config.body.ploc} onChange={v => handleBodyChange('ploc', v)} />
                <LabeledInput label="State Code (pstcd)" value={config.body.pstcd} onChange={v => handleBodyChange('pstcd', v)} />
                <LabeledInput label="PIN (ppin)" value={config.body.ppin} onChange={v => handleBodyChange('ppin', v)} />
                <LabeledInput label="Place of Bill EWB (pobewb)" value={config.body.pobewb} onChange={v => handleBodyChange('pobewb', v)} />


                <h4 style={{ color: '#66bb6a', marginTop: '20px', marginBottom: '8px' }}>Delivery (d...)</h4>
                <LabeledInput label="Recipient Name (dNm)" value={config.body.dNm} onChange={v => handleBodyChange('dNm', v)} />
                <LabeledInput label="Address 1 (daddr1)" value={config.body.daddr1} onChange={v => handleBodyChange('daddr1', v)} />
                <LabeledInput label="Address 2 (daddr2)" value={config.body.daddr2} onChange={v => handleBodyChange('daddr2', v)} />
                <LabeledInput label="Location (disloc)" value={config.body.disloc} onChange={v => handleBodyChange('disloc', v)} />
                <LabeledInput label="State Code (disstcd)" value={config.body.disstcd} onChange={v => handleBodyChange('disstcd', v)} />
                <LabeledInput label="PIN (dispin)" value={config.body.dispin} onChange={v => handleBodyChange('dispin', v)} />

            </div>
        </div>

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
            marginTop: '35px',
            cursor: loading || !isReady ? 'not-allowed' : 'pointer',
            border: 'none'
          }}
        >
          {loading ? 'Generating EWB...' : 'GENERATE E-WAY BILL'}
        </button>
      </div>

      {response && (
        <div>
          <h3 style={{ color: '#ef6c00', marginTop: '30px' }}>API Response ({response.status})</h3>
          <pre style={{ 
              background: '#222', 
              color: (response.body.status === 'SUCCESS' || response.status === 200) ? '#a5d6a7' : '#ffb74d', 
              padding: '20px', 
              marginTop: '10px', 
              borderRadius: '8px',
              whiteSpace: 'pre-wrap',
              fontFamily: 'monospace'
           }}>
            {JSON.stringify(response.body, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default GenerateEwbByIrn;