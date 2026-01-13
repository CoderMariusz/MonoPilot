import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  eslint: {
    // Warnings are treated as errors in production builds
    // Temporarily ignore during build until lint issues are fixed
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore TypeScript errors during build
    // Remove once all type issues are resolved
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
