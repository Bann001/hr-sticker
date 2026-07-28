import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface PageSetting {
  page_id: string;
  visible: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  pageSettings: PageSetting[];
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string, role?: string) => Promise<{ error: AuthError | null }>;
  deleteUser: (userId: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  refreshPageSettings: () => Promise<void>;
  togglePageVisibility: (pageId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageSettings, setPageSettings] = useState<PageSetting[]>([]);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    return data as Profile | null;
  }, []);

  const fetchPageSettings = useCallback(async () => {
    const { data } = await supabase.from('page_settings').select('*');
    if (data) setPageSettings(data as PageSetting[]);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const p = await fetchProfile(user.id);
    if (p) setProfile(p);
  }, [user, fetchProfile]);

  const refreshPageSettings = useCallback(async () => {
    await fetchPageSettings();
  }, [fetchPageSettings]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).then(p => {
          setProfile(p);
          setLoading(false);
        });
        fetchPageSettings();
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        fetchProfile(s.user.id).then(p => setProfile(p));
        fetchPageSettings();
      } else {
        setProfile(null);
        setPageSettings([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchPageSettings]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  }, []);

  const createUser = useCallback(async (email: string, password: string, role: string = 'user') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role } },
    });
    if (!error) await fetchPageSettings();
    return { error };
  }, [fetchPageSettings]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) return { error: new Error(error.message) };
      return { error: null };
    } catch (e) {
      return { error: e instanceof Error ? e : new Error('Unknown error') };
    }
  }, []);

  const togglePageVisibility = useCallback(async (pageId: string) => {
    const current = pageSettings.find(p => p.page_id === pageId);
    const newVisible = !current?.visible;
    const { error } = await supabase
      .from('page_settings')
      .upsert({ page_id: pageId, visible: newVisible, updated_at: new Date().toISOString() });
    if (!error) {
      setPageSettings(prev =>
        prev.map(p => p.page_id === pageId ? { ...p, visible: newVisible } : p)
      );
    }
  }, [pageSettings]);

  const isAdmin = profile?.role === 'admin';

  const isPageVisible = useCallback((pageId: string) => {
    if (isAdmin) return true;
    const setting = pageSettings.find(p => p.page_id === pageId);
    return setting?.visible ?? true;
  }, [isAdmin, pageSettings]);

  return (
    <AuthContext.Provider value={{
      user, profile, session, loading, pageSettings, isAdmin,
      signIn, signOut, createUser, deleteUser,
      refreshProfile, refreshPageSettings, togglePageVisibility,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function usePageVisibility() {
  const { pageSettings, isAdmin } = useAuth();
  return useCallback((pageId: string) => {
    if (isAdmin) return true;
    const setting = pageSettings.find(p => p.page_id === pageId);
    return setting?.visible ?? true;
  }, [isAdmin, pageSettings]);
}
