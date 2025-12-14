import React, { useState, useEffect } from "react";
import axios from "axios";

// LocalStorage keys
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

// Safe localStorage reader
const load = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
};

const EwaybillActions = () => {
  // ---------------- AUTH DATA ----------------
  const [auth, setAuth] = useState({
    token: "",
    headerCompanyId: "",
    userGstin: "",
    payloadCompanyId: "",
  });

  // ---------------- ACTION TYPE ----------------
  const [actionType, setActionType] = useState("UPDATE");

  // ---------------- FORM DATA ----------------
  const [form, setForm] = useState({
    userGstin:"",
    companyId:" ",
    ewbNo: "",
    vehicleNo: "",
    fromPlace: "",
    fromState: "",
    reasonCode: "3",
    reasonRem: "Vehicle is changed",
    transDocNo: "",
    transDocDate: "",
    transMode: 1,
    vehicleType: "R",

    cancelRsnCode: "1",
    cancelRmrk: "Order Cancelled",

    remainingDistance: "",
    extnRsnCode: "",
    extnRemarks: "",
    fromPincode: "",
    transitType: "T",
    consignmentStatus: "M",
  });

  // ---------------- UI STATES ----------------
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ---------------- LOAD LOCALSTORAGE ----------------
  useEffect(() => {
     const login = JSON.parse(localStorage.getItem(STORAGE_KEY00) || "{}");
    const latestEwb = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");
    const gstin = latestEwb.fromGstin || "";
        console.log("login",login )
    console.log("latestEwb",latestEwb)


    setAuth({
      token: login.fullResponse?.response?.token || "" || "",
      headerCompanyId: login.fullResponse?.response?.companyid || "",
      userGstin: latestEwb?.response?.fromGstin || "",
      payloadCompanyId: latestEwb?.response?.companyId || "",
    });

    setForm((prev) => ({
      ...prev,
       ewbNo: latestEwb?.ewbNo || "",
      vehicleNo: latestEwb ?.response?.vehicleNo || "",
      fromPlace: latestEwb ?.response?.fromPlace || "",
      fromState: latestEwb ?.response?.fromStateCode || "",
      transDocNo: latestEwb?.response?.transDocNo || "",
      transDocDate: latestEwb?.response?.transDocDate || "",
      transMode: latestEwb?.response?.transMode || 1,
      vehicleType: latestEwb?.response?.vehicleType || "R",
      fromPincode: latestEwb?.response?.fromPincode || "",
      userGstin: latestEwb?.response?.fromGstin || "",                    
      companyId: latestEwb?.response?.companyId || "",
    }));
  }, []);

  // ---------------- CLEAR RESPONSE ON INPUT CHANGE ----------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setResponse(null);
    setError("");
  };

  // ---------------- CHANGE PAYLOAD COMPANY ID ----------------
  const handleCompanyChange = (e) => {
    setAuth({ ...auth, payloadCompanyId: e.target.value });
    setResponse(null);
    setError("");
  };

  // ---------------- CHANGE ACTION TYPE ----------------
  const handleActionChange = (e) => {
    setActionType(e.target.value);
    setResponse(null); // 🔥 REQUIRED FIX
    setError("");
  };

  // ---------------- HEADERS ----------------
  const headers = {
    "X-Auth-Token": auth.token,
    companyId: auth.headerCompanyId,
    product: "TOPAZ",
    "Content-Type": "application/json",
  };

  // ---------------- PAYLOAD BUILDER ----------------
  const buildPayload = () => {
    const common = {
      ewbNo: form.ewbNo,
      userGstin: auth.userGstin,
      companyId: auth.payloadCompanyId,
      action: actionType,
    };

    switch (actionType) {
      case "UPDATE":
        return {
          ...common,
          vehicleNo: form.vehicleNo,
          fromPlace: form.fromPlace,
          fromState: form.fromState,
          reasonCode: form.reasonCode,
          reasonRem: form.reasonRem,
          transDocNo: form.transDocNo,
          transDocDate: form.transDocDate,
          transMode: form.transMode,
          vehicleType: form.vehicleType,
        };

      case "CANCEL":
        return {
          ...common,
          cancelRsnCode: form.cancelRsnCode,
          cancelRmrk: form.cancelRmrk,
        };

      case "REJECT":
        return common;

      case "EXTENDVALIDITY":
        return {
          ...common,
          vehicleNo: form.vehicleNo,
          fromPlace: form.fromPlace,
          fromState: form.fromState,
          remainingDistance: Number(form.remainingDistance),
          transDocNo: form.transDocNo,
          transDocDate: form.transDocDate,
          transMode: Number(form.transMode),
          extnRsnCode: form.extnRsnCode,
          extnRemarks: form.extnRemarks,
          fromPincode: form.fromPincode,
          transitType: form.transitType,
          consignmentStatus: form.consignmentStatus,
        };

      default:
        return common;
    }
  };

  // ---------------- SUBMIT ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const payload = buildPayload();

      const res = await axios.put(
        "http://localhost:3001/proxy/topaz/ewb/action",
        payload,
        { headers }
      );

      setResponse(res.data);

      if (res.data.status === "SUCCESS") {
        alert(`${actionType} completed for EWB ${form.ewbNo}`);
      }
    } catch (err) {
      const errData = err.response?.data || { message: err.message };
      setError(errData.message);
      setResponse(errData);
    }

    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
  };

  return (
    <div style={{ maxWidth: "720px", margin: "auto", padding: "20px" }}>
      <h2>EWB Action</h2>

      {/* COMPANY ID (EDITABLE PAYLOAD) */}
      <label>Payload Company ID (Editable)</label>
      <input
        style={inputStyle}
        value={auth.payloadCompanyId}
        onChange={handleCompanyChange}
      />

      {/* ACTION DROPDOWN (CLEARS RESPONSE) */}
      <label>Action Type</label>
      <select
        style={inputStyle}
        value={actionType}
        onChange={handleActionChange}
      >
        <option value="UPDATE">Update</option>
        <option value="CANCEL">Cancel</option>
        <option value="REJECT">Reject</option>
        <option value="EXTENDVALIDITY">Extend Validity</option>
      </select>

      {/* FORM */}
      <form onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          required
          name="ewbNo"
          placeholder="EWB Number"
          value={form.ewbNo}
          onChange={handleChange}
        />

        {actionType === "UPDATE" && (
          <>
            <input style={inputStyle} name="vehicleNo" placeholder="Vehicle No" value={form.vehicleNo} onChange={handleChange} />
            <input style={inputStyle} name="fromPlace" placeholder="From Place" value={form.fromPlace} onChange={handleChange} />
            <input style={inputStyle} name="fromState" placeholder="From State" value={form.fromState} onChange={handleChange} />
            <input style={inputStyle} name="transDocNo" placeholder="Transport Doc No" value={form.transDocNo} onChange={handleChange} />
            <input style={inputStyle} name="transDocDate" placeholder="Transport Doc Date" value={form.transDocDate} onChange={handleChange} />
            <input style={inputStyle} name="reasonCode" placeholder="Reason Code" value={form.reasonCode} onChange={handleChange} />
            <input style={inputStyle} name="reasonRem" placeholder="Reason Remark" value={form.reasonRem} onChange={handleChange} />
          </>
        )}

        {actionType === "CANCEL" && (
          <>
            <input style={inputStyle} name="cancelRsnCode" placeholder="Cancel Reason Code" value={form.cancelRsnCode} onChange={handleChange} />
            <input style={inputStyle} name="cancelRmrk" placeholder="Remark" value={form.cancelRmrk} onChange={handleChange} />
          </>
        )}

        {actionType === "EXTENDVALIDITY" && (
          <>
            <input style={inputStyle} name="vehicleNo" placeholder="Vehicle No" value={form.vehicleNo} onChange={handleChange} />
            <input style={inputStyle} name="fromPlace" placeholder="From Place" value={form.fromPlace} onChange={handleChange} />
            <input style={inputStyle} name="fromState" placeholder="From State" value={form.fromState} onChange={handleChange} />
            <input style={inputStyle} name="fromPincode" placeholder="From Pincode" value={form.fromPincode} onChange={handleChange} />
            <input style={inputStyle} name="remainingDistance" placeholder="Remaining Distance" value={form.remainingDistance} onChange={handleChange} />
            <input style={inputStyle} name="transDocNo" placeholder="Transport Doc No" value={form.transDocNo} onChange={handleChange} />
            <input style={inputStyle} name="transDocDate" placeholder="Transport Doc Date" value={form.transDocDate} onChange={handleChange} />
            <input style={inputStyle} name="extnRsnCode" placeholder="Extension Reason Code" value={form.extnRsnCode} onChange={handleChange} />
            <input style={inputStyle} name="extnRemarks" placeholder="Extension Remarks" value={form.extnRemarks} onChange={handleChange} />
          </>
        )}

        <button
          style={{ padding: "10px", marginTop: "10px" }}
          disabled={loading}
        >
          {loading ? "Processing..." : `Submit ${actionType}`}
        </button>
      </form>

      {/* ERROR */}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* RESPONSE */}
      {response && (
        <pre
          style={{
            background: "#e9f5ff",
            padding: "12px",
            marginTop: "20px",
            borderRadius: "5px",
          }}
        >
          {JSON.stringify(response, null, 2)}
        </pre>
      )}

      {/* DEBUG */}
      <h3>Payload</h3>
      <pre style={{ background: "#f4f4f4", padding: "12px" }}>
        {JSON.stringify(buildPayload(), null, 2)}
      </pre>
    </div>
  );
};

export default EwaybillActions;


