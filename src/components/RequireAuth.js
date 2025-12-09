// src/components/RequireAuth.jsx
import React from "react";
import { Navigate,useLocation  } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Route Guard Component
 * @param {ReactNode} children
 * @param {"EWAY" | "EINVOICE"} product
 */
const RequireAuth = ({ children, product }) => {
  const { isLoggedIn, product: userProduct } = useAuth();
  const location = useLocation();

  if (!isLoggedIn || userProduct !== product) {
    // Redirect to login page of the specific product
    const loginPath = product === "EWAY" ? "/ewaybill-login" : "/einvoice-login";
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  return children;

  // ✅ E-Way Bill protection
  if (product === "EWAY") {
    const eway = JSON.parse(
      localStorage.getItem("iris_ewaybill_shared_config") || "{}"
    );
    if (!eway?.token || !eway?.companyId) {
      return <Navigate to="/ewaybill-login" replace />;
    }
  }

  // ✅ E-Invoice protection
  if (product === "EINVOICE") {
    const einv = JSON.parse(
      localStorage.getItem("iris_einvoice_shared_config") || "{}"
    );
    if (!einv?.token || !einv?.companyId) {
      return <Navigate to="/einvoice-login" replace />;
    }
  }

  return children;
};

export default RequireAuth;

