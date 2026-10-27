import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api, clearSession, getStoredUser, saveSession } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);

  const login = useCallback(async (email, password) => {
    const { usuario, token } = await api.post('/auth/login', { email, password });
    saveSession(token, usuario);
    setUser(usuario);
    return usuario;
  }, []);

  const register = useCallback(async (payload) => {
    const { usuario, token } = await api.post('/auth/registro', payload);
    saveSession(token, usuario);
    setUser(usuario);
    return usuario;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  // RF-18: revoking the Ley 1581 authorization deactivates the account.
  const revokeAuthorization = useCallback(async () => {
    await api.delete('/auth/autorizacion');
    clearSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout, revokeAuthorization }),
    [user, login, register, logout, revokeAuthorization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
}
