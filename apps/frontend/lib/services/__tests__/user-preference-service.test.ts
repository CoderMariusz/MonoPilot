/**
 * User Preference Service Tests
 * Story: TD-208 - Language Selector for Allergen Names
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isValidLanguageCode,
  VALID_LANGUAGE_CODES,
  LANGUAGE_DISPLAY_NAMES,
  LANGUAGE_OPTIONS,
  getUserLanguage,
  saveUserLanguage,
  getCurrentUserLanguage,
} from '../user-preference-service'

// Mock Supabase client
const mockRpc = vi.fn()
const mockAuth = {
  getUser: vi.fn(),
}

const mockSupabase = {
  rpc: mockRpc,
  auth: mockAuth,
}

describe('UserPreferenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isValidLanguageCode', () => {
    it('should return true for valid language codes', () => {
      expect(isValidLanguageCode('en')).toBe(true)
      expect(isValidLanguageCode('pl')).toBe(true)
      expect(isValidLanguageCode('de')).toBe(true)
      expect(isValidLanguageCode('fr')).toBe(true)
    })

    it('should return false for invalid language codes', () => {
      expect(isValidLanguageCode('es')).toBe(false)
      expect(isValidLanguageCode('it')).toBe(false)
      expect(isValidLanguageCode('EN')).toBe(false) // Case sensitive
      expect(isValidLanguageCode('')).toBe(false)
      expect(isValidLanguageCode('english')).toBe(false)
    })
  })

  describe('VALID_LANGUAGE_CODES', () => {
    it('should contain exactly 4 language codes', () => {
      expect(VALID_LANGUAGE_CODES).toHaveLength(4)
    })

    it('should contain en, pl, de, fr', () => {
      expect(VALID_LANGUAGE_CODES).toContain('en')
      expect(VALID_LANGUAGE_CODES).toContain('pl')
      expect(VALID_LANGUAGE_CODES).toContain('de')
      expect(VALID_LANGUAGE_CODES).toContain('fr')
    })
  })

  describe('LANGUAGE_DISPLAY_NAMES', () => {
    it('should have display names for all language codes', () => {
      expect(LANGUAGE_DISPLAY_NAMES.en).toBe('English')
      expect(LANGUAGE_DISPLAY_NAMES.pl).toBe('Polski')
      expect(LANGUAGE_DISPLAY_NAMES.de).toBe('Deutsch')
      expect(LANGUAGE_DISPLAY_NAMES.fr).toBe('Francais')
    })
  })

  describe('LANGUAGE_OPTIONS', () => {
    it('should have options for all languages', () => {
      expect(LANGUAGE_OPTIONS).toHaveLength(4)
    })

    it('should have correct format for each option', () => {
      const enOption = LANGUAGE_OPTIONS.find(opt => opt.value === 'en')
      expect(enOption).toBeDefined()
      expect(enOption?.label).toBe('English')
      expect(enOption?.code).toBe('EN')
    })
  })

  describe('getUserLanguage', () => {
    it('should return language from RPC call', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'pl', error: null })

      const result = await getUserLanguage(mockSupabase as any, 'user-123')

      expect(result).toBe('pl')
      expect(mockRpc).toHaveBeenCalledWith('get_user_language', { p_user_id: 'user-123' })
    })

    it('should return en as fallback on error', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Error' } })

      const result = await getUserLanguage(mockSupabase as any, 'user-123')

      expect(result).toBe('en')
    })

    it('should return en for invalid language code', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'invalid', error: null })

      const result = await getUserLanguage(mockSupabase as any, 'user-123')

      expect(result).toBe('en')
    })
  })

  describe('saveUserLanguage', () => {
    it('should call RPC with valid language', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: null })

      const result = await saveUserLanguage(mockSupabase as any, 'user-123', 'de')

      expect(result.success).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('set_user_language', { p_language: 'de' })
    })

    it('should return error for invalid language code', async () => {
      const result = await saveUserLanguage(mockSupabase as any, 'user-123', 'invalid' as any)

      expect(result.success).toBe(false)
      expect(result.code).toBe('INVALID_LANGUAGE')
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it('should handle RPC error', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Database error' } })

      const result = await saveUserLanguage(mockSupabase as any, 'user-123', 'fr')

      expect(result.success).toBe(false)
      expect(result.code).toBe('DATABASE_ERROR')
    })

    it('should handle authentication error', async () => {
      mockRpc.mockResolvedValueOnce({ data: null, error: { message: 'Not authenticated' } })

      const result = await saveUserLanguage(mockSupabase as any, 'user-123', 'pl')

      expect(result.success).toBe(false)
      expect(result.code).toBe('UNAUTHORIZED')
    })
  })

  describe('getCurrentUserLanguage', () => {
    it('should get user ID from auth and fetch language', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: { id: 'current-user-123' } },
        error: null,
      })
      mockRpc.mockResolvedValueOnce({ data: 'fr', error: null })

      const result = await getCurrentUserLanguage(mockSupabase as any)

      expect(result).toBe('fr')
      expect(mockAuth.getUser).toHaveBeenCalled()
      expect(mockRpc).toHaveBeenCalledWith('get_user_language', { p_user_id: 'current-user-123' })
    })

    it('should return en if not authenticated', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await getCurrentUserLanguage(mockSupabase as any)

      expect(result).toBe('en')
      expect(mockRpc).not.toHaveBeenCalled()
    })
  })
})
