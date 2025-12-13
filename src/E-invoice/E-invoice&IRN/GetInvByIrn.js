// src/components/GetByIRNForm.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

// Local Storage Key Terminology
const STORAGE_KEY = "iris_einvoice_response";     // Holds irn, companyUniqueCode (GSTIN)
const STORAGE_KEY1  = "iris_einvoice_shared_config"; // Holds token, companyId

const GetInvByIrn = ({ previousResponse }) => {
  const { authToken, lastIrn, lastUserGstin } = useAuth();

  /* -------------------- LOCAL STORAGE DATA FETCH -------------------- */
  const savedResponse = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "{}"
  );
  const savedConfig = JSON.parse(
    localStorage.getItem(STORAGE_KEY1) || "{}"
  );
  
  /* -------------------- STATE -------------------- */
  const [irn, setIrn] = useState("");
  const [userGstin, setUserGstin] = useState("");

  const [headers, setHeaders] = useState({
    "X-Auth-Token": "",
    companyId: "",
    product: "ONYX",
    Current_IRN_State: "", // Initializing the display field
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
      savedConfig?.companyUniqueCode || 
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
  useEffect(() => {
    const token =
      previousResponse?.token ||
      authToken ||
      savedResponse?.token ||
      savedConfig?.token ||
      "";

    const companyId =
      previousResponse?.companyId ||
      savedResponse?.companyId || 
      savedConfig?.companyId ||
      "";
    
    // FIX: Use the current 'irn' state to update the headers object for display
    setHeaders({
      "X-Auth-Token": token,
      companyId,
      product: "ONYX",
      // Added for display/debugging purposes:
      Current_IRN_State: irn, 
    });
    // Header update depends on irn, which is why we must include it as a dependency
  }, [previousResponse, authToken, irn]); 

  /* -------------------- ENDPOINT -------------------- */
  const endpoint = `https://stage-api.irisgst.com/irisgst/onyx/irn/getInvByIrn?irn=${encodeURIComponent(
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

      <input
        value={irn}
        onChange={(e) => setIrn(e.target.value)}
        placeholder="IRN (auto-filled)"
        style={{...inputStyle, background: irn ? '#e8f5e9' : 'white', fontWeight: irn ? 'bold' : 'normal'}}
      />

      <input
        value={userGstin}
        onChange={(e) => setUserGstin(e.target.value)}
        placeholder="User GSTIN (auto-filled)"
        style={{...inputStyle, background: userGstin ? '#e8f5e9' : 'white', fontWeight: userGstin ? 'bold' : 'normal'}}
      />

      <div style={sectionStyle}>
        <strong>URL:</strong>
        <pre style={codeStyle}>{endpoint}</pre>
      </div>

      <div style={sectionStyle}>
        <strong>Headers (Auto-filled):</strong>
        <pre style={codeStyle}>{JSON.stringify(headers, null, 2)}</pre>
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
const containerStyle = {
  maxWidth: 900,
  margin: "20px auto",
  padding: 20,
};

const sectionStyle = {
  marginBottom: 20,
  padding: 12,
  backgroundColor: "#f5f5f5",
  borderRadius: 6,
};

const inputStyle = {
  width: "100%",
  padding: 8,
  marginBottom: 10,
  borderRadius: 4,
  border: "1px solid #ccc",
};

const codeStyle = {
  background: "#fff",
  padding: 10,
  borderRadius: 4,
  fontFamily: "monospace",
  whiteSpace: "pre-wrap",
  border: "1px solid #ddd",
  marginTop: 8,
};

const buttonStyle = (disabled) => ({
  padding: "10px 20px",
  backgroundColor: disabled ? "#ccc" : "#3498db",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: disabled ? "not-allowed" : "pointer",
});

export default GetInvByIrn;