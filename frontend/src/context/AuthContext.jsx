import { createContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/hospitoApi';

export const AuthContext = createContext(null);

function safeLoadUserFromStorage() {
  try {
    const raw = localStorage.getItem('hospito_user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('hospito_user');
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('hospito_token'));
  const [user, setUser] = useState(() => safeLoadUserFromStorage());

  useEffect(() => {
    if (token) {
      localStorage.setItem('hospito_token', token);
    } else {
      localStorage.removeItem('hospito_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('hospito_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hospito_user');
    }
  }, [user]);

  const login = async ({ email, password, code }) => {
    const challenge = await authApi.loginStart({ email, password });
    const response = await authApi.loginVerify({
      challengeToken: challenge.challengeToken,
      code,
    });

    setToken(response.accessToken);
    setUser(response.user);
    return response;
  };

  const register = (payload) => authApi.register(payload);
  const verifyRegistrationTotp = (payload) => authApi.verifyRegistrationTotp(payload);

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      verifyRegistrationTotp,
      logout,
    }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
