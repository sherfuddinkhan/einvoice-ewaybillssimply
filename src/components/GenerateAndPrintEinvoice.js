// GenerateAndPrintEinvoice.js
import React, { useState, useEffect } from "react";
import axios from "axios";

/* ------------------------------------------
   SAFE LOCALSTORAGE PARSER
------------------------------------------ */
const safeParse = (value, fallback) => {
  try {
    return JSON.parse(value) || fallback;
  } catch {
    return fallback;
  }
};

/* ------------------------------------------
   STORAGE KEYS
------------------------------------------ */
const STORAGE_KEY = "iris_ewaybill_shared_config";

const GenerateAndPrintEinvoice = () => {
  /* ------------------------------------------
     LOGIN DETAILS LOADED AT COMPONENT LOAD
     (Hooks MUST be here)
  ------------------------------------------ */
  const login = safeParse(localStorage.getItem(STORAGE_KEY), {});

  // Extract auth values safely
  const token =
    login?.token || login?.fullResponse?.response?.token || "";

  const companyId =
    login?.companyId ||
    login?.fullResponse?.response?.companyId ||
    "";

  const gstin =
    login?.gstin || login?.fullResponse?.response?.gstin || "";

  const username =
    login?.username || login?.fullResponse?.response?.username || "";

  /* ------------------------------------------
     STATES
  ------------------------------------------ */
  const [irnId, setIrnId] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState("");
  const [pdfMessage, setPdfMessage] = useState("");

  /* ------------------------------------------
     DEBUG: Confirm header values
  ------------------------------------------ */
  useEffect(() => {
    console.log("PRINT HEADERS:", {
      token,
      companyId,
      gstin,
      username,
      product: "ONYX",
    });
  }, []);

  /* ------------------------------------------
     HANDLE PRINT — PRINT ONLY VERSION
  ------------------------------------------ */
  const handlePrintInvoice = async () => {
    if (!irnId || irnId.trim() === "") {
      setPdfError("Please enter a valid IRN ID.");
      return;
    }

    setPdfLoading(true);
    setPdfError("");
    setPdfMessage("");

    try {
      const response = await axios.get(
        `/proxy/einvoice/print?id=${irnId}&template=STANDARD`,
        {
          headers: {
            "X-Auth-Token": token,
            companyId,
            gstin,
            username,
            product: "ONYX",
            Accept: "*/*",
          },
          responseType: "blob",
        }
      );

      // Open PDF in new tab
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      setPdfMessage("PDF printed successfully.");
    } catch (err) {
      console.error("PRINT ERROR:", err.response?.data || err.message);
      setPdfError("Failed to print E-Invoice PDF.");
    }

    setPdfLoading(false);
  };

  /* ------------------------------------------
     UI RENDER
  ------------------------------------------ */
  return (
    <div style={{ padding: "20px" }}>
      <h2>Print E-Invoice (IRN)</h2>

      {/* IRN Input */}
      <label>Enter IRN / Ack No:</label>
      <input
        type="text"
        value={irnId}
        onChange={(e) => setIrnId(e.target.value)}
        placeholder="Example: 0123456789ABCDE"
        style={{
          width: "330px",
          display: "block",
          marginTop: "8px",
          marginBottom: "15px",
          padding: "8px",
        }}
      />

      {/* Print Button */}
      <button
        onClick={handlePrintInvoice}
        disabled={pdfLoading}
        style={{
          padding: "8px 15px",
          background: pdfLoading ? "#999" : "#007bff",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {pdfLoading ? "Generating PDF..." : "Print E-Invoice"}
      </button>

      {/* Status Messages */}
      {pdfError && (
        <p style={{ color: "red", marginTop: "10px" }}>{pdfError}</p>
      )}
      {pdfMessage && (
        <p style={{ color: "green", marginTop: "10px" }}>{pdfMessage}</p>
      )}
    </div>
  );
};

export default GenerateAndPrintEinvoice;
