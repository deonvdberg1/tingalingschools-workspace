import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/supabase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAuth();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const checkAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await auth.me();
      setUser(currentUser);
      setIsAuthenticated(!!currentUser);
      setAuthError(null);
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    await auth.signOut();
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/?login=true';
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      authError,
      logout,
      navigateToLogin,
      checkAuth
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
