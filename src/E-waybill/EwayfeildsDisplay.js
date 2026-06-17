import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const EwayfeildsDisplay= () => {
const navigate = useNavigate();
const { token, companyId } = useAuth();

const [loading, setLoading] = useState(false);
const [invoiceData, setInvoiceData] = useState([]);
const [error, setError] = useState("");

const hasFetched = useRef(false);

const getInvoiceData = async () => {
try {
setLoading(true);
setError("");
const payload = {
  orderType: "invoicecumchallan",
  yearName: "24-25",
  companyValue: "5",
  customerName: "",
};

const { data } = await axios.post(
  "https://einvoice.fcssoftwares.com/api/OrderList/GetOrderList",
  payload,
  {
    headers: {
      "Content-Type": "application/json",
      accept: "*/*",
    },
  }
);

console.log("Invoice API Response:", data);
setInvoiceData(data || []);


} catch (err) {
console.error("API Error:", err);

if (err.response) {
  console.log("Status:", err.response.status);
  console.log("Response:", err.response.data);
}
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
          accept: "*/*",
        },
      }
    );

    console.log("Invoice Details Response:", data);

    localStorage.setItem("selectedInvoice",JSON.stringify(data));
      localStorage.setItem("Selected PID",JSON.stringify(data.pid));

    navigate("/ewaybill/ewb-generate-print", {
      state: {
        invoiceData: data,
        pid:pid,
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

return ( <div style={styles.container}> <h2 style={styles.heading}>Invoice List</h2>


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
              <td style={styles.td}>
                {index + 1}
              </td>

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
                {invoice.purchaseOrderDate || "-"}
              </td>

              <td style={styles.td}>
                {invoice.pid|| "-"}
              </td>

              <td style={styles.td}>
                {invoice.createdOn || "-"}
              </td>

              <td style={styles.td}>
                {invoice.pid || "-"}
              </td>

              <td style={styles.td}>
                {invoice.vehicleNo || "-"}
              </td>

              <td style={styles.td}>
                {invoice.eWayBillNumber || "-"}
              </td>

              <td style={styles.td}>
                {invoice.eWayBillNumber ? (
                  <span
                    style={{
                      color: "green",
                      fontWeight: "bold",
                    }}
                  >
                    Generated
                  </span>
                ) : (
                  <span
                    style={{
                      color: "red",
                      fontWeight: "bold",
                    }}
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
                  Generate E-Invoice
                </button>
              </td>
            </tr>
          ))
        ) : (
          !loading && (
            <tr>
              <td
                colSpan={12}
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

export default EwayfeildsDisplay;
