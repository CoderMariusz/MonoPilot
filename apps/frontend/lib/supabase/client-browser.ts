'use client';

import { createBrowserClient } from '@supabase/ssr';
import { API_CONFIG } from '../api/config';

export const supabase = createBrowserClient(
  API_CONFIG.supabaseUrl,
  API_CONFIG.supabaseAnonKey
);

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(API_CONFIG.supabaseUrl && API_CONFIG.supabaseAnonKey && API_CONFIG.supabaseUrl !== 'your-supabase-url');
};
