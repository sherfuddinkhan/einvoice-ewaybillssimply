import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const openEwayLogin = () => navigate("/ewaybill-login");
  const openEinvoiceLogin = () => navigate("/einvoice-login");

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Calibrecue IT Solutions</h1>
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
          }}
        >
          🧾 E-Invoice Login
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
