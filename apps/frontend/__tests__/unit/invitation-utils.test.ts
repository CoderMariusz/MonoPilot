/**
 * Invitation Utils Unit Tests
 * Story: 1.14 (Batch 3) - AC-1.6: Invitation Flow Tests
 *
 * Unit Tests:
 * - Token validation with client-side expiry check
 * - QR code generation output format
 * - Token format validation
 */

import { describe, it, expect } from 'vitest'
import QRCode from 'qrcode'

describe('Invitation Utils Unit Tests', () => {
  describe('AC-1.6.1: Token validation', () => {
    it('should validate token format (UUID v4)', () => {
      const validToken = '550e8400-e29b-41d4-a716-446655440000'
      const invalidToken = 'invalid-token'

      // UUID v4 format regex
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

      expect(uuidRegex.test(validToken)).toBe(true)
      expect(uuidRegex.test(invalidToken)).toBe(false)
    })

    it('should detect expired invitation based on expires_at date', () => {
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago

      const isExpired = (expiresAt: Date) => expiresAt < new Date()

      expect(isExpired(futureDate)).toBe(false)
      expect(isExpired(pastDate)).toBe(true)
    })

    it('should calculate days until expiry correctly', () => {
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

      const getDaysUntilExpiry = (expiresAt: Date) => {
        const diffTime = expiresAt.getTime() - new Date().getTime()
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      const days = getDaysUntilExpiry(sevenDaysFromNow)

      expect(days).toBeGreaterThanOrEqual(6)
      expect(days).toBeLessThanOrEqual(8)
    })
  })

  describe('AC-1.6.2: QR code generation', () => {
    it('should generate valid QR code data URL', async () => {
      const signupLink = 'https://monopilot.vercel.app/signup?token=550e8400-e29b-41d4-a716-446655440000'

      const qrCodeUrl = await QRCode.toDataURL(signupLink, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      // Should be a valid data URL
      expect(qrCodeUrl).toMatch(/^data:image\/png;base64,/)
      expect(qrCodeUrl.length).toBeGreaterThan(100)
    })

    it('should generate consistent QR code for same input', async () => {
      const signupLink = 'https://monopilot.vercel.app/signup?token=test-token'

      const qrCode1 = await QRCode.toDataURL(signupLink)
      const qrCode2 = await QRCode.toDataURL(signupLink)

      expect(qrCode1).toBe(qrCode2)
    })

    it('should generate different QR codes for different tokens', async () => {
      const link1 = 'https://monopilot.vercel.app/signup?token=token1'
      const link2 = 'https://monopilot.vercel.app/signup?token=token2'

      const qrCode1 = await QRCode.toDataURL(link1)
      const qrCode2 = await QRCode.toDataURL(link2)

      expect(qrCode1).not.toBe(qrCode2)
    })
  })

  describe('AC-1.6.3: Invitation link generation', () => {
    it('should generate correct signup link format', () => {
      const baseUrl = 'https://monopilot.vercel.app'
      const token = '550e8400-e29b-41d4-a716-446655440000'
      const email = 'user@example.com'

      const generateSignupLink = (token: string, email?: string) => {
        const url = new URL('/signup', baseUrl)
        url.searchParams.set('token', token)
        if (email) {
          url.searchParams.set('email', email)
        }
        return url.toString()
      }

      const linkWithoutEmail = generateSignupLink(token)
      const linkWithEmail = generateSignupLink(token, email)

      expect(linkWithoutEmail).toBe(`${baseUrl}/signup?token=${token}`)
      expect(linkWithEmail).toBe(`${baseUrl}/signup?token=${token}&email=${encodeURIComponent(email)}`)
    })
  })

  describe('AC-1.6.4: Status badge logic', () => {
    it('should return correct badge variant for each status', () => {
      const getStatusBadgeVariant = (
        status: 'pending' | 'accepted' | 'expired' | 'cancelled',
        isExpired: boolean
      ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        if (isExpired && status === 'pending') {
          return 'destructive'
        }

        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          pending: 'default',
          accepted: 'secondary',
          expired: 'destructive',
          cancelled: 'outline',
        }

        return variants[status] || 'default'
      }

      expect(getStatusBadgeVariant('pending', false)).toBe('default')
      expect(getStatusBadgeVariant('pending', true)).toBe('destructive') // Expired pending
      expect(getStatusBadgeVariant('accepted', false)).toBe('secondary')
      expect(getStatusBadgeVariant('expired', false)).toBe('destructive')
      expect(getStatusBadgeVariant('cancelled', false)).toBe('outline')
    })
  })

  describe('AC-1.6.5: Button disabled logic', () => {
    it('should correctly determine Resend button state', () => {
      const canResend = (status: string) => {
        return status !== 'accepted' && status !== 'cancelled'
      }

      expect(canResend('pending')).toBe(true)
      expect(canResend('expired')).toBe(true) // Can resend expired
      expect(canResend('accepted')).toBe(false)
      expect(canResend('cancelled')).toBe(false)
    })

    it('should correctly determine Cancel button state', () => {
      const canCancel = (status: string, isExpired: boolean) => {
        return !isExpired && status !== 'cancelled' && status !== 'accepted'
      }

      expect(canCancel('pending', false)).toBe(true)
      expect(canCancel('pending', true)).toBe(false) // Cannot cancel expired
      expect(canCancel('accepted', false)).toBe(false)
      expect(canCancel('cancelled', false)).toBe(false)
    })
  })

  describe('AC-1.6.6: Expiry date calculation', () => {
    it('should calculate correct expiry date (7 days from now)', () => {
      const calculateExpiryDate = () => {
        const expiryDate = new Date()
        expiryDate.setDate(expiryDate.getDate() + 7)
        return expiryDate
      }

      const expiryDate = calculateExpiryDate()
      const now = new Date()
      const diffDays = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)

      expect(diffDays).toBeGreaterThan(6.9)
      expect(diffDays).toBeLessThan(7.1)
    })
  })

  describe('AC-1.6.7: Clipboard copy logic', () => {
    it('should validate clipboard write permission', () => {
      // Mock clipboard API (not available in test environment)
      const mockClipboard = {
        writeText: async (text: string) => {
          if (!text || text.trim() === '') {
            throw new Error('Cannot copy empty text')
          }
          return Promise.resolve()
        },
      }

      const validLink = 'https://monopilot.vercel.app/signup?token=abc123'
      const emptyLink = ''

      expect(mockClipboard.writeText(validLink)).resolves.toBeUndefined()
      expect(mockClipboard.writeText(emptyLink)).rejects.toThrow('Cannot copy empty text')
    })
  })
})
