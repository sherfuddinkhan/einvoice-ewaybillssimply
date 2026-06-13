
import React, { useEffect, useState } from "react";
import { useAuth } from "../../components/AuthContext";

const InvoiceDetails = () => {
  const { token, companyId } = useAuth();

  const [einvId, setEinvId] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  // Auto-fill last generated E-Invoice ID
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("iris_einvoice_irn_ewabill") || "{}"
      );

      const id = saved?.response?.id;

      if (id) {
        setEinvId(String(id));
      }
    } catch (err) {
      console.error("Failed to load saved E-Invoice ID:", err);
    }
  }, []);

  const headers = {
    accept: "application/json",
    companyId,
    "X-Auth-Token": token,
    product: "ONYX",
  };

  const isReady =
    !!companyId &&
    !!token &&
    !!headers.product &&
    !!einvId.trim();

  const fetchInvoiceDetails = async () => {
    if (!isReady) {
      alert("Missing required headers or einvId");
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        `https://einvoice.fcssoftwares.com/api/gst/einvoice/details?einvId=${einvId.trim()}`,
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
      setResponse({
        error: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: "30px",
        background: "#e8f5e9",
        minHeight: "100vh",
        fontFamily: "Segoe UI, Arial",
      }}
    >
      <h1 style={{ color: "#1b5e20", textAlign: "center" }}>
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
        {/* Headers */}
        <h2 style={{ borderBottom: "3px solid #66bb6a" }}>
          Request Headers
        </h2>

        <div style={{ marginBottom: "14px" }}>
          <strong>accept</strong>
          <input
            value="application/json"
            readOnly
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

        <div style={{ marginBottom: "14px" }}>
          <strong>companyId</strong>
          <input
            value={companyId || ""}
            readOnly
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

        <div style={{ marginBottom: "14px" }}>
          <strong>X-Auth-Token</strong>
          <input
            value={token || ""}
            readOnly
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

        <div style={{ marginBottom: "14px" }}>
          <strong>product</strong>
          <input
            value="ONYX"
            readOnly
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

        {/* E-Invoice ID */}
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
            boxSizing: "border-box",
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
            border: "none",
            borderRadius: "12px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Fetching..." : "FETCH E-INVOICE DETAILS"}
        </button>
      </div>

      {response && (
        <div
          style={{
            marginTop: "40px",
            maxWidth: "900px",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <h2>Response ({response.time})</h2>

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
