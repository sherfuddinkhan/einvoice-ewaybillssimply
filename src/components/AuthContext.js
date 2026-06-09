import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

/* ---------------- STORAGE KEYS ---------------- */
const EWAY_KEY = "iris_ewaybill_shared_config";
const EINVOICE_KEY = "iris_einvoice_response";

/* ---------------- TOKEN VALIDATION ---------------- */
const isTokenValid = (token) => {
  try {
    if (!token) return false;
    const decoded = jwtDecode(token);
    const now = Date.now() / 1000;
    return decoded.exp && decoded.exp > now;
  } catch (err) {
    return false;
  }
};

export const AuthProvider = ({ children }) => {
  /* ---------------- AUTH STATE ---------------- */
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [product, setProduct] = useState(null);
  const [token, setToken] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  /* ---------------- LAST USED DATA ---------------- */
  const [lastUserGstin, setLastUserGstin] = useState(null);
  const [lastIrn, setLastIrn] = useState(null);
  const [lastDocNo, setLastDocNo] = useState(null);
  const [lastDocDate, setLastDocDate] = useState(null);
  const [lastDocType, setLastDocType] = useState(null);

  /* ---------------- CLEAR SESSION ---------------- */
  const clearSession = () => {
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
  };

  /* ---------------- RESTORE SESSION ---------------- */
  useEffect(() => {
    const eway = localStorage.getItem(EWAY_KEY);
    const einv = localStorage.getItem(EINVOICE_KEY);

    const restore = (data, type) => {
      if (!data?.token || !isTokenValid(data.token)) {
        return null;
      }

      return data;
    };

    try {
      if (eway) {
        const data = restore(JSON.parse(eway), "EWAY");

        if (data) {
          setToken(data.token);
          setCompanyId(data.companyId);
          setLastUserGstin(data.userGstin || null);
          setProduct("EWAY");
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem(EWAY_KEY);
        }
      }

      if (einv) {
        const data = restore(JSON.parse(einv), "EINVOICE");

        if (data) {
          setToken(data.token);
          setCompanyId(data.companyId);
          setLastUserGstin(data.userGstin || null);
          setLastIrn(data.irn || null);
          setLastDocNo(data.docNo || null);
          setLastDocDate(data.docDate || null);
          setLastDocType(data.docType || null);
          setProduct("EINVOICE");
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem(EINVOICE_KEY);
        }
      }
    } catch (err) {
      clearSession();
    }

    setIsAuthReady(true);
  }, []);

  /* ---------------- LOGIN ---------------- */
  const login = (store, productType) => {
    const key = productType === "EINVOICE" ? EINVOICE_KEY : EWAY_KEY;

    const payload = {
      ...store,
      loginTime: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(payload));

    setToken(store.token);
    setCompanyId(store.companyId);

    setLastUserGstin(store.userGstin || null);
    setLastIrn(store.irn || null);
    setLastDocNo(store.docNo || null);
    setLastDocDate(store.docDate || null);
    setLastDocType(store.docType || null);

    setProduct(productType);
    setIsLoggedIn(true);
  };

  /* ---------------- LOGOUT ---------------- */
  const logout = () => {
    clearSession();
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

        lastUserGstin,
        lastIrn,
        lastDocNo,
        lastDocDate,
        lastDocType,

        setLastUserGstin,
        setLastIrn,
        setLastDocNo,
        setLastDocDate,
        setLastDocType,

        login,
        logout,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* ---------------- HOOK ---------------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};