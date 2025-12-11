import React, { useState, useEffect } from "react";
import axios from "axios";

const LOGIN_RESPONSE_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";

const ConsigneeEwaybill = () => {
  const [authData, setAuthData] = useState({
    companyId: "",
    token: "",
  });

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

  // 👇 Helper: Clear previews whenever user edits anything
  const resetButton = () => {
    setRequestPreview(null);
    setResponsePreview(null);
  };

  // Auto-fill data
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_RESPONSE_KEY) || "{}");
    const lastEwb = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");
    const lastResponse = lastEwb?.response || {};

    setAuthData({
      companyId: login.companyId || "",
      token: login.token || "",
    });

    setHeaders((prev) => ({
      ...prev,
      companyId: login.companyId || "",
      "X-Auth-Token": login.token || "",
    }));

    setPayload({
      fromPlace: lastResponse.fromPlace || "",
      fromState: lastResponse.fromStateCode || "",
      vehicleNo: lastResponse.vehicleNo || "",
      transMode: lastResponse.transMode || 1,
      transDocNo: lastResponse.transDocNo || "",
      transDocDate: lastResponse.transDocDate || "",
      tripSheetEwbBills: lastResponse.ewbNo ? [lastResponse.ewbNo] : [],
      companyId: lastResponse.companyId || login.companyId || null,
      userGstin: lastResponse.userGstin || login.userGstin || "",
    });
  }, []);

  const generateCEWB = async () => {
    const url = "https://stage-api.irisgst.com/irisgst/topaz/api/v0.3/cewb";
    setRequestPreview({ url, headers, body: payload });

    try {
      const res = await axios.post(url, payload, { headers });
      setResponsePreview(res.data);
    } catch (err) {
      setResponsePreview(err.response?.data || { error: err.message });
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>
      <h2>📄 Generate Consolidated E-Waybill</h2>

      <h3>🔹 Edit Headers</h3>
      {Object.keys(headers).map((key) => (
        <div style={{ marginBottom: 10 }} key={key}>
          <label>{key} :</label>
          <input
            type="text"
            value={headers[key]}
            onChange={(e) => {
              resetButton(); // 🔥 Clears previews → button resets
              setHeaders((prev) => ({ ...prev, [key]: e.target.value }));
            }}
            style={{ width: "100%", padding: 8 }}
          />
        </div>
      ))}

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
                  resetButton();
                  setPayload((prev) => ({
                    ...prev,
                    [key]: e.target.value
                      .split(",")
                      .map((v) => v.trim())
                      .filter((v) => v),
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
                resetButton(); // 🔥 Button resets on ANY change
                setPayload((prev) => ({
                  ...prev,
                  [key]: e.target.value,
                }));
              }}
              style={{ width: "100%", padding: 8 }}
            />
          </div>
        );
      })}

      {/* 👇 Button automatically resets because previews are cleared */}
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

      <h3>📌 Request Preview</h3>
      <pre style={{ background: "#f4f4f4", padding: 10 }}>
        {JSON.stringify(requestPreview, null, 2)}
      </pre>

      <h3>📌 Response Preview</h3>
      <pre style={{ background: "#e8ffe8", padding: 10 }}>
        {JSON.stringify(responsePreview, null, 2)}
      </pre>
    </div>
  );
};

export default ConsigneeEwaybill;
