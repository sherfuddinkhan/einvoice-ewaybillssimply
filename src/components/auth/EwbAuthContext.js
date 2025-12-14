const EWB_KEY = "iris_auth_eway";

export const EwbAuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [userGstin, setUserGstin] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(EWB_KEY) || "null");
    if (data) {
      setToken(data.token);
      setCompanyId(data.companyId);
      setUserGstin(data.userGstin);
    }
    setReady(true);
  }, []);

  const login = (store) => {
    localStorage.setItem(EWB_KEY, JSON.stringify(store));
    setToken(store.token);
    setCompanyId(store.companyId);
    setUserGstin(store.userGstin);
  };

  const logout = () => {
    localStorage.removeItem(EWB_KEY);
    setToken(null);
    setCompanyId(null);
    setUserGstin(null);
  };

  return (
    <EwbAuthContext.Provider value={{ token, companyId, userGstin, ready, login, logout }}>
      {children}
    </EwbAuthContext.Provider>
  );
};
