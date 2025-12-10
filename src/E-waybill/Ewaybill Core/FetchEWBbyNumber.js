import React, { useState, useEffect } from "react";
import axios from "axios";

// LocalStorage Keys
const LOGIN_RESPONSE_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const FetchEWBbyNumber = () => {
  const [ewbNo, setEwbNo] = useState("");
  const [userGstin, setUserGstin] = useState(""); // State for the User GSTIN input

  const [authData, setAuthData] = useState({
    companyId: "",
    token: "",
  });

  const [updateNeeded, setUpdateNeeded] = useState(true);

  const [requestHeaders, setRequestHeaders] = useState({});
  const [requestPayload, setRequestPayload] = useState({});
  const [responseData, setResponseData] = useState(null);
  const [autoFields, setAutoFields] = useState({});

  // -----------------------------------------------------------
  // 🔵 Load Auth + Last EWB Auto Populate (Reading from Local Storage)
  // -----------------------------------------------------------
  useEffect(() => {
  const login = JSON.parse(localStorage.getItem(LOGIN_RESPONSE_KEY) || "{}");
  const latestEwb = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

  setAuthData({
    companyId: login.companyId || "",
    token: login.token || "",
  });

  // Auto-populate EWB Number
  if (latestEwb?.ewbNo) setEwbNo(latestEwb.ewbNo);

  // Auto-populate User GSTIN
  const gstin =
    latestEwb?.fromGstin || // top-level
    latestEwb?.response?.fromGstin || // nested response
    latestEwb?.response?.userGstin || // sometimes called userGstin
    login.userGstin || // fallback to login
    "";

  setUserGstin(gstin);

  // Auto-populate table fields
  if (latestEwb?.response) setAutoFields(latestEwb.response);
}, []);


  // -----------------------------------------------------------
  // 🔴 Save History (last 10 entries)
  // -----------------------------------------------------------
  const saveHistory = (entry) => {
    let history = JSON.parse(localStorage.getItem(EWB_HISTORY_KEY) || "[]");

    history.unshift({
      time: new Date().toLocaleString(),
      ...entry,
    });

    if (history.length > 10) history = history.slice(0, 10);

    localStorage.setItem(EWB_HISTORY_KEY, JSON.stringify(history));
  };

  // -----------------------------------------------------------
  // 🔵 API Call (Writing to State and Local Storage)
  // -----------------------------------------------------------
  const fetchEWB = async () => {
    const url = "http://localhost:3001/proxy/topaz/ewb/byNumber";

    const headers = {
      accept: "application/json",
      product: "TOPAZ",
      companyId: authData.companyId,
      "x-auth-token": authData.token,
    };

    // Payload uses the current state values
    const payload = {
      ewbNo,
      userGstin, 
      updateNeeded,
    };

    setRequestHeaders(headers);
    setRequestPayload(payload);

    try {
      const res = await axios.get(url, {
        headers,
        params: payload,
      });

      setResponseData(res.data);

      // 'extractedEwbData' holds the full EWB response (res.data.response)
      const extractedEwbData = res.data?.response || {};
      setAutoFields(extractedEwbData);

      // 1. Find the GSTIN from the successful response (e.g., 'fromGstin' or 'userGstin')
      const gstinFromResponse = extractedEwbData?.fromGstin || extractedEwbData?.userGstin;

      if (gstinFromResponse) {
        // 2. CRITICAL FIX: Update the component state for immediate reflection
        setUserGstin(gstinFromResponse); 

        // 3. Save the latest data for next auto-fill
        const latestDataToSave = {
          ewbNo,
          // Save the acquired GSTIN at the top level for 'useEffect' to read next time
          fromGstin: gstinFromResponse, 
          response: extractedEwbData,
        };
        localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(latestDataToSave));
      }

      saveHistory({
        requestHeaders: headers,
        requestPayload: payload,
        response: res.data,
      });

    } catch (error) {
      const err = error.response?.data || { error: error.message };
      setResponseData(err);
      saveHistory({
        requestHeaders: headers,
        requestPayload: payload,
        response: err,
      });
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "auto" }}>
      <h2>🔍 Fetch E-Waybill By Number</h2>

      {/* INPUTS */}
      <div style={{ marginBottom: "10px" }}>
        <label>EWB Number :</label>
        <input
          type="text"
          value={ewbNo}
          onChange={(e) => setEwbNo(e.target.value)}
          placeholder="Enter EWB Number"
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>User GSTIN :</label>
        <input
          type="text"
          value={userGstin}
          onChange={(e) => setUserGstin(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Update Needed :</label>
        <select
          value={updateNeeded}
          onChange={(e) => setUpdateNeeded(e.target.value === "true")}
          style={{ width: "100%", padding: "8px" }}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </div>

      <button
        onClick={fetchEWB}
        style={{
          padding: "10px 20px",
          backgroundColor: "black",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Fetch EWB
      </button>

      <hr />

      {/* REQUEST PREVIEW */}
      <h3>📌 Request Headers</h3>
      <pre style={{ background: "#f4f4f4", padding: "10px" }}>
        {JSON.stringify(requestHeaders, null, 2)}
      </pre>

      <h3>📌 Request Payload</h3>
      <pre style={{ background: "#f4f4f4", padding: "10px" }}>
        {JSON.stringify(requestPayload, null, 2)}
      </pre>

      <hr />

      {/* RESPONSE */}
      <h3>📌 Response</h3>
      <pre style={{ background: "#e8ffe8", padding: "10px" }}>
        {JSON.stringify(responseData, null, 2)}
      </pre>

      <hr />

      {/* AUTO FIELDS */}
      {autoFields && Object.keys(autoFields).length > 0 && (
        <>
          <h3>📌 Auto-Populated Data (From Previous EWB)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {Object.entries(autoFields).map(([key, value]) => (
                <tr key={key}>
                  <td style={{ padding: 6, fontWeight: "bold" }}>{key}</td>
                  <td style={{ padding: 6 }}>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default FetchEWBbyNumber;