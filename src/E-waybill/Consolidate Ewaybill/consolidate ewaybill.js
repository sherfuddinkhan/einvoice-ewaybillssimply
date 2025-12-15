import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------
   LocalStorage Keys
--------------------------- */
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";

/* ---------------------------
   Safe LocalStorage Reader
--------------------------- */
const readStorage = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

const ByDocNumType = () => {
  /* ---------------------------
     State
  --------------------------- */
  const [headers, setHeaders] = useState({
    Accept: "application/json",
    product: "TOPAZ",
    companyId: "",
    "X-Auth-Token": "",
  });

  const [payload, setPayload] = useState({
    cEwbNo: "",
    companyId: "",
    userGstin: "",
  });

  const [payloadText, setPayloadText] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ---------------------------
     Auto-fill from LocalStorage
  --------------------------- */
  useEffect(() => {
    const login = readStorage(STORAGE_KEY00);
    const lastEwb = readStorage(LATEST_EWB_KEY);
    console.log("lastEwb ",lastEwb)

    const token = login.fullResponse?.response?.token || "";
    const companyId = login.fullResponse?.response?.companyid || "";
    const gstin =
      lastEwb?.response?.fromGstin ||
      lastEwb?.fullApiResponse?.response?.fromGstin ||
      login.userGstin ||
      "";

    // Extract CEWB No from previous flows
    const cEwbNo =
      lastEwb?.cewbResponse?.cEwbNo||
      lastEwb?.cEwbNo ||
      lastEwb?.response?.cEwbNo ||
      "";

    setHeaders((prev) => ({
      ...prev,
      companyId,
      "X-Auth-Token": token,
    }));

    const initialPayload = {
      cEwbNo,
      companyId,
      userGstin: gstin || "05AAAAU1183B5ZW",
    };

    setPayload(initialPayload);
    setPayloadText(JSON.stringify(initialPayload, null, 2));
  }, []);

  /* ---------------------------
     Payload JSON Editor
  --------------------------- */
  const handlePayloadChange = (text) => {
    setPayloadText(text);
    try {
      const parsed = JSON.parse(text);
      setPayload(parsed);
      setError("");
    } catch {
      setError("Invalid JSON payload");
    }
  };

  const updateHeader = (key, value) =>
    setHeaders((prev) => ({ ...prev, [key]: value }));

  const updatePayload = (key, value) => {
    const updated = { ...payload, [key]: value };
    setPayload(updated);
    setPayloadText(JSON.stringify(updated, null, 2));
  };

  /* ---------------------------
     Fetch CEWB Details
  --------------------------- */
  const handleFetch = async () => {
    if (!payload.userGstin || !payload.cEwbNo) {
      setError("User GSTIN and CEWB Number are mandatory.");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);

    try {
      const res = await axios.get(
        "http://localhost:3001/proxy/topaz/cewb/details",
        {
          params: payload,
          headers: {
            ...headers,
            companyId: String(headers.companyId),
          },
          timeout: 30000,
        }
      );

      setResponse(res.data);

      // ✅ Persist latest CEWB response
      localStorage.setItem(LATEST_CEWB_KEY, JSON.stringify(res.data));
    } catch (err) {
      const msg = err.response?.data || err.message;
      setError(typeof msg === "string" ? msg : JSON.stringify(msg, null, 2));
      setResponse(err.response?.data || null);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------
     UI
  --------------------------- */
  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <h2>Fetch Consolidated E-Way Bill (CEWB) Details</h2>

      {/* Headers */}
      <div style={{ background: "#f4f6f7", padding: 15, borderRadius: 6 }}>
        <h3>Request Headers</h3>
        {Object.entries(headers).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <label style={{ width: 160, display: "inline-block" }}>{k}</label>
            <input
              value={v}
              onChange={(e) => updateHeader(k, e.target.value)}
              style={{ width: "60%", padding: 6 }}
            />
          </div>
        ))}
      </div>

      {/* Payload */}
      <div style={{ background: "#f4f6f7", padding: 15, borderRadius: 6, marginTop: 20 }}>
        <h3>Payload</h3>

        <div style={{ marginBottom: 10 }}>
          <label>User GSTIN</label><br />
          <input
            value={payload.userGstin}
            onChange={(e) => updatePayload("userGstin", e.target.value)}
            style={{ width: 380, padding: 6 }}
          />
        </div>

        <div>
          <label>CEWB Number</label><br />
          <input
            value={payload.cEwbNo}
            onChange={(e) => updatePayload("cEwbNo", e.target.value)}
            style={{ width: 380, padding: 6 }}
          />
        </div>
      </div>

      {/* JSON Editor */}
      <div style={{ marginTop: 20 }}>
        <h3>Payload JSON</h3>
        <textarea
          rows={12}
          value={payloadText}
          onChange={(e) => handlePayloadChange(e.target.value)}
          style={{ width: "100%", fontFamily: "monospace" }}
        />
      </div>

      {/* Action */}
      <button
        onClick={handleFetch}
        disabled={loading}
        style={{
          marginTop: 20,
          padding: "12px 26px",
          background: "#3498db",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Fetching..." : "Fetch CEWB Details"}
      </button>

      {/* Error */}
      {error && (
        <pre style={{ background: "#fdecea", color: "#c0392b", padding: 15, marginTop: 20 }}>
          {error}
        </pre>
      )}

      {/* Response */}
      {response && (
        <pre
          style={{
            marginTop: 30,
            background: "#1e272e",
            color: "#1abc9c",
            padding: 20,
            borderRadius: 6,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default ByDocNumType;
