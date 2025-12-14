import React, { useState, useEffect } from "react";
import axios from "axios";

// LocalStorage Keys
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const FetchEWBbyNumber = () => {
  const [ewbNo, setEwbNo] = useState("");
  const [userGstin, setUserGstin] = useState("");
  const [updateNeeded, setUpdateNeeded] = useState(true);

  const [authData, setAuthData] = useState({ companyId: "", token: "" });
  const [requestHeaders, setRequestHeaders] = useState({});
  const [requestPayload, setRequestPayload] = useState({});
  const [responseData, setResponseData] = useState(null);
  const [autoFields, setAutoFields] = useState({});

  
  // Load Auth + Last EWB Auto Populate
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(STORAGE_KEY00) || "{}");
    const latestEwb = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");
    console.log("login",login )
    console.log("latestEwb",latestEwb)

    setAuthData({
      companyId:login.fullResponse?.response?.companyid || latestEwb?.companyId || "",
      token: login.fullResponse?.response?.token|| latestEwb?.token || "",
    });

    if (latestEwb?.ewbNo) setEwbNo(latestEwb.ewbNo);

    const gstin =
      latestEwb?.fromGstin ||
      latestEwb?.response?.fromGstin ||
      latestEwb?.response?.userGstin ||
      login.userGstin ||
      "";

    setUserGstin(gstin);

    if (latestEwb?.response) setAutoFields(latestEwb.response);
  }, []);

  // Save History
  const saveHistory = (entry) => {
    let history = JSON.parse(localStorage.getItem(EWB_HISTORY_KEY) || "[]");
    history.unshift({ time: new Date().toLocaleString(), ...entry });
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem(EWB_HISTORY_KEY, JSON.stringify(history));
  };

  // Fetch EWB API
  const fetchEWB = async () => {
    const url = "http://localhost:3001/proxy/topaz/ewb/byNumber";
    const headers = {
      accept: "application/json",
      product: "TOPAZ",
      companyId: authData.companyId,
      "x-auth-token": authData.token,
    };

    const payload = { ewbNo, userGstin, updateNeeded };

    setRequestHeaders(headers);
    setRequestPayload(payload);

    try {
      const res = await axios.get(url, { headers, params: payload });
      setResponseData(res.data);

      const extracted = res.data?.response || {};
      setAutoFields(extracted);

      // Save latest for auto-fill next time
      const latestDataToSave = { ewbNo, fromGstin: extracted?.fromGstin || userGstin, response: extracted };
      localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(latestDataToSave));

      saveHistory({ requestHeaders: headers, requestPayload: payload, response: res.data });
    } catch (err) {
      const errorData = err.response?.data || { error: err.message };
      setResponseData(errorData);
      saveHistory({ requestHeaders: headers, requestPayload: payload, response: errorData });
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: "auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>🔍 Fetch E-Waybill By Number</h1>

      {/* INPUTS */}
      <div style={{ margin: "15px 0" }}>
        <label>EWB Number:</label>
        <input
          type="text"
          value={ewbNo}
          onChange={(e) => setEwbNo(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        />
      </div>

      <div style={{ margin: "15px 0" }}>
        <label>User GSTIN:</label>
        <input
          type="text"
          value={userGstin}
          onChange={(e) => setUserGstin(e.target.value)}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        />
      </div>

      <div style={{ margin: "15px 0" }}>
        <label>Update Needed:</label>
        <select
          value={updateNeeded}
          onChange={(e) => setUpdateNeeded(e.target.value === "true")}
          style={{ width: "100%", padding: 8, marginTop: 5 }}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </div>

      <button
        onClick={fetchEWB}
        style={{ padding: "10px 20px", backgroundColor: "#1A73E8", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
      >
        Fetch EWB
      </button>

      <hr style={{ margin: "25px 0" }} />

      {/* HEADERS */}
      <div style={{ background: "#f1f2f6", padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3>🔐 Request Headers</h3>
        <pre>{JSON.stringify(requestHeaders, null, 2)}</pre>
      </div>

      {/* PAYLOAD */}
      <div style={{ background: "#f1f2f6", padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3>📦 Request Payload</h3>
        <pre>{JSON.stringify(requestPayload, null, 2)}</pre>
      </div>

      {/* RESPONSE */}
      <div style={{ background: "#e8ffe8", padding: 15, borderRadius: 8, marginBottom: 20 }}>
        <h3>📌 Response</h3>
        <pre>{JSON.stringify(responseData, null, 2)}</pre>
      </div>

      {/* AUTO-POPULATED DATA */}
      {autoFields && Object.keys(autoFields).length > 0 && (
        <div style={{ background: "#fff3cd", padding: 15, borderRadius: 8, marginBottom: 20 }}>
          <h3>📌 Auto-Populated Data (From Previous EWB)</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {Object.entries(autoFields).map(([key, value]) => (
                <tr key={key}>
                  <td style={{ padding: 6, fontWeight: "bold", border: "1px solid #ccc" }}>{key}</td>
                  <td style={{ padding: 6, border: "1px solid #ccc" }}>{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FetchEWBbyNumber;
