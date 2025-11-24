import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
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
  session: Session | null;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isBootstrapping, setBootstrapping] = useState(true);
  const [isLoadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session ?? null);
      setBootstrapping(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setLoadingProfile(true);
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, clinic_id')
        .eq('id', session.user!.id)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        setProfile(null);
      } else {
        setProfile({
          id: data.id,
          fullName: data.full_name,
          role: data.role,
          clinicId: data.clinic_id,
        });
      }
      setLoadingProfile(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      throw new Error('Ingresa correo y contraseña');
    }
    const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
    if (error) {
      throw new Error(error.message || 'No se pudo iniciar sesión');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ profile, session, isBootstrapping: isBootstrapping || isLoadingProfile, login, logout }),
    [profile, session, isBootstrapping, isLoadingProfile, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
