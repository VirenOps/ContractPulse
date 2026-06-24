import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Optional: Fetch current user profile metadata using the token
    if (token) {
      localStorage.setItem('token', token);
      // Mock parsing the user out of a JWT for UI display
      setUser({ email: 'user@company.com', name: 'John Doe', companyId: 'company-uuid-101' });
    } else {
      localStorage.removeItem('token');
      setUser(null);
    }
    setIsLoading(false);
  }, [token]);

  const login = (jwtToken) => setToken(jwtToken);
  const logout = () => setToken(null);

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);