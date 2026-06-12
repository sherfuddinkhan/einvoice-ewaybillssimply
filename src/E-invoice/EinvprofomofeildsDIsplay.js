// EinvfeildsDisplay.js

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const EinvprofomofeildsDIsplay = () => {

  // ======================================================
  // NAVIGATION
  // ======================================================

  const navigate = useNavigate();

  // ======================================================
  // STATES
  // ======================================================

  const [loading, setLoading] = useState(false);

  const [invoiceData, setInvoiceData] = useState([]);

  const [error, setError] = useState("");

  // ======================================================
  // PREVENT DOUBLE API CALL
  // ======================================================

  const hasFetched = useRef(false);

  // ======================================================
  // FETCH INVOICE DATA
  // ======================================================

  const getInvoiceData = async () => {

    try {

      setLoading(true);

      setError("");

      console.log("Fetching Invoice Data...");

      // ======================================================
      // API CALL
      // ======================================================

   const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdGVlcUBjYWxpYnJlY3VlLmNvbSIsImp0aSI6Ijk1ZDRhMWFkLThiMmQtNGE5NC05MmRhLWNhZjQzMzgwOTUwNyIsInVzZXJuYW1lIjoiYXRlZXFAY2FsaWJyZWN1ZS5jb20iLCJkaXNwbGF5bmFtZSI6ImF0ZWVxIiwidXNlclhpZCI6IjIwIiwiY29tcGFueVhpZCI6IjEyIiwiY29tcGFueUJyYW5jaFhpZCI6IjEwIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiQWRtaW4iLCJleHAiOjE3ODExOTAxNzIsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0OjQ0MzEzIiwiYXVkIjoiaHR0cHM6Ly9sb2NhbGhvc3Q6NDQzMTMifQ.NptpzCGH9DO-7Gi-dn_68dE1s4Lfr76k-Cg_OzkwBqk";



const response = await axios.get(
  "https://einvoice.fcssoftwares.com/api/OrderList/GetInvoiceDetails/23/invoicecumchallan",
  {
    headers: {
      "X-Auth-Token": token,
    },
  }
);
    
      console.log("Full API Response:", response.data);

      // ======================================================
      // EXTRACT INVOICE DATA
      // ======================================================

      const invoices = response?.data?.data;

      console.log("Invoices:", invoices);

      // ======================================================
      // HANDLE DIFFERENT RESPONSE TYPES
      // ======================================================

      if (Array.isArray(invoices)) {

        setInvoiceData(invoices);

      } else if (invoices && typeof invoices === "object") {

        // If single object response
        setInvoiceData([invoices]);

      } else {

        setInvoiceData([]);

      }

    } catch (error) {

      console.log("=========== FETCH ERROR ===========");

      console.log("Message:", error.message);

      console.log("Status:", error.response?.status);

      console.log("Response:", error.response?.data);

      setError("Failed to fetch invoice data");

      setInvoiceData([]);

    } finally {

      setLoading(false);

    }

  };

  // ======================================================
  // USE EFFECT
  // ======================================================

  useEffect(() => {

    if (hasFetched.current) return;

    hasFetched.current = true;

    getInvoiceData();

  }, []);

  // ======================================================
  // GENERATE E-INVOICE
  // ======================================================

const handleGenerateEinvoice = (row) => {

  console.log(
    "=========== SELECTED INVOICE ==========="
  );

  console.log(row);

  // ==========================================
  // GET ACTUAL INVOICE ID
  // ==========================================

  const actualInvoiceId =
    row.invoiceProductDetails?.[0]?.invoiceXID;

  console.log(
    "Actual Invoice ID:",
    actualInvoiceId
  );

  // ==========================================
  // NAVIGATE
  // ==========================================

    navigate("/einvoice/generate-printproformo", {
    state: {
      invoiceData: row,
      id: actualInvoiceId
    }
  });

};
  

  // ======================================================
  // FORMAT DATE
  // ======================================================

  const formatDate = (date) => {

    if (!date) return "-";

    try {

      return new Date(date).toLocaleDateString();

    } catch {

      return "-";

    }

  };

  // ======================================================
  // FORMAT DATE & TIME
  // ======================================================

  const formatDateTime = (date) => {

    if (!date) return "-";

    try {

      return new Date(date).toLocaleString();

    } catch {

      return "-";

    }

  };

  // ======================================================
  // UI
  // ======================================================

  return (

    <div style={styles.container}>

      {/* ====================================================== */}
      {/* PAGE HEADING */}
      {/* ====================================================== */}

      <h2 style={styles.heading}>
        Invoice List
      </h2>

      {/* ====================================================== */}
      {/* LOADING */}
      {/* ====================================================== */}

      {loading && (
        <div style={styles.loading}>
          Loading Invoice Data...
        </div>
      )}

      {/* ====================================================== */}
      {/* ERROR */}
      {/* ====================================================== */}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* ====================================================== */}
      {/* TABLE */}
      {/* ====================================================== */}

      <div style={styles.tableWrapper}>

        <table style={styles.table}>

          {/* ====================================================== */}
          {/* TABLE HEADER */}
          {/* ====================================================== */}

          <thead>

            <tr>

              <th style={styles.th}>#</th>

              <th style={styles.th}>Customer Name</th>

              <th style={styles.th}>Mobile</th>

              <th style={styles.th}>PO Number</th>

              <th style={styles.th}>PO Date</th>

              <th style={styles.th}>Invoice Created</th>

              <th style={styles.th}>Created On</th>

              <th style={styles.th}>GSTIN</th>

              <th style={styles.th}>Vehicle No</th>

              <th style={styles.th}>E-Way Bill No</th>

              <th style={styles.th}>Status</th>

              <th style={styles.th}>Action</th>

            </tr>

          </thead>

          {/* ====================================================== */}
          {/* TABLE BODY */}
          {/* ====================================================== */}

          <tbody>

            {invoiceData.length > 0 ? (

              invoiceData.map((row, index) => (

                <tr key={row.id || index}>

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
                    {formatDate(row.purchaseOrderDate)}
                  </td>

                  <td style={styles.td}>
                    {formatDateTime(row.invoiceCreatedOn)}
                  </td>

                  <td style={styles.td}>
                    {formatDateTime(row.createdOn)}
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

                  {/* ====================================================== */}
                  {/* ACTION BUTTON */}
                  {/* ====================================================== */}

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

              !loading && (

                <tr>

                  <td
                    colSpan="12"
                    style={styles.noData}
                  >
                    No Invoice Data Found
                  </td>

                </tr>

              )

            )}

          </tbody>

        </table>

      </div>

    </div>

  );

};

// ======================================================
// STYLES
// ======================================================

const styles = {

  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    backgroundColor: "#f4f6f9",
    minHeight: "100vh"
  },

  heading: {
    marginBottom: "20px",
    color: "#1976d2",
    fontSize: "28px",
    fontWeight: "bold"
  },

  loading: {
    marginBottom: "15px",
    padding: "10px",
    backgroundColor: "#fff3cd",
    color: "#856404",
    borderRadius: "5px",
    fontWeight: "bold"
  },

  error: {
    marginBottom: "15px",
    padding: "10px",
    backgroundColor: "#f8d7da",
    color: "#721c24",
    borderRadius: "5px",
    fontWeight: "bold"
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    backgroundColor: "#ffffff",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1500px"
  },

  th: {
    backgroundColor: "#1976d2",
    color: "#ffffff",
    padding: "12px",
    textAlign: "center",
    fontWeight: "bold",
    borderBottom: "2px solid #1565c0"
  },

  td: {
    padding: "10px",
    borderBottom: "1px solid #dddddd",
    textAlign: "center",
    fontSize: "14px"
  },

  actionTd: {
    padding: "10px",
    borderBottom: "1px solid #dddddd",
    textAlign: "center"
  },

  buttonContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },

  einvoiceBtn: {
    backgroundColor: "#1976d2",
    color: "#ffffff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold"
  },

  noData: {
    padding: "20px",
    textAlign: "center",
    fontWeight: "bold",
    color: "#666"
  }

};

export default EinvprofomofeildsDIsplay;