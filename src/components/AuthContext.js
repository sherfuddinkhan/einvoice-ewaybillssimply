import React, { createContext, useContext, useEffect, useState } from "react";

/* ───────────────────────────────────────────
   STORAGE KEYS (SUPPORTED PRODUCTS)
─────────────────────────────────────────── */
const EWAY_KEY = "iris_ewaybill_shared_config";
const EINVOICE_KEY = "iris_einvoice_shared_config";

/* ───────────────────────────────────────────
   Create Context
─────────────────────────────────────────── */
const AuthContext = createContext(null);

/* ───────────────────────────────────────────
   Safe JSON parse helper
─────────────────────────────────────────── */
const safeParse = (value, fallback = {}) => {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
};

/* ───────────────────────────────────────────
   useAuth Hook
─────────────────────────────────────────── */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

/* ───────────────────────────────────────────
   Auth Provider
─────────────────────────────────────────── */
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [product, setProduct] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  /* ✅ Restore session on refresh */
  useEffect(() => {
    const eway = safeParse(localStorage.getItem(EWAY_KEY));
    const einvoice = safeParse(localStorage.getItem(EINVOICE_KEY));
    const active =
      eway?.token
        ? { ...eway, product: "EWAY", key: EWAY_KEY }
        : einvoice?.token
        ? { ...einvoice, product: "EINVOICE", key: EINVOICE_KEY }
        : null;
    if (active) {
      setToken(active.token);
      setCompanyId(active.companyId);
      setProduct(active.product);
      setIsLoggedIn(true);
    }

    setAuthReady(true);
  }, []);

  /* ✅ Unified Login */
  const login = (store, productType) => {
    const key =
      productType === "EINVOICE" ? EINVOICE_KEY : EWAY_KEY;

    localStorage.setItem(key, JSON.stringify(store));

    setToken(store.token);
    setCompanyId(store.companyId);
    setProduct(productType);
    setIsLoggedIn(true);
  };

  /* ✅ Unified Logout */
  const logout = () => {
    localStorage.removeItem(EWAY_KEY);
    localStorage.removeItem(EINVOICE_KEY);
    setToken(null);
    setCompanyId(null);
    setProduct(null);
    setIsLoggedIn(false);
  };

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Loading Authentication…
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        companyId,
        product,
        isLoggedIn,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
