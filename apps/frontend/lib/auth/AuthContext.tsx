'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/client-browser';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Simplified AuthProvider
 *
 * Responsibilities:
 * - Manage user session state
 * - Provide sign in/out functions
 * - Listen for auth state changes
 *
 * REMOVED (use separate hooks instead):
 * - User profile state (use useUserProfile hook)
 * - Session state (redundant with user)
 * - Visibility change listeners (unnecessary complexity)
 * - Storage change listeners (Supabase handles this)
 * - Focus listeners (Supabase handles this)
 * - Role/permission checks (do at page level)
 *
 * Benefits:
 * - Single useEffect (no race conditions)
 * - Clean lifecycle
 * - Easy to test
 * - On-demand profile fetching
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('AuthContext - Error getting session:', error);
        setUser(null);
      } else {
        setUser(session?.user ?? null);
      }
      setLoading(false);
    });

    // 2. Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('AuthContext - Auth state change:', event, session?.user?.id);
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      // Update last_login and create session record
      try {
        // Get user profile to get name and org_id
        const { data: userData } = await supabase
          .from('users')
          .select('name, org_id')
          .eq('id', data.user.id)
          .single();

        if (userData) {
          const now = new Date().toISOString();

          // Update last_login
          const { error: updateError } = await supabase
            .from('users')
            .update({ last_login: now })
            .eq('id', data.user.id);

          if (updateError) {
            console.error('Error updating last_login:', updateError);
          }

          // Insert session record
          const { error: sessionError } = await supabase.from('sessions').insert({
            org_id: userData.org_id,
            user_id: data.user.id,
            user_name: userData.name,
            ip_address: 'Browser',
            location: 'Web App',
            device: navigator.userAgent.substring(0, 100),
            login_time: now,
            status: 'Active'
          });

          if (sessionError) {
            console.error('Error creating session:', sessionError);
          }
        }
      } catch (err) {
        console.error('Error in post-login tasks:', err);
        // Don't fail login if these tasks fail
      }
    }

    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    // Profile is created automatically by database trigger (handle_new_user)
    // No need to manually insert into users table

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
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
