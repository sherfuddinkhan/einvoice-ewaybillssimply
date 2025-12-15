import React, { useState, useEffect } from "react";
import axios from "axios";

/* ---------------------------------
   API ENDPOINTS
---------------------------------- */
const BULK_STATUS_API =
  "http://localhost:3001/proxy/topaz/ewb/bulkStatus";
const BULK_DOWNLOAD_API =
  "http://localhost:3001/proxy/topaz/ewb/bulkDownload";

/* ---------------------------------
   LocalStorage Keys (STANDARD)
---------------------------------- */
const STORAGE_KEY00 = "iris_ewaybill_shared_config";
const LATEST_EWB_KEY = "latestEwbData";
const LATEST_CEWB_KEY = "latestCewbData";
const BULK_STATUS_KEY = "bulkStatusLatest";

/* ---------------------------------
   Safe LS Reader
---------------------------------- */
const readLS = (key, fallback = {}) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const GetEwbDocNumStatus = () => {
  /* ---------------------------------
     Load Stored Context
  ---------------------------------- */
  const shared = readLS(STORAGE_KEY00);
  const latestEwb = readLS(LATEST_EWB_KEY);
  const latestCewb = readLS(LATEST_CEWB_KEY);

  const token =
    shared?.fullResponse?.response?.token || "";

  const headerCompanyId =
    shared?.fullResponse?.response?.companyid ||
    latestEwb?.response?.companyId ||
    latestCewb?.response?.companyId ||
    "";

  const queryCompanyId =
    latestEwb?.response?.companyId ||
    latestCewb?.response?.companyId ||
    "";

  const userGstin =
    latestEwb?.response?.fromGstin ||
    latestCewb?.response?.fromGstin ||
    shared?.fullResponse?.response?.gstin ||
    "";

  /* ---------------------------------
     State
  ---------------------------------- */
  const [headers, setHeaders] = useState({
    companyId: headerCompanyId,
    token,
    product: "TOPAZ",
  });

  const [query, setQuery] = useState({
    companyId: queryCompanyId,
    userGstin,
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------------------------
     Handlers
  ---------------------------------- */
  const updateHeader = (k, v) =>
    setHeaders((h) => ({ ...h, [k]: v }));

  const updateQuery = (k, v) =>
    setQuery((q) => ({ ...q, [k]: v }));

  /* ---------------------------------
     Fetch Bulk Status
  ---------------------------------- */
  const fetchStatus = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await axios.get(BULK_STATUS_API, {
        params: query,
        headers: {
          Accept: "application/json",
          product: headers.product,
          "X-Auth-Token": headers.token,
          companyId: headers.companyId,
        },
      });

      setResponse(res.data);

      /* Persist latest bulk status */
      localStorage.setItem(
        BULK_STATUS_KEY,
        JSON.stringify(res.data)
      );
    } catch (err) {
      setResponse(
        err?.response?.data || {
          status: "ERROR",
          message: err.message,
        }
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------------------------
     Download File
  ---------------------------------- */
  const handleDownload = async () => {
    const id = response?.response?.id;
    if (!id) return alert("No valid Bulk ID found");

    try {
      const res = await axios.get(BULK_DOWNLOAD_API, {
        params: { id },
        headers: {
          Accept: "application/json",
          "X-Auth-Token": headers.token,
          companyId: headers.companyId,
          product: headers.product,
        },
        responseType: "blob",
      });

      const disposition = res.headers["content-disposition"];
      const fileName =
        disposition?.split("filename=")[1]?.replace(/"/g, "") ||
        `EWB_BULK_${id}`;

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(
        err?.response?.data ||
          err.message ||
          "Download failed"
      );
    }
  };

  /* ---------------------------------
     UI
  ---------------------------------- */
  return (
    <div style={styles.container}>
      <h2>Bulk EWB Status Lookup</h2>

      {/* Headers */}
      <div style={styles.card}>
        <h4>🧾 Headers</h4>

        <label>Header Company ID</label>
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
          readOnly
        />

        <label>Product</label>
        <input
          style={styles.input}
          value={headers.product}
          readOnly
        />
      </div>

      {/* Query */}
      <div style={styles.card}>
        <h4>📦 Query Params</h4>

        <label>User GSTIN</label>
        <input
          style={styles.input}
          value={query.userGstin}
          onChange={(e) =>
            updateQuery("userGstin", e.target.value)
          }
        />

        <label>Query Company ID</label>
        <input
          style={styles.input}
          value={query.companyId}
          onChange={(e) =>
            updateQuery("companyId", e.target.value)
          }
        />
      </div>

      <button
        onClick={fetchStatus}
        disabled={loading}
        style={styles.button}
      >
        {loading ? "Fetching..." : "Fetch Bulk Status"}
      </button>

      {/* Response */}
      {response && (
        <div style={{ marginTop: 20 }}>
          <h4>📥 Response</h4>
          <pre style={styles.pre}>
            {JSON.stringify(response, null, 2)}
          </pre>

          {response?.response?.id && (
            <button
              onClick={handleDownload}
              style={{
                ...styles.button,
                marginTop: 10,
                background: "#28a745",
              }}
            >
              ⬇️ Download EWB File
            </button>
          )}
        </div>
      )}

      <h4>📌 Final Payload</h4>
      <pre style={styles.pre}>
        {JSON.stringify(
          { headers, queryParams: query },
          null,
          2
        )}
      </pre>
    </div>
  );
};

export default GetEwbDocNumStatus;

/* ---------------------------------
   Styles
---------------------------------- */
const styles = {
  container: {
    maxWidth: 900,
    margin: "20px auto",
    fontFamily: "Arial",
    padding: 20,
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
  },
  pre: {
    background: "#f4f4f4",
    padding: 12,
    borderRadius: 6,
    maxHeight: 400,
    overflow: "auto",
  },
};
