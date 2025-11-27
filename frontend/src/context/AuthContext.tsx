'use client';
import { createContext, useContext, useEffect, useState } from 'react';

type AuthContextType = {
  isLoggedIn: boolean;
  isLoading: boolean; // New loading state
  login: (token: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Start as loading

  useEffect(() => {
    // Check for token immediately when app loads
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
    setIsLoading(false); // Check complete
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);