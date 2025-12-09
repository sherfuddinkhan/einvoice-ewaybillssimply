import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "iris_einvoice_shared_config";

/* -------------------------- LOGIN CHECK -------------------------- */
const isEinvoiceLoggedIn = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return Boolean(data?.token && data?.companyId);
  } catch {
    return false;
  }
};

/* -------------------------- COLORS -------------------------- */
const colors = {
  primary: "#1A73E8",
  primaryDark: "#0B4F9C",
  success: "#34A853",
  danger: "#EA4335",
  background: "#F5F5F7",
  cardBackground: "#FFFFFF",
  textDark: "#333333",
  textLight: "#707070",
  codeBg: "#263238",
  codeText: "#A8FFBF",
};

/* -------------------------- STYLES -------------------------- */
const styles = {
  container: {
    padding: "40px",
    background: colors.background,
    minHeight: "100vh",
    fontFamily: "Roboto, Arial, sans-serif",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },
  card: {
    background: colors.cardBackground,
    padding: "30px",
    borderRadius: "16px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
    width: "450px",
  },
  header: {
    textAlign: "center",
    color: colors.primaryDark,
    fontSize: "28px",
    marginBottom: "24px",
  },
  label: {
    fontWeight: 600,
    marginBottom: "6px",
    display: "block",
  },
  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: `1px solid ${colors.textLight}`,
    marginBottom: "20px",
    fontSize: "16px",
  },
  btnPrimary: (loading) => ({
    width: "100%",
    padding: "14px",
    background: loading ? "#BDBDBD" : colors.primary,
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: loading ? "not-allowed" : "pointer",
    fontWeight: "bold",
    fontSize: "18px",
  }),
  responseBox: (ok) => ({
    marginTop: "24px",
    padding: "16px",
    borderRadius: "10px",
    background: ok ? "#34A85322" : "#EA433522",
    border: `2px solid ${ok ? colors.success : colors.danger}`,
  }),
  codeBox: {
    background: colors.codeBg,
    color: colors.codeText,
    padding: "10px",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "13px",
    marginTop: "10px",
  },
};

/* ============================================================
   EINVOICE LOGIN
   ============================================================ */
const EInvoiceLoginPage = () => {
  const [email, setEmail] = useState("ateeq@calibrecue.com");
  const [password, setPassword] = useState("Abcd@1234567");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  /* ✅ AUTO-REDIRECT IF ALREADY LOGGED IN */
  useEffect(() => {
    if (isEinvoiceLoggedIn()) {
      navigate("/einvoice-generate-print", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch("http://localhost:3001/proxy/einvoice/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setResponse(data);

      if (data.status === "SUCCESS" && data.response?.token) {
        const store = {
          token: data.response.token,
          companyId: data.response.companyId || "24",
          email,
          product: "TOPAZ",
          fullResponse: data,
          lastLogin: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
        login(store.token);

        navigate("/einvoice-generate-print", { replace: true });
      }
    } catch (err) {
      setResponse({ status: "ERROR", message: err.message });
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>🔐 API Gateway Login</h2>

        <label style={styles.label}>Email</label>
        <input
          type="email"
          style={styles.input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label style={styles.label}>Password</label>
        <input
          type="password"
          style={styles.input}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={styles.btnPrimary(loading)}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {response && (
          <div style={styles.responseBox(response.status === "SUCCESS")}>
            <strong>Status: {response.status}</strong>
            <pre style={styles.codeBox}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default EInvoiceLoginPage;
