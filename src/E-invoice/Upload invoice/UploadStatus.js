// src/components/UploadStatus.js
import React, { useState, useEffect } from "react";

const STORAGE_KEY = "iris_einvoice_shared_config";
const STORAGE_KEY4 = "iris_einvoice_uploadfile";


const UploadStatus = () => {
  const [uploadId, setUploadId] = useState("");
  const [headers, setHeaders] = useState({
    companyId: "",
    "X-Auth-Token": "",
    product: "ONYX",
    Accept: "application/json",
  });

  const [preview, setPreview] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load saved companyId, token, and uploadId
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHeaders((prev) => ({
          ...prev,
          companyId: parsed.companyId || "",
          "X-Auth-Token": parsed.token || "",
        }));
      } catch {}
    }

    const lastUpload = JSON.parse(localStorage.getItem(STORAGE_KEY4 ));
    console.log("lastUpload",lastUpload)
    if (lastUpload) setUploadId(lastUpload.uploadId);
  }, []);

  const checkStatus = async () => {
    if (!uploadId) return alert("Upload ID is required!");

    setLoading(true);
    setResponse(null);

    setPreview({
      endpoint: `/proxy/onyx/upload/status?uploadId=${uploadId}`,
      headers,
    });

    try {
      const res = await fetch(
        `/proxy/onyx/upload/status?uploadId=${uploadId}`,
        { headers }
      );

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30, background: "#f5f5f5", minHeight: "50vh" }}>
      <h1 style={{ color: "#1d3557" }}>Check Upload Status</h1>

      <div
        style={{
          background: "white",
          padding: 25,
          borderRadius: 16,
          boxShadow: "0 5px 25px rgba(0,0,0,0.1)",
        }}
      >
        
        {/* Upload ID */}
        <div style={{ marginTop: 20 }}>
          <label><strong>Upload ID  </strong></label>
          <input
            type="text"
            value={uploadId}
            onChange={(e) => setUploadId(e.target.value)}
            placeholder="Enter Upload ID"
            style={{
              width: "50%",
              padding: "12px",
              marginTop: "8px",
              fontSize: "16px",
            }}
          />
        </div>

        {/* Check Status Button */}
        <button
          onClick={checkStatus}
          disabled={loading}
          style={{
            marginTop: 20,
            width: "50%",
            padding: "15px",
            fontSize: "18px",
            background: "#1d3557",
            border: "none",
            borderRadius: 12,
            color: "white",
            fontWeight: "bold",
          }}
        >
          {loading ? "Checking..." : "CHECK STATUS"}
        </button>
      </div>

      {/* Preview */}
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

      {/* Response */}
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
