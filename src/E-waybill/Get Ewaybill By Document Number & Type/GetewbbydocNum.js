import React, { useState } from "react";
import axios from "axios";

// ---------------------------
// LocalStorage Keys
// ---------------------------
const LOGIN_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";
const STORAGE_KEY = "BULK_DOCNUM_PAYLOAD";


// Helper to read JSON safely
const getJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};

const GetewbbydocNum = () => {
  const login = getJson(LOGIN_KEY) || {};
  const latest = getJson(LATEST_EWB_KEY) || {};
  const saved = getJson(STORAGE_KEY) || {};
console.log("latest",latest);
  // ---------------------------
  // HEADERS
  // ---------------------------
  const [headers, setHeaders] = useState({
    companyId: login.companyId || "",
    "X-Auth-Token": login.authToken || login.token || "",
    product: "TOPAZ",
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  // ---------------------------
  // PAYLOAD
  // ---------------------------
  const [payload, setPayload] = useState({
    userGstin:
      latest?.fullApiResponse?.response?.fromGstin ||
      saved?.userGstin ||
      login?.gstin ||
      "",
    companyId:latest?.response?.companyId || login?.companyId || "",
    docType:
      latest?.fullApiResponse?.response?.docType ||
      saved?.docType ||
      "INV",
    docNumList:
      latest?.fullApiResponse?.response?.docNumList ||
      saved?.docNumList ||
      [],
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const updatePayload = (key, value) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const updateHeaders = (key, value) => {
    setHeaders((prev) => ({ ...prev, [key]: value }));
  };

  const updateDocList = (value) => {
    const list = value
      .split(",")
      .map((v) => v.trim())
      .filter((v) => v.length);

    setPayload((prev) => ({ ...prev, docNumList: list }));
  };

  // ---------------------------
  // API CALL
  // ---------------------------
  const fetchData = async () => {
    setError(null);
    setResult(null);

    try {
      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/ewb/docNum",
        payload,
        { headers }
      );

      setResult(res.data);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      if (res.data?.response) {
        localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(res.data));
      }
    } catch (err) {
      setError(err.response?.data || err.message);
    }
  };

  // ---------------------------
  // COMPONENT UI
  // ---------------------------
  return (
    <div
      style={{
        maxWidth: 900,
        margin: "30px auto",
        fontFamily: "Arial",
        padding: 20,
      }}
    >
      <h2 style={{ marginBottom: 20, textAlign: "center" }}>
        🚚 EWB Bulk Lookup by Document Number
      </h2>

      {/* ----------------------------- */}
      {/* PAYLOAD CARD */}
      {/* ----------------------------- */}
      <div
        style={{
          background: "#f7faff",
          padding: 20,
          borderRadius: 10,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          marginBottom: 25,
        }}
      >
        <h3 style={{ marginBottom: 15 }}>📦 Payload (POST Body)</h3>

        <label>GSTIN</label>
        <input
          value={payload.userGstin}
          onChange={(e) => updatePayload("userGstin", e.target.value)}
          className="input"
          style={inputStyle}
        />

        <label>Company ID</label>
        <input
          value={payload.companyId}
          onChange={(e) => updatePayload("companyId", e.target.value)}
          style={inputStyle}
        />

        <label>Document Type (INV/BOE/DC/...)</label>
        <input
          value={payload.docType}
          onChange={(e) => updatePayload("docType", e.target.value)}
          style={inputStyle}
        />

        <label>Document Numbers (comma separated)</label>
        <input
          value={payload.docNumList.join(", ")}
          onChange={(e) => updateDocList(e.target.value)}
          style={inputStyle}
        />

        <button style={buttonStyle} onClick={fetchData}>
          🔍 Fetch Details
        </button>
      </div>

      {/* ----------------------------- */}
      {/* HEADERS CARD */}
      {/* ----------------------------- */}
      <div
        style={{
          background: "#fdf7e3",
          padding: 20,
          borderRadius: 10,
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
          marginBottom: 25,
        }}
      >
        <h3 style={{ marginBottom: 15 }}>🧾 Headers</h3>

        {Object.entries(headers).map(([key, value]) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label>{key}</label>
            <input
              value={value}
              onChange={(e) => updateHeaders(key, e.target.value)}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* ----------------------------- */}
      {/* PAYLOAD JSON */}
      {/* ----------------------------- */}
      <div style={{ marginBottom: 20 }}>
        <h3>📤 Final POST Payload</h3>
        <pre style={payloadBox}>{JSON.stringify(payload, null, 2)}</pre>
      </div>

      {/* ----------------------------- */}
      {/* API RESPONSE */}
      {/* ----------------------------- */}
      <h3>📥 API Response</h3>

      {error && <pre style={errorBox}>{JSON.stringify(error, null, 2)}</pre>}
      {result && <pre style={responseBox}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

// ---------------------------
// Reusable Styles
// ---------------------------
const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: 5,
  marginBottom: 15,
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
};

const buttonStyle = {
  padding: "12px 20px",
  width: "100%",
  borderRadius: 8,
  background: "#1976d2",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  marginTop: 10,
  fontSize: 16,
};

const payloadBox = {
  background: "#fffce0",
  padding: 15,
  borderRadius: 8,
  whiteSpace: "pre-wrap",
};

const responseBox = {
  background: "#e9f2ff",
  padding: 15,
  borderRadius: 8,
};

const errorBox = {
  background: "#ffe6e6",
  padding: 15,
  borderRadius: 8,
  color: "red",
};

export default GetewbbydocNum;
