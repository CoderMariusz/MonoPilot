import react from '@vitejs/plugin-react'
import path from 'path'
import { loadEnv } from 'vite'

export default ({ mode }: { mode: string }) => {
  // Load env file from apps/frontend directory
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, __dirname, '')

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
        // Pass through all env vars to tests
        NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  }
}
