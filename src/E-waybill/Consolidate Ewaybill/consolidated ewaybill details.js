import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------
   LocalStorage Keys (STANDARD)
--------------------------- */
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";

/* ---------------------------
   Safe LocalStorage Reader
--------------------------- */
const readStorage = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const CEWBDetails = () => {
  /* ---------------------------
     State
  --------------------------- */
  const [headers, setHeaders] = useState({
    Accept: "application/json",
    product: "TOPAZ",
    companyId: "",
    "X-Auth-Token": "",
    "Content-Type": "application/json",
  });

  const [payload, setPayload] = useState({});
  const [payloadText, setPayloadText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);

  /* ---------------------------
     Auto-fill from LocalStorage
  --------------------------- */
  useEffect(() => {
    const login = readStorage(STORAGE_KEY00);
    const lastEwb = readStorage(LATEST_EWB_KEY);
    console.log("lastEwb",lastEwb)

    const token = login.fullResponse?.response?.token || "";
    const companyId = login.fullResponse?.response?.companyid || "";

    /* ---------- GSTIN ---------- */
    const userGstin =
      lastEwb?.response?.fromGstin ||
      lastEwb?.fullApiResponse?.response?.fromGstin ||
      login.userGstin ||
      "05AAAAU1183B5ZW";

    /* ---------- Vehicle / EWB Details ---------- */
    const vehicle = lastEwb?.vehicleDetails?.[0] || {};

    const tripSheetEwbBills = Array.isArray(lastEwb?.allEwbs)
      ? lastEwb.allEwbs.map((e) => e.ewbNo).filter(Boolean)
      : [lastEwb?.response?.ewbNo || vehicle?.ewbNo].filter(Boolean);

    const initialPayload = {
      fromPlace:
        lastEwb?.response?.fromPlace ||
        vehicle?.fromPlace ||
        "Akhondiya",

      fromState:
        lastEwb?.response?.fromStateCode ||
        vehicle?.fromState ||
        "5",

      vehicleNo:
        lastEwb?.response?.vehicleNo ||
        vehicle?.vehicleNo ||
        "RJ14CA9999",

      vehicleType:
        lastEwb?.response?.vehicleType ||
        vehicle?.vehicleType ||
        "R",

      transMode:
        lastEwb?.response?.transMode ||
        vehicle?.transMode ||
        "3",

      transDocNo:
        lastEwb?.response?.transDocNo ||
        vehicle?.transDocNo ||
        "1234",

      transDocDate:
        lastEwb?.response?.transDocDate ||
        vehicle?.transDocDate ||
        "12/11/2025",

      tripSheetEwbBills,
      companyId,
      userGstin,
    };

    setHeaders((prev) => ({
      ...prev,
      companyId,
      "X-Auth-Token": token,
    }));

    setPayload(initialPayload);
    setPayloadText(JSON.stringify(initialPayload, null, 2));
  }, []);

  /* ---------------------------
     Payload JSON Editor
  --------------------------- */
  const handlePayloadChange = (text) => {
    setPayloadText(text);
    try {
      setPayload(JSON.parse(text));
      setError("");
    } catch {
      setError("Invalid JSON payload");
    }
  };

  /* ---------------------------
     Header Editor
  --------------------------- */
  const updateHeader = (key, value) =>
    setHeaders((prev) => ({ ...prev, [key]: value }));

  /* ---------------------------
     Generate CEWB
  --------------------------- */
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/cewb/generate",
        payload,
        { headers }
      );

      setResponse(res.data);

      /* ✅ Persist latest CEWB response */
      localStorage.setItem(LATEST_CEWB_KEY, JSON.stringify(res.data));

    } catch (err) {
      const msg = err.response?.data || err.message;
      setError(typeof msg === "string" ? msg : JSON.stringify(msg, null, 2));
      setResponse(err.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     UI
  --------------------------- */
  return (
    <div style={{ maxWidth: 900, margin: "auto", padding: 20 }}>
      <h2>Generate Consolidated E-Way Bill (CEWB)</h2>

      {/* Headers */}
      <div style={{ marginBottom: 20 }}>
        <h3>Request Headers</h3>
        {Object.entries(headers).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 8 }}>
            <label style={{ width: 160, display: "inline-block" }}>{k}</label>
            <input
              value={v}
              onChange={(e) => updateHeader(k, e.target.value)}
              style={{ width: "60%", padding: 6 }}
            />
          </div>
        ))}
      </div>

      {/* Payload JSON */}
      <div style={{ marginBottom: 20 }}>
        <h3>Payload JSON</h3>
        <textarea
          rows={14}
          value={payloadText}
          onChange={(e) => handlePayloadChange(e.target.value)}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        style={{ padding: "10px 24px" }}
      >
        {loading ? "Generating..." : "Generate CEWB"}
      </button>

      {/* Response */}
      {response && (
        <pre
          style={{
            marginTop: 20,
            background: "#1e272e",
            color: "#1abc9c",
            padding: 16,
            borderRadius: 6,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default CEWBDetails;
