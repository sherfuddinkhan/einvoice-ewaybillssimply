import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const EWAY_KEY = "iris_ewaybill_shared_config";
const EINVOICE_KEY = "iris_einvoice_shared_config";

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [product, setProduct] = useState(null);
  const [token, setToken] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false); // State declared
    
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

    // 🌟 FIX 1: Set isAuthReady to true after the localStorage check is complete
    setIsAuthReady(true); 

  }, []);

  const login = (store, productType) => {
    const key = productType === "EINVOICE" ? EINVOICE_KEY : EWAY_KEY;
    localStorage.setItem(key, JSON.stringify(store));

    setToken(store.token);
    setCompanyId(store.companyId);
    setProduct(productType);
    setIsLoggedIn(true);
    // If login happens manually, we should ensure 'ready' state is true (though usually redundant)
    setIsAuthReady(true); 
  };

  const logout = () => {
    localStorage.removeItem(EWAY_KEY);
    localStorage.removeItem(EINVOICE_KEY);
    setIsLoggedIn(false);
    setProduct(null);
    setToken(null);
    setCompanyId(null);
    setIsAuthReady(true); // Ensure logout doesn't break the 'ready' state
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
        isAuthReady, // 🌟 FIX 2: Expose the state so App.js can read it
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