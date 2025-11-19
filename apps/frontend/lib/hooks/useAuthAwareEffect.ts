'use client';

import { useEffect, DependencyList } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';

/**
 * A hook that runs an effect only after auth is initialized.
 * This prevents making API calls before the auth session is ready,
 * which can cause RLS policy errors in Supabase.
 *
 * @param effect - The effect function to run
 * @param deps - Dependencies array (not including auth loading state)
 */
export function useAuthAwareEffect(
  effect: () => void | (() => void),
  deps: DependencyList = []
) {
  const { loading: authLoading } = useAuth();

  useEffect(() => {
    // Only run the effect if auth is initialized
    if (!authLoading) {
      console.log('[useAuthAwareEffect] Auth ready, running effect');
      return effect();
    } else {
      console.log('[useAuthAwareEffect] Auth still loading, waiting...');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, ...deps]);
}


