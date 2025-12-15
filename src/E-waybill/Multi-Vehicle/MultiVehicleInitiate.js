import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------------
   API
---------------------------------- */
const INITIATE_API =
  "http://localhost:3001/proxy/topaz/multiVehicle/initiate";

/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00   = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY  = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";
const INIT_PAYLOAD_KEY = "mv_initiate_payload";
const INIT_RESP_KEY    = "mv_initiate_response";

/* ---------------------------------
   Safe LocalStorage Read
---------------------------------- */
const readLS = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const MultiVehicleInitiate = () => {
  /* ---------------------------------
     Load Context
  ---------------------------------- */
  const shared     = readLS(STORAGE_KEY00);
  const latestEwb  = readLS(LATEST_EWB_KEY);
  const latestCewb = readLS(LATEST_CEWB_KEY);
  const draft      = readLS(INIT_PAYLOAD_KEY);

  const token =
    shared?.fullResponse?.response?.token || "";

  const companyId =
    shared?.fullResponse?.response?.companyid ||
    latestEwb?.response?.companyId ||
    latestCewb?.response?.companyId ||
    "";

  /* ---------------------------------
     Headers
  ---------------------------------- */
  const [headers, setHeaders] = useState({
    "X-Auth-Token": token,
    companyId,
    product: "TOPAZ",
    "Content-Type": "application/json",
  });

  /* ---------------------------------
     Payload
  ---------------------------------- */
  const firstItem = latestEwb?.response?.itemList?.[0] || {};

  const [payload, setPayload] = useState({
    ewbNo:
      draft?.ewbNo ||
      latestCewb?.response?.ewbNo ||
      latestEwb?.response?.ewbNo ||
      "",
    reasonCode: draft?.reasonCode || "1",
    reasonRem: draft?.reasonRem || "Multiple Vehicles",
    fromPlace:
      draft?.fromPlace ||
      latestEwb?.response?.fromPlace ||
      "",
    fromState:
      draft?.fromState ||
      latestEwb?.response?.fromStateCode ||
      "",
    toPlace:
      draft?.toPlace ||
      latestEwb?.response?.toPlace ||
      "",
    toState:
      draft?.toState ||
      latestEwb?.response?.toStateCode ||
      "",
    transMode:
      draft?.transMode ||
      latestEwb?.response?.transMode ||
      "",
    totalQuantity:
      draft?.totalQuantity ||
      firstItem?.quantity ||
      "",
    unitCode:
      draft?.unitCode ||
      firstItem?.qtyUnit ||
      "",
    userGstin:
      draft?.userGstin ||
      latestEwb?.response?.userGstin ||
      "",
  });

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------------------------
     Persist Draft Payload
  ---------------------------------- */
  useEffect(() => {
    localStorage.setItem(INIT_PAYLOAD_KEY, JSON.stringify(payload));
  }, [payload]);

  /* ---------------------------------
     Handlers
  ---------------------------------- */
  const updateHeader = (k, v) =>
    setHeaders((h) => ({ ...h, [k]: v }));

  const updatePayload = (k, v) =>
    setPayload((p) => ({ ...p, [k]: v }));

  /* ---------------------------------
     Submit Initiate
  ---------------------------------- */
  const submit = async () => {
    if (!payload.ewbNo) {
      alert("EWB No is required");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await axios.post(
        INITIATE_API,
        payload,
        { headers }
      );

      setResponse(res.data);
      localStorage.setItem(INIT_RESP_KEY, JSON.stringify(res.data));
    } catch (e) {
      setError(e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------
     UI
  ---------------------------------- */
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>
      <h2>🚚 Multi-Vehicle — Initiate</h2>

      {/* HEADERS */}
      <h3>Headers</h3>
      {Object.entries(headers).map(([k, v]) => (
        <div key={k} style={rowStyle}>
          <label style={labelStyle}>{k}</label>
          <input
            value={v}
            onChange={(e) => updateHeader(k, e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}

      {/* PAYLOAD */}
      <h3 style={{ marginTop: 14 }}>Payload</h3>
      {Object.entries(payload).map(([k, v]) => (
        <div key={k} style={rowStyle}>
          <label style={labelStyle}>{k}</label>
          <input
            value={v}
            onChange={(e) => updatePayload(k, e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}

      <button
        onClick={submit}
        disabled={loading}
        style={buttonStyle}
      >
        {loading ? "Submitting..." : "Submit Initiate"}
      </button>

      {error && (
        <pre style={{ color: "red", marginTop: 15 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}
      {response && (
        <pre style={{ marginTop: 15 }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default MultiVehicleInitiate;

/* ---------------------------------
   Styles
---------------------------------- */
const rowStyle = {
  marginBottom: 8,
};

const labelStyle = {
  width: 170,
  display: "inline-block",
  fontWeight: "bold",
};

const inputStyle = {
  width: 460,
  padding: 6,
};

const buttonStyle = {
  marginTop: 18,
  padding: "10px 22px",
  fontSize: 16,
  background: "#0078ff",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
