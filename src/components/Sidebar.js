import React from "react";
import { Link, useLocation } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
     { path: "/", label: "Dashboard" },
    { path: "/ewaybill-login", label: "E-Way Bill Login" },
    { path: "/einvoice-login", label: "E-Invoice Login" },
    { path: "/ewb-generate-print", label: "EWB Generate & Print" },
    { path: "/einvoice-generate-print", label: "Generate & Print E-Invoice" },
    { path: "/einvoice-print", label: "E-invoice print" },
    { path: "/ewb-print", label: "E-waybill print" },
  ];

  return (
    <div style={{
      width: "220px",
      background: "#1A73E8",
      color: "#fff",
      display: "flex",
      flexDirection: "column",
      padding: "20px",
    }}>
      <h2 style={{ color: "#fff", marginBottom: "30px" }}>Dashboard</h2>
      {menuItems.map(item => (
        <Link 
          key={item.path} 
          to={item.path}
          style={{
            color: location.pathname === item.path ? "#1A73E8" : "#fff",
            backgroundColor: location.pathname === item.path ? "#fff" : "transparent",
            padding: "10px 15px",
            marginBottom: "10px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};

export default Sidebar;
