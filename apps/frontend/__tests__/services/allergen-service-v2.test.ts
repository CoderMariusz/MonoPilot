/**
 * Unit Tests: Allergen Service v2 (Story 01.12)
 *
 * Tests for read-only EU allergen service
 * Coverage target: >80%
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AllergenService } from '@/lib/services/allergen-service-v2'
import type { Allergen } from '@/lib/services/allergen-service-v2'

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            then: vi.fn((cb) => cb({ data: mockAllergens, error: null, count: 14 })),
          })),
          single: vi.fn(() => ({
            then: vi.fn((cb) => cb({ data: mockAllergens[0], error: null })),
          })),
        })),
        or: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => ({
              then: vi.fn((cb) => cb({ data: [mockAllergens[6]], error: null, count: 1 })),
            })),
          })),
        })),
      })),
    })),
  })),
}))

// Mock allergen data (14 EU allergens)
const mockAllergens: Allergen[] = [
  {
    id: '1',
    code: 'A01',
    name_en: 'Gluten',
    name_pl: 'Gluten',
    name_de: 'Gluten',
    name_fr: 'Gluten',
    icon_url: '/icons/allergens/gluten.svg',
    is_eu_mandatory: true,
    display_order: 1,
  },
  {
    id: '2',
    code: 'A02',
    name_en: 'Crustaceans',
    name_pl: 'Skorupiaki',
    name_de: 'Krebstiere',
    name_fr: 'Crustaces',
    icon_url: '/icons/allergens/crustaceans.svg',
    is_eu_mandatory: true,
    display_order: 2,
  },
  {
    id: '3',
    code: 'A03',
    name_en: 'Eggs',
    name_pl: 'Jaja',
    name_de: 'Eier',
    name_fr: 'Oeufs',
    icon_url: '/icons/allergens/eggs.svg',
    is_eu_mandatory: true,
    display_order: 3,
  },
  {
    id: '4',
    code: 'A04',
    name_en: 'Fish',
    name_pl: 'Ryby',
    name_de: 'Fisch',
    name_fr: 'Poisson',
    icon_url: '/icons/allergens/fish.svg',
    is_eu_mandatory: true,
    display_order: 4,
  },
  {
    id: '5',
    code: 'A05',
    name_en: 'Peanuts',
    name_pl: 'Orzeszki ziemne',
    name_de: 'Erdnusse',
    name_fr: 'Arachides',
    icon_url: '/icons/allergens/peanuts.svg',
    is_eu_mandatory: true,
    display_order: 5,
  },
  {
    id: '6',
    code: 'A06',
    name_en: 'Soybeans',
    name_pl: 'Soja',
    name_de: 'Soja',
    name_fr: 'Soja',
    icon_url: '/icons/allergens/soybeans.svg',
    is_eu_mandatory: true,
    display_order: 6,
  },
  {
    id: '7',
    code: 'A07',
    name_en: 'Milk',
    name_pl: 'Mleko',
    name_de: 'Milch',
    name_fr: 'Lait',
    icon_url: '/icons/allergens/milk.svg',
    is_eu_mandatory: true,
    display_order: 7,
  },
  {
    id: '8',
    code: 'A08',
    name_en: 'Nuts',
    name_pl: 'Orzechy',
    name_de: 'Schalenfruchte',
    name_fr: 'Fruits a coque',
    icon_url: '/icons/allergens/nuts.svg',
    is_eu_mandatory: true,
    display_order: 8,
  },
  {
    id: '9',
    code: 'A09',
    name_en: 'Celery',
    name_pl: 'Seler',
    name_de: 'Sellerie',
    name_fr: 'Celeri',
    icon_url: '/icons/allergens/celery.svg',
    is_eu_mandatory: true,
    display_order: 9,
  },
  {
    id: '10',
    code: 'A10',
    name_en: 'Mustard',
    name_pl: 'Gorczyca',
    name_de: 'Senf',
    name_fr: 'Moutarde',
    icon_url: '/icons/allergens/mustard.svg',
    is_eu_mandatory: true,
    display_order: 10,
  },
  {
    id: '11',
    code: 'A11',
    name_en: 'Sesame',
    name_pl: 'Sezam',
    name_de: 'Sesam',
    name_fr: 'Sesame',
    icon_url: '/icons/allergens/sesame.svg',
    is_eu_mandatory: true,
    display_order: 11,
  },
  {
    id: '12',
    code: 'A12',
    name_en: 'Sulphites',
    name_pl: 'Siarczyny',
    name_de: 'Sulfite',
    name_fr: 'Sulfites',
    icon_url: '/icons/allergens/sulphites.svg',
    is_eu_mandatory: true,
    display_order: 12,
  },
  {
    id: '13',
    code: 'A13',
    name_en: 'Lupin',
    name_pl: 'Lubin',
    name_de: 'Lupinen',
    name_fr: 'Lupin',
    icon_url: '/icons/allergens/lupin.svg',
    is_eu_mandatory: true,
    display_order: 13,
  },
  {
    id: '14',
    code: 'A14',
    name_en: 'Molluscs',
    name_pl: 'Mieczaki',
    name_de: 'Weichtiere',
    name_fr: 'Mollusques',
    icon_url: '/icons/allergens/molluscs.svg',
    is_eu_mandatory: true,
    display_order: 14,
  },
]

describe('AllergenService', () => {
  describe('getAllergens', () => {
    it('should return all 14 EU allergens', async () => {
      const result = await AllergenService.getAllergens()

      expect(result).toHaveProperty('allergens')
      expect(result).toHaveProperty('total')
      expect(result.allergens).toHaveLength(14)
      expect(result.total).toBe(14)
    })

    it('should return allergens sorted by display_order', async () => {
      const result = await AllergenService.getAllergens()

      expect(result.allergens[0].code).toBe('A01')
      expect(result.allergens[0].display_order).toBe(1)
      expect(result.allergens[13].code).toBe('A14')
      expect(result.allergens[13].display_order).toBe(14)
    })

    it('should filter allergens by search query', async () => {
      const result = await AllergenService.getAllergens({ search: 'milk' })

      expect(result.allergens).toHaveLength(1)
      expect(result.allergens[0].code).toBe('A07')
      expect(result.allergens[0].name_en).toBe('Milk')
    })

    it('should have all required fields', async () => {
      const result = await AllergenService.getAllergens()
      const allergen = result.allergens[0]

      expect(allergen).toHaveProperty('id')
      expect(allergen).toHaveProperty('code')
      expect(allergen).toHaveProperty('name_en')
      expect(allergen).toHaveProperty('name_pl')
      expect(allergen).toHaveProperty('name_de')
      expect(allergen).toHaveProperty('name_fr')
      expect(allergen).toHaveProperty('icon_url')
      expect(allergen).toHaveProperty('is_eu_mandatory')
      expect(allergen).toHaveProperty('display_order')
    })

    it('should have valid code format (A01-A14)', async () => {
      const result = await AllergenService.getAllergens()

      result.allergens.forEach((allergen) => {
        expect(allergen.code).toMatch(/^A[0-9]{2}$/)
      })
    })
  })

  describe('getAllergenById', () => {
    it('should return allergen by ID', async () => {
      const allergen = await AllergenService.getAllergenById('1')

      expect(allergen).toBeDefined()
      expect(allergen.id).toBe('1')
      expect(allergen.code).toBe('A01')
    })

    it('should throw error if allergen not found', async () => {
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabase = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  then: vi.fn((cb) => cb({ data: null, error: { message: 'Not found' } })),
                })),
              })),
            })),
          })),
        })),
      })) as any

      await expect(AllergenService.getAllergenById('invalid-id')).rejects.toThrow()
    })
  })

  describe('getAllergenByCode', () => {
    it('should return allergen by code A01', async () => {
      const allergen = await AllergenService.getAllergenByCode('A01')

      expect(allergen).toBeDefined()
      expect(allergen.code).toBe('A01')
      expect(allergen.name_en).toBe('Gluten')
    })

    it('should return allergen by code A07 (Milk)', async () => {
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabase = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  then: vi.fn((cb) => cb({ data: mockAllergens[6], error: null })),
                })),
              })),
            })),
          })),
        })),
      })) as any

      const allergen = await AllergenService.getAllergenByCode('A07')

      expect(allergen.code).toBe('A07')
      expect(allergen.name_en).toBe('Milk')
    })

    it('should handle lowercase codes', async () => {
      const allergen = await AllergenService.getAllergenByCode('a01')

      expect(allergen).toBeDefined()
      expect(allergen.code).toBe('A01')
    })

    it('should throw error for invalid code', async () => {
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabase = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  then: vi.fn((cb) => cb({ data: null, error: { message: 'Not found' } })),
                })),
              })),
            })),
          })),
        })),
      })) as any

      await expect(AllergenService.getAllergenByCode('A99')).rejects.toThrow()
    })
  })

  describe('searchAllergens', () => {
    it('should search by English name', async () => {
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabase = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                then: vi.fn((cb) => cb({ data: [mockAllergens[0]], error: null, count: 1 })),
              })),
            })),
            or: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  then: vi.fn((cb) => cb({ data: [mockAllergens[0]], error: null, count: 1 })),
                })),
              })),
            })),
          })),
        })),
      })) as any

      const results = await AllergenService.searchAllergens('gluten')

      expect(results).toHaveLength(1)
      expect(results[0].name_en).toBe('Gluten')
    })

    it('should search by Polish name', async () => {
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabase = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                then: vi.fn((cb) => cb({ data: [mockAllergens[7]], error: null, count: 1 })),
              })),
            })),
            or: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  then: vi.fn((cb) => cb({ data: [mockAllergens[7]], error: null, count: 1 })),
                })),
              })),
            })),
          })),
        })),
      })) as any

      const results = await AllergenService.searchAllergens('orzechy')

      expect(results).toHaveLength(1)
      expect(results[0].name_pl).toBe('Orzechy')
    })

    it('should search by code', async () => {
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabase = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                then: vi.fn((cb) => cb({ data: [mockAllergens[4]], error: null, count: 1 })),
              })),
            })),
            or: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  then: vi.fn((cb) => cb({ data: [mockAllergens[4]], error: null, count: 1 })),
                })),
              })),
            })),
          })),
        })),
      })) as any

      const results = await AllergenService.searchAllergens('A05')

      expect(results).toHaveLength(1)
      expect(results[0].code).toBe('A05')
    })

    it('should return empty array for non-existent search', async () => {
      vi.mocked(await import('@/lib/supabase/server')).createServerSupabase = vi.fn(() => ({
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                then: vi.fn((cb) => cb({ data: [], error: null, count: 0 })),
              })),
            })),
            or: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  then: vi.fn((cb) => cb({ data: [], error: null, count: 0 })),
                })),
              })),
            })),
          })),
        })),
      })) as any

      const results = await AllergenService.searchAllergens('xyz')

      expect(results).toHaveLength(0)
    })
  })

  describe('getName', () => {
    const testAllergen = mockAllergens[6] // A07 Milk

    it('should return English name when lang is en', () => {
      const name = AllergenService.getName(testAllergen, 'en')
      expect(name).toBe('Milk')
    })

    it('should return Polish name when lang is pl', () => {
      const name = AllergenService.getName(testAllergen, 'pl')
      expect(name).toBe('Mleko')
    })

    it('should return German name when lang is de', () => {
      const name = AllergenService.getName(testAllergen, 'de')
      expect(name).toBe('Milch')
    })

    it('should return French name when lang is fr', () => {
      const name = AllergenService.getName(testAllergen, 'fr')
      expect(name).toBe('Lait')
    })

    it('should fall back to English for invalid language', () => {
      const name = AllergenService.getName(testAllergen, 'invalid')
      expect(name).toBe('Milk')
    })

    it('should fall back to English when language field is null', () => {
      const allergenWithNullDE: Allergen = {
        ...testAllergen,
        name_de: null,
      }

      const name = AllergenService.getName(allergenWithNullDE, 'de')
      expect(name).toBe('Milk')
    })
  })

  describe('getAllergensForSelect', () => {
    it('should return 14 select options', async () => {
      const options = await AllergenService.getAllergensForSelect()

      expect(options).toHaveLength(14)
    })

    it('should format label with code and name', async () => {
      const options = await AllergenService.getAllergensForSelect('en')

      expect(options[0].label).toBe('A01 - Gluten')
      expect(options[6].label).toBe('A07 - Milk')
    })

    it('should use correct language for label', async () => {
      const options = await AllergenService.getAllergensForSelect('pl')

      expect(options[6].label).toBe('A07 - Mleko')
    })

    it('should include all required fields', async () => {
      const options = await AllergenService.getAllergensForSelect()

      options.forEach((option) => {
        expect(option).toHaveProperty('value')
        expect(option).toHaveProperty('label')
        expect(option).toHaveProperty('code')
        expect(option).toHaveProperty('icon_url')
      })
    })

    it('should use allergen ID as value', async () => {
      const options = await AllergenService.getAllergensForSelect()

      expect(options[0].value).toBe('1')
      expect(options[0].code).toBe('A01')
    })
  })
})
