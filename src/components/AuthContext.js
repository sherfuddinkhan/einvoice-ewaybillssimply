import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const EWAY_KEY = "iris_ewaybill_shared_config";
const EINVOICE_KEY = "iris_einvoice_shared_config";

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [product, setProduct] = useState(null);
  const [token, setToken] = useState(null);
  const [companyId, setCompanyId] = useState(null);

  // Restore session on refresh
  useEffect(() => {
    const eway = localStorage.getItem(EWAY_KEY);
    const einv = localStorage.getItem(EINVOICE_KEY);

    if (eway) {
      const data = JSON.parse(eway);
      setToken(data.token);
      setCompanyId(data.companyId);
      setProduct("EWAY");
      setIsLoggedIn(true);
    } else if (einv) {
      const data = JSON.parse(einv);
      setToken(data.token);
      setCompanyId(data.companyId);
      setProduct("EINVOICE");
      setIsLoggedIn(true);
    }
  }, []);

  const login = (store, productType) => {
    const key = productType === "EINVOICE" ? EINVOICE_KEY : EWAY_KEY;
    localStorage.setItem(key, JSON.stringify(store));

    setToken(store.token);
    setCompanyId(store.companyId);
    setProduct(productType);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem(EWAY_KEY);
    localStorage.removeItem(EINVOICE_KEY);
    setIsLoggedIn(false);
    setProduct(null);
    setToken(null);
    setCompanyId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        product,
        token,
        companyId,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
