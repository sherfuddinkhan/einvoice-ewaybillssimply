import React, { useState, useEffect } from "react";
import axios from "axios";

// LocalStorage Keys
const STORAGE_KEY00 = "iris_ewaybill_shared_config"; // login/auth info
const LATEST_EWB_KEY = "latestEwbData";             // last EWB info
const FORM_KEY = "iris_transporter_form";           // form state

const AssignedEwbTransporter = () => {
  // ------------------------------
  // 1️⃣ State Definitions
  // ------------------------------
  const [form, setForm] = useState({
    date: new Date().toLocaleDateString("en-GB"), // dd/mm/yyyy
    userGstin: "",
    page: "1",
    size: "10",
    updateNeeded: "true",
  });

  const [auth, setAuth] = useState({ companyId: "", token: "" });
  const [requestPreview, setRequestPreview] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ------------------------------
  // 2️⃣ Load login/auth + last used form from localStorage
  // ------------------------------
  useEffect(() => {
    try {
      // Auth & Company Info
      const login = JSON.parse(localStorage.getItem(STORAGE_KEY00) || "{}");
      const token = login.fullResponse?.response?.token || "";
      const companyId = login.fullResponse?.response?.companyid || "";

      setAuth({ companyId, token });

      // Last used transporter form
      const savedForm = JSON.parse(localStorage.getItem(FORM_KEY) || "{}");

      // Last EWB info for auto-fill GSTIN
      const latestEwb = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");
      const lastGstin = latestEwb?.userGstin || savedForm?.userGstin || "";

      setForm((prev) => ({
        ...prev,
        ...savedForm,
        userGstin: lastGstin,
      }));
    } catch (err) {
      console.error("Error loading localStorage data", err);
    }
  }, []);

  // ------------------------------
  // 3️⃣ Handle input changes and save form in localStorage
  // ------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    localStorage.setItem(FORM_KEY, JSON.stringify(updatedForm));
  };

  // ------------------------------
  // 4️⃣ Fetch transporter-assigned EWB data
  // ------------------------------
  const fetchData = async () => {
    if (!auth.companyId || !auth.token) {
      setError("Missing login credentials (companyId / token)");
      return;
    }

    setLoading(true);
    setError("");
    setRawResponse(null);

    const url = "http://localhost:3001/proxy/topaz/api/transporter-ewb";
    const headers = {
      companyId: auth.companyId,
      "X-Auth-Token": auth.token,
      product: "TOPAZ",
    };

    setRequestPreview({ url, headers, params: form });

    try {
      const res = await axios.get(url, { headers, params: form, timeout: 30000 });
      setRawResponse(res.data);
    } catch (err) {
      const msg = err.response?.data || err.message;
      setError("Fetch failed: " + JSON.stringify(msg, null, 2));
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // 5️⃣ Render UI
  // ------------------------------
  return (
    <div style={{ padding: 20, fontFamily: "monospace", maxWidth: 900, margin: "auto" }}>
      <h2>Transporter Assigned E-Way Bills – Raw Response</h2>

      {/* Auth Preview */}
      <div style={{ marginBottom: 15, padding: 10, background: "#f9f9f9", borderRadius: 6 }}>
        <strong>Company ID:</strong> {auth.companyId || "—"} <br />
        <strong>Token:</strong> {auth.token ? "Present" : "Missing"}
      </div>

      {/* Form Inputs */}
      <div style={{ marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <input
          name="date"
          value={form.date}
          onChange={handleChange}
          placeholder="dd/mm/yyyy"
        />
        <input
          name="userGstin"
          value={form.userGstin}
          onChange={handleChange}
          placeholder="GSTIN"
          style={{ width: 220 }}
        />
        <input
          name="page"
          type="number"
          value={form.page}
          onChange={handleChange}
          style={{ width: 70 }}
        />
        <input
          name="size"
          type="number"
          value={form.size}
          onChange={handleChange}
          style={{ width: 70 }}
        />
        <select name="updateNeeded" value={form.updateNeeded} onChange={handleChange}>
          <option value="true">Update from NIC</option>
          <option value="false">Use Cache</option>
        </select>
        <button onClick={fetchData} disabled={loading} style={{ padding: "8px 16px" }}>
          {loading ? "Fetching..." : "Fetch Now"}
        </button>
      </div>

      {/* Request Preview */}
      {requestPreview && (
        <div>
          <h3>📌 Request Preview</h3>
          <pre style={{ background: "#f4f4f4", padding: 15, borderRadius: 6, overflow: "auto" }}>
            {JSON.stringify(requestPreview, null, 2)}
          </pre>
        </div>
      )}

      {/* Error */}
      {error && (
        <pre style={{ background: "#ffeeee", color: "darkred", padding: 15, borderRadius: 6, overflow: "auto" }}>
          {error}
        </pre>
      )}

      {/* Response */}
      {rawResponse && (
        <div>
          <h3>📌 Response (only shown after clicking Fetch)</h3>
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
