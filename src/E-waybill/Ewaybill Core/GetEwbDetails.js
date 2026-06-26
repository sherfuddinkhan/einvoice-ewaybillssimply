import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";

const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const GetEwbDetails = () => {

  // Get values directly from localStorage
  const [selectedEnv, setSelectedEnv] = useState(
    localStorage.getItem("connectionType") || "DEFAULT"
  );
  const [ewbNo, setEwbNo] = useState("");
  const { authData } = useAuth();
  const [requestHeaders, setRequestHeaders] = useState({});
  const [requestPayload, setRequestPayload] = useState({});
  const [responseData, setResponseData] = useState(null);
  const [autoFields, setAutoFields] = useState({});
  // ------------------------------------
  // Load last EWB data
  // ------------------------------------
  useEffect(() => {
    const saved = JSON.parse(
      localStorage.getItem(LATEST_EWB_KEY) || "{}"
    );

    if (saved?.ewbNo) setEwbNo(saved.ewbNo);

    if (saved?.response) {
      setAutoFields(saved.response);
    }
  }, []);

  // ------------------------------------
  // Save history
  // ------------------------------------
  const saveHistory = (entry) => {
    let history = JSON.parse(
      localStorage.getItem(EWB_HISTORY_KEY) || "[]"
    );

    history.unshift({
      time: new Date().toLocaleString(),
      ...entry,
    });

    if (history.length > 10) {
      history = history.slice(0, 10);
    }

    localStorage.setItem(
      EWB_HISTORY_KEY,
      JSON.stringify(history)
    );
  };

  // ------------------------------------
  // Save latest EWB
  // ------------------------------------
  const saveLatest = (data) => {
    localStorage.setItem(
      LATEST_EWB_KEY,
      JSON.stringify(data)
    );
  };
const { token, companyId } = useAuth();

    const currentConnectionType =
      localStorage.getItem("connectionType") || "DEFAULT";  
  // ------------------------------------
  // Fetch Details
  // ------------------------------------
  const handleFetchDetails = async () => {
   const headers = {
  accept: "application/json",
  product: "TOPAZ",
  companyId: companyId,
  "X-Auth-Token": token,
 ConnectionType: currentConnectionType,
};

    const payload = {
      ewbNo,
      tabId: 1,
    };

    setRequestHeaders(headers);
    setRequestPayload(payload);

    console.log("Headers:", headers);
    console.log("Payload:", payload);

    try {
      const res = await axios.get(
        "https://einvoice.fcssoftwares.com/api/gst/ewaybill/details",
        {
          params: payload,
          headers,
        }
      );

      setResponseData(res.data);

      const extracted = res.data?.response || {};

      setAutoFields(extracted);

      saveLatest({
        ewbNo,
        response: extracted,
      });

      saveHistory({
        requestHeaders: headers,
        requestPayload: payload,
        response: res.data,
      });
    } catch (error) {
      console.error(
        "API Error:",
        error.response?.data || error.message
      );

      const err =
        error.response?.data || {
          error: error.message,
        };

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

      <label>EWB Number:</label>

      <input
        type="text"
        value={ewbNo}
        onChange={(e) => setEwbNo(e.target.value)}
        placeholder="Enter EWB Number"
        style={{
          width: "100%",
          padding: 10,
          marginBottom: 20,
        }}
      />

      <button
        onClick={handleFetchDetails}
        style={{
          padding: "12px 20px",
          background: "black",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Fetch Details
      </button>

      <hr />

      <h3>Request Headers</h3>
      <pre style={{ background: "#f0f0f0", padding: 10 }}>
        {JSON.stringify(requestHeaders, null, 2)}
      </pre>

      <h3>Request Payload</h3>
      <pre style={{ background: "#f0f0f0", padding: 10 }}>
        {JSON.stringify(requestPayload, null, 2)}
      </pre>

      <h3>Response</h3>
      <pre style={{ background: "#e8f5ff", padding: 10 }}>
        {responseData
          ? JSON.stringify(responseData, null, 2)
          : "No response yet"}
      </pre>
    </div>
  );
};

export default GetEwbDetails;