import React, { useState, useEffect } from "react";
import axios from "axios";

const FORM_KEY = "iris_transporter_form";
const LOGIN_KEY = "iris_login_data";

const AssignedEwbTransporter = () => {
  const [form, setForm] = useState({
    date: "26/11/2025",
    userGstin: "05AAAAU1183B1Z0",
    page: "1",
    size: "10",
    updateNeeded: "true",
  });

  const [headers, setHeaders] = useState({ companyId: "", token: "" });
  const [rawResponse, setRawResponse] = useState(null);   // ← stays null until fetch
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Only restore form + login on mount — NOT the previous response
  useEffect(() => {
    try {
      const savedForm = JSON.parse(localStorage.getItem(FORM_KEY) || "{}");
      const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");

      if (Object.keys(savedForm).length > 0) {
        setForm((prev) => ({ ...prev, ...savedForm }));
      }
      if (login.companyId && login.token) {
        setHeaders({ companyId: login.companyId, token: login.token });
      }
    } catch (e) {
      console.error("localStorage parse error", e);
    }
    // rawResponse intentionally NOT loaded here
  }, []);

  const handleChange = (e) => {
    const updated = { ...form, [e.target.name]: e.target.value };
    setForm(updated);
    localStorage.setItem(FORM_KEY, JSON.stringify(updated));
  };

  const fetchData = async () => {
    if (!headers.companyId || !headers.token) {
      setError("Missing login credentials (companyId / token)");
      return;
    }

    setLoading(true);
    setError("");
    setRawResponse(null);          // ← clear previous result every time

    try {
      const res = await axios.get("http://localhost:3001/proxy/topaz/api/transporter-ewb", {
        params: form,
        headers: {
          companyId: headers.companyId,
          "X-Auth-Token": headers.token,
          product: "TOPAZ",
        },
        timeout: 30000,
      });

      setRawResponse(res.data);     // ← only now we show it
    } catch (err) {
      const msg = err.response?.data || err.message;
      setError("Fetch failed: " + JSON.stringify(msg, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "monospace" }}>
      <h2>Transporter Assigned E-Way Bills – Raw Response</h2>

      <div style={{ marginBottom: 15, padding: 10, background: "#f9f9f9", borderRadius: 6 }}>
        <strong>Company ID:</strong> {headers.companyId || "—"} <br />
        <strong>Token:</strong> {headers.token ? "Present" : "Missing"}
      </div>

      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <input name="date" value={form.date} onChange={handleChange} placeholder="dd/mm/yyyy" />
        <input name="userGstin" value={form.userGstin} onChange={handleChange} placeholder="GSTIN" style={{ width: 220 }} />
        <input name="page" type="number" value={form.page} onChange={handleChange} style={{ width: 70 }} />
        <input name="size" type="number" value={form.size} onChange={handleChange} style={{ width: 70 }} />
        <select name="updateNeeded" value={form.updateNeeded} onChange={handleChange}>
          <option value="true">Update from NIC</option>
          <option value="false">Use Cache</option>
        </select>
        <button onClick={fetchData} disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Fetching..." : "Fetch Now"}
        </button>
      </div>

      {error && (
        <pre style={{ background: "#ffeeee", color: "darkred", padding: 15, borderRadius: 6, overflow: "auto" }}>
          {error}
        </pre>
      )}

      {rawResponse && (
        <div>
          <h3>Response (only shown after clicking Fetch):</h3>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 20,
              borderRadius: 8,
              border: "1px solid #ddd",
              overflow: "auto",
              maxHeight: "80vh",
              whiteSpace: "pre-wrap",
            }}
          >
            {JSON.stringify(rawResponse, null, 2)}
          </pre>
        </div>
      )}

      {!rawResponse && !loading && !error && (
        <p style={{ color: "#888", fontStyle: "italic" }}>
          Click “Fetch Now” to see the raw JSON response.
        </p>
      )}
    </div>
  );
};

export default AssignedEwbTransporter;