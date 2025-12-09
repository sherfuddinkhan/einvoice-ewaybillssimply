import React, { useState, useEffect } from "react";
import axios from "axios";

const LOGIN_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";

const MultiVehicleRequests = () => {
  // -----------------------------
  // HEADERS STATE
  // -----------------------------
  const [headers, setHeaders] = useState({
    "X-Auth-Token": "",
    companyId: "",
    product: "TOPAZ",
  });

  // -----------------------------
  // QUERY STATE
  // -----------------------------
  const [query, setQuery] = useState({
    reqGstin: "",
    ewbNo: "",
  });

  const [resp, setResp] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  // -----------------------------
  // AUTOPOPULATE HEADERS AND QUERY
  // -----------------------------
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");

    setHeaders({
      "X-Auth-Token": login?.token || "",
      companyId: login?.companyId || "",
      product: "TOPAZ",
    });

    setQuery({
      reqGstin: latest?.response?.fromGstin || "",
      ewbNo: latest?.response?.ewbNo || "",
    });
  }, []);

  // -----------------------------
  // HANDLERS
  // -----------------------------
  const onHeaderChange = (key, value) => setHeaders((h) => ({ ...h, [key]: value }));
  const onQueryChange = (key, value) => setQuery((q) => ({ ...q, [key]: value }));

  // -----------------------------
  // FETCH MULTIVEHICLE REQUESTS
  // -----------------------------
  const fetchList = async () => {
    if (!headers["X-Auth-Token"]) {
      alert("X-Auth-Token is required. Please login again.");
      return;
    }

    if (!query.reqGstin || !query.ewbNo) {
      alert("reqGstin and ewbNo are required.");
      return;
    }

    setLoading(true);
    setErr(null);
    setResp(null);

    try {
      const res = await axios.get(
        "http://localhost:3001/proxy/topaz/multiVehicle/requests",
        { params: query, headers }
      );
      setResp(res.data);
    } catch (e) {
      setErr(e.response?.data || e.message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "auto" }}>
      <h2>Multi-Vehicle — List Requests</h2>

      {/* HEADERS */}
      <section>
        <h3>Headers</h3>
        {Object.entries(headers).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 6 }}>
            <label style={{ width: 140, display: "inline-block" }}>{k}</label>
            <input
              style={{ width: 420 }}
              value={v}
              onChange={(e) => onHeaderChange(k, e.target.value)}
            />
          </div>
        ))}
      </section>

      {/* QUERY */}
      <section style={{ marginTop: 12 }}>
        <h3>Query Parameters</h3>
        {Object.entries(query).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 6 }}>
            <label style={{ width: 140, display: "inline-block" }}>{k}</label>
            <input
              style={{ width: 420 }}
              value={v}
              onChange={(e) => onQueryChange(k, e.target.value)}
            />
          </div>
        ))}
      </section>

      {/* BUTTON */}
      <div style={{ marginTop: 12 }}>
        <button onClick={fetchList} disabled={loading}>
          {loading ? "Loading..." : "Fetch Requests"}
        </button>
      </div>

      {/* RESPONSE */}
      <div style={{ marginTop: 12 }}>
        {err && <pre style={{ color: "red" }}>{JSON.stringify(err, null, 2)}</pre>}
        {resp && <pre>{JSON.stringify(resp, null, 2)}</pre>}
      </div>
    </div>
  );
};

export default MultiVehicleRequests;
