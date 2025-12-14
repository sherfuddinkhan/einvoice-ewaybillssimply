import React, { useState, useEffect } from "react";

const STORAGE_KEY = "iris_einvoice_response";  
const STORAGE_KEY1 = "iris_einvoice_shared_config";
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";
 // header info (companyId, maybe token)
const STORAGE_KEY4 = "iris_einvoice_uploadfile"; // upload info (uploadId)

  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
  const savedResponse = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  const savedConfig2 = JSON.parse(localStorage.getItem(STORAGE_KEY2) || "{}");
  const savedConfig3 = JSON.parse(localStorage.getItem(STORAGE_KEY4) || "{}");
    console.log("savedConfig",savedConfig)
    console.log("savedResponse",savedResponse)
    console.log("savedConfig2",savedConfig2)
    console.log("savedConfig3",savedConfig3)
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
      *** FIX: Ensure 'X-Auth-Token' is loaded correctly. ***
  ---------------------------------------- */
  useEffect(() => {
    // Load header data
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setHeaders((prev) => ({
          ...prev,
          companyId: parsed.companyId || "24", // Use a default for companyId
          // Assuming token is available on 'token' field in STORAGE_KEY
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
        const savedConfig3 = JSON.parse(uploadSaved);
        if (savedConfig3.lastResponse.response.uploadId) {
          setUploadId(savedConfig3.lastResponse.response.uploadId);
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

    // The endpoint includes the uploadId as a query parameter
    const endpoint = `http://localhost:3001/proxy/onyx/upload/status?uploadId=${uploadId}`;

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

      // Handle non-200 responses that might still return JSON (e.g., 401, 404)
      const data = await res.json();
      setResponse(data);

    } catch (err) {
      setResponse({ error: err.message || "Network Error" });
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
        {/* Headers Preview */}
        <h4 style={{ marginTop: 0 }}>Current Headers</h4>
        <pre style={{ overflowX: 'auto', background: '#f0f0f0', padding: 10, borderRadius: 6, fontSize: '0.8em' }}>
            {JSON.stringify(headers, null, 2)}
        </pre>

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
          disabled={loading || !uploadId} // Disable if no ID
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