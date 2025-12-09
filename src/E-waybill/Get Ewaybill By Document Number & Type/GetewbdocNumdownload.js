import React, { useState, useEffect } from "react";
import axios from "axios";

const LOGIN_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";
const STORAGE_KEY = "EWB_PREVIOUS_DATA";
const  Bulkstorage_key = "bulkStatusLatest"
console.log("Bulkstorage_key",Bulkstorage_key)
const DEFAULT_PROXY = "http://localhost:3001/proxy/topaz/ewb/bulkDownload";

const BulkDownload = () => {
  const [headers, setHeaders] = useState({
    companyId: "",
    token: "",
    product: "TOPAZ",
  });

  const [payload, setPayload] = useState({ id: "" });

  const [downloadUrl, setDownloadUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  // Auto-populate from localStorage
  useEffect(() => {
    const login = JSON.parse(localStorage.getItem(LOGIN_KEY) || "{}");
    const latest = JSON.parse(localStorage.getItem(LATEST_EWB_KEY) || "{}");
    const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    setHeaders({
      companyId: login.companyId || prev.companyId || "",
      token: login.token || prev.token || "",
      product: "TOPAZ",
    });

    setPayload({ id: latest?.response?.id || prev.id || "" });
  }, []);

  const updateHeader = (key, value) => setHeaders((prev) => ({ ...prev, [key]: value }));
  const updatePayload = (key, value) => setPayload((prev) => ({ ...prev, [key]: value }));

  const download = async () => {
    try {
      setError("");
      setDownloadUrl("");
      setFileName("");

      const res = await axios.get(DEFAULT_PROXY, {
        params: payload,
        headers: {
          Accept: "application/json",
          companyId: headers.companyId,
          "X-Auth-Token": headers.token,
          product: headers.product,
        },
        responseType: "blob", // allows any file type
      });

      // Get file name from API response header or fallback
      const contentDisposition = res.headers["content-disposition"];
      const name = contentDisposition?.split("filename=")[1]?.replace(/"/g, "") || `EWB_${payload.id}`;
      setFileName(name);

      const url = window.URL.createObjectURL(res.data);
      setDownloadUrl(url);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...headers, ...payload }));
    } catch (err) {
      setError(err?.response?.data || err.message || "Error while downloading file");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "auto", fontFamily: "Arial" }}>
      <h2>EWB Bulk Download</h2>

      {/* Headers */}
      <div style={styles.card}>
        <h4>Headers</h4>
        <label>Company ID</label>
        <input style={styles.input} value={headers.companyId} onChange={(e) => updateHeader("companyId", e.target.value)} />

        <label>X-Auth-Token</label>
        <input style={styles.input} value={headers.token} onChange={(e) => updateHeader("token", e.target.value)} />

        <label>Product</label>
        <input style={styles.input} value={headers.product} readOnly />
      </div>

      {/* Payload */}
      <div style={styles.card}>
        <h4>Payload</h4>
        <label>ID</label>
        <input style={styles.input} value={payload.id} onChange={(e) => updatePayload("id", e.target.value)} />
      </div>

      <button onClick={download} style={styles.button}>
        Download File
      </button>

      {/* Download Link */}
      {downloadUrl && (
        <div style={{ marginTop: 20 }}>
          <a href={downloadUrl} download={fileName} target="_blank" rel="noreferrer">
            Click here to download: {fileName}
          </a>
        </div>
      )}

      {error && <p style={{ color: "red", marginTop: 10 }}>{JSON.stringify(error)}</p>}
    </div>
  );
};

export default BulkDownload;

const styles = {
  card: {
    background: "#f9f9f9",
    padding: 14,
    marginBottom: 12,
    borderRadius: 8,
    border: "1px solid #ddd",
  },
  input: {
    width: "100%",
    padding: 8,
    borderRadius: 6,
    border: "1px solid #ccc",
    marginBottom: 8,
  },
  button: {
    padding: "10px 20px",
    fontSize: 16,
    borderRadius: 6,
    border: "none",
    background: "#0078ff",
    color: "#fff",
    cursor: "pointer",
    marginTop: 10,
  },
};
