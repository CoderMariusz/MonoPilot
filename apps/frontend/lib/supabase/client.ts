'use client';

import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../api/config';

export const supabase = createClient(API_CONFIG.supabaseUrl, API_CONFIG.supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(API_CONFIG.supabaseUrl && API_CONFIG.supabaseAnonKey && API_CONFIG.supabaseUrl !== 'your-supabase-url');
};
