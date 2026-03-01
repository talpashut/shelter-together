import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { UserProfile } from './types';
import { store } from './store';

interface AuthContextValue {
  profile: UserProfile | null;
  loading: boolean;
  createProfile: (name: string, city: string, avatar: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(store.getProfile());
  const [loading, setLoading] = useState(!store.ready);

  useEffect(() => {
    return store.subscribe(() => {
      setProfile(store.getProfile());
      setLoading(!store.ready);
    });
  }, []);

  const createProfile = useCallback(async (name: string, city: string, avatar: string) => {
    const p = await store.createProfile(name, city, avatar);
    setProfile(p);
  }, []);

  const logout = useCallback(() => {
    store.logout();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ profile, loading, createProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}
