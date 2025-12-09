import React, { useState, useEffect } from "react";
import axios from "axios";

const DEFAULT_PROXY_STATUS = "http://localhost:3001/proxy/topaz/ewb/bulkStatus";
const DEFAULT_PROXY_DOWNLOAD = "http://localhost:3001/proxy/topaz/ewb/bulkDownload";

const LS_KEYS = {
  HEADER_COMPANY: "ewb_headerCompanyId",
  QUERY_COMPANY: "ewb_queryCompanyId",
  GSTIN: "ewb_userGstin",
  TOKEN: "iris_login_token",
};

const LOGIN_KEY = "iris_login_data";
const LATEST_EWB_KEY = "latestEwbData";
const STORAGE_KEY = "BULK_DOCNUM_PAYLOAD";

// Helper to read JSON safely
const getJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
};


const BulkStatus = () => {
   const login = getJson(LOGIN_KEY) || {};
  const latest = getJson(LATEST_EWB_KEY) || {};
  const saved = getJson(STORAGE_KEY) || {};
console.log("latest",latest);

  const [headers, setHeaders] = useState({
    companyId: "",
    authToken: "",
    product: "TOPAZ",
  });

  const [query, setQuery] = useState({
    companyId: "",
    userGstin: "",
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // ----------------------------
  // Auto-populate headers and query
  // ----------------------------
  useEffect(() => {
    const LOGIN_KEY = "iris_login_data";
    const LATEST_EWB_KEY = "latestEwbData";
    const STORAGE_KEY = "BULK_DOCNUM_PAYLOAD";

    const loginData = JSON.parse(localStorage.getItem("iris_login_data") || "{}");

    const headerCompanyId = localStorage.getItem(LS_KEYS.HEADER_COMPANY) || loginData.companyId || "4";
    const queryCompanyId = latest?.response?.companyId ||loginData?.companyId || "";
    const userGstin = localStorage.getItem(LS_KEYS.GSTIN) || loginData.gstin || "05AAAAU1183B5ZW";
    const token = loginData.authToken || loginData.token || localStorage.getItem(LS_KEYS.TOKEN) || "";

    setHeaders({
      companyId: headerCompanyId,
      authToken: token,
      product: "TOPAZ",
    });

    setQuery({
      companyId: queryCompanyId,
      userGstin,
    });
  }, []);

  // ----------------------------
  // Input handlers
  // ----------------------------
  const handleHeaderChange = (key, value) => {
    setHeaders((prev) => ({ ...prev, [key]: value }));
  };

  const handleQueryChange = (key, value) => {
    setQuery((prev) => ({ ...prev, [key]: value }));
  };

  // ----------------------------
  // Fetch Bulk Status
  // ----------------------------
  const fetchStatus = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await axios.get(DEFAULT_PROXY_STATUS, {
        params: {
          companyId: query.companyId, // Query Param companyId
          userGstin: query.userGstin,
        },
        headers: {
          Accept: "application/json",
          product: headers.product,
          "X-Auth-Token": headers.authToken,
          companyId: headers.companyId, // Header companyId
        },
      });

      setResponse(res.data);
      localStorage.setItem("bulkStatusLatest", JSON.stringify(res.data));
    } catch (err) {
      setResponse(err.response?.data || { status: "ERROR", message: err.message });
    }

    setLoading(false);
  };

  // ----------------------------
  // Download EWB by ID
  // ----------------------------
  const handleDownload = async () => {
    if (!response?.response?.id) return alert("No valid EWB ID to download");

    try {
      const res = await axios.get(DEFAULT_PROXY_DOWNLOAD, {
        params: { id: response.response.id },
        headers: {
          Accept: "application/json",
          "X-Auth-Token": headers.authToken,
          companyId: headers.companyId,
          product: headers.product,
        },
        responseType: "blob",
      });

      const contentDisposition = res.headers["content-disposition"];
      const fileName =
        contentDisposition?.split("filename=")[1]?.replace(/"/g, "") ||
        `EWB_${response.response.id}`;

      const url = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err?.response?.data || err.message || "Error downloading file");
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", fontFamily: "Arial", padding: 20 }}>
      <h2>Bulk EWB Status Lookup</h2>

      {/* Headers */}
      <div style={styles.card}>
        <h4>Headers</h4>
        <label>Header Company ID</label>
        <input style={styles.input} value={headers.companyId} onChange={(e) => handleHeaderChange("companyId", e.target.value)} />
        <label>X-Auth-Token</label>
        <input style={styles.input} value={headers.authToken} readOnly />
        <label>Product</label>
        <input style={styles.input} value={headers.product} readOnly />
      </div>

      {/* Query */}
      <div style={styles.card}>
        <h4>Query Params</h4>
        <label>User GSTIN</label>
        <input style={styles.input} value={query.userGstin} onChange={(e) => handleQueryChange("userGstin", e.target.value)} />
        <label>Query Company ID</label>
        <input style={styles.input} value={query.companyId} onChange={(e) => handleQueryChange("companyId", e.target.value)} />
      </div>

      <button onClick={fetchStatus} disabled={loading} style={styles.button}>
        {loading ? "Fetching..." : "Fetch Bulk Status"}
      </button>

      {/* Response */}
      {response && (
        <div style={{ marginTop: 20 }}>
          <h4>Response Body</h4>
          <pre style={styles.pre}>{JSON.stringify(response, null, 2)}</pre>

          {response?.response?.id && (
            <button onClick={handleDownload} style={{ ...styles.button, marginTop: 10, background: "#28a745" }}>
              Download EWB File
            </button>
          )}
        </div>
      )}

      <h4>Final Payload Sent</h4>
      <pre style={styles.pre}>{JSON.stringify({ headers, queryParams: query }, null, 2)}</pre>
    </div>
  );
};

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
  },
  pre: {
    background: "#f4f4f4",
    padding: 12,
    borderRadius: 6,
    maxHeight: 400,
    overflow: "auto",
  },
};

export default BulkStatus;
