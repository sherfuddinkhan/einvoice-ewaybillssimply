import React, { useState, useEffect } from "react";
import axios from "axios";

const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const GetEwbDetails = () => {
  const [ewbNo, setEwbNo] = useState("");

  const [authData, setAuthData] = useState({
    companyId: "",
    token: "",
    userGstin: "",
  });

  const [requestHeaders, setRequestHeaders] = useState({});
  const [requestPayload, setRequestPayload] = useState({});
  const [responseData, setResponseData] = useState(null);
  const [autoFields, setAutoFields] = useState({});

  // --------------------------------------------------
  // 🔵 Load login response + last used data
  // --------------------------------------------------
  useEffect(() => {
    // Load login data
    const login = JSON.parse(localStorage.getItem(STORAGE_KEY00) || "{}");
    const latestEwb = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");
        console.log("login",login )
    console.log("latestEwb",latestEwb)

    setAuthData({
      companyId: login.fullResponse?.response?.companyid  || "",
      token: login.fullResponse?.response?.token || "",
      userGstin:latestEwb.fromGstin || "",
    });

    // Load last EWB auto-population
    const saved = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

    if (saved?.ewbNo) setEwbNo(saved.ewbNo);
    if (saved?.response) setAutoFields(saved.response);
  }, []);

  // --------------------------------------------------
  // 🔴 Save EWB History (Last 10)
  // --------------------------------------------------
  const saveHistory = (entry) => {
    let history = JSON.parse(localStorage.getItem(EWB_HISTORY_KEY) || "[]");

    history.unshift({
      time: new Date().toLocaleString(),
      ...entry,
    });

    if (history.length > 10) history = history.slice(0, 10);

    localStorage.setItem(EWB_HISTORY_KEY, JSON.stringify(history));
  };

  // --------------------------------------------------
  // 🔵 Save Latest Auto-Population
  // --------------------------------------------------
  const saveLatest = (data) => {
  if (!data || typeof data !== "object") {
    console.warn("saveLatest: invalid data", data);
    return;
  }

  localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(data));
  console.log("saveLatest: saved data →", data);
};

  const handleFetchDetails = async () => {
    // ------------------------
    // BUILD HEADERS
    // ------------------------
    const headers = {
      accept: "application/json",
      product: "TOPAZ",
      companyId: authData.companyId,
      "x-auth-token": authData.token,
    };

    // ------------------------
    // BUILD PAYLOAD
    // ------------------------
    const payload = {
      tabId: 1,
      ewbNo: ewbNo,
      userGstin: authData.userGstin,
    };

    // Show request preview in UI
    setRequestHeaders(headers);
    setRequestPayload(payload);

    try {
      const res = await axios.get(
        "http://localhost:3001/proxy/topaz/ewb/details",
        { params: payload, headers }
      );

      setResponseData(res.data);

      const extracted = res.data?.response || {};
      setAutoFields(extracted);

      // Save for auto-fill next time
      saveLatest({ ewbNo, response: extracted });

      // Save history
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
    <div style={{ padding: 25, maxWidth: 900, margin: "auto" }}>
      <h2>🔍 Get E-Waybill Full Details</h2>

      {/* INPUT */}
      <label>EWB Number:</label>
      <input
        type="text"
        value={ewbNo}
        onChange={(e) => setEwbNo(e.target.value)}
        placeholder="Enter EWB No"
        style={{ width: "100%", padding: 10, marginBottom: 20 }}
      />

      <button
        onClick={handleFetchDetails}
        style={{
          padding: "12px 20px",
          background: "black",
          color: "white",
          borderRadius: 6,
        }}
      >
        Fetch Details
      </button>

      <hr />

      {/* REQUEST PREVIEWS */}
      <h3>📌 Request Headers</h3>
      <pre style={{ background: "#f0f0f0", padding: 10 }}>
        {JSON.stringify(requestHeaders, null, 2)}
      </pre>

      <h3>📌 Request Payload</h3>
      <pre style={{ background: "#f0f0f0", padding: 10 }}>
        {JSON.stringify(requestPayload, null, 2)}
      </pre>

      <hr />

      {/* RESPONSE */}
      <h3>📌 Response</h3>
      <pre style={{ background: "#e8f5ff", padding: 10 }}>
        {responseData ? JSON.stringify(responseData, null, 2) : "No response yet"}
      </pre>

      <hr />

      {/* AUTO FIELDS TABLE */}
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

export default GetEwbDetails;
