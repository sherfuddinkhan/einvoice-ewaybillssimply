import React, { useState, useEffect } from "react";
import axios from "axios";

const LOGIN_KEY = "iris_login_data";
const MV_INITIATE_KEY = "mv_initiate_response"; // MultiVehicleInitiate response
const LATEST_EWB_KEY = "latestEwbData";

const AddVehicle = () => {
  // ------------------------------------------
  // HEADERS STATE
  // ------------------------------------------
  const [headers, setHeaders] = useState({
    accept: "application/json",
    product: "TOPAZ",
    companyid: "",
    "x-auth-token": "",
  });

  // ------------------------------------------
  // PAYLOAD STATE
  // ------------------------------------------
  const [payload, setPayload] = useState({
    ewbNo: "",
    groupNo: "1",
    vehicleNo: "",
    fromPlace: "",
    fromState: "",
    reasonCode: "1",
    reasonDesc: "Multiple Vehicles",
    transDocNo: "",
    transDocDate: "",
    transMode: "",
    quantity: "",
    userGstin: "",
    validUpto: "",
  });

  const [resp, setResp] = useState(null);
  const [err, setErr] = useState(null);

  // ========================================================================
  // AUTO-POPULATE HEADERS + PAYLOAD FROM LOCALSTORAGE
  // ========================================================================
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");
    const initResp = JSON.parse(localStorage.getItem(MV_INITIATE_KEY) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

    // 1️⃣ Headers
    setHeaders({
      accept: "application/json",
      product: "TOPAZ",
      companyid: login?.companyId || initResp?.response?.companyId || "",
      "x-auth-token": login?.token || "",
    });

    // 2️⃣ Auto-fill payload
    const vehicleDetails = latest?.response?.vehicleDetails?.[0] || {};
    const itemList = latest?.response?.itemList?.[0] || {};

    setPayload({
      ewbNo: initResp?.response?.ewbNo || latest?.response?.ewbNo || "",
      groupNo: initResp?.response?.groupNo || "1",
      vehicleNo: vehicleDetails.vehicleNo || "",
      fromPlace: vehicleDetails.fromPlace || initResp?.response?.fromPlace || "",
      fromState: vehicleDetails.fromState || initResp?.response?.fromState || "",
      reasonCode: initResp?.response?.reasonCode || "1",
      reasonDesc: initResp?.response?.reasonRem || "Multiple Vehicles",
      transDocNo: vehicleDetails.transDocNo || latest?.response?.transDocNo || "",
      transDocDate: vehicleDetails.transDocDate || latest?.response?.transDocDate || "",
      transMode: vehicleDetails.transMode || latest?.response?.transMode || "",
      quantity: initResp?.response?.totalQuantity || itemList.quantity || "",
      userGstin: initResp?.response?.reqGstin || latest?.response?.userGstin || "",
      validUpto: latest?.response?.validUpto || "",
    });
  }, []);

  // ========================================================================
  // PAYLOAD UPDATE HANDLER
  // ========================================================================
  const onP = (key, value) =>
    setPayload((prev) => ({ ...prev, [key]: value }));

  // ========================================================================
  // SUBMIT REQUEST
  // ========================================================================
  const submit = async () => {
    setErr(null);
    setResp(null);

    try {
      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/multiVehicle/add",
        payload,
        { headers }
      );
      setResp(res.data);
    } catch (e) {
      setErr(e.response?.data || e.message);
    }
  };

  // ========================================================================
  // UI
  // ========================================================================
  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h2>Multi-Vehicle — Add Vehicle</h2>

      {/* HEADERS */}
      <h3>Headers</h3>
      {Object.entries(headers).map(([k, v]) => (
        <div key={k} style={{ marginBottom: 6 }}>
          <label style={{ width: 150, display: "inline-block" }}>{k}</label>
          <input
            value={v}
            onChange={(e) =>
              setHeaders((prev) => ({ ...prev, [k]: e.target.value }))
            }
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
        Submit Add Vehicle
      </button>

      {/* RESPONSES */}
      {err && <pre style={{ color: "red" }}>{JSON.stringify(err, null, 2)}</pre>}
      {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
};

export default AddVehicle;
