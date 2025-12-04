import React, { createContext, useContext, useState, useEffect } from 'react';

// Using a placeholder constant since actual Firebase config/auth isn't visible.
const STORAGE_KEY = 'auth_token_for_proxy';

// 1. Create the Context
const AuthContext = createContext(null);

// 2. Custom Hook to use the Auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // This error indicates the component is used outside the provider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 3. Provider Component
export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  
  // Initialize state from local storage on mount
  useEffect(() => {
    // In a real Firebase/Canvas app, this is where onAuthStateChanged would run.
    // For this boilerplate, we check localStorage for a saved token.
    const token = localStorage.getItem(STORAGE_KEY);
    if (token) {
      setAuthToken(token);
      setIsLoggedIn(true);
    }
    setAuthReady(true);
  }, []);

  // Function to be called from the login page upon successful API login
  const login = (token) => {
    localStorage.setItem(STORAGE_KEY, token);
    setAuthToken(token);
    setIsLoggedIn(true);
  };

  // Function to handle logout
  const logout = () => {
    // Clear the token saved by the proxy login, but typically Firebase logout would handle this.
    localStorage.removeItem(STORAGE_KEY); 
    setAuthToken(null);
    setIsLoggedIn(false);
  };

  const contextValue = {
    isLoggedIn,
    authToken,
    authReady,
    login,
    logout,
  };

  if (!authReady) {
    // Optional: Render a loading state while checking initial auth status
    return <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      Loading Authentication...
    </div>;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the AuthProvider for wrapping the main App component
export default AuthProvider;