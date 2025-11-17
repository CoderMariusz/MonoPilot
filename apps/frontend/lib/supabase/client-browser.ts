'use client';

import { createBrowserClient } from '@supabase/ssr';
import { API_CONFIG } from '../api/config';

// Create browser client with proper cookie handling for Next.js 15
export const supabase = createBrowserClient(
  API_CONFIG.supabaseUrl,
  API_CONFIG.supabaseAnonKey,
  {
    cookies: {
      get(name: string) {
        // Read cookie from document.cookie
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
          const cookie = parts.pop()?.split(';').shift();
          return cookie || null;
        }
        return null;
      },
      set(name: string, value: string, options: any) {
        // Set cookie via document.cookie
        let cookie = `${name}=${value}`;
        if (options?.maxAge) cookie += `; max-age=${options.maxAge}`;
        if (options?.path) cookie += `; path=${options.path}`;
        if (options?.domain) cookie += `; domain=${options.domain}`;
        if (options?.sameSite) cookie += `; samesite=${options.sameSite}`;
        if (options?.secure) cookie += '; secure';
        document.cookie = cookie;
      },
      remove(name: string, options: any) {
        // Remove cookie by setting max-age to 0
        let cookie = `${name}=; max-age=0`;
        if (options?.path) cookie += `; path=${options.path}`;
        if (options?.domain) cookie += `; domain=${options.domain}`;
        document.cookie = cookie;
      },
    },
  }
);

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return !!(API_CONFIG.supabaseUrl && API_CONFIG.supabaseAnonKey && API_CONFIG.supabaseUrl !== 'your-supabase-url');
};
