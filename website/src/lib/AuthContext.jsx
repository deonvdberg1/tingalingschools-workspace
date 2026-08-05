import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { api, getToken, setToken } from './api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState(null);

  const checkUserAuth = useCallback(async () => {
    if (!getToken()) {
      setIsLoadingAuth(false);
      setAuthChecked(true);
      return;
    }
    try {
      const me = await api('/auth/me');
      setUser(me);
      setAuthError(null);
    } catch (e) {
      setUser(null);
      setAuthError({ type: 'auth_failed', message: e.message });
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    checkUserAuth();
  }, [checkUserAuth]);

  const login = async (email, password) => {
    const data = await api('/auth/signin', { method: 'POST', body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    setAuthError(null);
    return data.user;
  };

  const registerParent = async ({ name, email, password, child_name }) => {
    const data = await api('/portal/register-parent', {
      method: 'POST',
      body: { name, email, password, child_name },
    });
    setToken(data.token);
    setUser(data.user);
    setAuthError(null);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoadingAuth,
      authChecked,
      authError,
      login,
      registerParent,
      logout,
      checkUserAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
