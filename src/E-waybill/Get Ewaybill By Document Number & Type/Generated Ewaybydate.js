import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData"; // standard placeholder

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

const FetchEWBByDate = () => {
  /* --------------------------
     State Definitions
  --------------------------- */
  const [ewbNo, setEwbNo] = useState("");
  const [userGstin, setUserGstin] = useState("");
  const [updateNeeded, setUpdateNeeded] = useState(true);

  const [auth, setAuth] = useState({ companyId: "", token: "" });
  const [requestHeaders, setRequestHeaders] = useState({});
  const [requestPayload, setRequestPayload] = useState({});
  const [responseData, setResponseData] = useState(null);
  const [autoFields, setAutoFields] = useState({});

  /* --------------------------
     Load Auth + Latest EWB
  --------------------------- */
useEffect(() => {
  const shared = readLS(STORAGE_KEY00);
  const latestEwb = readLS(LATEST_EWB_KEY);
  const latestCEwb=  readLS(LATEST_CEWB_KEY) 
  console.log("latestEwb",latestEwb)
  console.log("latestCEwb",latestCEwb)

  const token = shared?.fullResponse?.response?.token || "";
  const companyId = shared?.fullResponse?.response?.companyid || "";
  const gstinFromAuth = shared?.fullResponse?.response?.userGstin || "";

  // Get GSTIN from latestEwb or auth
  const latestFromGstin =
    latestEwb?.fromGstin || latestEwb?.response?.fromGstin || gstinFromAuth || "";
  setUserGstin(latestFromGstin);

  // Get EWB number
  // Sometimes it might be stored as `ewbNo` or `cEwbNo` in response
  const latestEwbNo =
    latestEwb?.ewbNo ||
    latestEwb?.response?.cEwbNo ||
    latestEwb?.response?.ewbNo ||
    "";
  setEwbNo(latestEwbNo);
  console.log("latestEwbNo  ",latestEwbNo)

  // Set auth
  setAuth({ token, companyId });

  // Populate autoFields for display
  if (latestEwb?.response) setAutoFields(latestEwb.response);
}, []);


  /* --------------------------
     Fetch EWB by Number
  --------------------------- */
  const fetchEWB = async () => {
    const url = "http://localhost:3001/proxy/topaz/ewb/byNumber";

    const headers = {
      Accept: "application/json",
      product: "TOPAZ",
      companyId: auth.companyId,
      "X-Auth-Token": auth.token,
    };

    const payload = { ewbNo, userGstin, updateNeeded };

    // Save request preview
    setRequestHeaders(headers);
    setRequestPayload(payload);

    try {
      const res = await axios.get(url, { headers, params: payload });
      setResponseData(res.data);

      const extracted = res.data?.response || {};
      setAutoFields(extracted);

      // Persist latest EWB for future autopopulation
      const latestToSave = {
        ewbNo,
        fromGstin: extracted?.fromGstin || userGstin,
        response: extracted,
      };
      localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(latestToSave));
    } catch (err) {
      setResponseData(err.response?.data || { error: err.message });
    }
  };

  /* --------------------------
     UI
  --------------------------- */
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>
      <h2>🔍 Fetch E-Waybill By Number</h2>

      {/* Inputs */}
      <div style={{ marginBottom: 10 }}>
        <label>EWB Number</label>
        <input
          value={ewbNo}
          onChange={(e) => setEwbNo(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>User GSTIN</label>
        <input
          value={userGstin}
          onChange={(e) => setUserGstin(e.target.value)}
          style={{ width: "100%", padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 10 }}>
        <label>Update Needed</label>
        <select
          value={updateNeeded}
          onChange={(e) => setUpdateNeeded(e.target.value === "true")}
          style={{ width: "100%", padding: 8 }}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </div>

      <button
        onClick={fetchEWB}
        style={{ padding: "10px 20px", background: "black", color: "white", borderRadius: 6 }}
      >
        Fetch EWB
      </button>

      <hr />

      {/* Request Preview */}
      <h3>📌 Request Headers</h3>
      <pre>{JSON.stringify(requestHeaders, null, 2)}</pre>

      <h3>📌 Request Payload</h3>
      <pre>{JSON.stringify(requestPayload, null, 2)}</pre>

      <hr />

      {/* Response */}
      <h3>📌 Response</h3>
      <pre>{JSON.stringify(responseData, null, 2)}</pre>

      {/* Auto-Populated EWB Fields */}
      {Object.keys(autoFields).length > 0 && (
        <>
          <h3>📌 Auto-Populated EWB Data</h3>
          <table width="100%" border="1" cellPadding="6">
            <tbody>
              {Object.entries(autoFields).map(([k, v]) => (
                <tr key={k}>
                  <td><b>{k}</b></td>
                  <td>{String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default FetchEWBByDate;
