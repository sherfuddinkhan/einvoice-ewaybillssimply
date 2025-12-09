// MultiVehicleInitiate.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";

const LOGIN_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";

const MultiVehicleInitiate = () => {
  const [headers, setHeaders] = useState({
    "X-Auth-Token": "",
    companyId: "",
    product: "TOPAZ",
    "Content-Type": "application/json",
  });

  const [payload, setPayload] = useState({
    ewbNo: "",
    reasonCode: "1",
    reasonRem: "Multiple Vehicles",
    fromPlace: "",
    fromState: "",
    toPlace: "",
    toState: "",
    transMode: "",
    totalQuantity: "",
    unitCode: "",
    userGstin: "",
  });

  const [resp, setResp] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // ------------------------
  // Auto-populate payload
  // ------------------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

    if (!latest?.response) return;

    // Headers
    setHeaders((prev) => ({
      ...prev,
      "X-Auth-Token": login?.token || "",
      companyId: login?.companyId || "",
    }));

    // Payload
    const firstItem = latest.response.itemList?.[0] || {};
    const pf = {
      ewbNo: latest.ewbNo || "",
      reasonCode: "1",
      reasonRem: "Multiple Vehicles",
      fromPlace: latest.response.fromPlace || "",
      fromState: latest.response.fromStateCode || "",
      toPlace: latest.response.toPlace || "",
      toState: latest.response.toStateCode || "",
      transMode: latest.response.transMode || "",
      totalQuantity: firstItem.quantity || "",
      unitCode: firstItem.qtyUnit || "",
      userGstin: latest.response.userGstin || "",
    };

    setPayload((p) => ({ ...p, ...pf }));
  }, []);

  const onHeaderChange = (k, v) =>
    setHeaders((prev) => ({ ...prev, [k]: v }));

  const onPayloadChange = (k, v) =>
    setPayload((prev) => ({ ...prev, [k]: v }));

  const submit = async () => {
    setLoading(true);
    setErr(null);
    setResp(null);

    try {
      const res = await axios.post(
        "http://localhost:3001/proxy/topaz/multiVehicle/initiate",
        payload,
        { headers }
      );
      setResp(res.data);
    } catch (error) {
      setErr(error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h2>Multi-Vehicle — Initiate</h2>

      <h3>Headers</h3>
      {Object.entries(headers).map(([k, v]) => (
        <div key={k}>
          <label style={{ width: 130, display: "inline-block" }}>{k}</label>
          <input
            value={v}
            onChange={(e) => onHeaderChange(k, e.target.value)}
            style={{ width: 420 }}
          />
        </div>
      ))}

      <h3 style={{ marginTop: 12 }}>Payload</h3>
      {Object.entries(payload).map(([k, v]) => (
        <div key={k}>
          <label style={{ width: 140, display: "inline-block" }}>{k}</label>
          <input
            value={v}
            onChange={(e) => onPayloadChange(k, e.target.value)}
            style={{ width: 420 }}
          />
        </div>
      ))}

      <button onClick={submit} style={{ marginTop: 15 }}>
        {loading ? "Submitting..." : "Submit Initiate"}
      </button>

      {err && <pre style={{ color: "red" }}>{JSON.stringify(err, null, 2)}</pre>}
      {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
    </div>
  );
};

export default MultiVehicleInitiate;
