/**
 * Security Settings Page Tests
 * Story: 01.15 - Session & Password Management
 *
 * Tests for the Security Settings page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import SecurityPage from '../page'

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/settings/security',
}))

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null,
      }),
    },
  }),
}))

// Mock fetch for sessions API
global.fetch = vi.fn()

describe('SecurityPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock sessions API response
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        sessions: [
          {
            id: 'session-1',
            device_name: 'Chrome on Windows',
            device_type: 'desktop',
            browser: 'Chrome',
            os: 'Windows',
            ip_address: '192.168.1.1',
            last_activity_at: new Date().toISOString(),
            is_current: true,
          },
          {
            id: 'session-2',
            device_name: 'Safari on iPhone',
            device_type: 'mobile',
            browser: 'Safari',
            os: 'iOS',
            ip_address: '192.168.1.2',
            last_activity_at: new Date(Date.now() - 3600000).toISOString(),
            is_current: false,
          },
        ],
      }),
    })
  })

  it('renders the security page with header', async () => {
    render(<SecurityPage />)

    // Wait for auth check and loading to complete
    await waitFor(() => {
      expect(screen.getByText('Security Settings')).toBeInTheDocument()
    })
  })

  it('renders active sessions section', async () => {
    render(<SecurityPage />)

    await waitFor(() => {
      expect(screen.getByText('Active Sessions')).toBeInTheDocument()
    })
  })

  it('renders change password section', async () => {
    render(<SecurityPage />)

    await waitFor(() => {
      expect(screen.getByText('Change Password')).toBeInTheDocument()
    })
  })

  it('renders security tips section', async () => {
    render(<SecurityPage />)

    await waitFor(() => {
      expect(screen.getByText('Security Tips')).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<SecurityPage />)

    // Should show skeleton loaders initially
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })
})

describe('ActiveSessionsList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows sessions list after loading', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        sessions: [
          {
            id: 'session-1',
            device_name: 'Chrome on Windows',
            device_type: 'desktop',
            browser: 'Chrome',
            os: 'Windows',
            ip_address: '192.168.1.1',
            last_activity_at: new Date().toISOString(),
            is_current: true,
          },
        ],
      }),
    })

    render(<SecurityPage />)

    await waitFor(() => {
      expect(screen.getByText(/Chrome on Windows/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no sessions', async () => {
    ;(global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ sessions: [] }),
    })

    render(<SecurityPage />)

    await waitFor(() => {
      expect(screen.getByText(/No Active Sessions/i)).toBeInTheDocument()
    })
  })

  it('shows error state when API fails', async () => {
    ;(global.fetch as any).mockRejectedValue(new Error('API Error'))

    render(<SecurityPage />)

    await waitFor(() => {
      expect(screen.getByText(/Failed to load active sessions/i)).toBeInTheDocument()
    })
  })
})

describe('ChangePasswordForm', () => {
  it('renders password form fields', async () => {
    render(<SecurityPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/Current Password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/New Password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Confirm New Password/i)).toBeInTheDocument()
    })
  })

  it('shows password requirements', async () => {
    render(<SecurityPage />)

    await waitFor(() => {
      expect(screen.getByText(/At least 8 characters/i)).toBeInTheDocument()
      expect(screen.getByText(/One uppercase letter/i)).toBeInTheDocument()
      expect(screen.getByText(/One lowercase letter/i)).toBeInTheDocument()
      expect(screen.getByText(/One number/i)).toBeInTheDocument()
      expect(screen.getByText(/One special character/i)).toBeInTheDocument()
    })
  })
})
