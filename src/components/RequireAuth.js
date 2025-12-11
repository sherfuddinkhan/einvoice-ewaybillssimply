import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

/**
 * Protects routes based on product type (EWAY or EINVOICE)
 */
const RequireAuth = ({ children, product }) => {
  const { isLoggedIn, product: loggedProduct } = useAuth();
  const location = useLocation();

  if (!isLoggedIn) {
    // Not logged in → go to correct login page
    return <Navigate to={product === "EWAY" ? "/ewaybill-login" : "/einvoice-login"} replace />;
  }

  if (loggedProduct !== product) {
    // Logged in but for the other module → force correct login
    return <Navigate to={product === "EWAY" ? "/ewaybill-login" : "/einvoice-login"} replace />;
  }

  return children;
};

export default RequireAuth;
