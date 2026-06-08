// src/auth/EinvoiceAuthContext.js

import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

/* =========================================
   LOCAL STORAGE KEY
========================================= */

const EINVOICE_AUTH_KEY =
  "iris_auth_einvoice";

/* =========================================
   CONTEXT
========================================= */

const EinvoiceAuthContext =
  createContext(null);

/* =========================================
   PROVIDER
========================================= */

export const EinvoiceAuthProvider = ({
  children
}) => {

  // =========================================
  // STATES
  // =========================================

  const [token, setToken] =
    useState(null);

  const [companyId, setCompanyId] =
    useState(null);

  const [userGstin, setUserGstin] =
    useState(null);

  const [lastIrn, setLastIrn] =
    useState(null);

  const [lastDocNo, setLastDocNo] =
    useState(null);

  const [lastDocDate, setLastDocDate] =
    useState(null);

  const [lastDocType, setLastDocType] =
    useState(null);

  const [ready, setReady] =
    useState(false);

  // =========================================
  // RESTORE SESSION
  // =========================================

  useEffect(() => {

    const raw =
      localStorage.getItem(
        EINVOICE_AUTH_KEY
      );

    if (raw) {

      const data = JSON.parse(raw);

      setToken(data.token);

      setCompanyId(data.companyId);

      setUserGstin(data.userGstin);

      setLastIrn(data.irn || null);

      setLastDocNo(data.docNo || null);

      setLastDocDate(
        data.docDate || null
      );

      setLastDocType(
        data.docType || null
      );

    }

    setReady(true);

  }, []);

  // =========================================
  // LOGIN
  // =========================================

  const login = (store) => {

    localStorage.setItem(
      EINVOICE_AUTH_KEY,
      JSON.stringify(store)
    );

    setToken(store.token);

    setCompanyId(store.companyId);

    setUserGstin(store.userGstin);

    setLastIrn(store.irn || null);

    setLastDocNo(store.docNo || null);

    setLastDocDate(
      store.docDate || null
    );

    setLastDocType(
      store.docType || null
    );

  };

  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {

    localStorage.removeItem(
      EINVOICE_AUTH_KEY
    );

    setToken(null);

    setCompanyId(null);

    setUserGstin(null);

    setLastIrn(null);

    setLastDocNo(null);

    setLastDocDate(null);

    setLastDocType(null);

  };

  // =========================================
  // LOGIN STATUS
  // =========================================

  const isLoggedIn = !!token;

  return (

    <EinvoiceAuthContext.Provider
      value={{

        token,

        isLoggedIn,

        companyId,

        userGstin,

        ready,

        lastIrn,

        lastDocNo,

        lastDocDate,

        lastDocType,

        setLastIrn,

        setLastDocNo,

        setLastDocDate,

        setLastDocType,

        login,

        logout

      }}
    >

      {children}

    </EinvoiceAuthContext.Provider>

  );

};

/* =========================================
   HOOK
========================================= */

export const useEinvoiceAuth = () => {

  const ctx =
    useContext(EinvoiceAuthContext);

  if (!ctx) {

    throw new Error(
      "useEinvoiceAuth must be used inside EinvoiceAuthProvider"
    );

  }

  return ctx;

};