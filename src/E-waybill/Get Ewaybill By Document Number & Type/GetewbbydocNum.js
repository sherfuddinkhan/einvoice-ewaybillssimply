import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const DOCNUM_PAYLOAD_KEY = "ewb_docnum_payload";

/* ---------------------------------
   Safe LocalStorage Reader
---------------------------------- */
const readLS = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const GetEwbByDocNum = () => {
  /* ---------------------------------
     Load Shared Auth & Cached Data
  ---------------------------------- */
  const shared = readLS(STORAGE_KEY00);
  const latestEwb = readLS(LATEST_EWB_KEY);
  const savedPayload = readLS(DOCNUM_PAYLOAD_KEY);

  const token = shared?.fullResponse?.response?.token || "";
  const companyId =
    latestEwb?.response?.companyId ||
    shared?.fullResponse?.response?.companyid ||
    "";

  const defaultGstin =
    latestEwb?.response?.fromGstin ||
    shared?.fullResponse?.response?.userGstin ||
    "";

  /* ---------------------------------
     Headers State
  ---------------------------------- */
  const [headers, setHeaders] = useState({
    Accept: "application/json",
    "Content-Type": "application/json",
    product: "TOPAZ",
    companyId,
    "X-Auth-Token": token,
  });

  /* ---------------------------------
     Payload State
  ---------------------------------- */
  const [payload, setPayload] = useState({
    userGstin: savedPayload?.userGstin || defaultGstin,
    companyId: savedPayload?.companyId || companyId,
    docType: savedPayload?.docType || "INV",
    docNumList: savedPayload?.docNumList || [],
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  /* ---------------------------------
     State Helpers
  ---------------------------------- */
  const updatePayload = (key, value) =>
    setPayload((p) => ({ ...p, [key]: value }));

  const updateHeaders = (key, value) =>
    setHeaders((h) => ({ ...h, [key]: value }));

  const updateDocList = (value) => {
    const list = value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    setPayload((p) => ({ ...p, docNumList: list }));
  };

  /* ---------------------------------
     API Call
  ---------------------------------- */
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

      // Persist payload for reload
      localStorage.setItem(
        DOCNUM_PAYLOAD_KEY,
        JSON.stringify(payload)
      );

      // Persist latest EWB response
      if (res.data?.response) {
        localStorage.setItem(
          LATEST_EWB_KEY,
          JSON.stringify({
            ewbSource: "DOC_NUM",
            request: payload,
            response: res.data.response,
            fullApiResponse: res.data,
          })
        );
      }
    } catch (err) {
      setError(err.response?.data || err.message);
    }
  };

  /* ---------------------------------
     UI
  ---------------------------------- */
  return (
    <div style={container}>
      <h2 style={{ textAlign: "center" }}>
        🚚 EWB Bulk Lookup by Document Number
      </h2>

      {/* Payload */}
      <div style={cardBlue}>
        <h3>📦 Payload (POST Body)</h3>

        <label>GSTIN</label>
        <input
          value={payload.userGstin}
          onChange={(e) => updatePayload("userGstin", e.target.value)}
          style={inputStyle}
        />

        <label>Company ID</label>
        <input
          value={payload.companyId}
          onChange={(e) => updatePayload("companyId", e.target.value)}
          style={inputStyle}
        />

        <label>Document Type</label>
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

      {/* Headers */}
      <div style={cardYellow}>
        <h3>🧾 Headers</h3>

        {Object.entries(headers).map(([k, v]) => (
          <div key={k}>
            <label>{k}</label>
            <input
              value={v}
              onChange={(e) => updateHeaders(k, e.target.value)}
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* Debug */}
      <h3>📤 Final Payload</h3>
      <pre style={payloadBox}>{JSON.stringify(payload, null, 2)}</pre>

      <h3>📥 API Response</h3>
      {error && <pre style={errorBox}>{JSON.stringify(error, null, 2)}</pre>}
      {result && <pre style={responseBox}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
};

/* ---------------------------------
   Styles
---------------------------------- */
const container = {
  maxWidth: 900,
  margin: "30px auto",
  padding: 20,
  fontFamily: "Arial",
};

const cardBlue = {
  background: "#f7faff",
  padding: 20,
  borderRadius: 10,
  marginBottom: 25,
};

const cardYellow = {
  background: "#fdf7e3",
  padding: 20,
  borderRadius: 10,
  marginBottom: 25,
};

const inputStyle = {
  width: "100%",
  padding: 10,
  marginTop: 5,
  marginBottom: 15,
  borderRadius: 6,
  border: "1px solid #ccc",
};

const buttonStyle = {
  width: "100%",
  padding: 12,
  background: "#1976d2",
  color: "#fff",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
  fontSize: 16,
};

const payloadBox = {
  background: "#fffce0",
  padding: 15,
  borderRadius: 8,
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

export default GetEwbByDocNum;
