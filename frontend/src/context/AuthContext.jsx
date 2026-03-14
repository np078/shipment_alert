import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('shipAlert_token');
    const savedUser = localStorage.getItem('shipAlert_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const loginSuccess = (tokenVal, userVal) => {
    setToken(tokenVal);
    setUser(userVal);
    localStorage.setItem('shipAlert_token', tokenVal);
    localStorage.setItem('shipAlert_user', JSON.stringify(userVal));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shipAlert_token');
    localStorage.removeItem('shipAlert_user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginSuccess, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
