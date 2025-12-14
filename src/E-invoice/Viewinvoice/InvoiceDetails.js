// InvoiceDetails.jsx
import React, { useEffect, useState } from "react";

/* ----------------------------
   LocalStorage Keys
---------------------------- */
const STORAGE_KEY = "iris_einvoice_response";  
const STORAGE_KEY1 = "iris_einvoice_shared_config";
const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";

    /* -------------------- LOCAL STORAGE DATA FETCH -------------------- */
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
  const savedResponse = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const savedConfig2 = JSON.parse(localStorage.getItem(STORAGE_KEY2) || "{}");
    console.log("savedConfig",savedConfig)
    console.log("savedResponse",savedResponse)
    console.log("savedConfig2",savedConfig2)

/* ----------------------------
   Component
---------------------------- */
const InvoiceDetails = () => {
  /* ----------------------------
     State
  ---------------------------- */
  const [einvId, setEinvId] = useState("");

  const [headers, setHeaders] = useState({
    accept: "application/json",
    companyId: "",
    "X-Auth-Token": "",
    product: "ONYX",
  });

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  /* ------------------------------------------------
     useEffect – Auto populate headers & einvId
  ------------------------------------------------ */
  useEffect(() => {
    // ---- Load auth details ----
   
    /* -------------------- LOCAL STORAGE DATA FETCH -------------------- */
  const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY1) || "{}");
  const savedResponse = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const savedConfig2 = JSON.parse(localStorage.getItem(STORAGE_KEY2) || "{}");
    console.log("savedConfig",savedConfig)
    console.log("savedResponse",savedResponse)
    console.log("savedConfig2",savedConfig2)

    setHeaders((prev) => ({
      ...prev,
      companyId:
        savedConfig.companyId ||
        savedResponse .companyId ||
        "",
      "X-Auth-Token":
        savedConfig.token ||
        savedResponse.token ||
        "",
    }));

  const autoEinvId = savedConfig2?.response?.id|| savedConfig ?.lastGeneratedResponse?.id || "";
    if (autoEinvId) {
      setEinvId(String(autoEinvId));
    }
  }, []);

  /* ----------------------------
     Helpers
  ---------------------------- */
  const updateHeader = (key, value) => {
    setHeaders((prev) => ({ ...prev, [key]: value }));
  };

  const isReady =
    headers.companyId &&
    headers["X-Auth-Token"] &&
    headers.product &&
    einvId;

  /* ------------------------------------------------
     API – Fetch Invoice Details (ONYX)
     Backend calls:
     https://stage-api.irisgst.com/irisgst/onyx/einvoice/details
  ------------------------------------------------ */
  const fetchInvoiceDetails = async () => {
    if (!isReady) {
      alert("Missing required headers or einvId");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        `http://localhost:3001/proxy/onyx/einvoice/details?einvId=${einvId}`,
        {
          method: "GET",
          headers,
        }
      );

      const data = await res.json();

      setResponse({
        status: res.status,
        body: data,
        time: new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      });
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------
     UI
  ---------------------------- */
  return (
    <div
      style={{
        padding: "30px",
        background: "#e8f5e9",
        minHeight: "100vh",
        fontFamily: "Segoe UI, Arial",
      }}
    >
      <h1 style={{ color: "#1b5e20" }}>
        E-Invoice Details (ONYX)
      </h1>

      <div
        style={{
          background: "#fff",
          padding: "30px",
          borderRadius: "16px",
          maxWidth: "900px",
          margin: "0 auto",
          boxShadow: "0 10px 35px rgba(0,0,0,0.15)",
        }}
      >
        {/* ---------------- Headers ---------------- */}
        <h2 style={{ borderBottom: "3px solid #66bb6a" }}>
          Request Headers
        </h2>

        {Object.entries(headers).map(([key, value]) => (
          <div key={key} style={{ marginBottom: "14px" }}>
            <strong>{key}</strong>
            <input
              value={value}
              onChange={(e) => updateHeader(key, e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                borderRadius: "6px",
                border: "2px solid #66bb6a",
                fontFamily: "monospace",
              }}
            />
          </div>
        ))}

        {/* ---------------- einvId ---------------- */}
        <h2
          style={{
            marginTop: "30px",
            borderBottom: "3px solid #66bb6a",
          }}
        >
          Request Parameter
        </h2>

        <strong>einvId</strong>
        <input
          value={einvId}
          onChange={(e) => setEinvId(e.target.value)}
          placeholder="Enter or auto-filled einvId"
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "8px",
            borderRadius: "6px",
            border: "2px solid #66bb6a",
            fontFamily: "monospace",
          }}
        />

        <button
          onClick={fetchInvoiceDetails}
          disabled={!isReady || loading}
          style={{
            marginTop: "25px",
            width: "100%",
            padding: "18px",
            background: loading ? "#999" : "#2e7d32",
            color: "#fff",
            fontSize: "20px",
            fontWeight: "bold",
            borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Fetching..." : "FETCH E-INVOICE DETAILS"}
        </button>
      </div>

      {/* ---------------- Response ---------------- */}
      {response && (
        <div style={{ marginTop: "40px" }}>
          <h2>
            Response ({response.time})
          </h2>
          <pre
            style={{
              background: "#1e1e1e",
              color: "#00e676",
              padding: "25px",
              borderRadius: "12px",
              overflow: "auto",
            }}
          >
{JSON.stringify(response.body || response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;
