import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { config } from 'dotenv'
import path from 'path'

// Load .env.local from apps/frontend for integration tests
config({ path: path.resolve(__dirname, '.env.local') })

// Polyfill for Radix UI (JSDOM compatibility)
// See: https://github.com/radix-ui/primitives/issues/1822
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function () {
      return false
    }
  }

  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function () {
      // no-op
    }
  }

  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function () {
      // no-op
    }
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function () {
      // no-op
    }
  }
}

// Polyfill for ResizeObserver (used by Radix Popover/Select)
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Store original fetch for integration tests
const originalFetch = global.fetch

// Mock global fetch for test environment
// Only mock specific test scenarios, not Supabase requests
global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString()

  // Let Supabase requests through (for integration tests)
  if (url.includes('supabase.co') || url.includes('localhost:54321')) {
    return originalFetch(input, init)
  }

  // Mock successful responses for warehouse APIs (unit tests only)
  if (url.includes('/api/warehouse/license-plates/') && init?.method === 'PUT') {
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} }),
    } as Response
  }

  // Default successful response for non-Supabase requests
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
  } as Response
}

// Cleanup after each test
afterEach(() => {
  cleanup()
})
