import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const EInvoiceLoginPage = () => {
  const [email, setEmail] = useState("ateeq@calibrecue.com");
  const [password, setPassword] = useState("Ateeq@123");
  const [invoiceMode, setInvoiceMode] = useState("NORMAL");
  const [connectionType, setConnectionType] = useState(
      localStorage.getItem("connectionType") || "DEFAULT"
    );
  
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();
  const currentConnectionType =
        localStorage.getItem("connectionType") || "DEFAULT";

  // ==========================================
  // LOGIN
  // ==========================================
  const handleLogin = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        "https://einvoice.fcssoftwares.com/api/gst/auth/einvoice-login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
             ConnectionType: currentConnectionType,
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json();
      console.log("login APi response", data);
      setResponse(data);
  

      if (data?.status === "SUCCESS" && data?.response?.token) {
        const selectedMode = invoiceMode;

        const loginData = {
          token: data.response.token,
          companyId: data.response.companyid, // lowercase "id"
          userGstin: data.response.userGstin,
          email,
          invoiceMode: selectedMode,
          fullResponse: data,
        };
  localStorage.setItem("einvoiceLoginData",JSON.stringify(loginData));
        console.log("loginresponse", loginData);

        // store in AuthContext
        login(loginData, "EINVOICE");
        
        

        // redirect
        console.log("➡️ Redirecting using window.location");
      console.log("➡️ Redirecting in 3 seconds...");

setTimeout(() => {
  window.location.href =
    selectedMode === "PROFORMA"
      ? "/einvoice/einvoice-pdisplay"
      : "/einvoice/einvoice-display";
}, 300000); // 3000 ms = 3 seconds
      }
    } catch (error) {
      setResponse({
        status: "ERROR",
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>E-Invoice Login</h2>

        <div style={styles.inputGroup}>
          <label htmlFor="email" style={styles.label}>Email</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="password" style={styles.label}>Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </div>

        {/* <div style={styles.inputGroup}>
          <label htmlFor="mode" style={styles.label}>Invoice Mode</label>
          <select
            id="mode"
            value={invoiceMode}
            onChange={(e) => {
              console.log("Mode Changed:", e.target.value);
              setInvoiceMode(e.target.value);
            }}
            style={styles.input}
          >
            <option value="NORMAL">Normal E-Invoice</option>
            <option value="PROFORMA">Proforma E-Invoice</option>
          </select>
        </div> */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...styles.button,
            ...(loading ? styles.buttonDisabled : {}),
          }}
        >
          {loading ? "Logging In..." : "Login"}
        </button>

        {response && (
          <div style={styles.responseContainer}>
            <p style={styles.responseTitle}>API Response:</p>
            <pre style={styles.responseCode}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// INLINE STYLES
// ==========================================
const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f4f7f6",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: "20px",
    boxSizing: "border-box",
  },
  card: {
    backgroundColor: "#ffffff",
    width: "100%",
    maxWidth: "420px",
    padding: "40px 30px",
    borderRadius: "12px",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
    boxSizing: "border-box",
  },
  title: {
    marginTop: "0",
    marginBottom: "24px",
    color: "#2c3e50",
    fontSize: "24px",
    fontWeight: "600",
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: "20px",
    display: "flex",
    flexDirection: "column",
  },
  label: {
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "500",
    color: "#34495e",
  },
  input: {
    padding: "12px 16px",
    fontSize: "15px",
    border: "1px solid #dce1e6",
    borderRadius: "8px",
    backgroundColor: "#fcfcfc",
    color: "#2c3e50",
    boxSizing: "border-box",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "14px",
    marginTop: "10px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },
  buttonDisabled: {
    backgroundColor: "#95a5a6",
    cursor: "not-allowed",
  },
  responseContainer: {
    marginTop: "24px",
    backgroundColor: "#1e1e1e",
    borderRadius: "8px",
    padding: "16px",
    overflowX: "auto",
  },
  responseTitle: {
    margin: "0 0 10px 0",
    color: "#a8b2bd",
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  responseCode: {
    margin: "0",
    color: "#4ade80",
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: "13px",
    lineHeight: "1.4",
  },
};

export default EInvoiceLoginPage;