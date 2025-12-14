import React, { useState, useEffect } from "react";

const STORAGE_KEY = "iris_einvoice_shared_config"; // header info
const STORAGE_KEY4 = "iris_einvoice_uploadfile";   // upload info

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

  /* ----------------------------------------
     Load headers + last uploadId
  ---------------------------------------- */
  useEffect(() => {
    // Load header data
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHeaders((prev) => ({
          ...prev,
          companyId: parsed.companyId || "",
          "X-Auth-Token": parsed.token || "",
        }));
      }
    } catch (e) {
      console.error("Header storage parse error", e);
    }

    // Load last upload info
    try {
      const uploadSaved = localStorage.getItem(STORAGE_KEY4);
      if (uploadSaved) {
        const parsedUpload = JSON.parse(uploadSaved);
        if (parsedUpload?.uploadId) {
          setUploadId(parsedUpload.uploadId);
        }
      }
    } catch (e) {
      console.error("Upload storage parse error", e);
    }
  }, []);

  /* ----------------------------------------
     Check upload status
  ---------------------------------------- */
  const checkStatus = async () => {
    if (!uploadId) {
      alert("Upload ID is required");
      return;
    }

    setLoading(true);
    setResponse(null);

    const endpoint = `/proxy/onyx/upload/status?uploadId=${uploadId}`;

    setPreview({
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
          background: "#fff",
          padding: 25,
          borderRadius: 16,
          boxShadow: "0 5px 25px rgba(0,0,0,0.1)",
          maxWidth: 700,
        }}
      >
        {/* Upload ID */}
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

        {/* Button */}
        <button
          onClick={checkStatus}
          disabled={loading}
          style={{
            width: "100%",
            padding: 15,
            fontSize: 18,
            background: "#1d3557",
            border: "none",
            borderRadius: 12,
            color: "#fff",
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
