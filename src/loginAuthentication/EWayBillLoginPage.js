import React, { useState, useEffect } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";

const EWayBillLoginPage = () => {
  const [email, setEmail] = useState("eway@gmail.com");
  const [password, setPassword] = useState("Abcd@123khan");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

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
        "http://localhost:3001/proxy/ewaybill/login",
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
            data.response.companyId ||
            "24",

          userGstin:
            data.response.userGstin ||
            null,

          email,

          fullResponse: data,

          lastLogin:
            new Date().toISOString(),
        };

        // AuthContext handles sessionStorage
        login(
          loginData,
          "EWAY"
        );

        navigate(
          "/eway-display",
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