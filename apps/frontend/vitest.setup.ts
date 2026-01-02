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

// Mock global fetch to handle relative URLs in test environment
// This resolves "Failed to parse URL" errors when using fetch('/api/...')
const originalFetch = global.fetch
global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  // Convert relative URLs to absolute URLs for testing
  if (typeof input === 'string' && input.startsWith('/')) {
    input = `http://localhost:3000${input}`
  }
  return originalFetch(input, init)
}

// Cleanup after each test
afterEach(() => {
  cleanup()
})
