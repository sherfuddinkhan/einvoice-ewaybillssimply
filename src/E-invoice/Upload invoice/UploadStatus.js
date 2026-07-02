

import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

const STORAGE_KEY = "iris_einvoice_response";
const STORAGE_KEY1 = "iris_einvoice_shared_config";
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";
const STORAGE_KEY4 = "iris_einvoice_uploadfile";

const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
const savedResponse = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
const savedConfig2 = JSON.parse(localStorage.getItem(STORAGE_KEY2) || "{}");
const savedConfig3 = JSON.parse(localStorage.getItem(STORAGE_KEY4) || "{}");

const currentConnectionType =
  localStorage.getItem("connectionType") || "DEFAULT";

console.log("savedConfig", savedConfig);
console.log("savedResponse", savedResponse);
console.log("savedConfig2", savedConfig2);
console.log("savedConfig3", savedConfig3);

const UploadStatus = () => {
  const { token, companyId, userGstin, user } = useAuth();

  const [uploadId, setUploadId] = useState("");
  const [preview, setPreview] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const [headers, setHeaders] = useState({
    companyId: "",
    "X-Auth-Token": "",
    product: "ONYX",
    Accept: "application/json",
    ConnectionType: currentConnectionType,
  });

  /* ----------------------------------------
     Load Auth Headers + Upload ID
  ---------------------------------------- */
  useEffect(() => {
    setHeaders((prev) => ({
      ...prev,
      companyId: companyId || user?.companyId || "",
      "X-Auth-Token": token || user?.token || "",
    }));

    try {
      const uploadSaved = localStorage.getItem(STORAGE_KEY4);

      if (uploadSaved) {
        const parsed = JSON.parse(uploadSaved);

        const id = parsed?.lastResponse?.response?.uploadId;

        if (id) {
          setUploadId(id);
        }
      }
    } catch (err) {
      console.error("Upload storage parse error", err);
    }
  }, [token, companyId, user]);

  /* ----------------------------------------
     Check Upload Status
  ---------------------------------------- */
  const checkStatus = async () => {
    if (!uploadId) {
      alert("Upload ID is required");
      return;
    }

    setLoading(true);
    setResponse(null);

    const endpoint = `https://einvoice.fcssoftwares.com/api/gst/upload/status?uploadId=${uploadId}`;

    setPreview({
      method: "GET",
      endpoint,
      headers,
    });

    try {
      const res = await fetch(endpoint, {
        method: "GET",
        headers,
      });

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({
        error: err.message || "Network Error",
      });
    } finally {
      setLoading(false);
    }
  };
return (
  <div
    style={{
      padding: 30,
      background: "#f5f5f5",
      minHeight: "100vh",
    }}
  >
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        background: "#fff",
        padding: "35px",
        borderRadius: "15px",
        boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
      }}
    >
      <h1
        style={{
          color: "#1d3557",
          marginBottom: "35px",
        }}
      >
        Check Upload Status
      </h1>

      <div style={fieldRow}>
        <label style={labelStyle}>Upload ID</label>

        <input
          type="text"
          value={uploadId}
          onChange={(e) => setUploadId(e.target.value)}
          placeholder="Enter Upload ID"
          style={inputStyle}
        />
      </div>

      <button
        onClick={checkStatus}
        disabled={loading || !uploadId}
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "18px",
          background: "#1d3557",
          border: "none",
          borderRadius: "12px",
          color: "#fff",
          fontWeight: "bold",
          cursor: loading || !uploadId ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Checking..." : "CHECK STATUS"}
      </button>
    </div>

    {preview && (
      <pre
        style={{
          maxWidth: "900px",
          margin: "25px auto 0",
          background: "#222",
          color: "#0f0",
          padding: "20px",
          borderRadius: "10px",
          overflowX: "auto",
        }}
      >
        {JSON.stringify(preview, null, 2)}
      </pre>
    )}

    {response && (
      <pre
        style={{
          maxWidth: "900px",
          margin: "25px auto 0",
          background: "#000",
          color: "#4eff4e",
          padding: "20px",
          borderRadius: "10px",
          overflowX: "auto",
        }}
      >
        {JSON.stringify(response, null, 2)}
      </pre>
    )}
  </div>
);
 
};
const fieldRow = {
  display: "flex",
  alignItems: "center",
  gap: "20px",
  marginBottom: "25px",
};

const labelStyle = {
  width: "180px",
  fontWeight: "600",
  fontSize: "16px",
  color: "#333",
};

const inputStyle = {
  width: "220px", // Reduce width as needed
  padding: "12px",
  fontSize: "16px",
  border: "2px solid #1d3557",
  borderRadius: "8px",
  outline: "none",
};

export default UploadStatus;