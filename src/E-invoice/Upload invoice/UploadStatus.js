

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
    <div style={{ padding: 30, background: "#f5f5f5", minHeight: "50vh" }}>
      <h1 style={{ color: "#1d3557" }}>Check Upload Status</h1>

      <div
        style={{
          background: "#fff",
          padding: 25,
          borderRadius: 16,
          boxShadow: "0 5px 25px rgba(0,0,0,0.1)",
          maxWidth: 700,
        }}
      >
        <h4>Current Headers</h4>

        <pre
          style={{
            overflowX: "auto",
            background: "#f0f0f0",
            padding: 10,
            borderRadius: 6,
            fontSize: "0.8em",
          }}
        >
          {JSON.stringify(headers, null, 2)}
        </pre>

        <div style={{ marginBottom: 20 }}>
          <label>
            <strong>Upload ID</strong>
          </label>

          <input
            type="text"
            value={uploadId}
            onChange={(e) => setUploadId(e.target.value)}
            placeholder="Enter Upload ID"
            style={{
              display: "block",
              width: "100%",
              padding: 12,
              marginTop: 8,
              fontSize: 16,
            }}
          />
        </div>

        <button
          onClick={checkStatus}
          disabled={loading || !uploadId}
          style={{
            width: "100%",
            padding: 15,
            fontSize: 18,
            background: "#1d3557",
            border: "none",
            borderRadius: 12,
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Checking..." : "CHECK STATUS"}
        </button>
      </div>

      {preview && (
        <pre
          style={{
            marginTop: 25,
            background: "#222",
            color: "#0f0",
            padding: 20,
            borderRadius: 10,
          }}
        >
          {JSON.stringify(preview, null, 2)}
        </pre>
      )}

      {response && (
        <pre
          style={{
            marginTop: 25,
            background: "#000",
            color: "#4eff4e",
            padding: 20,
            borderRadius: 10,
          }}
        >
          {JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default UploadStatus;