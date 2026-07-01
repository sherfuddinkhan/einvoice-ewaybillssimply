import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogoutOutlined } from "@ant-design/icons";
import { DashboardOutlined } from "@ant-design/icons";




const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ AUTH FROM CONTEXT (IMPORTANT FIX)
  const { product, isLoggedIn, logout, userGstin } = useAuth();

  const [openSections, setOpenSections] = useState({});

  // ✅ USER DISPLAY (NO localStorage)
  const displayUser = userGstin || "Calibrecue IT Solutions";

  const toggle = (title) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path + "/"));

  // ✅ FIXED LOGOUT (USES CONTEXT)
  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you willing to logout?");
    if (!confirmLogout) return;

    logout();
    navigate("/", { replace: true });
  };

  // AUTO OPEN MENU BASED ON ROUTE
  useEffect(() => {
    setOpenSections((prev) => {
      const updated = { ...prev };

      menuSections.forEach((section) => {
        if (section.items?.some((i) => isActive(i.path))) {
          updated[section.title] = true;
        }
      });

      return updated;
    });
  }, [location.pathname]);

  // MENU CONFIG
  const menuSections = [
    !isLoggedIn
      ? {
          title: "Home",
          path: "/",
        }
      : null,

  {
    title: "Dashboard",
    path: "/dashboard",
    icon: <DashboardOutlined />,
  },
    // ================= E-WAY BILL =================
    {
      title: "E-Way Bill Core",
      product: "EWAY",
      items: [
        { path: "/ewaybill/eway-display", label: "E-Waybill Fields" },
        { path: "/ewaybill/ewb-generate-print", label: "Generate & Print E-way bill" },
        { path: "/ewaybill/fetch-ewb", label: "Fetch by EWB No" },
        { path: "/ewaybill/ewb-details", label: "Get EWB Details" },
      ],
    },

    {
      title: "EWB Actions",
      product: "EWAY",
      items: [
        { path: "/ewaybill/ewb-action", label: "Cancel / Reject EWB" },
        { path: "/ewaybill/update-transporter-id", label: "Update Transporter ID" },
      ],
    },

    {
      title: "Fetch EWB / Consignee",
      product: "EWAY",
      items: [
        { path: "/ewaybill/assigned-ewb", label: "Transporter EWB" },
        { path: "/ewaybill/consignee-ewb", label: "Consignee EWB" },
        { path: "/ewaybill/fetch-by-date", label: "Fetch by Date" },
      ],
    },

    {
      title: "Consolidate Ewaybill",
      product: "EWAY",
      items: [
        { path: "/ewaybill/consolidated-ewb-details", label: "Consolidated EWB" },
        { path: "/ewaybill/consolidate-ewb", label: "Generate Consolidated" },
      ],
    },

    // ================= E-INVOICE =================
    {
      title: "E-Invoice Core",
      product: "EINVOICE",
      items: [
        { path: "/einvoice/einvoice-display", label: "E-Invoice Fields" },
        { path: "/einvoice/generate-print", label: "Generate Invoice and print" },
        { path: "/einvoice/cancel-irn", label: "Cancel IRN" },
        { path: "/einvoice/get-by-irn", label: "Get by IRN" },
      ],
    },

    {
      title: "Upload",
      product: "EINVOICE",
      items: [
        { path: "/einvoice/upload-invoices", label: "Upload Invoice" },
        { path: "/einvoice/uploaded-file-status", label: "Upload Status" },
      ],
    },

    // ================= LOGOUT =================
   {
  title: "Logout",
  icon: <LogoutOutlined />,
  onClick: handleLogout,
},
  ].filter(Boolean);

  // FILTER BY PRODUCT
 const isDashboard = location.pathname === "/dashboard";
const isEinvoice = location.pathname.startsWith("/einvoice");
const isEway = location.pathname.startsWith("/ewaybill");

let visibleSections = [];

if (isDashboard) {
  visibleSections = menuSections.filter(
    (section) => section.title === "Dashboard"
  );
} else if (isEinvoice) {
  visibleSections = menuSections.filter(
    (section) => section.product === "EINVOICE"
  );
} else if (isEway) {
  visibleSections = menuSections.filter(
    (section) => section.product === "EWAY"
  );

}
  return (
    <div
      style={{
        width: 270,
        background: "#1A73E8",
        color: "#fff",
        height: "100vh",
        padding: 20,
        overflowY: "auto",
      }}
    >
      <h3 style={{ textAlign: "center", marginBottom: 20 }}>
      {product && !isDashboard && (
  <div style={{ fontSize: 13, color: "#B3E5FC" }}>
    ({product})
  </div>
)}
      </h3>

      {visibleSections.map((section) => (
        <div key={section.title}>
          {/* SECTION TITLE */}
          <div
            onClick={() => section.items && toggle(section.title)}
            style={{
              padding: "10px",
              cursor: section.items ? "pointer" : "default",
              fontWeight: "bold",
            }}
          >
            {section.title}
          </div>

          {/* LOGOUT BUTTON */}
          {section.onClick && (
            <div
              onClick={section.onClick}
              style={{
                padding: "10px",
                cursor: "pointer",
                color: "#ffdddd",
              }}
            >
              {section.icon} {section.title}
            </div>
          )}

          {/* MENU ITEMS */}
          {openSections[section.title] &&
            section.items?.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "block",
                  padding: "8px 18px",
                  marginTop: 4,
                  borderRadius: 6,
                  fontSize: 14,
                  textDecoration: "none",
                  background: isActive(item.path) ? "#fff" : "transparent",
                  color: isActive(item.path) ? "#1A73E8" : "#fff",
                }}
              >
                {item.label}
              </Link>
            ))}
        </div>
      ))}
      <div
  onClick={handleLogout}
  style={{
    marginTop: "auto",
    padding: "12px",
    cursor: "pointer",
    color: "#ffdddd",
    fontWeight: "bold",
    borderTop: "1px solid rgba(255,255,255,0.2)",
  }}
>
  <LogoutOutlined style={{ marginRight: 8 }} />
  Logout
</div>
    </div>
  );
};

export default Sidebar;

