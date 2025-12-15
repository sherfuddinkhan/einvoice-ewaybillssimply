import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";
const BULK_STATUS_KEY = "bulkStatusLatest";

/* ---------------------------------
   API
---------------------------------- */
const DEFAULT_PROXY =
  "http://localhost:3001/proxy/topaz/ewb/bulkDownload";

/* ---------------------------------
   Safe LocalStorage Reader
---------------------------------- */
const readLS = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const BulkDownload = () => {
  /* ---------------------------------
     Load Stored Context
  ---------------------------------- */
  const shared = readLS(STORAGE_KEY00);
  const latestEwb = readLS(LATEST_EWB_KEY);
  const latestCewb = readLS(LATEST_CEWB_KEY);
  const lastBulk = readLS(BULK_STATUS_KEY);

  const token =
    shared?.fullResponse?.response?.token || lastBulk?.token || "";

const companyId = shared ?.fullResponse?.response?.companyid || "";

  const defaultId =
    latestEwb?.response?.id ||
    latestCewb?.response?.id ||
    lastBulk?.id ||
    "";

  /* ---------------------------------
     Headers State
  ---------------------------------- */
  const [headers, setHeaders] = useState({
    companyId,
    token,
    product: "TOPAZ",
  });

  /* ---------------------------------
     Payload State
  ---------------------------------- */
  const [payload, setPayload] = useState({
    id: defaultId,
  });

  const [downloadUrl, setDownloadUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");

  /* ---------------------------------
     Helpers
  ---------------------------------- */
  const updateHeader = (key, value) =>
    setHeaders((h) => ({ ...h, [key]: value }));

  const updatePayload = (key, value) =>
    setPayload((p) => ({ ...p, [key]: value }));

  /* ---------------------------------
     Download Handler
  ---------------------------------- */
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
        responseType: "blob",
      });

      /* File name */
      const disposition = res.headers["content-disposition"];
      const name =
        disposition?.split("filename=")[1]?.replace(/"/g, "") ||
        `EWB_BULK_${payload.id}`;

      const url = window.URL.createObjectURL(res.data);

      setFileName(name);
      setDownloadUrl(url);

      /* Persist last successful bulk context */
      localStorage.setItem(
        BULK_STATUS_KEY,
        JSON.stringify({
          id: payload.id,
          companyId: headers.companyId,
          token: headers.token,
          downloadedAt: new Date().toISOString(),
        })
      );
    } catch (err) {
      setError(
        err?.response?.data ||
          err.message ||
          "Error while downloading file"
      );
    }
  };

  /* ---------------------------------
     UI
  ---------------------------------- */
  return (
    <div style={styles.container}>
      <h2>EWB Bulk Download</h2>

      {/* Headers */}
      <div style={styles.card}>
        <h4>🧾 Headers</h4>

        <label>Company ID</label>
        <input
          style={styles.input}
          value={headers.companyId}
          onChange={(e) =>
            updateHeader("companyId", e.target.value)
          }
        />

        <label>X-Auth-Token</label>
        <input
          style={styles.input}
          value={headers.token}
          onChange={(e) =>
            updateHeader("token", e.target.value)
          }
        />

        <label>Product</label>
        <input
          style={styles.input}
          value={headers.product}
          readOnly
        />
      </div>

      {/* Payload */}
      <div style={styles.card}>
        <h4>📦 Payload</h4>

        <label>Bulk Request ID</label>
        <input
          style={styles.input}
          value={payload.id}
          onChange={(e) =>
            updatePayload("id", e.target.value)
          }
        />
      </div>

      <button onClick={download} style={styles.button}>
        ⬇️ Download File
      </button>

      {/* Download Link */}
      {downloadUrl && (
        <div style={{ marginTop: 20 }}>
          <a
            href={downloadUrl}
            download={fileName}
            target="_blank"
            rel="noreferrer"
          >
            Click here to download: <b>{fileName}</b>
          </a>
        </div>
      )}

      {error && (
        <pre style={styles.error}>
          {JSON.stringify(error, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default BulkDownload;

/* ---------------------------------
   Styles
---------------------------------- */
const styles = {
  container: {
    padding: 20,
    maxWidth: 600,
    margin: "auto",
    fontFamily: "Arial",
  },
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
  error: {
    background: "#ffe6e6",
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    color: "red",
  },
};
