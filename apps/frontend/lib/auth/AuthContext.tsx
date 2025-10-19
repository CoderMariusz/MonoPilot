'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase/client-browser';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string, role: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip auth if using mock data
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        }
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_OUT' || !session?.user) {
        setProfile(null);
        setUser(null);
        setSession(null);
      } else if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check session validity on page focus/visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && user) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          console.log('Session expired, signing out');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Listen for storage changes (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = async (e: StorageEvent) => {
      if (e.key?.startsWith('sb-') && e.newValue === null) {
        console.log('Auth data cleared in another tab, signing out');
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    };

    const handleFocus = async () => {
      if (user) {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          console.log('Session expired on focus, signing out');
          setSession(null);
          setUser(null);
          setProfile(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Handle specific RLS errors
        if (error.code === '42P17') {
          console.error('RLS infinite recursion detected. This should be fixed by the updated policies.');
        }
        
        // Don't set profile to null on error, keep existing profile if any
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string, role: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            role,
          },
        },
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
    }
    // Clear state immediately
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  // Debug logging
  useEffect(() => {
    console.log('Auth State:', { user: !!user, profile: !!profile, loading, role: profile?.role });
  }, [user, profile, loading]);

  const isAdmin = profile?.role === 'Admin';
  const hasRole = (role: string) => profile?.role === role;

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
