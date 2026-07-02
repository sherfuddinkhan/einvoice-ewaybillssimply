// src/components/GetByIRNForm.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

// Local Storage Key Terminology
const STORAGE_KEY = "iris_einvoice_response";     // Holds irn, companyUniqueCode (GSTIN)
const STORAGE_KEY1  = "iris_einvoice_shared_config"; // Holds token, companyId
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";
 const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY2) || '{}');

const GetInvByIrn = ({ previousResponse }) => {
  const { authToken, lastIrn, lastUserGstin } = useAuth();

  /* -------------------- LOCAL STORAGE DATA FETCH -------------------- */
  const savedResponse = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "{}"
  );
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY2) || '{}');
  
  /* -------------------- STATE -------------------- */
  const [irn, setIrn] = useState("");
  const [userGstin, setUserGstin] = useState("");

  const [headers, setHeaders] = useState({
    "X-Auth-Token": "",
    companyId: "",
    product: "ONYX",
  });

  const [response, setResponse] = useState(null);

  /* -------------------- AUTO-POPULATION LOGIC (IRN & GSTIN) -------------------- */
  useEffect(() => {
    // 1. Determine the IRN based on priority: lastAuth > savedResponse > savedConfig
    const determinedIrn = savedResponse?.irn || savedConfig?.irn ||  "";
    
    // 2. Determine the User GSTIN based on priority: lastAuth > savedResponse (companyUniqueCode) > savedConfig (companyUniqueCode)
    const determinedUserGstin = 
      lastUserGstin || 
      savedResponse?.companyUniqueCode || 
      savedConfig?.userGstin || 
      "";

    // Update state only if values have changed
    if (determinedIrn !== irn) {
      setIrn(determinedIrn);
    }
    if (determinedUserGstin !== userGstin) {
      setUserGstin(determinedUserGstin);
    }
  }, []); // Removed irn/userGstin dependencies as they cause loops

  /* -------------------- AUTO-FILL HEADERS (INCLUDING IRN FOR DISPLAY) -------------------- */
const { token, companyid } = useAuth();
  // Always get latest values from localStorage
      const currentConnectionType =
        localStorage.getItem("connectionType") || "DEFAULT";


useEffect(() => {
  setHeaders({
    "X-Auth-Token": token || "",
    companyId: companyid || "24",
    product: "ONYX",
    "ConnectionType": currentConnectionType ,
  });
}, [token, companyid]);

  /* -------------------- ENDPOINT -------------------- */
  const endpoint = `https://einvoice.fcssoftwares.com/api/gst/einvoice/by-irn?irn=${encodeURIComponent(
  irn
)}&userGstin=${encodeURIComponent(userGstin)}`;

  /* -------------------- FETCH HANDLER -------------------- */
  const handleFetch = async () => {
    if (!headers["X-Auth-Token"]) return alert("Please login first!");
    if (!irn) return alert("Enter IRN");
    if (!userGstin) return alert("Enter User GSTIN");

    setResponse(null);
    try {
      const res = await fetch(endpoint, {
        method: "GET",
        // Note: Headers object is used directly, which contains the token/companyId
        headers: headers, 
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch invoice");
    }
  };

  /* -------------------- UI -------------------- */
  return (
    <div style={containerStyle}>
      <h2>Get Invoice by IRN</h2>
      <p style={{color: '#006400', fontSize: 'small', padding: '5px', borderLeft: '3px solid #006400', backgroundColor: '#f0fff0'}}>
        * IRN and User GSTIN are auto-populated from Auth context or Local Storage.
      </p>

<div style={fieldRow}>
  <label style={labelStyle}>IRN</label>

  <input
    value={irn}
    onChange={(e) => setIrn(e.target.value)}
    placeholder="IRN (auto-filled)"
    style={{
      ...inputStyle,
      background: irn ? "#e8f5e9" : "white",
      fontWeight: irn ? "bold" : "normal",
    }}
  />
</div>

<div style={fieldRow}>
  <label style={labelStyle}>User GSTIN</label>

  <input
    value={userGstin}
    onChange={(e) => setUserGstin(e.target.value)}
    placeholder="User GSTIN (auto-filled)"
    style={{
      ...inputStyle,
      background: userGstin ? "#e8f5e9" : "white",
      fontWeight: userGstin ? "bold" : "normal",
    }}
  />
</div>

<div style={fieldRow}>
  <label style={labelStyle}>URL</label>

  <pre
    style={{
      ...codeStyle,
      flex: 1,
      margin: 0,
    }}
  >
    {endpoint}
  </pre>
</div>


      <button
        onClick={handleFetch}
        disabled={!headers["X-Auth-Token"] || !irn || !userGstin}
        style={buttonStyle(!headers["X-Auth-Token"] || !irn || !userGstin)}
      >
        Fetch Invoice
      </button>

      {response && (
        <div style={{ ...sectionStyle, backgroundColor: response.body?.status === 'SUCCESS' ? '#e8f5e9' : '#ffebee' }}>
          <strong>Response:</strong>
          <p style={{ color: response.body?.status === 'SUCCESS' ? 'green' : 'red', fontWeight: 'bold' }}>
             Status: {response.body?.status || 'N/A'} (HTTP {response.status || 'N/A'})
          </p>
          <pre style={codeStyle}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

/* -------------------- STYLES -------------------- */
const fieldRow = {
  display: "flex",
  alignItems: "center",
  marginBottom: "20px",
  gap: "20px",
};

const labelStyle = {
  width: "180px",
  fontWeight: "600",
  color: "#333",
  fontSize: "16px",
};

const containerStyle = {
  // Increased container width to 800px so the URL input can expand horizontally
  maxWidth: 800, 
  margin: "40px auto",
  padding: "0 20px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const sectionStyle = {
  marginBottom: 24,
  padding: "4px 0",
  backgroundColor: "transparent", 
};

// Dedicated style for the URL container to let it sit comfortably on its own wide line
const urlContainerStyle = {
  width: "100%",
  marginBottom: 16,
};

const inputStyle = {
  // Spans the full width of the expanded 800px container
  width: "50%",
  boxSizing: "border-box", 
  padding: "12px 16px", // Added slightly deeper padding for a premium, spacious look
  borderRadius: 6,
  border: "1px solid #dcdcdc",
  backgroundColor: "#fff", 
  fontSize: "15px", // Bumped font up slightly for a clean readability sweep
  transition: "border-color 0.2s ease",
};

// Restricting other elements (like standard forms/buttons) so they don't stretch awkwardly across the new 800px width
const compactElementStyle = {
  maxWidth: 400, 
  width: "100%",
};

const codeStyle = {
  background: "#1e1e1e", 
  color: "#f8f8f2",
  padding: 14,
  borderRadius: 6,
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "13px",
  whiteSpace: "pre-wrap",
  wordBreak: "break-all",
  marginTop: 8,
};

const buttonStyle = (disabled) => ({
  padding: "12px 24px",
  backgroundColor: disabled ? "#e0e0e0" : "#2563eb", 
  color: disabled ? "#a3a3a3" : "white",
  border: "none",
  borderRadius: 6,
  fontSize: "14px",
  fontWeight: "600",
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "background-color 0.2s ease",
});



export default GetInvByIrn;