import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------------
   API
---------------------------------- */
const EDIT_VEHICLE_API =
  "http://localhost:3001/proxy/topaz/multiVehicle/edit";

/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00   = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY  = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";
const EDIT_DRAFT_KEY  = "mv_edit_payload";

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

const MultiVehicleEdit = () => {
  /* ---------------------------------
     Load Stored Context
  ---------------------------------- */
  const shared     = readLS(STORAGE_KEY00);
  const latestEwb  = readLS(LATEST_EWB_KEY);
  const latestCewb = readLS(LATEST_CEWB_KEY);
  const draft      = readLS(EDIT_DRAFT_KEY);

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
     Payload Bootstrap
  ---------------------------------- */
  const vehicle = latestEwb?.response?.vehicleDetails?.[0] || {};
  const qty     = latestEwb?.response?.itemList?.[0]?.quantity || "";

  const [payload, setPayload] = useState({
    ewbNo:         draft?.ewbNo         || latestEwb?.response?.ewbNo || "",
    groupNo:       draft?.groupNo       || vehicle?.groupNo || "1",
    vehicleNo:     draft?.vehicleNo     || vehicle?.vehicleNo || "",
    oldvehicleNo:  draft?.oldvehicleNo  || vehicle?.vehicleNo || "",
    quantity:      draft?.quantity      || qty,
    reasonCode:    draft?.reasonCode    || "1",
    reasonRem:     draft?.reasonRem     || "Multiple Vehicles",
    fromPlace:
      draft?.fromPlace ||
      vehicle?.fromPlace ||
      latestEwb?.response?.fromPlace ||
      "",
    fromState:
      draft?.fromState ||
      vehicle?.fromState ||
      latestEwb?.response?.fromStateCode ||
      "",
    transDocNo:
      draft?.transDocNo ||
      vehicle?.transDocNo ||
      latestEwb?.response?.transDocNo ||
      "",
    transDocDate:
      draft?.transDocDate ||
      vehicle?.transDocDate ||
      latestEwb?.response?.transDocDate ||
      "",
    userGstin:
      draft?.userGstin ||
      latestEwb?.response?.fromGstin ||
      latestEwb?.response?.userGstin ||
      "",
    validUpto:
      draft?.validUpto ||
      latestEwb?.response?.validUpto ||
      "",
  });

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------------------------
     Persist Draft
  ---------------------------------- */
  useEffect(() => {
    localStorage.setItem(EDIT_DRAFT_KEY, JSON.stringify(payload));
  }, [payload]);

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
    if (!payload.ewbNo) {
      alert("E-Way Bill Number (ewbNo) is required");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await axios.post(
        EDIT_VEHICLE_API,
        payload,
        { headers }
      );

      setResponse(res.data);

      /* Optional: keep last success */
      localStorage.setItem(
        LATEST_CEWB_KEY,
        JSON.stringify(res.data)
      );
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
      <h2>🚚 Multi-Vehicle — Edit Vehicle</h2>

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

      <button onClick={submit} style={buttonStyle}>
        {loading ? "Processing..." : "Submit Edit"}
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

export default MultiVehicleEdit;

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
