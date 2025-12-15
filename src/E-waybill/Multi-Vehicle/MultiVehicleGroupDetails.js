import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------------
   API
---------------------------------- */
const GROUP_DETAILS_API =
  "http://localhost:3001/proxy/topaz/multiVehicle/groupDetails";

/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00   = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY  = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";
const GROUP_QUERY_KEY = "mv_group_query";

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

const MultiVehicleGroupDetails = () => {
  /* ---------------------------------
     Load Stored Context
  ---------------------------------- */
  const shared     = readLS(STORAGE_KEY00);
  const latestEwb  = readLS(LATEST_EWB_KEY);
  const latestCewb = readLS(LATEST_CEWB_KEY);
  const draftQuery = readLS(GROUP_QUERY_KEY);

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
    Accept: "application/json",
    product: "TOPAZ",
    companyId,
    "X-Auth-Token": token,
  });

  /* ---------------------------------
     Query Params
  ---------------------------------- */
  const [query, setQuery] = useState({
    groupNo:
      draftQuery?.groupNo ||
      latestCewb?.response?.groupNo ||
      latestEwb?.response?.groupNo ||
      "",
    ewbNo:
      draftQuery?.ewbNo ||
      latestCewb?.response?.ewbNo ||
      latestEwb?.response?.ewbNo ||
      "",
  });

  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------------------------
     Persist Query Draft
  ---------------------------------- */
  useEffect(() => {
    localStorage.setItem(GROUP_QUERY_KEY, JSON.stringify(query));
  }, [query]);

  /* ---------------------------------
     Handlers
  ---------------------------------- */
  const updateHeader = (k, v) =>
    setHeaders((h) => ({ ...h, [k]: v }));

  const updateQuery = (k, v) =>
    setQuery((q) => ({ ...q, [k]: v }));

  /* ---------------------------------
     Fetch Group Details
  ---------------------------------- */
  const fetchGroup = async () => {
    if (!query.groupNo || !query.ewbNo) {
      alert("Both Group No and EWB No are required");
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await axios.get(
        GROUP_DETAILS_API,
        { params: query, headers }
      );
      setResponse(res.data);
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
      <h2>📦 Multi-Vehicle — Group Details</h2>

      {/* HEADERS */}
      <h3>Headers</h3>
      {Object.entries(headers).map(([k, v]) => (
        <div key={k} style={rowStyle}>
          <label style={labelStyle}>{k}</label>
          <input
            value={v}
            onChange={(e) => updateHeader(k, e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}

      {/* QUERY */}
      <h3 style={{ marginTop: 14 }}>Query Parameters</h3>
      {Object.entries(query).map(([k, v]) => (
        <div key={k} style={rowStyle}>
          <label style={labelStyle}>{k}</label>
          <input
            value={v}
            onChange={(e) => updateQuery(k, e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}

      <button
        onClick={fetchGroup}
        disabled={loading}
        style={buttonStyle}
      >
        {loading ? "Loading..." : "Fetch Group"}
      </button>

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

export default MultiVehicleGroupDetails;

/* ---------------------------------
   Styles
---------------------------------- */
const rowStyle = {
  marginBottom: 8,
};

const labelStyle = {
  width: 170,
  display: "inline-block",
  fontWeight: "bold",
};

const inputStyle = {
  width: 460,
  padding: 6,
};

const buttonStyle = {
  marginTop: 18,
  padding: "10px 22px",
  fontSize: 16,
  background: "#0078ff",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
