import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
const EWayBillLoginPage = () => {
  const [email, setEmail] = useState("eway@gmail.com");
  const [password, setPassword] = useState("Abcd@12345");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [invoiceMode, setInvoiceMode] = useState("NORMAL");

  const {
    login,
    isLoggedIn,
    product,
  } = useAuth();

  const navigate = useNavigate();

  /* ==========================
     AUTO REDIRECT
  ========================== */

  useEffect(() => {
    if (
      !isLoggedIn ||
      product !== "EWAY"
    ) {
      return;
    }

    navigate(
      "/eway-display",
      {
        replace: true,
      }
    );
  }, [
    isLoggedIn,
    product,
    navigate,
  ]);

  /* ==========================
     LOGIN
  ========================== */

  const handleLogin = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch(
        "https://einvoice.fcssoftwares.com/api/gst/auth/ewaybill-login",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data =
        await res.json();

      setResponse(data);

      if (data?.status === "SUCCESS" &&data?.response?.token) {
          const selectedMode = invoiceMode;
        const loginData = {
          token:data.response.token,
          companyId:data.response.companyId || "24",
          userGstin:data.response.userGstin ||
            null,
          email,
          fullResponse: data,
          invoiceMode: selectedMode,
          lastLogin:
            new Date().toISOString(),
        };

        // AuthContext handles sessionStorage
        login(
          loginData,
          "EWAY"
        );

       window.location.href =
  selectedMode === "PROFORMA"
    ? "/einvoice/eway-pewdisplay"
    : "/einvoice/eway-display";
      }
    } catch (error) {
      setResponse({
        status: "ERROR",
        message:
          error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: 40,
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F5F5F7",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 16,
          width: 400,
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.12)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          🚚 E-Way Bill Login
        </h2>

        <label>Email</label>

        <input
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 20,
            borderRadius: 8,
            border:
              "1px solid #707070",
          }}
        />

        <label>Password</label>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          style={{
            width: "100%",
            padding: 12,
            marginBottom: 20,
            borderRadius: 8,
            border:
              "1px solid #707070",
          }}
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
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 10,
            border: "none",
            background: loading
              ? "#BDBDBD"
              : "#1A73E8",
            color: "#fff",
            fontSize: 18,
            cursor: loading
              ? "not-allowed"
              : "pointer",
          }}
        >
          {loading
            ? "Logging In..."
            : "Login"}
        </button>

        {response && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 10,
              background:
                response.status ===
                "SUCCESS"
                  ? "#34A85322"
                  : "#EA433522",
              border: `2px solid ${
                response.status ===
                "SUCCESS"
                  ? "#34A853"
                  : "#EA4335"
              }`,
            }}
          >
            <strong>
              Status:{" "}
              {response.status}
            </strong>

            <pre
              style={{
                background:
                  "#263238",
                color:
                  "#A8FFBF",
                padding: 10,
                borderRadius: 6,
                fontFamily:
                  "monospace",
                marginTop: 10,
                overflowX:
                  "auto",
              }}
            >
              {JSON.stringify(
                response,
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default EWayBillLoginPage;