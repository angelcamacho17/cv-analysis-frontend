/**
 * Authentication Context
 * Simple token-based authentication
 */

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { environment } from '../config/environment';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    // Initialize token from storage or environment
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      return storedToken;
    } else if (environment.adminToken) {
      localStorage.setItem('authToken', environment.adminToken);
      return environment.adminToken;
    }
    return null;
  });

  const login = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('authToken');
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
