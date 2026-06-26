import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../components/AuthContext";

const LATEST_EWB_KEY = "latestEwbData";
const FORM_KEY = "iris_transporter_form";

const AssignedEwbTransporter = () => {
  const { token, companyId } = useAuth();

  const [form, setForm] = useState({
    date: new Date().toLocaleDateString("en-GB"),
    userGstin: "",
    page: "1",
    size: "10",
    updateNeeded: "true",
  });

  const [requestPreview, setRequestPreview] = useState(null);
  const [rawResponse, setRawResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const savedForm = JSON.parse(
        localStorage.getItem(FORM_KEY) || "{}"
      );

      const latestEwb = JSON.parse(
        localStorage.getItem(LATEST_EWB_KEY) || "{}"
      );

      const lastGstin =
        latestEwb?.response?.fromGstin ||
        latestEwb?.userGstin ||
        savedForm?.userGstin ||
        "";

      setForm((prev) => ({
        ...prev,
        ...savedForm,
        userGstin: lastGstin,
      }));
    } catch (err) {
      console.error(
        "Error loading localStorage data",
        err
      );
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    const updatedForm = {
      ...form,
      [name]: value,
    };

    setForm(updatedForm);

    localStorage.setItem(
      FORM_KEY,
      JSON.stringify(updatedForm)
    );
  };

  const fetchData = async () => {
    if (!token || !companyId) {
      setError(
        "Missing authentication (token/companyId)"
      );
      return;
    }

    setLoading(true);
    setError("");
    setRawResponse(null);

        // Read latest values from localStorage
    const currentConnectionType =
      localStorage.getItem("connectionType") || "DEFAULT";

    const url =
      `https://einvoice.fcssoftwares.com/api/gst/ewaybill/transporter-assigned` +
      `?date=${form.date}` +
      `&userGstin=${form.userGstin}` +
      `&page=${form.page}` +
      `&size=${form.size}` +
      `&updateNeeded=${form.updateNeeded}`;

    const headers = {
      accept: "application/json",
      product: "TOPAZ",
      companyId,
      "X-Auth-Token": token,
     ConnectionType: currentConnectionType,
    };

    setRequestPreview({
      url,
      headers,
    });

    try {
      const { data } = await axios.get(url, {
        headers,
        timeout: 30000,
      });

      setRawResponse(data);
    } catch (err) {
      const msg =
        err.response?.data || err.message;

      setError(
        "Fetch failed:\n" +
          JSON.stringify(msg, null, 2)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 20,
        fontFamily: "monospace",
        maxWidth: 900,
        margin: "auto",
      }}
    >
      <h2>
        Transporter Assigned E-Way Bills –
        Raw Response
      </h2>

      <div
        style={{
          marginBottom: 15,
          padding: 10,
          background: "#f9f9f9",
          borderRadius: 6,
        }}
      >
        <strong>Company ID:</strong>{" "}
        {companyId || "—"}
        <br />
        <strong>Token:</strong>{" "}
        {token ? "Present" : "Missing"}
      </div>

      <div
        style={{
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "center",
        }}
      >
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

        <select
          name="updateNeeded"
          value={form.updateNeeded}
          onChange={handleChange}
        >
          <option value="true">
            Update from NIC
          </option>
          <option value="false">
            Use Cache
          </option>
        </select>

        <button
          onClick={fetchData}
          disabled={loading}
          style={{
            padding: "8px 16px",
          }}
        >
          {loading
            ? "Fetching..."
            : "Fetch Now"}
        </button>
      </div>

      {requestPreview && (
        <>
          <h3>📌 Request Preview</h3>
          <pre
            style={{
              background: "#f4f4f4",
              padding: 15,
              borderRadius: 6,
              overflow: "auto",
            }}
          >
            {JSON.stringify(
              requestPreview,
              null,
              2
            )}
          </pre>
        </>
      )}

      {error && (
        <pre
          style={{
            background: "#ffeeee",
            color: "darkred",
            padding: 15,
            borderRadius: 6,
            overflow: "auto",
          }}
        >
          {error}
        </pre>
      )}

      {rawResponse && (
        <>
          <h3>
            📌 Response (only shown after
            clicking Fetch)
          </h3>

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
            {JSON.stringify(
              rawResponse,
              null,
              2
            )}
          </pre>
        </>
      )}

      {!rawResponse &&
        !loading &&
        !error && (
          <p
            style={{
              color: "#888",
              fontStyle: "italic",
            }}
          >
            Click "Fetch Now" to see the raw
            JSON response.
          </p>
        )}
    </div>
  );
};

export default AssignedEwbTransporter;