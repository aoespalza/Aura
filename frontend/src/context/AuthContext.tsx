import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auraApi, type AuthUser, type CoupleInfo } from '../api/auraApi';

interface AuthCtx {
  isAuth: boolean;
  loading: boolean;
  user: AuthUser | null;
  couple: CoupleInfo | null;
  hasCouple: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  refresh: () => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx>({
  isAuth: false, loading: true, user: null, couple: null, hasCouple: false,
  login: async () => {}, register: async () => {}, refresh: async () => {}, logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuth, setIsAuth] = useState(() => !!localStorage.getItem('aura_token'));
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [couple, setCouple] = useState<CoupleInfo | null>(null);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem('aura_token')) { setLoading(false); return; }
    try {
      const { user, couple } = await auraApi.me();
      setUser(user);
      setCouple(couple);
      setIsAuth(true);
    } catch {
      // token inválido/expirado
      localStorage.removeItem('aura_token');
      setIsAuth(false); setUser(null); setCouple(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const applyAuth = (token: string) => {
    localStorage.setItem('aura_token', token);
  };

  const login = async (email: string, password: string) => {
    const { token } = await auraApi.login(email, password);
    applyAuth(token);
    await refresh();
  };

  const register = async (email: string, password: string, name?: string) => {
    const { token } = await auraApi.register(email, password, name);
    applyAuth(token);
    await refresh();
  };

  const logout = () => {
    localStorage.removeItem('aura_token');
    setIsAuth(false); setUser(null); setCouple(null);
  };

  return (
    <Ctx.Provider value={{
      isAuth, loading, user, couple, hasCouple: !!couple,
      login, register, refresh, logout,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
