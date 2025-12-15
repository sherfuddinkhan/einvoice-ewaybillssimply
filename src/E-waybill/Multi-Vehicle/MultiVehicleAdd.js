import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------------
   API
---------------------------------- */
const ADD_VEHICLE_API =
  "http://localhost:3001/proxy/topaz/multiVehicle/add";

/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00   = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY  = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";

/* ---------------------------------
   Safe LS Reader
---------------------------------- */
const readLS = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const MultiVehicleAdd = () => {
  /* ---------------------------------
     Load Stored Context
  ---------------------------------- */
  const shared     = readLS(STORAGE_KEY00);
  const latestEwb  = readLS(LATEST_EWB_KEY);
  const latestCewb = readLS(LATEST_CEWB_KEY);

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
    Accept: "application/json",
    product: "TOPAZ",
    companyid: companyId,
    "X-Auth-Token": token,
  });

  /* ---------------------------------
     Payload
  ---------------------------------- */
  const vehicle = latestEwb?.response?.vehicleDetails?.[0] || {};
  const item    = latestEwb?.response?.itemList?.[0] || {};

  const [payload, setPayload] = useState({
    ewbNo:       latestEwb?.response?.ewbNo || "",
    groupNo:     "1",
    vehicleNo:   vehicle.vehicleNo || "",
    fromPlace:   vehicle.fromPlace || "",
    fromState:   vehicle.fromState || "",
    reasonCode:  "1",
    reasonDesc:  "Multiple Vehicles",
    transDocNo:  vehicle.transDocNo || "",
    transDocDate:vehicle.transDocDate || "",
    transMode:   vehicle.transMode || "",
    quantity:    item.quantity || "",
    userGstin:
      latestEwb?.response?.fromGstin ||
      latestEwb?.response?.userGstin ||
      "",
    validUpto:   latestEwb?.response?.validUpto || "",
  });

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  /* ---------------------------------
     Handlers
  ---------------------------------- */
  const updateHeader = (k, v) =>
    setHeaders((h) => ({ ...h, [k]: v }));

  const updatePayload = (k, v) =>
    setPayload((p) => ({ ...p, [k]: v }));

  /* ---------------------------------
     Submit
  ---------------------------------- */
  const submit = async () => {
    setError(null);
    setResponse(null);

    try {
      const res = await axios.post(
        ADD_VEHICLE_API,
        payload,
        { headers }
      );

      setResponse(res.data);

      /* Optional: persist last action */
      localStorage.setItem(
        LATEST_CEWB_KEY,
        JSON.stringify(res.data)
      );
    } catch (e) {
      setError(e?.response?.data || e.message);
    }
  };

  /* ---------------------------------
     UI
  ---------------------------------- */
  return (
    <div style={{ padding: 20, maxWidth: 820, margin: "auto" }}>
      <h2>🚚 Multi-Vehicle – Add Vehicle</h2>

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
      <h3 style={{ marginTop: 15 }}>Payload</h3>
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

      <button onClick={submit} style={buttonStyle}>
        Submit Add Vehicle
      </button>

      {/* RESPONSE */}
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

export default MultiVehicleAdd;

/* ---------------------------------
   Styles
---------------------------------- */
const rowStyle = {
  marginBottom: 8,
};

const labelStyle = {
  width: 160,
  display: "inline-block",
  fontWeight: "bold",
};

const inputStyle = {
  width: 450,
  padding: 6,
};

const buttonStyle = {
  marginTop: 18,
  padding: "10px 20px",
  fontSize: 16,
  background: "#0078ff",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
