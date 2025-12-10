import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "iris_einvoice_shared_config";

const EInvoiceLoginPage = () => {
  const [email, setEmail] = useState("ateeq@calibrecue.com");
  const [password, setPassword] = useState("Abcd@1234567");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const { login, isLoggedIn, product } = useAuth();
  const navigate = useNavigate();

  // Auto redirect if already logged in
  useEffect(() => {
    if (isLoggedIn && product === "EINVOICE") {
      navigate("/einvoice-generate-print", { replace: true });
    }
  }, [isLoggedIn, product, navigate]);

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
          product: "EINVOICE",
          fullResponse: data,
          lastLogin: new Date().toISOString(),
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(store));

        login(store, "EINVOICE"); // AuthProvider will handle redirect via useEffect
      }
    } catch (err) {
      setResponse({ status: "ERROR", message: err.message });
    }

    setLoading(false);
  };

  return (
    <div style={{ padding: "40px", minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#F5F5F7" }}>
      <div style={{ background: "#fff", padding: "30px", borderRadius: "16px", width: "400px", boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}>
        <h2 style={{ textAlign: "center", marginBottom: "24px" }}>🧾 E-Invoice Login</h2>

        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #707070" }} />

        <label>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #707070" }} />

        <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "14px", borderRadius: "10px", background: loading ? "#BDBDBD" : "#1A73E8", color: "#fff", fontSize: "18px", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {response && (
          <div style={{ marginTop: "20px", padding: "16px", borderRadius: "10px", background: response.status === "SUCCESS" ? "#34A85322" : "#EA433522", border: `2px solid ${response.status === "SUCCESS" ? "#34A853" : "#EA4335"}` }}>
            <strong>Status: {response.status}</strong>
            <pre style={{ background: "#263238", color: "#A8FFBF", padding: "10px", borderRadius: "6px", fontFamily: "monospace", marginTop: "10px" }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default EInvoiceLoginPage;
