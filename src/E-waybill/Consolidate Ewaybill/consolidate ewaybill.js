import React, { useState, useEffect } from "react";
import axios from "axios";

const LOGIN_RESPONSE_KEY = "iris_login_data";
const LATEST_CEWB_KEY = "latestCewbData";
const LATEST_EWB_KEY = "latestEwbData";

// Helper: Safely read from localStorage
const readStorage = (key, fallback = {}) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
};

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
const ByDocNumType = () => {
  const [authData, setAuthData] = useState({ token: "", companyId: "", userGstin: "" });

  const [headers, setHeaders] = useState({
    "X-Auth-Token": "",
    companyId: "",
    product: "TOPAZ",
    Accept: "application/json",
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
   const [payload, setPayload] = useState({});
   const [payloadText, setPayloadText] = useState("");
  // Auto-populate headers & payload on mount
  useEffect(() => {
    const loginData = readStorage(LOGIN_RESPONSE_KEY, {});
    const lastCewbData = readStorage(LATEST_CEWB_KEY, {});
      const login = getLocalStorageData(LOGIN_RESPONSE_KEY);
    const savedEwbData = getLocalStorageData(LATEST_EWB_KEY);

    console.log("🔎 login:", login);
    console.log("🔎 savedEwbData:", savedEwbData);

    // --------------------------
    // Extract
    // --------------------------
    const gstin = savedEwbData?.response?.fromGstin || login.userGstin || "";
    const companyId = login.companyId || 7;
    const token = login.token || "";

    // Extract CEWB Number
    let cEwbNo = "";
    if (savedEwbData?.cewbResponse?.cEwbNo) {
      cEwbNo = savedEwbData.cewbResponse.cEwbNo;
    } else if (savedEwbData?.cEwbNo) {
      cEwbNo = savedEwbData.cEwbNo;
    } else if (savedEwbData?.fullApiResponse?.response?.ewbNo) {
      cEwbNo = savedEwbData.fullApiResponse.response.ewbNo;
    }

     let previousGstin    = " ";  // → userGstin (sender's GSTIN)
  // ───── Extract fromGstin → userGstin (as array) ─────
if (savedEwbData?.fullApiResponse?.response?.fromGstin) {
  previousGstin = savedEwbData.fullApiResponse.response.fromGstin;
}
else if (savedEwbData?.fromGstin) {
  previousGstin = savedEwbData.fromGstin;
}

// Fallback GSTIN if still empty
if (previousGstin.length === 0) {
  previousGstin = "05AAAAU1183B5ZW"; // or your default like "351010498047" if preferred
}

    // Update headers
    setHeaders((prev) => ({
      ...prev,
      "X-Auth-Token": loginData.token || "",
      companyId: loginData.companyId || 4,
    }));


     const initialPayload = {
      cEwbNo: cEwbNo,
      companyId,
      userGstin: previousGstin,
    };

    console.log("📦 Payload:", initialPayload);

    setPayload(initialPayload);
    setPayloadText(JSON.stringify(initialPayload, null, 2));
  }, []);
    
     // --------------------------
  // JSON Payload Edit
  // --------------------------
  const handlePayloadChange = (text) => {
    setPayloadText(text);
    try {
      const parsed = JSON.parse(text);
      setPayload(parsed);
      setError("");
    } catch {
      setError("Invalid JSON");
    }
  };

  const updateHeader = (key, value) => {
    setHeaders((prev) => ({ ...prev, [key]: value }));
  };

  const updatePayload = (key, value) => {
    setPayload((prev) => ({ ...prev, [key]: value }));
  };

  const handleFetch = async () => {
    if (!payload.userGstin.trim() || !payload.cEwbNo.trim()) {
      setError("Both User GSTIN and CEWB Number are required.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await axios.get("http://localhost:3001/proxy/topaz/cewb/details", {
        params: payload,
        headers: {
          ...headers,
          companyId: headers.companyId.toString(),
        },
      });

      const responseData = res.data;
      setResponse(responseData);

      // Save latest CEWB for future auto-fill
      localStorage.setItem(LATEST_CEWB_KEY, JSON.stringify(responseData));
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Unknown error";
      setError(msg);
      setResponse(err.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h2 style={{ color: "#2c3e50" }}>
        Fetch Consolidated E-Way Bill (CEWB) Details
      </h2>
      <p style={{ color: "#7f8c8d" }}>
        Enter or auto-filled CEWB number to get full details.
      </p>

      <div
        style={{
          background: "#f8f9fa",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3>Request Headers</h3>
        {Object.entries(headers).map(([key, value]) => (
          <div
            key={key}
            style={{ marginBottom: 10, display: "flex", alignItems: "center" }}
          >
            <strong style={{ width: 160 }}>{key}:</strong>
            <input
              type="text"
              value={value}
              onChange={(e) => updateHeader(key, e.target.value)}
              style={{
                flex: 1,
                padding: "8px",
                marginLeft: 10,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#f8f9fa",
          padding: 15,
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <h3>Payload Parameters</h3>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "inline-block", width: 140, fontWeight: "bold" }}>
            User GSTIN:
          </label>
          <input
            value={payload.userGstin}
            onChange={(e) => updatePayload("userGstin", e.target.value)}
            placeholder="e.g. 05AAAAA0000A1Z5"
            style={{
              width: "380px",
              padding: "8px",
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div>
          <label style={{ display: "inline-block", width: 140, fontWeight: "bold" }}>
            CEWB Number:
          </label>
          <input
            value={payload.cEwbNo}
            onChange={(e) => updatePayload("cEwbNo", e.target.value)}
            placeholder="e.g. 3810034524"
            style={{
              width: "380px",
              padding: "8px",
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>
      </div>

      <button
        onClick={handleFetch}
        disabled={loading}
        style={{
          padding: "12px 28px",
          fontSize: "16px",
          backgroundColor: "#3498db",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? "Fetching..." : "Fetch CEWB Details"}
      </button>
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

      {/* Error */}
      {error && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            background: "#fadbd8",
            color: "#c0392b",
            borderRadius: 6,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Response */}
      {response && (
        <div style={{ marginTop: 30 }}>
          <h3>Response</h3>
          <pre
            style={{
              background: "#2c3e50",
              color: "#1abc9c",
              padding: 20,
              borderRadius: 8,
              overflowX: "auto",
              fontSize: "14px",
            }}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ByDocNumType;