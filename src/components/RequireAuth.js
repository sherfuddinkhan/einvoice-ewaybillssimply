import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const RequireAuth = ({ children, product }) => {
  const { isAuthReady, isLoggedIn, product: loggedProduct } = useAuth();

  if (!isAuthReady) {
    return <div>Loading...</div>;
  }

  // 1. If not logged into the app at all, send them to the new landing/login page
  if (!isLoggedIn) {
    return <Navigate replace to="/" />;
  }

  // 2. If trying to access a product route without matching product access
  if (product && loggedProduct !== product) {
    return (
      <Navigate
        replace
        to={product === "EWAY" ? "/ewaybill-login" : "/einvoice-login"}
      />
    );
  }

  return children;
};

export default RequireAuth;