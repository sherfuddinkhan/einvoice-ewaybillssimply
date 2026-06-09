import React from "react";

import {
  Navigate,
} from "react-router-dom";

import {
  useAuth,
} from "./AuthContext";

const RequireAuth = ({
  children,
  product,
}) => {
  const {
    isAuthReady,
    isLoggedIn,
    product: loggedProduct,
  } = useAuth();

  if (!isAuthReady) {
    return (
      <div>Loading...</div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Navigate
        replace
        to={
          product === "EWAY"
            ? "/ewaybill-login"
            : "/einvoice-login"
        }
      />
    );
  }

  if (
    loggedProduct !== product
  ) {
    return (
      <Navigate
        replace
        to={
          product === "EWAY"
            ? "/ewaybill-login"
            : "/einvoice-login"
        }
      />
    );
  }

  return children;
};

export default RequireAuth;