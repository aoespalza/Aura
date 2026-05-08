import { createContext, useContext, useState } from 'react';
import { auraApi } from '../api/auraApi';

interface AuthCtx {
  isAuth: boolean;
  role: 'him' | 'her' | null;
  login: (pin: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({ isAuth: false, role: null, login: async () => {}, logout: () => {} });

function getSavedRole(): 'him' | 'her' | null {
  const r = localStorage.getItem('aura_role');
  return r === 'him' || r === 'her' ? r : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('aura_token'));
  const [role, setRole] = useState<'him' | 'her' | null>(getSavedRole);

  const login = async (pin: string) => {
    const { token, role: r } = await auraApi.login(pin);
    localStorage.setItem('aura_token', token);
    localStorage.setItem('aura_role', r);
    setRole(r);
    setIsAuth(true);
  };

  const logout = () => {
    localStorage.removeItem('aura_token');
    localStorage.removeItem('aura_role');
    setIsAuth(false);
    setRole(null);
  };

  return <Ctx.Provider value={{ isAuth, role, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
