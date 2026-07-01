import React, { useState, useEffect } from 'react';
import { useAuth } from "../../components/AuthContext";
import { useLocation } from "react-router-dom";

// --- Colors ---
const colors = {
  primary: "#1A73E8",
  success: "#34A853",
  danger: "#EA4335",
  background: "#F8F9FA",
};

// --- Table Styles ---
const tableStyles = {
  container: { padding: "20px", background: colors.background, minHeight: "100vh", fontFamily: "'Segoe UI', Roboto, sans-serif" },
  header: { textAlign: "center", color: colors.primary, fontSize: "28px", marginBottom: "30px", fontWeight: 500 },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "30px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", borderRadius: "8px", overflow: "hidden" },
  th: { background: "#E3F2FD", color: colors.primary, textAlign: "left", padding: "16px", fontWeight: 600, fontSize: "16px" },
  td: { padding: "14px 16px", borderBottom: "1px solid #eee", verticalAlign: "top" },
  labelText: { fontWeight: "600", color: "#333", fontSize: "14px", display: "block", marginBottom: "8px" },
  input: { width: "100%", padding: "12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "14px", boxSizing: "border-box" },
  inputFocus: { borderColor: colors.primary, boxShadow: "0 0 0 3px rgba(26,115,232,0.2)", outline: "none" },
  btnGreen: { padding: "12px 24px", background: colors.success, color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "15px" },
  btnRed: { padding: "8px 16px", background: colors.danger, color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "13px" },
  btnGenerate: (loading, ready) => ({
    padding: "20px 100px",
    fontSize: "22px",
    fontWeight: "bold",
    background: loading || !ready ? "#999" : colors.primary,
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: loading || !ready ? "not-allowed" : "pointer",
    boxShadow: "0 10px 30px rgba(26,115,232,0.4)",
  }),
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

// --- Reusable Labeled Input ---
const LabeledInput = ({ label, value, onChange, type = 'text', isHighlighted = false, readOnly = false }) => {
  const [focused, setFocused] = useState(false);

  const inputStyle = {
    ...tableStyles.input,
    ...(focused ? tableStyles.inputFocus : {}),
    ...(isHighlighted ? { background: '#fffbe5', fontWeight: 'bold' } : {}),
    opacity: readOnly ? 0.7 : 1,
  };

  return (
    <label style={{ display: 'block', marginBottom: '12px' }}>
      <span style={tableStyles.labelText}>{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        style={inputStyle}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        readOnly={readOnly}
      />
    </label>
  );
};

// LocalStorage Keys
const STORAGE_KEY = "iris_einvoice_response";
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";

const FALLBACK_DEFAULTS = {
  irn: "5eb8ce1121003e0b0b44059d85b660d2f4f00e3587bac05e16fed14a791386cd",
  userGstin: "01AAACI9260R002",
  vehNo: "MH20ZZ8888",
  transId: "01ACQPN4602B002",
  transDocDate: "14-11-2025",
};

const GenerateEwbByIrn = () => {
  const location = useLocation();
  const { token, companyId, userGstin: authUserGstin } = useAuth();

  const invoiceData = location.state?.invoiceData || JSON.parse(localStorage.getItem("selectedInvoice") || "{}");
  const inv = invoiceData;

  // ================= DATE FORMAT =================
  const formatDate = (dateInput) => {
    if (!dateInput) return "";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "";
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = date.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  // ================= INITIAL PAYLOAD =================
  const getInitialBody = () => ({
    // Basic
    irn: inv?.irn || FALLBACK_DEFAULTS.irn,
    userGstin: inv?.gstin || authUserGstin || FALLBACK_DEFAULTS.userGstin,

    // Transport
    vehTyp: "R",
    transDist: Number(inv?.distance || 0),
    transDocNo: inv?.transporterDocNo || inv?.despatchedDocumentNumber || `DOC${inv?.keyID || "001"}`,
    transDocDate: formatDate(inv?.deliveryNoteDate || inv?.invoicecreatedOn || new Date()),
    vehNo: inv?.vehicleNo || FALLBACK_DEFAULTS.vehNo,
    transId: inv?.transporterID || FALLBACK_DEFAULTS.transId,
    transName: inv?.transporterName || "",
    transMode: inv?.transportMode || "Road",

    // Supply
    subSplyTyp: "Supply",
    subSplyDes: "",

    // Dispatch & Delivery (commonly required)
    paddr1: "", paddr2: "", ploc: "", pstcd: "", ppin: "", pobewb: "",
    dNm: "", daddr1: "", daddr2: "", disloc: "", disstcd: "", dispin: "",
  });

  const [body, setBody] = useState(getInitialBody);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const isReady = !!(companyId && token);

  // Sync invoice data when it changes
  useEffect(() => {
    setBody(getInitialBody());
  }, [inv, authUserGstin]);

  const handleChange = (key, value) => {
    setBody(prev => ({ ...prev, [key]: value }));
  };

  const generateEWB = async () => {
    if (!body.irn?.trim()) {
      alert("IRN is required!");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("https://einvoice.fcssoftwares.com/api/gst/einvoice/generate-ewb", {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          companyId,
          "X-Auth-Token": token,
          product: "ONYX",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      const result = {
        status: res.status,
        body: data,
        time: new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      };

      setResponse(result);

      if (res.ok && data.status === "SUCCESS") {
        alert("E-Way Bill Generated Successfully!");
        localStorage.setItem(STORAGE_KEY2, JSON.stringify(data));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      }
    } catch (err) {
      setResponse({ error: err.message });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isSuccessResponse = response?.status === 200 || response?.body?.status === "SUCCESS";

  return (
    <div style={tableStyles.container}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
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
          Auth Status: {isReady ? '✅ Ready' : '❌ Missing Token or Company ID'}
        </div>

        {/* E-Invoice Reference */}
        <table style={tableStyles.table}>
          <thead>
            <tr><th colSpan={2} style={{ background: colors.primary, color: "white" }}>E-Invoice Reference & Supply Details</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableStyles.td}>
                <LabeledInput label="IRN" value={body.irn} onChange={(v) => handleChange('irn', v)} isHighlighted />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput label="User GSTIN" value={body.userGstin} onChange={(v) => handleChange('userGstin', v)} isHighlighted />
              </td>
            </tr>
            <tr>
              <td style={tableStyles.td}>
                <LabeledInput label="Supply Type" value={body.subSplyTyp} onChange={(v) => handleChange('subSplyTyp', v)} />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput label="Supply Description" value={body.subSplyDes} onChange={(v) => handleChange('subSplyDes', v)} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Transport Details */}
        <table style={tableStyles.table}>
          <thead>
            <tr><th colSpan={3} style={{ background: "#FF9800", color: "white" }}>Transport Details</th></tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableStyles.td}><LabeledInput label="Vehicle No" value={body.vehNo} onChange={v => handleChange('vehNo', v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="Transporter ID" value={body.transId} onChange={v => handleChange('transId', v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="Transporter Name" value={body.transName} onChange={v => handleChange('transName', v)} /></td>
            </tr>
            <tr>
              <td style={tableStyles.td}><LabeledInput label="Mode" value={body.transMode} onChange={v => handleChange('transMode', v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="Vehicle Type" value={body.vehTyp} onChange={v => handleChange('vehTyp', v)} /></td>
              <td style={tableStyles.td}><LabeledInput label="Distance (km)" value={body.transDist} onChange={v => handleChange('transDist', v)} type="number" /></td>
            </tr>
            <tr>
              <td style={tableStyles.td}><LabeledInput label="Trans Doc No" value={body.transDocNo} onChange={v => handleChange('transDocNo', v)} /></td>
              <td colSpan={2} style={tableStyles.td}><LabeledInput label="Trans Doc Date" value={body.transDocDate} onChange={v => handleChange('transDocDate', v)} /></td>
            </tr>
          </tbody>
        </table>

        {/* Dispatch & Delivery */}
        <table style={tableStyles.table}>
          <thead>
            <tr>
              <th style={{ background: colors.success, color: "white" }}>Dispatch Details</th>
              <th style={{ background: colors.primary, color: "white" }}>Delivery Details</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={tableStyles.td}>
                <LabeledInput label="Address 1" value={body.paddr1} onChange={v => handleChange('paddr1', v)} />
                <LabeledInput label="Address 2" value={body.paddr2} onChange={v => handleChange('paddr2', v)} />
                <LabeledInput label="Location" value={body.ploc} onChange={v => handleChange('ploc', v)} />
                <LabeledInput label="State Code" value={body.pstcd} onChange={v => handleChange('pstcd', v)} />
                <LabeledInput label="PIN" value={body.ppin} onChange={v => handleChange('ppin', v)} />
                <LabeledInput label="Place of EWB" value={body.pobewb} onChange={v => handleChange('pobewb', v)} />
              </td>
              <td style={tableStyles.td}>
                <LabeledInput label="Recipient Name" value={body.dNm} onChange={v => handleChange('dNm', v)} />
                <LabeledInput label="Address 1" value={body.daddr1} onChange={v => handleChange('daddr1', v)} />
                <LabeledInput label="Address 2" value={body.daddr2} onChange={v => handleChange('daddr2', v)} />
                <LabeledInput label="Location" value={body.disloc} onChange={v => handleChange('disloc', v)} />
                <LabeledInput label="State Code" value={body.disstcd} onChange={v => handleChange('disstcd', v)} />
                <LabeledInput label="PIN" value={body.dispin} onChange={v => handleChange('dispin', v)} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Generate Button */}
        <div style={{ textAlign: "center", margin: "40px 0" }}>
          <button
            onClick={generateEWB}
            disabled={loading || !isReady}
            style={tableStyles.btnGenerate(loading, isReady)}
          >
            {loading ? 'Generating E-Way Bill...' : 'GENERATE E-WAY BILL'}
          </button>
        </div>

        {/* Response */}
        {response && (
          <div>
            <h3 style={{ color: isSuccessResponse ? colors.success : colors.danger, marginBottom: "16px" }}>
              API Response {response.status && `(Status: ${response.status})`}
            </h3>
            <pre style={tableStyles.responseBox(response?.body?.status || response?.status)}>
              {JSON.stringify(response?.body ?? response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerateEwbByIrn;