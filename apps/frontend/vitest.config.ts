import react from '@vitejs/plugin-react'
import path from 'path'

export default {
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
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
}
