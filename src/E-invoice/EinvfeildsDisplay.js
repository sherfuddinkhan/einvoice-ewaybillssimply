import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const EinvfeildsDisplay = () => {
  const navigate = useNavigate();
  
  // ✅ Pull connectionType from useAuth (aliased to contextType to avoid naming conflicts)
  const { token, companyId, connectionType: contextType } = useAuth();

  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);
  const [error, setError] = useState("");
  
  // ✅ Auto-populate from Context -> LocalStorage -> Fallback to "Default"
  const [connectionType, setConnectionType] = useState(
    contextType || localStorage.getItem("connectionType") || "Default"
  );

  const hasFetched = useRef(false);

 const getInvoiceData = async () => {
  setLoading(true);
  setError("");

  try {
    // Get company value from localStorage
    const companyValue =
      localStorage.getItem("userLoginRef") || "5";

    // Prepare request payload
    const payload = {
      orderType: "invoicecumchallan",
      yearName: "24-25",
      companyValue,
      customerName: "",
    };

    // Prepare request headers
    const headers = {
      "Content-Type": "application/json",
      Accept: "*/*",
      ConnectionType: connectionType || "Default",
    };

    // API endpoint
    const url =
      "https://einvoice.fcssoftwares.com/api/OrderList/GetOrderList";

    console.log("Fetching invoices...");
    console.log("Connection Type:", connectionType);
    console.log("Request Payload:", payload);
    console.log("Request Headers:", headers);

    // Make API request
    const response = await axios.post(
      url,
      payload,
      { headers }
    );

    console.log(
      "Invoice API Response:",
      response.data
    );

    // Update state with API response
    setInvoiceData(response.data || []);
  } catch (error) {
    console.error(
      "Error fetching invoice data:",
      error
    );

    setError(
      error.response?.data?.message ||
        error.message ||
        "Failed to fetch invoices"
    );
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    if (!token || !companyId) return;
    if (hasFetched.current) return;
    
    hasFetched.current = true;
    getInvoiceData();
  }, [token, companyId, connectionType]);

  // ✅ Handle Dropdown Change, sync to localStorage, and force refetch
  const handleConnectionChange = (e) => {
    const newValue = e.target.value;
    setConnectionType(newValue);
    localStorage.setItem("connectionType", newValue); // Keep synced
    hasFetched.current = false; // Trigger re-fetch
  };

  const handleGenerateEinvoice = async (invoice) => {
    try {
      setLoading(true);

      const pid = invoice?.pid;

      if (!pid) {
        alert("PID not found");
        return;
      }

      console.log("Selected Invoice:", invoice);
      console.log("Selected PID:", pid);

      const { data } = await axios.get(
        `https://einvoice.fcssoftwares.com/api/OrderList/GetInvoiceDetails/${pid}/invoicecumchallan`,
        {
          headers: {
            "accept": "*/*",
            "ConnectionType": connectionType, // Injected dynamically
          },
        }
      );

      console.log("Invoice Details Response:", data);

      localStorage.setItem("selectedInvoice", JSON.stringify(data));
      localStorage.setItem("Selected PID", JSON.stringify(data.pid));

      navigate("/einvoice/generate-print", {
        state: {
          invoiceData: data,
          pid: pid,
        },
      });
    } catch (err) {
      console.error("Invoice Details API Error:", err);

      if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Response:", err.response.data);
      }

      alert("Failed to fetch invoice details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={styles.heading}>Invoice List</h2>
        
        {/* Dropdown UI */}
        <div style={styles.dropdownContainer}>
          <label htmlFor="connType" style={styles.label}>Environment: </label>
          <select 
            id="connType" 
            value={connectionType} 
            onChange={handleConnectionChange} 
            style={styles.select}
          >
            <option value="Default">Default</option>
            <option value="UAT">UAT</option>
            <option value="LIVE">LIVE</option>
          </select>
        </div>
      </div>

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
              <th style={styles.th}>Invoice No</th>
              <th style={styles.th}>Created On</th>
              <th style={styles.th}>PID</th>
              <th style={styles.th}>Vehicle No</th>
              <th style={styles.th}>EWB No</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {invoiceData.length > 0 ? (
              invoiceData.map((invoice, index) => (
                <tr key={invoice.refID || index}>
                  <td style={styles.td}>{index + 1}</td>
                  <td style={styles.td}>{invoice.clientCompanyName || "-"}</td>
                  <td style={styles.td}>{invoice.mobileNo || "-"}</td>
                  <td style={styles.td}>{invoice.purchaseOrder || "-"}</td>
                  <td style={styles.td}>{invoice.purchaseOrderDate || "-"}</td>
                  <td style={styles.td}>{invoice.pid || "-"}</td>
                  <td style={styles.td}>{invoice.createdOn || "-"}</td>
                  <td style={styles.td}>{invoice.pid || "-"}</td>
                  <td style={styles.td}>{invoice.vehicleNo || "-"}</td>
                  <td style={styles.td}>{invoice.eWayBillNumber || "-"}</td>
                  <td style={styles.td}>
                    {invoice.eWayBillNumber ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>
                        Generated
                      </span>
                    ) : (
                      <span style={{ color: "red", fontWeight: "bold" }}>
                        Pending
                      </span>
                    )}
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
  container: { padding: "20px", fontFamily: "Arial, sans-serif", background: "#f4f6f9", minHeight: "100vh" },
  headerRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  heading: { fontSize: "28px", color: "#1976d2", fontWeight: "bold", margin: 0 },
  dropdownContainer: { display: "flex", alignItems: "center", background: "#fff", padding: "8px 16px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" },
  label: { fontWeight: "bold", color: "#333", marginRight: "10px", fontSize: "14px" },
  select: { padding: "8px 12px", borderRadius: "5px", border: "1px solid #ccc", outline: "none", cursor: "pointer", fontSize: "14px" },
  loading: { padding: "10px", marginBottom: "15px", background: "#fff3cd", color: "#856404", borderRadius: "5px" },
  error: { padding: "10px", marginBottom: "15px", background: "#f8d7da", color: "#721c24", borderRadius: "5px" },
  tableWrapper: { overflowX: "auto", background: "#fff", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "1400px" },
  th: { background: "#1976d2", color: "#fff", padding: "12px", textAlign: "center" },
  td: { padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" },
  actionTd: { padding: "10px", borderBottom: "1px solid #ddd", textAlign: "center" },
  einvoiceBtn: { background: "#1976d2", color: "#fff", border: "none", padding: "8px 14px", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" },
  noData: { padding: "20px", textAlign: "center", fontWeight: "bold" },
};

export default EinvfeildsDisplay;