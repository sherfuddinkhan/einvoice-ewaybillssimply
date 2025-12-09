import React, { useState, useEffect } from "react";
import axios from "axios";

const LOGIN_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";

const EditVehicle = () => {
  // -------------------------
  // HEADERS STATE
  // -------------------------
  const [headers, setHeaders] = useState({
    accept: "application/json",
    product: "TOPAZ",
    companyid: "",
    "x-auth-token": "",
  });

  // -------------------------
  // PAYLOAD STATE
  // -------------------------
  const [payload, setPayload] = useState({
    ewbNo: "",
    groupNo: "",
    vehicleNo: "",
    oldvehicleNo: "",
    quantity: "",
    reasonCode: "",
    reasonRem: "",
    fromPlace: "",
    fromState: "",
    transDocNo: "",
    transDocDate: "",
    userGstin: "",
    validUpto: "",
  });

  const [resp, setResp] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // -------------------------
  // AUTO-POPULATE HEADERS + PAYLOAD
  // -------------------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");
    const savedPayload = JSON.parse(localStorage.getItem("mv_edit_payload") || "{}");

    // ---- SET HEADERS ----
    setHeaders({
      accept: "application/json",
      product: "TOPAZ",
      companyid: login?.companyId || "",
      "x-auth-token": login?.token || "",
    });

    // ---- EXTRACT VEHICLE DETAILS ----
    const vehicleDetails = latest?.response?.vehicleDetails?.[0] || {};
    const qty = latest?.response?.itemList?.[0]?.quantity || "";

    // ---- SET PAYLOAD ----
    setPayload({
      ewbNo: savedPayload?.ewbNo || latest?.response?.ewbNo || "",
      groupNo: savedPayload?.groupNo || vehicleDetails?.groupNo || "1",
      vehicleNo: savedPayload?.vehicleNo || vehicleDetails?.vehicleNo || "",
      oldvehicleNo: savedPayload?.oldvehicleNo || vehicleDetails?.vehicleNo || "",
      quantity: savedPayload?.quantity || qty,
      reasonCode: savedPayload?.reasonCode || "1",
      reasonRem: savedPayload?.reasonRem || "Multiple Vehicles",
      fromPlace: savedPayload?.fromPlace || vehicleDetails?.fromPlace || latest?.response?.fromPlace || "",
      fromState: savedPayload?.fromState || vehicleDetails?.fromState || latest?.response?.fromStateCode || "",
      transDocNo: savedPayload?.transDocNo || vehicleDetails?.transDocNo || latest?.response?.transDocNo || "",
      transDocDate: savedPayload?.transDocDate || vehicleDetails?.transDocDate || latest?.response?.transDocDate || "",
      userGstin: savedPayload?.userGstin || latest?.response?.userGstin || "",
      validUpto: savedPayload?.validUpto || latest?.response?.validUpto || "",
    });
  }, []);

  // -------------------------
  // SAVE PAYLOAD TO LOCALSTORAGE
  // -------------------------
  useEffect(() => {
    localStorage.setItem("mv_edit_payload", JSON.stringify(payload));
  }, [payload]);

  // -------------------------
  // HANDLERS
  // -------------------------
  const onP = (key, value) => setPayload((prev) => ({ ...prev, [key]: value }));
  const onH = (key, value) => setHeaders((prev) => ({ ...prev, [key]: value }));

  // -------------------------
  // SUBMIT REQUEST
  // -------------------------
  const submit = async () => {
    if (!payload.ewbNo) {
      alert("E-Way Bill Number (ewbNo) is required!");
      return;
    }

    setLoading(true);
    setErr(null);
    setResp(null);

    try {
      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/multiVehicle/edit",
        payload,
        { headers }
      );
      setResp(res.data);
    } catch (e) {
      setErr(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>
      <h2>Multi-Vehicle — Edit Vehicle</h2>

      {/* HEADERS */}
      <h3>Headers</h3>
      {Object.entries(headers).map(([k, v]) => (
        <div key={k} style={{ marginBottom: 6 }}>
          <label style={{ width: 150, display: "inline-block" }}>{k}</label>
          <input
            value={v}
            onChange={(e) => onH(k, e.target.value)}
            style={{ width: 430 }}
          />
        </div>
      ))}

      {/* PAYLOAD */}
      <h3 style={{ marginTop: 12 }}>Payload</h3>
      {Object.entries(payload).map(([k, v]) => (
        <div key={k} style={{ marginBottom: 6 }}>
          <label style={{ width: 150, display: "inline-block" }}>{k}</label>
          <input
            value={v}
            onChange={(e) => onP(k, e.target.value)}
            style={{ width: 430 }}
          />
        </div>
      ))}

      {/* BUTTON */}
      <button onClick={submit} style={{ marginTop: 15 }}>
        {loading ? "Processing..." : "Submit Edit"}
      </button>

      {/* RESPONSES */}
      {err && <pre style={{ color: "red" }}>{JSON.stringify(err, null, 2)}</pre>}
      {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
};

export default EditVehicle;
