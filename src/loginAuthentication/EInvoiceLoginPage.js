import React, {useState,useEffect} from "react";

import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

const MODE_KEY = "invoiceMode";

const EInvoiceLoginPage = () => {
  const [email, setEmail] = useState("ateeq@calibrecue.com");
  const [password, setPassword] = useState("Ateeq@123");
  const [invoiceMode, setInvoiceMode] =
    useState("NORMAL");

  const [loading, setLoading] =
    useState(false);

  const [response, setResponse] =
    useState(null);

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
      product !== "EINVOICE"
    ) {
      return;
    }

    const mode =
      sessionStorage.getItem(
        MODE_KEY
      ) || "NORMAL";

    navigate(
      mode === "PROFORMA"
        ? "/einvoice/generate-printproformo"
        : "/einvoice/generate-print",
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
        "http://localhost:3001/proxy/einvoice/login",
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

      if (
        data?.status === "SUCCESS" &&
        data?.response?.token
      ) {
        const loginData = {
          token:
            data.response.token,

          companyId:
            data.response.companyId,

          userGstin:
            data.response.userGstin,

          email,

          invoiceMode,

          fullResponse: data,
        };

        sessionStorage.setItem(
          MODE_KEY,
          invoiceMode
        );

        login(
          loginData,
          "EINVOICE"
        );

        navigate(
          invoiceMode ===
            "PROFORMA"
            ? "/einvoice/generate-printproformo"
            : "/einvoice/generate-print",
          {
            replace: true,
          }
        );
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
    <div>
      <h2>E-Invoice Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
      />

      <select
        value={invoiceMode}
        onChange={(e) =>
          setInvoiceMode(
            e.target.value
          )
        }
      >
        <option value="NORMAL">
          Normal E-Invoice
        </option>

        <option value="PROFORMA">
          Proforma E-Invoice
        </option>
      </select>

      <button
        onClick={handleLogin}
        disabled={loading}
      >
        {loading
          ? "Logging In..."
          : "Login"}
      </button>

      {response && (
        <pre>
          {JSON.stringify(
            response,
            null,
            2
          )}
        </pre>
      )}
    </div>
  );
};

export default EInvoiceLoginPage;