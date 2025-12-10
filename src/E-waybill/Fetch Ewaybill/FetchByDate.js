import React, { useState, useEffect } from "react";
import axios from "axios";

const LOGIN_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";

const FetchByDate = () => {
  const [date, setDate] = useState(""); // user input
  const [userGstin, setUserGstin] = useState("");

  const [headersUI, setHeadersUI] = useState({});
  const [payloadUI, setPayloadUI] = useState({});
  const [response, setResponse] = useState(null);

  // ----------------------------------------
  // Load headers + latest EWB
  // ----------------------------------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

    const headers = {
      accept: "application/json",
      product: "TOPAZ",
      companyid: login.companyId || "",
      "x-auth-token": login.token || "",
    };

    setHeadersUI(headers);

    // Prefill date (DD/MM/YYYY)
    const latestDate = latest?.response?.ewbDate?.split(" ")[0] || "";
    setDate(latestDate);

    // Prefill GSTIN
    setUserGstin(latest?.response?.fromGstin || "");
  }, []);

  // ----------------------------------------
  // Fix date → convert DD/MM/YY to DD/MM/YYYY
  // ----------------------------------------
  const fixDateFormat = (d) => {
    if (!d) return d;

    const parts = d.split("/");
    if (parts.length !== 3) return d;

    if (parts[2].length === 2) {
      parts[2] = "20" + parts[2]; // convert 25 → 2025
    }

    return parts.join("/");
  };

  // ----------------------------------------
  // Fetch EWBs (axios only)
  // ----------------------------------------
  const fetchEwbs = async () => {
    const finalDate = fixDateFormat(date);

    const payload = {
      date: finalDate,
      userGstin,
    };

    setPayloadUI(payload);

    console.log("📤 REQUEST URL:", "http://localhost:3001/proxy/topaz/ewb/fetchByDate");
    console.log("📤 REQUEST HEADERS:", headersUI);
    console.log("📤 FIXED DATE SENT:", finalDate);
    console.log("📤 REQUEST PARAMS:", payload);

    try {
      const res = await axios.get(
        "http://localhost:3001/proxy/topaz/ewb/fetchByDate",
        {
          params: payload,
          headers: headersUI,
        }
      );

      console.log("✅ RESPONSE SUCCESS:", res.data);
      setResponse(res.data);

    } catch (error) {
      const err = error.response?.data || error.message;
      console.log("❌ RESPONSE ERROR:", err);
      setResponse(err);
    }
  };

  // ----------------------------------------
  // UI
  // ----------------------------------------
  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Fetch Generated E-Way Bills by Date</h2>

      {/* Date input */}
      <div>
        <label>Date (DD/MM/YYYY)</label>
        <br />
        <input
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="26/11/2025"
          style={{ padding: 6, width: 200 }}
        />
      </div>

      {/* GSTIN input */}
      <div style={{ marginTop: 10 }}>
        <label>User GSTIN</label>
        <br />
        <input
          value={userGstin}
          onChange={(e) => setUserGstin(e.target.value)}
          placeholder="Enter GSTIN"
          style={{ padding: 6, width: 200 }}
        />
      </div>

      <button
        onClick={fetchEwbs}
        style={{
          marginTop: 15,
          padding: "8px 20px",
          cursor: "pointer",
          background: "#1976d2",
          color: "white",
          border: "none",
        }}
      >
        Fetch EWB
      </button>

      {/* Headers */}
      <h3>Request Headers</h3>
      <pre style={{ background: "#f3f3f3", padding: 10 }}>
        {JSON.stringify(headersUI, null, 2)}
      </pre>

      {/* Query Params */}
      <h3>Query Parameters (Payload)</h3>
      <pre style={{ background: "#fafafa", padding: 10 }}>
        {JSON.stringify(payloadUI, null, 2)}
      </pre>

      {/* Response */}
      <h3>Response</h3>
      <pre style={{ background: "#e8f5e9", padding: 10 }}>
        {JSON.stringify(response, null, 2)}
      </pre>
    </div>
  );
};

export default FetchByDate;
