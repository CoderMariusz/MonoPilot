import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  },
};

export default nextConfig;
