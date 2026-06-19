import React, { useState } from "react";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";

const EWayBillLoginPage = () => {
  const [email, setEmail] = useState("eway@gmail.com");
  const [password, setPassword] = useState("Abcd@12345");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [ewayMode, setEwayMode] = useState("NORMAL");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    console.log("===== EWAY LOGIN START =====");

    setLoading(true);
    setResponse(null);

    try {
      console.log("Selected Mode:", ewayMode);

      const res = await fetch(
        "https://einvoice.fcssoftwares.com/api/gst/auth/ewaybill-login",
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

      console.log("HTTP Status:", res.status);

      const text = await res.text();

      console.log("Raw API Response:", text);

      let data = {};

      try {
        data = JSON.parse(text);
      } catch (err) {
        throw new Error("Invalid JSON received from server");
      }

      console.log("ewaydata:", data);

      setResponse(data);

      if (
        data?.status === "SUCCESS" &&
        data?.response?.token
      ) {
        const loginData = {
          token: data.response.token,
          companyId: data.response.companyid || "24",
          userGstin: data.response.userGstin || null,
          email,
          fullResponse: data,
          ewayMode,
          lastLogin: new Date().toISOString(),
        };

        console.log(
          "logindataforeway:",
          loginData
        );

        login(loginData, "EWAY");

        console.log(
          "Login Successful. Redirecting..."
        );

        setTimeout(() => {
          navigate(
            ewayMode === "PROFORMA"
              ? "/ewaybill/eway-pewdisplay"
              : "/ewaybill/eway-display"
          );
        }, 3000);
      } else {
        console.error(
          "Login failed:",
          data?.message
        );
      }
    } catch (error) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      setResponse({
        status: "ERROR",
        message:
          error.message ||
          "Something went wrong",
      });
    } finally {
      setLoading(false);
      console.log("===== EWAY LOGIN END =====");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#F5F5F7",
        padding: "40px",
      }}
    >
      <div
        style={{
          width: "420px",
          background: "#fff",
          borderRadius: "16px",
          padding: "30px",
          boxShadow:
            "0 8px 30px rgba(0,0,0,0.12)",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            marginBottom: "25px",
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
            padding: "12px",
            marginTop: "6px",
            marginBottom: "16px",
            borderRadius: "8px",
            border: "1px solid #707070",
            boxSizing: "border-box",
          }}
        />

        <label>Password</label>

        <input
          type="password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            marginBottom: "16px",
            borderRadius: "8px",
            border: "1px solid #707070",
            boxSizing: "border-box",
          }}
        />

        <label>Select Mode</label>

        <select
          value={ewayMode}
          onChange={(e) => {
            console.log(
              "Mode Changed:",
              e.target.value
            );
            setEwayMode(e.target.value);
          }}
          style={{
            width: "100%",
            padding: "12px",
            marginTop: "6px",
            marginBottom: "20px",
            borderRadius: "8px",
            border: "1px solid #707070",
          }}
        >
          <option value="NORMAL">
            Normal E-Way Bill
          </option>
          <option value="PROFORMA">
            Proforma E-Way Bill
          </option>
        </select>

        <button
          onClick={() => {
            console.log(
              "Login Button Clicked"
            );
            handleLogin();
          }}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "10px",
            border: "none",
            background: loading
              ? "#BDBDBD"
              : "#1A73E8",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "bold",
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
              marginTop: "20px",
              padding: "16px",
              borderRadius: "10px",
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
              Status: {response.status}
            </strong>

            <pre
              style={{
                background: "#263238",
                color: "#A8FFBF",
                padding: "10px",
                borderRadius: "6px",
                marginTop: "10px",
                overflowX: "auto",
                fontSize: "12px",
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