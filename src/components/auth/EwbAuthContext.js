// src/auth/EwbAuthContext.js

import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

/* =========================================
   LOCAL STORAGE KEY
========================================= */

const EWB_KEY =
  "iris_auth_eway";

/* =========================================
   CONTEXT
========================================= */

const EwbAuthContext =
  createContext(null);

/* =========================================
   PROVIDER
========================================= */

export const EwbAuthProvider = ({
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

  const [ready, setReady] =
    useState(false);

  // =========================================
  // RESTORE SESSION
  // =========================================

  useEffect(() => {

    const raw =
      localStorage.getItem(EWB_KEY);

    if (raw) {

      const data = JSON.parse(raw);

      setToken(data.token);

      setCompanyId(data.companyId);

      setUserGstin(data.userGstin);

    }

    setReady(true);

  }, []);

  // =========================================
  // LOGIN
  // =========================================

  const login = (store) => {

    localStorage.setItem(
      EWB_KEY,
      JSON.stringify(store)
    );

    setToken(store.token);

    setCompanyId(store.companyId);

    setUserGstin(store.userGstin);

  };

  // =========================================
  // LOGOUT
  // =========================================

  const logout = () => {

    localStorage.removeItem(EWB_KEY);

    setToken(null);

    setCompanyId(null);

    setUserGstin(null);

  };

  // =========================================
  // LOGIN STATUS
  // =========================================

  const isLoggedIn = !!token;

  return (

    <EwbAuthContext.Provider
      value={{

        token,

        isLoggedIn,

        companyId,

        userGstin,

        ready,

        login,

        logout

      }}
    >

      {children}

    </EwbAuthContext.Provider>

  );

};

/* =========================================
   HOOK
========================================= */

export const useEwbAuth = () => {

  const ctx =
    useContext(EwbAuthContext);

  if (!ctx) {

    throw new Error(
      "useEwbAuth must be used inside EwbAuthProvider"
    );

  }

  return ctx;

};