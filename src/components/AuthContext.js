import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const EWAY_KEY = "iris_ewaybill_shared_config";
const EINVOICE_KEY = "iris_einvoice_response";

export const AuthProvider = ({ children }) => {
  /* -------------------- AUTH STATE -------------------- */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [product, setProduct] = useState(null);
  const [token, setToken] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  /* -------------------- LAST USED DATA -------------------- */
  const [lastUserGstin, setLastUserGstin] = useState(null);
  const [lastIrn, setLastIrn] = useState(null);
  const [lastDocNo, setLastDocNo] = useState(null);
  const [lastDocDate, setLastDocDate] = useState(null);
  const [lastDocType, setLastDocType] = useState(null);

  /* -------------------- RESTORE SESSION -------------------- */
  useEffect(() => {
    const eway = localStorage.getItem(EWAY_KEY);
    const einv = localStorage.getItem(EINVOICE_KEY);

    if (eway) {
      const data = JSON.parse(eway);
      setToken(data.token);
      setCompanyId(data.companyId);
      setLastUserGstin(data.userGstin || null);
      setProduct("EWAY");
      setIsLoggedIn(true);
    } 
    else if (einv) {
      const data = JSON.parse(einv);
      setToken(data.token);
      setCompanyId(data.companyId);
      setLastUserGstin(data.userGstin || null);
      setLastIrn(data.irn || null);
      setLastDocNo(data.docNo || null);
      setLastDocDate(data.docDate || null);
      setLastDocType(data.docType || null);
      setProduct("EINVOICE");
      setIsLoggedIn(true);
    }

    setIsAuthReady(true);
  }, []);

  /* -------------------- LOGIN -------------------- */
  const login = (store, productType) => {
    const key = productType === "EINVOICE" ? EINVOICE_KEY : EWAY_KEY;
    localStorage.setItem(key, JSON.stringify(store));

    setToken(store.token);
    setCompanyId(store.companyId);
    setLastUserGstin(store.userGstin || null);
    setLastIrn(store.irn || null);
    setLastDocNo(store.docNo || null);
    setLastDocDate(store.docDate || null);
    setLastDocType(store.docType || null);

    setProduct(productType);
    setIsLoggedIn(true);
    setIsAuthReady(true);
  };

  /* -------------------- LOGOUT -------------------- */
  const logout = () => {
    localStorage.removeItem(EWAY_KEY);
    localStorage.removeItem(EINVOICE_KEY);

    setIsLoggedIn(false);
    setProduct(null);
    setToken(null);
    setCompanyId(null);

    setLastUserGstin(null);
    setLastIrn(null);
    setLastDocNo(null);
    setLastDocDate(null);
    setLastDocType(null);

    setIsAuthReady(true);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        product,
        token,
        companyId,
        isAuthReady,

        /* exposed last-used values */
        lastUserGstin,
        lastIrn,
        lastDocNo,
        lastDocDate,
        lastDocType,

        /* setters (optional but useful) */
        setLastUserGstin,
        setLastIrn,
        setLastDocNo,
        setLastDocDate,
        setLastDocType,

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
