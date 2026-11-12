import { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

function load() {
  try {
    const raw = localStorage.getItem('alfred-session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(load);

  const login = useCallback((token, userId, name) => {
    const s = { token, userId, name };
    localStorage.setItem('alfred-session', JSON.stringify(s));
    setSession(s);
  }, []);

  const updateName = useCallback((name) => {
    setSession(prev => {
      const s = { ...prev, name };
      localStorage.setItem('alfred-session', JSON.stringify(s));
      return s;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('alfred-session');
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, updateName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
