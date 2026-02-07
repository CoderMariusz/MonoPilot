import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['@supabase/ssr', '@supabase/supabase-js'],
  outputFileTracingRoot: path.join(__dirname, '../../'),
  typescript: {
    // Temporarily ignore TypeScript errors during build
    // Remove once all type issues are resolved
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/shipping/orders',
        destination: '/shipping/sales-orders',
        permanent: true,
      },
      {
        source: '/shipping/orders/:path*',
        destination: '/shipping/sales-orders/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
