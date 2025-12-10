// InvoiceDetailsForm.js
import React, { useState, useEffect } from "react";

const STORAGE_KEY = 'iris_einvoice_shared_config';
const LAST_IRN_KEY = 'iris_last_used_irn';
const LAST_EWB_KEY = 'iris_last_ewb_details';
const InvoiceDetails = () => {
  const [einvId, setEinvId] = useState("");
  const [config, setConfig] = useState({
    proxyBase: "http://localhost:3001",
    headers: {
      Accept: "application/json",
      companyId: "",
      "X-Auth-Token": "",
      product: "ONYX",
    },
  });

  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  // ============================
  // 🔥 AUTO POPULATE LOGIC
  // ============================
  useEffect(() => {
    // -------- Load companyId + token ----------
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig((prev) => ({
          ...prev,
          headers: {
            ...prev.headers,
            companyId: parsed.companyId || "",
            "X-Auth-Token": parsed.token || "",
          },
        }));
      }
    } catch (err) {
      console.warn("Invalid STORAGE_KEY data");
    }

    // -------- Load LAST_EWB_KEY : extract response.id --------
    try {
      const raw = localStorage.getItem(LAST_IRN_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);

        console.log("Loaded LAST_IRN_KEY:", parsed); // DEBUG

        const id =
          parsed?.response?.id || // MAIN VALUE YOU WANT
          parsed?.response?.InvId || // fallback if some other API
          "";

        if (id) {
          setEinvId(String(id));
        }
      }
    } catch (err) {
      console.warn("Invalid LAST_EWB_KEY JSON");
    }
  }, []);

  // ============================
  // API: Fetch Invoice Details
  // ============================
  const fetchDetails = async () => {
    if (!einvId) return alert("Enter einvId");

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        `${config.proxyBase}/proxy/einvoice/details?einvId=${einvId}`,
        { headers: config.headers }
      );

      const data = await res.json();
      setResponse({ body: data });
    } catch (err) {
      setResponse({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // API: PRINT PDF
  // ============================
  const printEInvoice = async () => {
    if (!einvId) return alert("Enter einvId");

    try {
      const res = await fetch(
        `${config.proxyBase}/proxy/einvoice/print?template=STANDARD&id=${einvId}`,
        {
          headers: { ...config.headers, Accept: "*/*" },
        }
      );

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `einvoice_${einvId}.pdf`;
      a.click();

      setResponse({ message: "PDF downloaded!" });
    } catch (err) {
      setResponse({ error: "Print failed" });
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        background: "#e8f5e8",
        fontFamily: "Segoe UI",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ margin: "20px 0" }}>
          <strong>einvId:</strong>
          <input
            type="text"
            value={einvId}
            onChange={(e) => setEinvId(e.target.value)}
            placeholder="Auto-filled from last EWB details"
            style={{
              width: "100%",
              padding: "12px",
              marginTop: "8px",
              fontSize: "16px",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <button
            onClick={fetchDetails}
            disabled={loading || !einvId}
            style={{
              padding: "16px 40px",
              background: "#43a047",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            {loading ? "Loading..." : "FETCH DETAILS"}
          </button>

          <button
            onClick={printEInvoice}
            disabled={!einvId}
            style={{
              padding: "16px 40px",
              background: "#1b5e20",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: "bold",
            }}
          >
            PRINT PDF
          </button>
        </div>
      </div>

      {response && (
        <pre
          style={{
            marginTop: "30px",
            background: "#333",
            color: "#0f0",
            padding: "25px",
            borderRadius: "12px",
          }}
        >
          {JSON.stringify(response.body || response, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default InvoiceDetails;
