import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";

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
 const {token, companyId} = useAuth();
   const currentConnectionType =
      localStorage.getItem("connectionType") || "DEFAULT";

  /* ---------------------------
     State
  --------------------------- */
  const [headers, setHeaders] = useState({
    Accept: "application/json",
    product: "TOPAZ",
    companyId: "",
    "X-Auth-Token": "",
    "Content-Type": "application/json",
    ConnectionType: currentConnectionType,
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
  const lastEwb = readStorage(LATEST_EWB_KEY);

  console.log("lastEwb", lastEwb);

  /* ---------- GSTIN ---------- */
  const userGstin =
    lastEwb?.response?.fromGstin ||
    lastEwb?.fullApiResponse?.response?.fromGstin ||
    "05AAAAU1183B5ZW";

  /* ---------- Vehicle Details ---------- */
  const vehicle = lastEwb?.vehicleDetails?.[0] || {};

  /* ---------- Trip Sheet Bills ---------- */
  const tripSheetEwbBills =
    Array.isArray(lastEwb?.tripSheetEwbBills) &&
    lastEwb.tripSheetEwbBills.length > 0
      ? lastEwb.tripSheetEwbBills.filter(Boolean)
      : [lastEwb?.response?.cEwbNo || vehicle?.ewbNo].filter(Boolean);

  console.log("tripSheetEwbBills", tripSheetEwbBills);

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
    companyId: String(companyId),
    userGstin,
  };

  setHeaders({
    Accept: "application/json",
    product: "ONYX",
    companyId: String(companyId),
    "X-Auth-Token": token,
    "Content-Type": "application/json",
    ConnectionType: currentConnectionType,
  });

  setPayload(initialPayload);
  setPayloadText(JSON.stringify(initialPayload, null, 2));
}, [companyId, token, currentConnectionType]);

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
      "https://einvoice.fcssoftwares.com/api/gst/ewaybill/cewb-generate",
      payload,
      {
        headers: {
          Accept: "application/json",
          companyId: String(companyId),
          "X-Auth-Token": token,
          product: "ONYX",
          "Content-Type": "application/json",
          ConnectionType: currentConnectionType,
        },
      }
    );

    setResponse(res.data);

    localStorage.setItem(
      LATEST_CEWB_KEY,
      JSON.stringify(res.data)
    );
  } catch (err) {
    const msg = err.response?.data || err.message;

    setError(
      typeof msg === "string"
        ? msg
        : JSON.stringify(msg, null, 2)
    );

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
