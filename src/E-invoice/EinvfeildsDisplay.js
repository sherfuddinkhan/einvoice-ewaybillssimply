// Einv&EwayfeildsDisplay.js

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EinvfeildsDisplay = () => {

  // =========================
  // NAVIGATION
  // =========================

  const navigate = useNavigate();

  // =========================
  // STATES
  // =========================

  const [loading, setLoading] = useState(false);

  const [invoiceData, setInvoiceData] = useState([]);

  // =========================
  // PREVENT DOUBLE API CALL
  // =========================

  const hasFetched = useRef(false);

  // =========================
  // FETCH INVOICE DATA
  // =========================

  const getInvoiceData = async () => {

    try {

      // SHOW LOADING
      setLoading(true);

      console.log("Fetching Invoice Data...");

      // API CALL
      const response = await axios.get(
        "http://localhost:3001/api/invoices"
      );

      console.log("API Response:", response.data);

      // CHECK ARRAY RESPONSE
      if (Array.isArray(response.data)) {

        setInvoiceData(response.data);

      } else {

        setInvoiceData([]);

      }

    } catch (error) {

      console.log("Fetch Error:", error);

      alert("Failed to fetch invoice data");

    } finally {

      // STOP LOADING
      setLoading(false);

    }

  };

  // =========================
  // USE EFFECT
  // =========================

  useEffect(() => {

    // PREVENT DOUBLE EXECUTION
    if (hasFetched.current) return;

    hasFetched.current = true;

    getInvoiceData();

  }, []);

  // =========================
  // GENERATE E-INVOICE
  // =========================

  const handleGenerateEinvoice = (row) => {

    console.log("Selected Row:", row);

    navigate("/einvoice/generate-print", {
      state: {
        invoiceData: row,
       id: row.pid || row.id 
      }
    });

  };

  // =========================
  // UI
  // =========================

  return (

    <div style={styles.container}>

      {/* HEADING */}

      <h2 style={styles.heading}>
        Invoice List
      </h2>

      {/* LOADING */}

      {loading && (
        <div style={styles.loading}>
          Loading...
        </div>
      )}

      {/* TABLE */}

      <div style={styles.tableWrapper}>

        <table style={styles.table}>

          {/* TABLE HEADER */}

          <thead>

            <tr>

              <th style={styles.th}>#</th>

              <th style={styles.th}>Customer Name</th>

              <th style={styles.th}>Mobile</th>

              <th style={styles.th}>PO</th>

              <th style={styles.th}>PO Date</th>

              <th style={styles.th}>Invoice Created</th>

              <th style={styles.th}>Created On</th>

              <th style={styles.th}>GSTIN</th>

              <th style={styles.th}>Vehicle</th>

              <th style={styles.th}>E-Way No</th>

              <th style={styles.th}>Status</th>

              <th style={styles.th}>Action</th>

            </tr>

          </thead>

          {/* TABLE BODY */}

          <tbody>

            {invoiceData.length > 0 ? (

              invoiceData.map((row, index) => (

                <tr key={index}>

                  <td style={styles.td}>
                    {index + 1}
                  </td>

                  <td style={styles.td}>
                    {row.clientCompanyName || "-"}
                  </td>

                  <td style={styles.td}>
                    {row.mobileNo || "-"}
                  </td>

                  <td style={styles.td}>
                    {row.purchaseOrder || "-"}
                  </td>

                  <td style={styles.td}>

                    {row.purchaseOrderDate
                      ? new Date(
                          row.purchaseOrderDate
                        ).toLocaleDateString()
                      : "-"}

                  </td>

                  <td style={styles.td}>

                    {row.invoiceCreatedOn
                      ? new Date(
                          row.invoiceCreatedOn
                        ).toLocaleString()
                      : "-"}

                  </td>

                  <td style={styles.td}>

                    {row.createdOn
                      ? new Date(
                          row.createdOn
                        ).toLocaleString()
                      : "-"}

                  </td>

                  <td style={styles.td}>
                    {row.gstin || "-"}
                  </td>

                  <td style={styles.td}>
                    {row.vehicleNo || "-"}
                  </td>

                  <td style={styles.td}>
                    {row.eWayBillNumber || "-"}
                  </td>

                  <td style={styles.td}>
                    {row.transactionStatusXid || "-"}
                  </td>

                  {/* ACTION BUTTON */}

                  <td style={styles.actionTd}>

                    <div style={styles.buttonContainer}>

                      <button
                        style={styles.einvoiceBtn}
                        onClick={() =>
                          handleGenerateEinvoice(row)
                        }
                      >
                        Generate E-Invoice
                      </button>

                    </div>

                  </td>

                </tr>

              ))

            ) : (

              <tr>

                <td
                  colSpan="12"
                  style={styles.noData}
                >
                  No Invoice Data Found
                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

// =========================
// STYLES
// =========================

const styles = {

  container: {
    padding: "20px",
    fontFamily: "Arial",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh"
  },

  heading: {
    marginBottom: "15px",
    color: "#1976d2"
  },

  loading: {
    marginBottom: "15px",
    fontWeight: "bold"
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    backgroundColor: "#fff",
    borderRadius: "10px",
    marginBottom: "20px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1500px"
  },

  th: {
    backgroundColor: "#1976d2",
    color: "white",
    padding: "12px",
    textAlign: "center"
  },

  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "center"
  },

  actionTd: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    verticalAlign: "bottom"
  },

  buttonContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: "8px"
  },

  einvoiceBtn: {
    backgroundColor: "#1976d2",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    width: "150px"
  },

  noData: {
    textAlign: "center",
    padding: "15px",
    fontWeight: "bold"
  }

};

export default EinvfeildsDisplay;