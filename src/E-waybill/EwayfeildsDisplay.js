// Einv&EwayfeildsDisplay.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const EwayfeildsDisplay = () => {

  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);

  // =========================
  // FETCH DATA
  // =========================

  const getInvoiceData = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        "http://localhost:3001/api/invoices"
      );

      if (Array.isArray(response.data)) {
        setInvoiceData(response.data);
      } else {
        setInvoiceData([]);
      }

    } catch (error) {
      console.log("Fetch Error:", error);
      alert("Failed to fetch invoice data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInvoiceData();
  }, []);

  // =========================
  // NAVIGATION ACTIONS
  // =========================

 const handleGenerateEinvoice = (row) => {
    navigate("/ewaybill/ewb-generate-print", { state: { 
      invoiceData: row, 
      id: row.pid || row.id 
    } });
  };

  return (
    <div style={styles.container}>

      {/* HEADER */}
      <h2 style={styles.heading}>Invoice List</h2>

      {/* LOADING */}
      {loading && <div style={styles.loading}>Loading...</div>}

      {/* TABLE */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>

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

          <tbody>

            {invoiceData.length > 0 ? (
              invoiceData.map((row, index) => (
                <tr key={index}>

                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{row.clientCompanyName || "-"}</td>
                  <td style={styles.td}>{row.mobileNo || "-"}</td>
                  <td style={styles.td}>{row.purchaseOrder || "-"}</td>

                  <td style={styles.td}>
                    {row.purchaseOrderDate
                      ? new Date(row.purchaseOrderDate).toLocaleDateString()
                      : "-"}
                  </td>

                  <td style={styles.td}>
                    {row.invoiceCreatedOn
                      ? new Date(row.invoiceCreatedOn).toLocaleString()
                      : "-"}
                  </td>

                  <td style={styles.td}>
                    {row.createdOn
                      ? new Date(row.createdOn).toLocaleString()
                      : "-"}
                  </td>

                  <td style={styles.td}>{row.gstin || "-"}</td>
                  <td style={styles.td}>{row.vehicleNo || "-"}</td>
                  <td style={styles.td}>{row.eWayBillNumber || "-"}</td>
                  <td style={styles.td}>{row.transactionStatusXid || "-"}</td>

                  {/* ACTION BUTTONS */}
                  <td style={styles.actionTd}>

                    <div style={styles.buttonContainer}>
                      <button
                        style={styles.einvoiceBtn}
                        onClick={() => handleGenerateEinvoice(row)}
                      >
                        Generate E-way bill
                      </button>

                    </div>

                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" style={styles.noData}>
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

  ewayBtn: {
    backgroundColor: "green",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "5px",
    cursor: "pointer",
    width: "150px"
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
  },

  productSection: {
    marginTop: "30px"
  },

  productHeading: {
    marginBottom: "10px",
    color: "#333"
  }
};

export default EwayfeildsDisplay;