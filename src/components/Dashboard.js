import React from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = ({ setAllowEwayLogin, setAllowEinvoiceLogin }) => {
  const navigate = useNavigate();

  const openEway = () => {
    setAllowEwayLogin(true);
    navigate("/ewaybill-login");
  };

  const openEinvoice = () => {
    setAllowEinvoiceLogin(true);
    navigate("/einvoice-login");
  };

  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h1>Choose a Compliance Service</h1>
      <p>Select the necessary flow to begin the authentication process.</p>

      <div style={{ display: "flex", justifyContent: "center", gap: "30px" }}>
        
        <button
          onClick={openEway}
          style={{ padding: "15px 30px", fontSize: "22px", background: "#3498db", color: "white", borderRadius: 10 }}
        >
          🚚 E-Way Bill Management
        </button>

        <button
          onClick={openEinvoice}
          style={{ padding: "15px 30px", fontSize: "22px", background: "#2ecc71", color: "white", borderRadius: 10 }}
        >
          🧾 E-Invoice Generation
        </button>

      </div>
    </div>
  );
};

export default Dashboard;
