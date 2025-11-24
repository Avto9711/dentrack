import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '@/lib/supabaseClient';
import type { UserRole } from '@/types/domain';

interface AuthProfile {
  id: string;
  fullName: string;
  role: UserRole;
  clinicId?: string | null;
}

interface AuthContextValue {
  profile: AuthProfile | null;
  isBootstrapping: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const STORAGE_KEY = 'dentrack-auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isBootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setProfile(JSON.parse(stored));
      } catch (error) {
        console.warn('Failed to parse stored auth session', error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setBootstrapping(false);
  }, []);

  const logout = useCallback(() => {
    setProfile(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername || !password) {
      throw new Error('Ingresa usuario y contraseña');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, clinic_id, password_hash, username')
      .ilike('username', normalizedUsername)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Usuario o contraseña inválidos');
    }

    const isValid = await bcrypt.compare(password, data.password_hash);
    if (!isValid) {
      throw new Error('Usuario o contraseña inválidos');
    }

    const authProfile: AuthProfile = {
      id: data.id,
      fullName: data.full_name,
      role: data.role,
      clinicId: data.clinic_id,
    };

    setProfile(authProfile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authProfile));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ profile, isBootstrapping, login, logout }),
    [profile, isBootstrapping, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
