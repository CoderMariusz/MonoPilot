import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Load env from .env.local
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      include: [
        '**/__tests__/**/*.test.{ts,tsx}',
        '**/lib/**/__tests__/**/*.test.{ts,tsx}',
      ],
      exclude: ['node_modules', '.next', 'dist'],
      env: {
        NODE_ENV: "test",
        VITEST: "true",
        // Load from .env.local
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
        '@tests': path.resolve(__dirname, '../../tests'),
      },
    },
  }
})
