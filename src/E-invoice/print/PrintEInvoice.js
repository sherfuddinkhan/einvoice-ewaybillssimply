import React, { useState, useEffect } from 'react';
import { useAuth } from "../../components/AuthContext";

const STORAGE_KEY = 'iris_einvoice_shared_config'; // Shared across all components

const STORAGE_KEY2 = "iris_einvoice_irn_ewabill";

const PrintEInvoice = () => {
  const { token, companyId } = useAuth();

  const [einvId, setEinvId] = useState("");
  const [template, setTemplate] = useState("STANDARD");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-fill last generated E-Invoice ID
  useEffect(() => {
    const lastSavedId = localStorage.getItem("iris_last_generated_id");

    if (lastSavedId) {
      setEinvId(lastSavedId);
    }
  }, []);

  const printInvoice = async () => {
    const id = einvId.trim();

    if (!id) {
      setMessage("Please enter E-Invoice ID");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(
        `https://einvoice.fcssoftwares.com/api/gst/einvoice/print?template=${template}&id=${id}`,
        {
          headers: {
            Accept: "*/*",
            companyId,
            "X-Auth-Token": token,
            product: "ONYX",
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to generate PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `EInvoice_${id}_${template}_${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);

      setMessage("PDF downloaded successfully!");
    } catch (err) {
      setMessage(`Failed to download PDF: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isAuthReady = !!token && !!companyId;

  return (
    <div
      style={{
        padding: "30px",
        background: "#e8f5e8",
        fontFamily: "Segoe UI, Arial, sans-serif",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "35px",
          borderRadius: "20px",
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
          maxWidth: "700px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginTop: "30px" }}>
          <h3 style={{ color: "#1b5e20" }}>E-Invoice Details</h3>

          <div style={{ margin: "20px 0" }}>
            <strong>E-Invoice ID:</strong>
            <input
              type="text"
              value={einvId}
              onChange={(e) => setEinvId(e.target.value)}
              placeholder="Auto-filled from previous IRN generation"
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "8px",
                borderRadius: "10px",
                border: "2px solid #ddd",
                fontSize: "18px",
                fontFamily: "monospace",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ margin: "20px 0" }}>
            <strong>Template:</strong>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "8px",
                borderRadius: "10px",
                border: "2px solid #ddd",
                fontSize: "16px",
                boxSizing: "border-box",
              }}
            >
              <option value="STANDARD">Standard</option>
              <option value="DETAILED">Detailed</option>
              <option value="SIMPLE">Simple</option>
            </select>
          </div>

          <button
            onClick={printInvoice}
            disabled={loading || !isAuthReady || !einvId.trim()}
            style={{
              width: "100%",
              padding: "20px",
              background:
                loading || !isAuthReady || !einvId.trim()
                  ? "#999"
                  : "#2e7d32",
              color: "white",
              border: "none",
              borderRadius: "14px",
              fontSize: "24px",
              fontWeight: "bold",
              cursor:
                loading || !isAuthReady || !einvId.trim()
                  ? "not-allowed"
                  : "pointer",
              marginTop: "20px",
              boxShadow: "0 8px 25px rgba(46,125,50,0.4)",
            }}
          >
            {loading ? "Generating PDF..." : "DOWNLOAD E-INVOICE PDF"}
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              background: message.includes("successfully")
                ? "#e8f5e8"
                : "#ffebee",
              borderRadius: "12px",
              fontSize: "18px",
              textAlign: "center",
              color: message.includes("successfully")
                ? "#1b5e20"
                : "#c62828",
              fontWeight: "bold",
            }}
          >
            {message}
          </div>
        )}
      </div>

      <footer
        style={{
          marginTop: "60px",
          textAlign: "center",
          color: "#888",
          fontSize: "13px",
        }}
      >
        IRIS GST ONYX • Auto-authenticated •{" "}
        {new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })}{" "}
        IST
      </footer>
    </div>
  );
};

export default PrintEInvoice;
