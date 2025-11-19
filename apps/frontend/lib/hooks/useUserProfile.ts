'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabase/client-browser';
import type { User } from '../types';

/**
 * Hook for on-demand user profile fetching
 *
 * This hook fetches the user profile from the database when needed,
 * rather than storing it globally in AuthContext.
 *
 * Benefits:
 * - Profile only loaded when needed (not on every page)
 * - Easy to refetch if needed
 * - No global profile state to manage
 * - Clean separation of concerns
 *
 * Usage:
 * ```typescript
 * function ProfilePage() {
 *   const { profile, loading, error, refetch } = useUserProfile();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 *   if (!profile) return <div>No profile found</div>;
 *
 *   return <div>Welcome, {profile.name}!</div>;
 * }
 * ```
 */
export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('useUserProfile - Error fetching profile:', fetchError);
        setError(fetchError.message);
        setProfile(null);
      } else if (data) {
        setProfile(data as User);
      }
    } catch (err) {
      console.error('useUserProfile - Unexpected error:', err);
      setError('Failed to load profile');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      // Clear profile when user logs out
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    // Fetch profile when user is available
    fetchProfile(user.id);
  }, [user]);

  // Refetch function for manual profile refresh
  const refetch = () => {
    if (user) {
      fetchProfile(user.id);
    }
  };

  return {
    profile,
    loading,
    error,
    refetch,
  };
}
