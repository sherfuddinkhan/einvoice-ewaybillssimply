import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const EwayfeildsDisplay = () => {
  const navigate = useNavigate();


  // Get only token and companyId from AuthContext
  const { token, companyId } = useAuth();

  // Get values directly from localStorage
  const [selectedEnv, setSelectedEnv] = useState(
    localStorage.getItem("connectionType") || "DEFAULT"
  );

  const [selectedYear, setSelectedYear] = useState(
    localStorage.getItem("yearName")
  );
  const [loading, setLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);
  const [error, setError] = useState("");
  const hasFetched = useRef(false);


  const getInvoiceData = async () => {
    setLoading(true);
    setError("");

    try {
      const companyValue =
        localStorage.getItem("userLoginRef") || "6";

      // Read latest values from localStorage
      const currentConnectionType =
        localStorage.getItem("connectionType") || "DEFAULT";

      const currentYear =localStorage.getItem("yearName") 

      const payload = {
        orderType: "invoicecumchallan",
        yearName: currentYear,
        companyValue,
        customerName: "",
      };

      const headers = {
        "Content-Type": "application/json",
        Accept: "*/*",
        ConnectionType: currentConnectionType,
      };

      console.log("Environment:", currentConnectionType);
      console.log("Year:", currentYear);
      console.log("Payload:", payload);

      const response = await axios.post(
        "https://einvoice.fcssoftwares.com/api/OrderList/GetOrderList",
        payload,
        { headers }
      );

      setInvoiceData(response.data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);

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
  }, [token, companyId]);

  const handleConnectionChange = (e) => {
    const newValue = e.target.value;
    setSelectedEnv(newValue);
    localStorage.setItem("connectionType", newValue);
    hasFetched.current = false; // Trigger refetch on change
  };


  const handleGenerateEinvoice = async (invoice) => {
    // Read latest values from localStorage
    const currentConnectionType =
      localStorage.getItem("connectionType") || "DEFAULT";
    try {
      setLoading(true);

      const pid = invoice?.pid;

      if (!pid) {
        alert("PID not found");
        return;
      }

      const currentConnectionType =
        localStorage.getItem("connectionType") || "DEFAULT";

      const { data } = await axios.get(
        `https://einvoice.fcssoftwares.com/api/OrderList/GetInvoiceDetails/${pid}/invoicecumchallan`,
        {
          headers: {
            accept: "*/*",
            ConnectionType: currentConnectionType,
          },
        }
      );

      localStorage.setItem(
        "selectedInvoice",
        JSON.stringify(data)
      );

      localStorage.setItem(
        "Selected PID",
        JSON.stringify(data.pid)
      );

      navigate("/ewaybill/ewb-generate-print", {
        state: {
          invoiceData: data,
          pid,
        },
      });
    } catch (err) {
      console.error("Invoice Details API Error:", err);
      alert("Failed to fetch invoice details.");
    } finally {
      setLoading(false);
    }
  };
  const handleDeleteIRN = async (invoice) => {
    // Check whether IRN exists
    if (
      !invoice.irnnumber ||
      invoice.irnnumber === "" ||
      invoice.irnnumber === null
    ) {
      alert("IRN is not generated for this invoice.");
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to cancel IRN for Invoice ${invoice.pid}?`
    );

    if (!confirmDelete) return;
    try {
      setLoading(true);
      const userGstin = invoiceData[0]?.gstin
      const payload = {
        irn: invoice.irnnumber,
        cnlRsn: "1", // Wrong Entry
        cnlRem: "Wrong entry",
        userGstin: invoiceData[0]?.gstin,
      };
      // Read latest values from localStorage
      const currentConnectionType =
        localStorage.getItem("connectionType") || "DEFAULT";
      console.log("userGstin01", userGstin)
      console.log("Cancel IRN Payload:", payload);

      const response = await axios.put(
        "https://einvoice.fcssoftwares.com/api/gst/einvoice/cancel-irn",
        payload,
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            companyId: companyId,
            ConnectionType: currentConnectionType,
            "X-Auth-Token": token,
            product: "ONYX",
          },
        }
      );

      console.log("Cancel IRN Response:", response.data);

      if (response.data?.status === "SUCCESS") {
        alert("IRN Cancelled Successfully");
        getInvoiceData();
      } else {
        alert(
          response.data?.message ||
          "Failed to cancel IRN"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        error.message ||
        "Failed to cancel IRN"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEwayBill = async (invoice) => {
    // Check whether EWB exists
    if (
      !invoice.eWayBillNumber ||
      invoice.eWayBillNumber === "" ||
      invoice.eWayBillNumber === null
    ) {
      alert(
        "E-Way Bill is not generated for this invoice."
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to cancel E-Way Bill ${invoice.eWayBillNumber}?`
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      //console.log("usergstin1",gstin)
      const payload = {
        ewbNo: invoice.eWayBillNumber,
        cnlRsn: "3", // Order Cancelled
        cnlRem: "Order cancelled by buyer",
        userGstin: invoice.gstin,
      };
      // Read latest values from localStorage
      const currentConnectionType =
        localStorage.getItem("connectionType") || "DEFAULT";
      console.log("Cancel EWB Payload:", payload);

      const response = await axios.put(
        "https://einvoice.fcssoftwares.com/api/gst/einvoice/cancel-ewb",
        payload,
        {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            companyid: companyId,
            "x-auth-token": token,
            product: "ONYX",
          },
        }
      );

      console.log("Cancel EWB Response:", response.data);

      if (response.data?.status === "SUCCESS") {
        alert("E-Way Bill Cancelled Successfully");
        getInvoiceData();
      } else {
        alert(
          response.data?.message ||
          "Failed to cancel E-Way Bill"
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.message ||
        error.message ||
        "Failed to cancel E-Way Bill"
      );
    } finally {
      setLoading(false);
    }
  };


  return (
    <div>
      {loading && (
        <div style={styles.loading}>Loading Invoice Data...</div>
      )}

      {error && <div style={styles.error}>{error}</div>}

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
              <th style={styles.th}>Primary Key(Update)</th>
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
                  <td style={styles.td}>
                    {invoice.clientCompanyName || "-"}
                  </td>
                  <td style={styles.td}>{invoice.mobileNo || "-"}</td>
                  <td style={styles.td}>
                    {invoice.purchaseOrder || "-"}
                  </td>
                  <td style={styles.td}>
                    {invoice.purchaseOrderDate || "-"}
                  </td>
                  <td style={styles.td}>{invoice.invoiceNumber || "-"}</td>
                  <td style={styles.td}>
                    {invoice.pid || "-"}
                  </td>
                  <td style={styles.td}>{invoice.createdOn || "-"}</td>
                  <td style={styles.td}>{invoice.pid || "-"}</td>
                  <td style={styles.td}>{invoice.vehicleNo || "-"}</td>
                  <td style={styles.td}>
                    {invoice.eWayBillNumber || "-"}
                  </td>

                  <td style={styles.td}>
                    {invoice.eWayBillNumber ? (
                      <span
                        style={{ color: "green", fontWeight: "bold" }}
                      >
                        Generated
                      </span>
                    ) : (
                      <span
                        style={{ color: "red", fontWeight: "bold" }}
                      >
                        Pending
                      </span>
                    )}
                  </td>

                  <td style={styles.actionTd}>
                    <button
                      style={styles.einvoiceBtn}
                      onClick={() =>
                        handleGenerateEinvoice(invoice)
                      }
                    >
                      Generate E-Way Bill
                    </button>

                    <button
                      style={{
                        ...styles.deleteIrnBtn,
                        opacity: invoice.irnnumber ? 1 : 0.5,
                        cursor: invoice.irnnumber
                          ? "pointer"
                          : "not-allowed",
                      }}
                      disabled={!invoice.irnnumber}
                      onClick={() => handleDeleteIRN(invoice)}
                      title={
                        invoice.irnnumber
                          ? "Cancel IRN"
                          : "IRN not generated"
                      }
                    >
                      Delete IRN
                    </button>

                    <button
                      style={{
                        ...styles.deleteEwbBtn,
                        opacity: invoice.eWayBillNumber
                          ? 1
                          : 0.5,
                        cursor: invoice.eWayBillNumber
                          ? "pointer"
                          : "not-allowed",
                      }}
                      disabled={!invoice.eWayBillNumber}
                      onClick={() =>
                        handleDeleteEwayBill(invoice)
                      }
                      title={
                        invoice.eWayBillNumber
                          ? "Cancel E-Way Bill"
                          : "E-Way Bill not generated"
                      }
                    >
                      Delete E-Way Bill
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="12"
                  style={{
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No invoices found
                </td>
              </tr>
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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  heading: {
    fontSize: "28px",
    color: "#1976d2",
    fontWeight: "bold",
    margin: 0,
  },
  dropdownContainer: {
    display: "flex",
    alignItems: "center",
    background: "#fff",
    padding: "8px 16px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
  },
  label: {
    fontWeight: "bold",
    color: "#333",
    marginRight: "10px",
    fontSize: "14px",
  },
  select: {
    padding: "8px 12px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    outline: "none",
    cursor: "pointer",
    fontSize: "14px",
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
    //overflowX: "auto",
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
  deleteIrnBtn: {
    backgroundColor: "#ff9800",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    marginLeft: "5px",
    marginTop: "5px",
  },

  deleteEwbBtn: {
    backgroundColor: "#f44336",
    color: "#fff",
    border: "none",
    padding: "6px 10px",
    borderRadius: "4px",
    cursor: "pointer",
    marginLeft: "5px",
    marginTop: "5px",
  },

  actionTd: {
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    alignItems: "center",
  },
};
export default EwayfeildsDisplay;