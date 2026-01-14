// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { decodeToken, getUserRole } from '../utils/auth';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage to persist login across page refreshes
  const [token, setToken] = useState(localStorage.getItem('jwtToken') || null);
  const [role, setRole] = useState(null);
  
  const isAuthenticated = useMemo(() => !!token, [token]);

  // Effect to decode token and set role when the token changes
  useEffect(() => {
    if (token) {
      const payload = decodeToken(token);
      const userRole = getUserRole(payload);
      setRole(userRole);
      localStorage.setItem('jwtToken', token);
    } else {
      setRole(null);
      localStorage.removeItem('jwtToken');
    }
  }, [token]);

  // Function to handle successful login
  const login = (jwtToken) => {
    setToken(jwtToken);
  };

  // Function to handle logout
  const logout = () => {
    setToken(null);
  };

  const contextValue = useMemo(() => ({
    isAuthenticated, 
    token, 
    role, 
    login, 
    logout
  }), [isAuthenticated, token, role]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};