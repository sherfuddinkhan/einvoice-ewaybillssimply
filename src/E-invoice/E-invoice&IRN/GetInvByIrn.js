// src/components/GetByIRNForm.js
import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

const STORAGE_KEY = "iris_einvoice_response";
const STORAGE_KEY1  = "iris_einvoice_shared_config";

const GetInvByIrn = ({ previousResponse }) => {
  const { authToken, lastIrn, lastUserGstin } = useAuth();

  /* -------------------- LOCAL STORAGE -------------------- */
  const savedConfig = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "{}"
  );

  const savedResponse = JSON.parse(
    localStorage.getItem(STORAGE_KEY1) || "{}"
  );
 console.log("savedConfig",savedConfig)
  console.log("savedResponse",savedResponse)

  /* -------------------- STATE -------------------- */
  const [irn, setIrn] = useState(lastIrn || savedConfig.irn || "");
  const [userGstin, setUserGstin] = useState(
    lastUserGstin || savedConfig.companyUniqueCode
 || ""
  );

  const [headers, setHeaders] = useState({
    "X-Auth-Token": "",
    companyId: "",
    product: "ONYX",
  });

  const [response, setResponse] = useState(null);

  /* -------------------- AUTO-FILL IRN & GSTIN -------------------- */
  useEffect(() => {
    if (lastIrn) setIrn(lastIrn);
    if (lastUserGstin) setUserGstin(lastUserGstin);
  }, [lastIrn, lastUserGstin]);

  /* -------------------- AUTO-FILL HEADERS -------------------- */
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

    setHeaders({
      "X-Auth-Token": token,
      companyId,
      product: "ONYX",
    });
  }, [previousResponse, authToken]);

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
        headers,
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

      <input
        value={irn}
        onChange={(e) => setIrn(e.target.value)}
        placeholder="IRN (auto-filled)"
        style={inputStyle}
      />

      <input
        value={userGstin}
        onChange={(e) => setUserGstin(e.target.value)}
        placeholder="User GSTIN (auto-filled)"
        style={inputStyle}
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
        disabled={!headers["X-Auth-Token"]}
        style={buttonStyle(!headers["X-Auth-Token"] || !irn || !userGstin)}
      >
        Fetch Invoice
      </button>

      {response && (
        <div style={{ ...sectionStyle, backgroundColor: "#e3f2fd" }}>
          <strong>Response:</strong>
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
