import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

const EWAY_KEY = "iris_eway_session";
const EINVOICE_KEY = "iris_einvoice_session";

/* ==========================
   TOKEN VALIDATION
========================== */

const isTokenValid = (token) => {
  try {
    if (!token) return false;

    const decoded = jwtDecode(token);

    return decoded.exp > Date.now() / 1000;
  } catch {
    return false;
  }
};

/* ==========================
   GET ITEM FROM LOCAL OR SESSION
========================== */

const getStoredItem = (key) =>
  localStorage.getItem(key) || sessionStorage.getItem(key);

export const AuthProvider = ({ children }) => {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [product, setProduct] = useState(null);

  const [token, setToken] = useState(null);

  const [companyId, setCompanyId] = useState(null);

  const [userGstin, setUserGstin] = useState(null);

  const [lastIrn, setLastIrn] = useState(null);

  const [lastDocNo, setLastDocNo] = useState(null);

  const [lastDocDate, setLastDocDate] = useState(null);

  const [lastDocType, setLastDocType] = useState(null);

  /* ==========================
     CLEAR SESSION
  ========================== */

  const clearSession = useCallback(() => {
    // Session Storage

    sessionStorage.removeItem(EWAY_KEY);
    sessionStorage.removeItem(EINVOICE_KEY);
    sessionStorage.removeItem("authResponse");

    // Local Storage

    localStorage.removeItem(EWAY_KEY);
    localStorage.removeItem(EINVOICE_KEY);

    localStorage.removeItem("token");
    localStorage.removeItem("companyId");
    localStorage.removeItem("authToken");
    localStorage.removeItem("authResponse");
    localStorage.removeItem("connectionType");
    localStorage.removeItem("yearName");

    setIsLoggedIn(false);
    setProduct(null);
    setToken(null);
    setCompanyId(null);
    setUserGstin(null);

    setLastIrn(null);
    setLastDocNo(null);
    setLastDocDate(null);
    setLastDocType(null);
  }, []);

  /* ==========================
     LOGOUT
  ========================== */

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  /* ==========================
     LOGIN
  ========================== */

  const login = (loginData, productType) => {
    const storage = loginData.rememberMe
      ? localStorage
      : sessionStorage;

    const storageKey =
      productType === "EINVOICE"
        ? EINVOICE_KEY
        : EWAY_KEY;

    const payload = {
      ...loginData,
      product: productType,
      loginTime: Date.now(),
    };

    storage.setItem(
      storageKey,
      JSON.stringify(payload)
    );

    setToken(loginData.token);
    setCompanyId(loginData.companyId);
    setUserGstin(loginData.userGstin);

    setProduct(productType);
    setIsLoggedIn(true);
  };

  /* ==========================
     RESTORE SESSION
  ========================== */

  useEffect(() => {
    try {
      const eway = getStoredItem(EWAY_KEY);

      const einvoice =
        getStoredItem(EINVOICE_KEY);

      let sessionData = null;
      let sessionProduct = null;

      if (eway) {
        sessionData = JSON.parse(eway);
        sessionProduct = "EWAY";
      }

      if (einvoice) {
        sessionData = JSON.parse(einvoice);
        sessionProduct = "EINVOICE";
      }

      if (
        sessionData &&
        isTokenValid(sessionData.token)
      ) {
        setToken(sessionData.token);

        setCompanyId(sessionData.companyId);

        setUserGstin(sessionData.userGstin);

        setLastIrn(sessionData.irn || null);

        setLastDocNo(sessionData.docNo || null);

        setLastDocDate(sessionData.docDate || null);

        setLastDocType(sessionData.docType || null);

        setProduct(sessionProduct);

        setIsLoggedIn(true);
      } else {
        clearSession();
      }
    } catch {
      clearSession();
    }

    setIsAuthReady(true);
  }, [clearSession]);

  /* ==========================
     AUTO LOGOUT ON TOKEN EXPIRY
  ========================== */

  useEffect(() => {
    if (!token) return;

    try {
      const decoded = jwtDecode(token);

      const expiryTime = decoded.exp * 1000;

      const remainingTime =
        expiryTime - Date.now();

      if (remainingTime <= 0) {
        logout();
        return;
      }

      const timer = setTimeout(() => {
        logout();
      }, remainingTime);

      return () => clearTimeout(timer);
    } catch {
      logout();
    }
  }, [token, logout]);

  return (
    <AuthContext.Provider
      value={{
        isAuthReady,
        isLoggedIn,
        product,
        token,
        companyId,
        userGstin,
        lastIrn,
        lastDocNo,
        lastDocDate,
        lastDocType,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};