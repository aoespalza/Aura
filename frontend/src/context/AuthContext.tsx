import { createContext, useContext, useState, useEffect } from 'react';
import { auraApi } from '../api/auraApi';

interface AuthCtx { isAuth: boolean; login: (pin: string) => Promise<void>; logout: () => void; }
const Ctx = createContext<AuthCtx>({ isAuth: false, login: async () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('aura_token'));

  const login = async (pin: string) => {
    const { token } = await auraApi.login(pin);
    localStorage.setItem('aura_token', token);
    setIsAuth(true);
  };

  const logout = () => { localStorage.removeItem('aura_token'); setIsAuth(false); };

  return <Ctx.Provider value={{ isAuth, login, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
