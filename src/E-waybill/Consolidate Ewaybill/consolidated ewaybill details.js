import React, { useState, useEffect } from "react";
import axios from "axios";

// LocalStorage keys
const LOGIN_RESPONSE_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";

// Helper to read JSON safely
const getLocalStorageData = (key) => {
  try {
    const raw = localStorage.getItem(key);
    console.log(`📥 Loaded ${key}:`, raw);
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
};

const CEWBDetails = () => {
  const [authData, setAuthData] = useState({ token: "", companyId: "", userGstin: "" });
  const [headers, setHeaders] = useState({});
  const [payload, setPayload] = useState({});
  const [payloadText, setPayloadText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const login = getLocalStorageData(LOGIN_RESPONSE_KEY);
    const savedEwbData = getLocalStorageData(LATEST_EWB_KEY);

    console.log("🔎 login:", login);
    console.log("🔎 savedEwbData:", savedEwbData);

    // --------------------------
    // Extract authentication info
    // --------------------------
    const companyId = login.companyId || 7;
    const token = login.token || "";
    const gstin = savedEwbData?.response?.fromGstin || login.userGstin || "";

    setAuthData({ token, companyId, userGstin: gstin });

    // --------------------------
    // Set headers
    // --------------------------
    const headerObj = {
      "X-Auth-Token": token,
      companyId,
      product: "TOPAZ",
      "Content-Type": "application/json",
      accept: "application/json",
    };
    setHeaders(headerObj);

    // --------------------------
    // Extract fields from savedEwbData or vehicleDetails
    // --------------------------
    const vehicleDetail = savedEwbData?.vehicleDetails?.[0] || {};

    const tripSheetEwbBills =
      Array.isArray(savedEwbData?.allEwbs)
        ? savedEwbData.allEwbs.map((x) => x.ewbNo).filter(Boolean)
        : [savedEwbData?.response?.ewbNo || savedEwbData?.ewbNo || vehicleDetail.ewbNo].filter(Boolean);

    const previousGstin =
      savedEwbData?.fullApiResponse?.response?.fromGstin ||
      savedEwbData?.fromGstin ||
      vehicleDetail?.fromGstin ||
      "05AAAAU1183B5ZW";

    const fromPlace =
      savedEwbData?.fullApiResponse?.response?.fromPlace ||
      savedEwbData?.fromPlace ||
      vehicleDetail?.fromPlace ||
      "Akhondiya";

    const fromStateCode =
      savedEwbData?.fullApiResponse?.response?.fromStateCode ||
      savedEwbData?.fromStateCode ||
      vehicleDetail?.fromState ||
      "5";

    const transDocNo =
      savedEwbData?.fullApiResponse?.response?.transDocNo ||
      savedEwbData?.transDocNo ||
      vehicleDetail?.transDocNo ||
      "1234";

    const transDocDate =
      savedEwbData?.fullApiResponse?.response?.transDocDate ||
      savedEwbData?.transDocDate ||
      vehicleDetail?.transDocDate ||
      "12/11/2025";

    const vehicleNo =
      savedEwbData?.response?.vehicleNo ||
      savedEwbData?.vehicleNo ||
      vehicleDetail?.vehicleNo ||
      "RJ14CA9999";

    const vehicleType =
      savedEwbData?.response?.vehicleType ||
      savedEwbData?.vehicleType ||
      vehicleDetail?.vehicleType ||
      "R";

    const transMode =
      savedEwbData?.fullApiResponse?.response?.transMode ||
      savedEwbData?.transMode ||
      vehicleDetail?.transMode ||
      "3";

    console.log("📌 tripSheetEwbBills:", tripSheetEwbBills);
    console.log("📌 userGstin:", previousGstin);
    console.log("📌 fromPlace:", fromPlace);
    console.log("📌 fromStateCode:", fromStateCode);
    console.log("📌 transMode:", transMode);
    console.log("📌 transDocDate:", transDocDate);
    console.log("📌 transDocNo:", transDocNo);
    console.log("📌 vehicleNo:", vehicleNo);
    console.log("📌 vehicleType:", vehicleType);

    // --------------------------
    // Build initial payload
    // --------------------------
    const initialPayload = {
      fromPlace,
      fromState: fromStateCode,
      vehicleNo,
      vehicleType,
      transMode,
      transDocNo,
      transDocDate,
      tripSheetEwbBills,
      companyId,
      userGstin: previousGstin,
    };

    setPayload(initialPayload);
    setPayloadText(JSON.stringify(initialPayload, null, 2));
  }, []);

  // --------------------------
  // JSON Payload Edit
  // --------------------------
  const handlePayloadChange = (text) => {
    setPayloadText(text);
    try {
      setPayload(JSON.parse(text));
      setError("");
    } catch {
      setError("Invalid JSON");
    }
  };

  // --------------------------
  // Header edit
  // --------------------------
  const handleHeaderChange = (key, value) => {
    const updated = { ...headers, [key]: value };
    setHeaders(updated);
  };

  // --------------------------
  // SUBMIT CEWB
  // --------------------------
  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await axios.post("http://localhost:3001/proxy/topaz/cewb/generate", payload, { headers });
      console.log("🎉 CEWB Response:", res.data);
      setResponse(res.data);

      // Save updated CEWB locally
      const saved = getLocalStorageData(LATEST_EWB_KEY);
      const allEwbs = [...(saved.allEwbs || [])];

      if (res.data.response?.cEwbNo) {
        allEwbs.push({ ewbNo: res.data.response.cEwbNo });
      }

      const updated = { ...saved, cewbResponse: res.data.response, allEwbs };
      localStorage.setItem(LATEST_EWB_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error("❌ API Error:", err);
      setError(err?.response?.data?.message || err.message || "API Error");
      setResponse(err?.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // UI
  // --------------------------
  return (
    <div style={{ maxWidth: "900px", margin: "auto", padding: "20px", fontFamily: "Arial" }}>
      <h2>Generate Consolidated E-Way Bill (CEWB)</h2>

      {/* Headers */}
      <div style={{ marginBottom: 20 }}>
        <h3>Headers</h3>
        {Object.entries(headers).map(([key, value]) => (
          <div key={key} style={{ marginBottom: 6 }}>
            <strong>{key}:</strong>
            <input
              style={{ width: "80%", marginLeft: 10 }}
              value={value}
              onChange={(e) => handleHeaderChange(key, e.target.value)}
            />
          </div>
        ))}
      </div>

      {/* Payload Editor */}
      <div style={{ marginBottom: 20 }}>
        <h3>Payload JSON</h3>
        <textarea
          rows={14}
          value={payloadText}
          style={{ width: "100%", fontFamily: "monospace" }}
          onChange={(e) => handlePayloadChange(e.target.value)}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      <button onClick={handleSubmit} disabled={loading} style={{ padding: "10px 20px" }}>
        {loading ? "Generating..." : "Generate CEWB"}
      </button>

      {/* API Response */}
      {response && (
        <div style={{ marginTop: 20 }}>
          <h3>API Response</h3>
          <pre style={{ background: "#f5f5f5", padding: 10 }}>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}

      {/* Final Payload & Headers */}
      <div style={{ marginTop: 20, border: "1px solid #ddd", padding: 10, borderRadius: 4 }}>
        <h3>Final Payload</h3>
        <pre style={{ background: "#f5f5f5", padding: 10 }}>{JSON.stringify(payload, null, 2)}</pre>
        <h3>Headers</h3>
        <pre style={{ background: "#f5f5f5", padding: 10 }}>{JSON.stringify(headers, null, 2)}</pre>
      </div>
    </div>
  );
};

export default CEWBDetails;
