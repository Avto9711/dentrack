import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: Profile | null;
  profileLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface Profile {
  id: string;
  role: string | null;
  full_name: string | null;
  clinic_id?: string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile(userId: string) {
      setProfileLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name, clinic_id')
        .eq('id', userId)
        .single();
      if (cancelled) return;
      if (error) {
        console.error('Failed to fetch profile', error);
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
      setProfileLoading(false);
    }

    if (session?.user?.id) {
      loadProfile(session.user.id);
    } else {
      setProfile(null);
      setProfileLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      profile,
      profileLoading,
      isAdmin: (profile?.role ?? '').toLowerCase() === 'admin',
      async signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signOut() {
        await supabase.auth.signOut();
        setProfile(null);
      },
    }),
    [session, loading, profile, profileLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
