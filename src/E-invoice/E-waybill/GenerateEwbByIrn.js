import React, { useState, useEffect } from 'react';

// Define the standard colors object (Required for tableStyles)
const colors = {
  primary: "#1A73E8",
  success: "#34A853",
  danger: "#EA4335",
  background: "#F8F9FA",
};

// --- Table Styles from User Input ---
const tableStyles = {
  container: { padding: "20px", background: colors.background, minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif" },
  header: { textAlign: "center", color: colors.primary, fontSize: "28px", marginBottom: "30px", fontWeight: 500 },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "30px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderRadius: "8px", overflow: "hidden" },
  th: { background: "#E3F2FD", color: colors.primary, textAlign: "left", padding: "16px", fontWeight: 600, fontSize: "16px" },
  td: { padding: "14px 16px", borderBottom: "1px solid #eee", verticalAlign: "top" },
  labelText: { fontWeight: "600", color: "#333", fontSize: "14px", display: "block", marginBottom: "8px" },
  input: { width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box" },
  inputFocus: { borderColor: colors.primary, boxShadow: "0 0 0 3px rgba(26,115,232,0.2)", outline: "none" },
  select: { width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px" },
  btnGreen: { padding: "12px 24px", background: colors.success, color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  btnRed: { padding: "8px 16px", background: colors.danger, color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" },
  btnGenerate: (loading, token) => ({
    padding: "20px 100px",
    fontSize: "22px",
    fontWeight: "bold",
    background: loading || !token ? "#999" : colors.primary,
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: loading || !token ? "not-allowed" : "pointer",
    boxShadow: "0 10px 30px rgba(26,115,232,0.4)",
  }),
  itemCard: { background: "#f8fbff", border: "1px solid #d0e4ff", borderRadius: "12px", padding: "24px", marginBottom: "24px", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" },
  twoColGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" },
  col: { display: "flex", flexDirection: "column", gap: "16px" },
  itemFooter: { marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", borderTop: "1px dashed #bbb" },
  responseBox: (status) => ({
    background: "#1e1e1e",
    color: (status === 'SUCCESS' || status === 200) ? "#A8FFBF" : "#FFB4A9",
    padding: "24px",
    borderRadius: "10px",
    fontFamily: "monospace",
    fontSize: "13px",
    overflow: "auto",
    border: `1px solid ${(status === 'SUCCESS' || status === 200) ? colors.success : colors.danger}`,
  }),
};

// --- Labeled Input Component (Styled with tableStyles) ---
const LabeledInput = ({ label, value, onChange, isHighlighted = false, type = 'text', readOnly = false }) => {
  const [focused, setFocused] = useState(false);
  const inputStyle = {
    ...tableStyles.input,
    ...(focused ? tableStyles.inputFocus : {}),
    ...(isHighlighted ? { background: '#fffbe5', fontWeight: 'bold' } : {}),
    opacity: readOnly ? 0.7 : 1,
  };

  return (
    <label style={{ display: 'block' }}>
      <span style={tableStyles.labelText}>{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        readOnly={readOnly}
      />
    </label>
  );
};

// LocalStorage keys
const STORAGE_KEY = "iris_einvoice_response";  
const STORAGE_KEY1 = "iris_einvoice_shared_config";

// Default values for EWB fields if not found in storage
const FALLBACK_DEFAULTS = {
    irn: "5eb8ce1121003e0b0b44059d85b660d2f4f00e3587bac05e16fed14a791386cd",
    userGstin: "01AAACI9260R002",
    vehNo: "MH20ZZ8888",
    transId: "01ACQPN4602B002",
    transDocDate: "14-11-2025", 
};

const GenerateEwbByIrn = () => {
    /* -------------------- LOCAL STORAGE DATA FETCH -------------------- */
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
  const savedResponse = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  
    // Derive Auth/ID values
    const initialAuthToken = savedResponse.token || savedConfig.token;
    const initialCompanyId = savedResponse.companyId || savedConfig.companyId;

    // Derive body values, prioritizing storage
    const storageIrn = savedResponse.irn || savedConfig.irn;
    const storageUserGstin = savedResponse.companyUniqueCode || savedConfig.companyUniqueCode;
    const storageVehNo = savedResponse.vehNo || savedConfig.vehNo;
    const storageTransId = savedResponse.transId || savedConfig.transId;


    /* -------------------- CONSOLIDATED REQUEST BODY DEFINITION -------------------- */
    const INITIAL_REQUEST_BODY = {
        // 1. Mandatory E-Invoice Reference
        "irn": storageIrn || FALLBACK_DEFAULTS.irn, 
        "userGstin": storageUserGstin || FALLBACK_DEFAULTS.userGstin,
        
        // 2. Transport Details
        "transMode": "ROAD",
        "vehTyp": "R",
        "transDist": 0,
        "transName": "Safe and Secure",
        "transDocNo": "10294",
        "transDocDate": FALLBACK_DEFAULTS.transDocDate, 
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
    useEffect(() => {
        const sourceToken = savedResponse?.token || savedConfig?.token || "";
        const sourceCompanyId = savedResponse?.companyId || savedConfig?.companyId || "";
        
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
  const payload = config.body;

  const handleBodyChange = (key, value) => {
    setConfig(prev => ({
      ...prev,
      body: { 
            ...prev.body, 
            [key]: value
        },
    }));
  };

  // Generate button style using the provided btnGenerate style (using primary color)
  const generateBtnStyle = tableStyles.btnGenerate(loading, isReady);

  // Helper to check if a response indicates success
  const isSuccessResponse = response && (response.status === 200 || response.body.status === 'SUCCESS');

  return (
    <div style={tableStyles.container}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <h1 style={tableStyles.header}>Generate E-Way Bill by IRN</h1>

        <div style={{
            padding: '12px',
            background: isReady ? '#e8f5e9' : '#ffebee',
            borderRadius: '10px',
            marginBottom: '30px',
            fontWeight: 'bold',
            color: isReady ? colors.success : colors.danger,
            textAlign: 'center'
        }}>
            Auth Status: {isReady ? 'Ready' : 'Missing X-Auth-Token or Company ID'}
        </div>

        {/* =========================================================================
            SECTION 1: E-Invoice Reference & Supply Details (2 Columns) 
        ========================================================================= */}
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th colSpan={2} style={{ background: colors.primary, color: "white", fontSize: "16px" }}>E-Invoice Reference & Supply Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="IRN (Invoice Reference Number)" 
                    value={payload.irn} 
                    onChange={v => handleBodyChange('irn', v)}
                    isHighlighted 
                />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="User GSTIN" 
                    value={payload.userGstin} 
                    onChange={v => handleBodyChange('userGstin', v)}
                    isHighlighted 
                />
              </td>
            </tr>
            <tr>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="Supply Type (subSplyTyp)" 
                    value={payload.subSplyTyp} 
                    onChange={v => handleBodyChange('subSplyTyp', v)}
                />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="Supply Description (subSplyDes)" 
                    value={payload.subSplyDes} 
                    onChange={v => handleBodyChange('subSplyDes', v)}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* =========================================================================
            SECTION 2: Transport Details (3 Columns)
        ========================================================================= */}
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th colSpan={3} style={{ background: "#FF9800", color: "white", fontSize: "16px" }}>Transport Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="Vehicle Number (vehNo)" 
                    value={payload.vehNo} 
                    onChange={v => handleBodyChange('vehNo', v)}
                />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="Transporter ID (transId)" 
                    value={payload.transId} 
                    onChange={v => handleBodyChange('transId', v)}
                />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="Transporter Name (transName)" 
                    value={payload.transName} 
                    onChange={v => handleBodyChange('transName', v)}
                />
              </td>
            </tr>
            <tr>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="Mode (transMode)" 
                    value={payload.transMode} 
                    onChange={v => handleBodyChange('transMode', v)}
                />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="Vehicle Type (vehTyp)" 
                    value={payload.vehTyp} 
                    onChange={v => handleBodyChange('vehTyp', v)}
                />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="Distance (transDist)" 
                    value={payload.transDist} 
                    onChange={v => handleBodyChange('transDist', v)}
                    type='number'
                />
              </td>
            </tr>
            <tr>
              <td style={tableStyles.td}>
                <LabeledInput 
                    label="Transporter Doc No (transDocNo)" 
                    value={payload.transDocNo} 
                    onChange={v => handleBodyChange('transDocNo', v)}
                />
              </td>
              <td colSpan={2} style={tableStyles.td}>
                <LabeledInput 
                    label="Transporter Doc Date (transDocDate)" 
                    value={payload.transDocDate} 
                    onChange={v => handleBodyChange('transDocDate', v)}
                />
              </td>
            </tr>
          </tbody>
        </table>

        {/* =========================================================================
            SECTION 3: Place & Delivery Details (2 Columns for clarity)
        ========================================================================= */}
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={{ background: colors.success, color: "white", fontSize: "16px" }}>Dispatch (p...) Details</th>
              <th style={{ background: colors.primary, color: "white", fontSize: "16px" }}>Delivery (d...) Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableStyles.td}>
                <LabeledInput label="Address 1 (paddr1)" value={payload.paddr1} onChange={v => handleBodyChange('paddr1', v)} />
                <LabeledInput label="Address 2 (paddr2)" value={payload.paddr2} onChange={v => handleBodyChange('paddr2', v)} />
                <LabeledInput label="Location (ploc)" value={payload.ploc} onChange={v => handleBodyChange('ploc', v)} />
                <LabeledInput label="State Code (pstcd)" value={payload.pstcd} onChange={v => handleBodyChange('pstcd', v)} />
                <LabeledInput label="PIN (ppin)" value={payload.ppin} onChange={v => handleBodyChange('ppin', v)} />
                <LabeledInput label="Place of Bill EWB (pobewb)" value={payload.pobewb} onChange={v => handleBodyChange('pobewb', v)} />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput label="Recipient Name (dNm)" value={payload.dNm} onChange={v => handleBodyChange('dNm', v)} />
                <LabeledInput label="Address 1 (daddr1)" value={payload.daddr1} onChange={v => handleBodyChange('daddr1', v)} />
                <LabeledInput label="Address 2 (daddr2)" value={payload.daddr2} onChange={v => handleBodyChange('daddr2', v)} />
                <LabeledInput label="Location (disloc)" value={payload.disloc} onChange={v => handleBodyChange('disloc', v)} />
                <LabeledInput label="State Code (disstcd)" value={payload.disstcd} onChange={v => handleBodyChange('disstcd', v)} />
                <LabeledInput label="PIN (dispin)" value={payload.dispin} onChange={v => handleBodyChange('dispin', v)} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* --- Action Button --- */}
        <div style={{ textAlign: "center", margin: "40px 0" }}>
            <button
                onClick={generateEWB}
                disabled={loading || !isReady}
                style={generateBtnStyle}
            >
                {loading ? 'Generating EWB...' : 'GENERATE E-WAY BILL'}
            </button>
        </div>


        {/* --- API Response --- */}
        {response && (
            <div>
                <h3 style={{ color: isSuccessResponse ? colors.success : colors.danger, marginBottom: "16px", fontSize: "18px" }}>
                    API Response (Status: {response.status})
                </h3>
                <pre style={tableStyles.responseBox(response.body.status || response.status)}>
                    {JSON.stringify(response.body, null, 2)}
                </pre>
            </div>
        )}
      </div>
    </div>
  );
};

export default GenerateEwbByIrn;