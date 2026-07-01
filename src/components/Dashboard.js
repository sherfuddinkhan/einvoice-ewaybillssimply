import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  // 1. Fetch and parse the response saved during login
  const savedAuth = sessionStorage.getItem("authResponse");
  console.log("authresponse",savedAuth)
  let displayUser = "Calibrecue IT Solutions"; // Fallback name

  if (savedAuth) {
    try {
      const parsedData = JSON.parse(savedAuth);
      
      // 2. Extract user name (adjust key name based on your API response structure)
      // e.g., parsedData.userName, parsedData.data.userName, or parsedData.email
      if (parsedData?.userName) {
        displayUser = parsedData.userName;
      } else if (parsedData?.data?.userName) {
        displayUser = parsedData.data.userName;
      }
    } catch (e) {
      console.error("Failed to parse auth response from localStorage", e);
    }
  }

  const openEwayLogin = () => navigate("/ewaybill-login");
  const openEinvoiceLogin = () => navigate("/einvoice-login");

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      {/* 3. Render the dynamic username here */}
      <h1>{displayUser}</h1>
      <p>Select the type of service</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
        <button
          onClick={openEwayLogin}
          style={{
            padding: "15px 30px",
            fontSize: "22px",
            background: "#3498db",
            color: "white",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          🚚 E-Way Bill Login
        </button>

        <button
          onClick={openEinvoiceLogin}
          style={{
            padding: "15px 30px",
            fontSize: "22px",
            background: "#2ecc71",
            color: "white",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          🧾 E-Invoice Login
        </button>
      </div>
    </div>
  );
};

export default Dashboard;