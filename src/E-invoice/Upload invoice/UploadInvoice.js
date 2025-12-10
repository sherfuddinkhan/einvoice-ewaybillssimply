// UploadInvoice.js
import React, { useState, useEffect } from "react";

const STORAGE_KEY = "iris_einvoice_shared_config";

const UploadInvoice = () => {
  const [companyUniqueCode, setCompanyUniqueCode] = useState("");
  const [file, setFile] = useState(null);

  const [headers, setHeaders] = useState({
    companyId: "",
    "X-Auth-Token": "",
    product: "ONYX",
    Accept: "application/json"
  });

  const [preview, setPreview] = useState(null);
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load auto-filled companyId & token from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHeaders((prev) => ({
          ...prev,
          companyId: parsed.companyId || "",
          "X-Auth-Token": parsed.token || ""
        }));

        setCompanyUniqueCode(parsed.companyUniqueCode || "");
      } catch (e) {
        console.log("Parsing error", e);
      }
    }
  }, []);

  const handleFileUpload = async () => {
    if (!file) return alert("Please select CSV or ZIP file");
    if (!companyUniqueCode) return alert("companyUniqueCode is required");

    setLoading(true);
    setResponse(null);

    // Show header & payload preview
    setPreview({
      endpoint: `/proxy/onyx/upload/invoices?companyUniqueCode=${companyUniqueCode}`,
      headers,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `/proxy/onyx/upload/invoices?companyUniqueCode=${companyUniqueCode}`,
        {
          method: "POST",
          headers,
          body: formData
        }
      );

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30, background: "#f5f5f5", minHeight: "100vh" }}>
      <h1 style={{ color: "#2d6a4f" }}>Upload Invoice (CSV / ZIP)</h1>
      <p style={{ color: "#555" }}>companyId, X-Auth-Token auto-filled from login step</p>

      <div
        style={{
          background: "white",
          padding: "25px",
          borderRadius: "14px",
          boxShadow: "0 5px 20px rgba(0,0,0,0.1)"
        }}
      >
        {/* Auto Headers */}
        <h3>Headers (Auto-populated)</h3>
        <p><strong>companyId:</strong> {headers.companyId || "NOT SET"}</p>
        <p><strong>X-Auth-Token:</strong> {headers["X-Auth-Token"] || "NOT SET"}</p>
        <p><strong>product:</strong> ONYX</p>

        {/* companyUniqueCode */}
        <div style={{ margin: "15px 0" }}>
          <label><strong>companyUniqueCode (GSTIN)</strong></label>
          <input
            type="text"
            value={companyUniqueCode}
            onChange={(e) => setCompanyUniqueCode(e.target.value)}
            placeholder="Enter GSTIN"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "8px",
              fontSize: "16px"
            }}
          />
        </div>

        {/* File Upload */}
        <div style={{ marginTop: 20 }}>
          <strong>Select CSV / ZIP File:</strong>
          <input
            type="file"
            accept=".csv,.zip"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ width: "100%", paddingTop: 10 }}
          />
        </div>

        {/* Upload Button */}
        <button
          onClick={handleFileUpload}
          disabled={loading}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "15px",
            fontSize: "18px",
            background: "#2d6a4f",
            border: "none",
            borderRadius: "10px",
            color: "white",
            fontWeight: "bold"
          }}
        >
          {loading ? "UPLOADING..." : "UPLOAD FILE"}
        </button>
      </div>

      {/* Preview Section */}
      {preview && (
        <pre
          style={{
            marginTop: 25,
            background: "#222",
            color: "#0f0",
            padding: 20,
            borderRadius: 10
          }}
        >
{JSON.stringify(preview, null, 2)}
        </pre>
      )}

      {/* Response Section */}
      {response && (
        <pre
          style={{
            marginTop: 25,
            background: "#000",
            color: "#4eff4e",
            padding: 20,
            borderRadius: 10
          }}
        >
{JSON.stringify(response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default UploadInvoice;
