// PrintEinvoice.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const LAST_GENERATED_ID_KEY = "iris_last_generated_id";

const PrintEinvoice = () => {
  const [template, setTemplate] = useState("STANDARD");
  const [id, setId] = useState("");
  const [message, setMessage] = useState("");
  const [pdfMessage, setPdfMessage] = useState("");
   const { authToken, setLastInvoice } = useAuth();
  // Load last generated ID automatically from localStorage
  useEffect(() => {
    const lastId = localStorage.getItem(LAST_GENERATED_ID_KEY);
    if (lastId) setId(lastId);
  }, []);

 const downloadPDF = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/proxy/einvoice/print?template=${template}&id=${id}`, {
        headers: { "X-Auth-Token": authToken, companyId: "24", product: "ONYX" },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `EInvoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      setPdfMessage("PDF downloaded successfully.");
    } catch (error) {
      setPdfMessage("Failed to download PDF.");
      console.error(error);
    }
  };


  return (
    <div
      style={{
        padding: 40,
        fontFamily: "Roboto, Arial, sans-serif",
        background: "#F5F5F7",
        minHeight: "100vh",
      }}
    >
      <h2 style={{ color: "#1A73E8", marginBottom: 30 }}>
        📄 Print E-Invoice (PDF)
      </h2>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
        >
          Template:
        </label>
        <input
          style={{ width: 250, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          placeholder="STANDARD"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
        >
          Invoice ID:
        </label>
        <input
          style={{ width: 250, padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
          placeholder="Last Generated ID"
          value={id}
          onChange={(e) => setId(e.target.value)}
        />
      </div>

      <button
        onClick={downloadPDF}
        style={{
          padding: "12px 24px",
          background: "#34A853",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Download PDF
      </button>

      {message && (
        <p
          style={{
            marginTop: 20,
            color: message.includes("successfully") ? "#34A853" : "#EA4335",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
};

export default PrintEinvoice;

