import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------------
   API
---------------------------------- */
const REQUESTS_API =
  "http://localhost:3001/proxy/topaz/multiVehicle/requests";

/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00   = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY  = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";
const QUERY_KEY       = "mv_requests_query";
const RESP_KEY        = "mv_requests_response";

/* ---------------------------------
   Safe LocalStorage Read
---------------------------------- */
const readLS = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const MultiVehicleRequests = () => {
  /* ---------------------------------
     Load Context
  ---------------------------------- */
  const shared     = readLS(STORAGE_KEY00);
  const latestEwb  = readLS(LATEST_EWB_KEY);
  const latestCewb = readLS(LATEST_CEWB_KEY);
  const savedQuery = readLS(QUERY_KEY);

  const token =
    shared?.fullResponse?.response?.token || "";

  const companyId =
    shared?.fullResponse?.response?.companyid ||
    latestEwb?.response?.companyId ||
    latestCewb?.response?.companyId ||
    "";

  /* ---------------------------------
     Headers
  ---------------------------------- */
  const [headers, setHeaders] = useState({
    "X-Auth-Token": token,
    companyId,
    product: "TOPAZ",
  });

  /* ---------------------------------
     Query Params
  ---------------------------------- */
  const [query, setQuery] = useState({
    reqGstin:
      savedQuery?.reqGstin ||
      latestEwb?.response?.fromGstin ||
      latestEwb?.response?.userGstin ||
      "",
    ewbNo:
      savedQuery?.ewbNo ||
      latestCewb?.response?.ewbNo ||
      latestEwb?.response?.ewbNo ||
      "",
  });

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------------------------
     Persist Query
  ---------------------------------- */
  useEffect(() => {
    localStorage.setItem(QUERY_KEY, JSON.stringify(query));
  }, [query]);

  /* ---------------------------------
     Handlers
  ---------------------------------- */
  const updateHeader = (k, v) =>
    setHeaders((h) => ({ ...h, [k]: v }));

  const updateQuery = (k, v) =>
    setQuery((q) => ({ ...q, [k]: v }));

  /* ---------------------------------
     Fetch Requests
  ---------------------------------- */
  const fetchRequests = async () => {
    if (!headers["X-Auth-Token"]) {
      alert("Auth token missing. Please regenerate EWB session.");
      return;
    }

    if (!query.reqGstin || !query.ewbNo) {
      alert("reqGstin and ewbNo are mandatory");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await axios.get(REQUESTS_API, {
        params: query,
        headers,
      });

      setResponse(res.data);
      localStorage.setItem(RESP_KEY, JSON.stringify(res.data));
    } catch (e) {
      setError(e?.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------
     UI
  ---------------------------------- */
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>
      <h2>🚚 Multi-Vehicle — Requests</h2>

      {/* HEADERS */}
      <h3>Headers</h3>
      {Object.entries(headers).map(([k, v]) => (
        <div key={k} style={row}>
          <label style={label}>{k}</label>
          <input
            style={input}
            value={v}
            onChange={(e) => updateHeader(k, e.target.value)}
          />
        </div>
      ))}

      {/* QUERY */}
      <h3 style={{ marginTop: 14 }}>Query Parameters</h3>
      {Object.entries(query).map(([k, v]) => (
        <div key={k} style={row}>
          <label style={label}>{k}</label>
          <input
            style={input}
            value={v}
            onChange={(e) => updateQuery(k, e.target.value)}
          />
        </div>
      ))}

      <button
        onClick={fetchRequests}
        disabled={loading}
        style={button}
      >
        {loading ? "Loading..." : "Fetch Requests"}
      </button>

      {/* RESPONSE */}
      {error && (
        <pre style={{ color: "red", marginTop: 15 }}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}
      {response && (
        <pre style={{ marginTop: 15 }}>
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default MultiVehicleRequests;

/* ---------------------------------
   Styles
---------------------------------- */
const row = { marginBottom: 8 };

const label = {
  width: 160,
  display: "inline-block",
  fontWeight: "bold",
};

const input = {
  width: 460,
  padding: 6,
};

const button = {
  marginTop: 18,
  padding: "10px 22px",
  fontSize: 16,
  background: "#0078ff",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
