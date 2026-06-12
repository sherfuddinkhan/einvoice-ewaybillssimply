import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const MODE_KEY = "invoiceMode";

const EInvoiceLoginPage = () => {
  const [email, setEmail] = useState("ateeq@calibrecue.com");
  const [password, setPassword] = useState("Ateeq@123");
  const [invoiceMode, setInvoiceMode] = useState("NORMAL");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

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
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await res.json();
      setResponse(data);

      // ✅ FIXED LOGIC (was incorrectly outside function)
      if (data?.status === "SUCCESS" && data?.response?.token) {
        const selectedMode = invoiceMode;

        const loginData = {
          token: data.response.token,
          companyId: data.response.companyId,
          userGstin: data.response.userGstin,
          email,
          invoiceMode: selectedMode,
          fullResponse: data,
        };

        // store only in AuthContext
        login(loginData, "EINVOICE");

        // redirect
        navigate(
          selectedMode === "PROFORMA"
            ? "/einvoice/einvoice-pdisplay"
            : "/einvoice/einvoice-display",
          { replace: true }
        );
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
    <div>
      <h2>E-Invoice Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <select
        value={invoiceMode}
        onChange={(e) => {
          console.log("Mode Changed:", e.target.value);
          setInvoiceMode(e.target.value);
        }}
      >
        <option value="NORMAL">Normal E-Invoice</option>
        <option value="PROFORMA">Proforma E-Invoice</option>
      </select>

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging In..." : "Login"}
      </button>

      {response && <pre>{JSON.stringify(response, null, 2)}</pre>}
    </div>
  );
};

export default EInvoiceLoginPage;