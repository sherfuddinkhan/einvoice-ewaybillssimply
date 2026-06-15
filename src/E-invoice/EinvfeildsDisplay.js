// EinvfeildsDisplay.js

import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const EinvfeildsDisplay = () => {
  const navigate = useNavigate();
  const { token, companyId } = useAuth();

  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);
  const [error, setError] = useState("");

  const hasFetched = useRef(false);

  // =====================================================
  // FETCH INVOICE DATA
  // =====================================================

  const getInvoiceData = async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await axios.get(
        "https://einvoice.fcssoftwares.com/api/OrderList/GetInvoiceDetails/24/invoicecumchallan",
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            companyId,
            "X-Auth-Token": token,
            product: "ONYX",
          },
        }
      );

      console.log("Invoice API Response", data);

      if (Array.isArray(data)) {
        setInvoiceData(data);
      } else if (data) {
        setInvoiceData([data]);
      } else {
        setInvoiceData([]);
      }
    } catch (err) {
      console.log(err);

      setError("Failed to fetch invoice data");
      setInvoiceData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;

    if (!token || !companyId) return;

    hasFetched.current = true;

    getInvoiceData();
  }, [token, companyId]);

  // =====================================================
  // NAVIGATE TO GENERATE E-INVOICE
  // =====================================================

  const handleGenerateEinvoice = (invoice) => {
      console.log("FULL INVOICE OBJECT:", JSON.stringify(invoice, null, 2))
        localStorage.setItem("selectedInvoice", JSON.stringify(invoice));
    console.log("Selected Invoice", invoice);

    navigate("/einvoice/generate-print", {
      state: {
        invoiceData: invoice,
        id: invoice?.invoiceProductDetails?.[0]?.invoiceXID,
      },
    });
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const formatDate = (value) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return "-";
    }
  };

  const formatDateTime = (value) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString();
    } catch {
      return "-";
    }
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>Invoice List</h2>

      {loading && (
        <div style={styles.loading}>
          Loading Invoice Data...
        </div>
      )}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>#</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Mobile</th>
              <th style={styles.th}>PO Number</th>
              <th style={styles.th}>PO Date</th>
              <th style={styles.th}>Invoice Created</th>
              <th style={styles.th}>Created On</th>
              <th style={styles.th}>GSTIN</th>
              <th style={styles.th}>Vehicle No</th>
              <th style={styles.th}>EWB No</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {invoiceData.length > 0 ? (
              invoiceData.map((invoice, index) => (
                <tr key={invoice.id || index}>
                  <td style={styles.td}>{index + 1}</td>

                  <td style={styles.td}>
                    {invoice.clientCompanyName || "-"}
                  </td>

                  <td style={styles.td}>
                    {invoice.mobileNo || "-"}
                  </td>

                  <td style={styles.td}>
                    {invoice.purchaseOrder || "-"}
                  </td>

                  <td style={styles.td}>
                    {formatDate(invoice.purchaseOrderDate)}
                  </td>

                  <td style={styles.td}>
                    {formatDateTime(invoice.invoiceCreatedOn)}
                  </td>

                  <td style={styles.td}>
                    {formatDateTime(invoice.createdOn)}
                  </td>

                  <td style={styles.td}>
                    {invoice.gstin || "-"}
                  </td>

                  <td style={styles.td}>
                    {invoice.vehicleNo || "-"}
                  </td>

                  <td style={styles.td}>
                    {invoice.eWayBillNumber || "-"}
                  </td>

                  <td style={styles.td}>
                    {invoice.transactionStatusXid || "-"}
                  </td>

                  <td style={styles.actionTd}>
                    <button
                      style={styles.einvoiceBtn}
                      onClick={() => handleGenerateEinvoice(invoice)}
                    >
                      Generate E-Invoice
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              !loading && (
                <tr>
                  <td colSpan={12} style={styles.noData}>
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

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    background: "#f4f6f9",
    minHeight: "100vh",
  },

  heading: {
    fontSize: "28px",
    color: "#1976d2",
    marginBottom: "20px",
    fontWeight: "bold",
  },

  loading: {
    padding: "10px",
    marginBottom: "15px",
    background: "#fff3cd",
    color: "#856404",
    borderRadius: "5px",
  },

  error: {
    padding: "10px",
    marginBottom: "15px",
    background: "#f8d7da",
    color: "#721c24",
    borderRadius: "5px",
  },

  tableWrapper: {
    overflowX: "auto",
    background: "#fff",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "1400px",
  },

  th: {
    background: "#1976d2",
    color: "#fff",
    padding: "12px",
    textAlign: "center",
  },

  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "center",
  },

  actionTd: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "center",
  },

  einvoiceBtn: {
    background: "#1976d2",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "5px",
    cursor: "pointer",
    fontWeight: "bold",
  },

  noData: {
    padding: "20px",
    textAlign: "center",
    fontWeight: "bold",
  },
};

export default EinvfeildsDisplay;