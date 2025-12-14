import React, { useState, useEffect } from "react";
import axios from "axios";

// LocalStorage keys
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const EWB_HISTORY_KEY = "ewbHistory";

const ConsigneeEwaybill = () => {
  // ------------------------------
  // 1️⃣ State Definitions
  // ------------------------------
  const [authData, setAuthData] = useState({ companyId: "", token: "" });
  const [headers, setHeaders] = useState({
    accept: "application/json",
    product: "TOPAZ",
    companyId: "",
    "X-Auth-Token": "",
    "Content-Type": "application/json",
  });
  const [payload, setPayload] = useState({
    fromPlace: "",
    fromState: "",
    vehicleNo: "",
    transMode: 1,
    transDocNo: "",
    transDocDate: "",
    tripSheetEwbBills: [],
    companyId: null,
    userGstin: "",
  });
  const [requestPreview, setRequestPreview] = useState(null);
  const [responsePreview, setResponsePreview] = useState(null);

  // ------------------------------
  // 2️⃣ Reset Previews when Inputs Change
  // ------------------------------
  const resetPreviews = () => {
    setRequestPreview(null);
    setResponsePreview(null);
  };

  // ------------------------------
  // 3️⃣ Auto-Populate Data from LocalStorage
  // ------------------------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(STORAGE_KEY00) || "{}");
    const lastEwb = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");
    const lastResponse = lastEwb?.response || {};

    const companyId = login.fullResponse?.response?.companyid || "";
    const token = login.fullResponse?.response?.token || "";

    setAuthData({ companyId, token });

    // Set Headers
    setHeaders((prev) => ({
      ...prev,
      companyId,
      "X-Auth-Token": token,
    }));

    // Set Payload with meaningful defaults
    setPayload({
      fromPlace: lastResponse.fromPlace || "",
      fromState: lastResponse.fromStateCode || "",
      vehicleNo: lastResponse.vehicleNo || "",
      transMode: lastResponse.transMode || 1,
      transDocNo: lastResponse.transDocNo || "",
      transDocDate: lastResponse.transDocDate || "",
      tripSheetEwbBills: lastResponse.ewbNo ? [lastResponse.ewbNo] : [],
      companyId: lastResponse.companyId || companyId || null,
      userGstin: lastResponse.userGstin || login.userGstin || "",
    });
  }, []);

  // ------------------------------
  // 4️⃣ Generate CEWB API Call
  // ------------------------------
  const generateCEWB = async () => {
    const url = "https://stage-api.irisgst.com/irisgst/topaz/api/v0.3/cewb";
    setRequestPreview({ url, headers, body: payload });

    try {
      const res = await axios.post(url, payload, { headers });
      setResponsePreview(res.data);

      // Save the latest EWB in LocalStorage for auto-population next time
      const latestEwbData = {
        response: res.data.response || {},
        fromPlace: payload.fromPlace,
        fromStateCode: payload.fromState,
        vehicleNo: payload.vehicleNo,
        transMode: payload.transMode,
        transDocNo: payload.transDocNo,
        transDocDate: payload.transDocDate,
        tripSheetEwbBills: payload.tripSheetEwbBills,
        companyId: payload.companyId,
        userGstin: payload.userGstin,
      };
      localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(latestEwbData));

      // Save history (keep last 10)
      const history = JSON.parse(localStorage.getItem(EWB_HISTORY_KEY) || "[]");
      history.unshift({
        time: new Date().toLocaleString(),
        ...latestEwbData,
      });
      localStorage.setItem(EWB_HISTORY_KEY, JSON.stringify(history.slice(0, 10)));
    } catch (err) {
      setResponsePreview(err.response?.data || { error: err.message });
    }
  };

  // ------------------------------
  // 5️⃣ Render UI
  // ------------------------------
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto", fontFamily: "Arial" }}>
      <h2>📄 Generate Consolidated E-Waybill</h2>

      {/* 🔹 Headers */}
      <h3>🔹 Edit Headers</h3>
      {Object.keys(headers).map((key) => (
        <div style={{ marginBottom: 10 }} key={key}>
          <label>{key} :</label>
          <input
            type="text"
            value={headers[key]}
            onChange={(e) => {
              resetPreviews();
              setHeaders((prev) => ({ ...prev, [key]: e.target.value }));
            }}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
      ))}

      {/* 🔹 Payload */}
      <h3>🔹 Edit Payload</h3>
      {Object.keys(payload).map((key) => {
        if (key === "tripSheetEwbBills") {
          return (
            <div style={{ marginBottom: 10 }} key={key}>
              <label>{key} (comma separated) :</label>
              <input
                type="text"
                value={payload[key].join(", ")}
                onChange={(e) => {
                  resetPreviews();
                  setPayload((prev) => ({
                    ...prev,
                    [key]: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  }));
                }}
                style={{ width: "100%", padding: 8 }}
              />
            </div>
          );
        }

        return (
          <div style={{ marginBottom: 10 }} key={key}>
            <label>{key} :</label>
            <input
              type={key === "transMode" || key === "fromState" ? "number" : "text"}
              value={payload[key]}
              onChange={(e) => {
                resetPreviews();
                setPayload((prev) => ({ ...prev, [key]: e.target.value }));
              }}
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        );
      })}

      {/* Generate Button */}
      <button
        onClick={generateCEWB}
        style={{
          padding: "10px 20px",
          backgroundColor: "black",
          color: "white",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        {responsePreview ? "Submitted ✔" : "Generate CEWB"}
      </button>

      <hr />

      {/* Request Preview */}
      <h3>📌 Request Preview</h3>
      <pre style={{ background: "#f4f4f4", padding: 10 }}>
        {JSON.stringify(requestPreview, null, 2)}
      </pre>

      {/* Response Preview */}
      <h3>📌 Response Preview</h3>
      <pre style={{ background: "#e8ffe8", padding: 10 }}>
        {JSON.stringify(responsePreview, null, 2)}
      </pre>
    </div>
  );
};

export default ConsigneeEwaybill;
