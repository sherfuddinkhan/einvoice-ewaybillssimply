import React, { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthContext";

import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";


const STORAGE_KEY = "iris_einvoice_response";
const STORAGE_KEY1 = "iris_einvoice_shared_config";
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";
const STORAGE_KEY4 = "iris_einvoice_uploadfile";
  const savedConfig1 = JSON.parse(localStorage.getItem(STORAGE_KEY1) || '{}');
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY2) || '{}');

const UploadInvoice = () => {
const { token, companyId, userGstin } = useAuth();
const [companyUniqueCode, setCompanyUniqueCode] = useState("");
 const navigate = useNavigate();
    const location = useLocation();
     const invoiceData = location.state?.invoiceData;

  console.log("invoiceData", invoiceData);
const [file, setFile] = useState(null);
const [preview, setPreview] = useState(null);
const [response, setResponse] = useState(null);
const [loading, setLoading] = useState(false);
  const currentConnectionType =
        localStorage.getItem("connectionType") || "DEFAULT";

const headers = {
  companyId,
  "X-Auth-Token": token,
  product: "ONYX",
  Accept: "application/json",
   ConnectionType: currentConnectionType,
};
  // Auto-populate headers & companyUniqueCode from localStorage
 useEffect(() => {
   const userGstin = savedConfig1?.companyUniqueCode
    || savedConfig?.companyUniqueCode
    || savedConfig?.userGstin
    || "";
  setCompanyUniqueCode(userGstin || "");
}, [userGstin]);

  const handleFileUpload = async () => {
      if (!file) {
    alert("Please select CSV or ZIP file");
    return;
  }

  if (!companyUniqueCode) {
    alert("companyUniqueCode is required");
    return;
  }

  if (!companyId || !token) {
    alert("Authentication information is missing");
    return;
  }

    if (!file) return alert("Please select CSV or ZIP file");
    if (!companyUniqueCode) return alert("companyUniqueCode is required");

    setLoading(true);
    setResponse(null);
   

    setPreview({
      endpoint: `https://einvoice.fcssoftwares.com/api/gst/upload/invoice?companyUniqueCode=${companyUniqueCode}`,
      headers,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(2)} KB`,
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(
        `https://einvoice.fcssoftwares.com/api/gst/upload/invoice?companyUniqueCode=${companyUniqueCode}`,
        {
          method: "POST",
         headers,
          body: formData,
        }
      );

      const data = await res.json();

      // Auto-populate localStorage for next upload
      localStorage.setItem(STORAGE_KEY4, JSON.stringify({
        companyId: headers.companyId,
        token: headers["X-Auth-Token"],
        companyUniqueCode,
        lastResponse: data
      }));

      setResponse(data);
    } catch (error) {
      setResponse({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 30, background: "#f5f5f5", minHeight: "50vh" }}>
      <h1 style={{ color: "#2d6a4f" }}>Upload Invoice (CSV / ZIP)</h1>
      <p style={{ color: "#555" }}>companyId, X-Auth-Token auto-filled from localStorage</p>

      <div style={{ background: "white", padding: 25, borderRadius: 14, boxShadow: "0 5px 20px rgba(0,0,0,0.1)" }}>
        <div style={{ margin: "15px 0" }}>
          <label><strong>companyUniqueCode:</strong></label>
          <input
            type="text"
            value={companyUniqueCode}
            onChange={(e) => setCompanyUniqueCode(e.target.value)}
            placeholder="Enter GSTIN"
            style={{ width: "30%", padding: 10, marginTop: 8, fontSize: 16 }}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <strong>Select CSV / ZIP File:</strong>
          <input
            type="file"
            accept=".csv,.zip"
            onChange={(e) => setFile(e.target.files[0])}
            style={{ width: "30%", paddingTop: 10 }}
          />
        </div>

        <button
          onClick={handleFileUpload}
          disabled={loading}
          style={{
            marginTop: 20, width: "30%", padding: 15, fontSize: 18,
            background: "#2d6a4f", border: "none", borderRadius: 10,
            color: "white", fontWeight: "bold"
          }}
        >
          {loading ? "UPLOADING..." : "UPLOAD FILE"}
        </button>
      </div>

      {preview && <pre style={{ marginTop: 25, background: "#222", color: "#0f0", padding: 20, borderRadius: 10 }}>{JSON.stringify(preview, null, 2)}</pre>}
      {response && <pre style={{ marginTop: 25, background: "#000", color: "#4eff4e", padding: 20, borderRadius: 10 }}>{JSON.stringify(response, null, 2)}</pre>}
    </div>
  );
};

export default UploadInvoice;
