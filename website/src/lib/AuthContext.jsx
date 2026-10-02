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

  // Ask the browser for one GPS fix (used only when the school restricts
  // teacher sign-in to the school premises — see server-side geofence).
  const getPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Location is not available in this browser.'));
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) => reject(new Error(
        e && e.code === 1
          ? 'Location access is required to sign in from here. Please allow location for this site and try again.'
          : 'We could not determine your location. Please move somewhere with a clear signal and try again.'
      )),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });

  const login = async (email, password) => {
    const attempt = (extra) => api('/auth/signin', { method: 'POST', body: { email, password, ...(extra || {}) } });
    let data;
    try {
      data = await attempt();
    } catch (e) {
      // School premises restriction → get a location fix and retry once.
      if (e && e.code === 'location_required') {
        const coords = await getPosition(); // throws a friendly message on denial/failure
        data = await attempt(coords); // may still 403 if genuinely out of range
      } else {
        throw e;
      }
    }
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

  // Teacher self-registration → creates a PENDING account for the school
  // office to approve. No token is issued until approved.
  const registerTeacher = async ({ name, email, password, phone, position }) => {
    const data = await api('/portal/register-teacher', {
      method: 'POST',
      body: { name, email, password, phone, position },
    });
    return data; // { pending: true, message }
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
      registerTeacher,
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
