/**
 * Component Tests: AllergensDataTable
 * Story: 01.12 - Allergens Management
 * Phase: RED - Tests will fail until component exists
 *
 * Tests the AllergensDataTable component which displays:
 * - 14 EU allergens in read-only mode
 * - Columns: Code, Icon, Name (localized), Name EN, Name PL, Status
 * - Search across all language fields
 * - Multi-language tooltip on hover
 * - Read-only info banner
 * - NO Add/Edit/Delete actions (regulatory data)
 *
 * Coverage Target: 80%+
 * Test Count: 30+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-AL-01 to AC-AL-03: Allergen list display
 * - AC-AS-01 to AC-AS-03: Search functionality
 * - AC-AI-01 to AC-AI-02: Icon display
 * - AC-RO-01 to AC-RO-03: Read-only enforcement
 * - AC-ML-01 to AC-ML-02: Multi-language support
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
// import { AllergensDataTable } from '../AllergensDataTable' // Will be created in GREEN phase

/**
 * Mock Data - 14 EU Allergens
 */
const create14EUAllergens = () => [
  {
    id: 'allergen-01',
    code: 'A01',
    name_en: 'Gluten',
    name_pl: 'Gluten',
    name_de: 'Gluten',
    name_fr: 'Gluten',
    icon_url: '/icons/allergens/gluten.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 1,
  },
  {
    id: 'allergen-02',
    code: 'A02',
    name_en: 'Crustaceans',
    name_pl: 'Skorupiaki',
    name_de: 'Krebstiere',
    name_fr: 'Crustaces',
    icon_url: '/icons/allergens/crustaceans.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 2,
  },
  {
    id: 'allergen-03',
    code: 'A03',
    name_en: 'Eggs',
    name_pl: 'Jaja',
    name_de: 'Eier',
    name_fr: 'Oeufs',
    icon_url: '/icons/allergens/eggs.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 3,
  },
  {
    id: 'allergen-04',
    code: 'A04',
    name_en: 'Fish',
    name_pl: 'Ryby',
    name_de: 'Fisch',
    name_fr: 'Poisson',
    icon_url: '/icons/allergens/fish.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 4,
  },
  {
    id: 'allergen-05',
    code: 'A05',
    name_en: 'Peanuts',
    name_pl: 'Orzeszki ziemne',
    name_de: 'Erdnusse',
    name_fr: 'Arachides',
    icon_url: '/icons/allergens/peanuts.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 5,
  },
  {
    id: 'allergen-06',
    code: 'A06',
    name_en: 'Soybeans',
    name_pl: 'Soja',
    name_de: 'Soja',
    name_fr: 'Soja',
    icon_url: '/icons/allergens/soybeans.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 6,
  },
  {
    id: 'allergen-07',
    code: 'A07',
    name_en: 'Milk',
    name_pl: 'Mleko',
    name_de: 'Milch',
    name_fr: 'Lait',
    icon_url: '/icons/allergens/milk.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 7,
  },
  {
    id: 'allergen-08',
    code: 'A08',
    name_en: 'Nuts',
    name_pl: 'Orzechy',
    name_de: 'Schalenfruchte',
    name_fr: 'Fruits a coque',
    icon_url: '/icons/allergens/nuts.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 8,
  },
  {
    id: 'allergen-09',
    code: 'A09',
    name_en: 'Celery',
    name_pl: 'Seler',
    name_de: 'Sellerie',
    name_fr: 'Celeri',
    icon_url: '/icons/allergens/celery.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 9,
  },
  {
    id: 'allergen-10',
    code: 'A10',
    name_en: 'Mustard',
    name_pl: 'Gorczyca',
    name_de: 'Senf',
    name_fr: 'Moutarde',
    icon_url: '/icons/allergens/mustard.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 10,
  },
  {
    id: 'allergen-11',
    code: 'A11',
    name_en: 'Sesame',
    name_pl: 'Sezam',
    name_de: 'Sesam',
    name_fr: 'Sesame',
    icon_url: '/icons/allergens/sesame.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 11,
  },
  {
    id: 'allergen-12',
    code: 'A12',
    name_en: 'Sulphites',
    name_pl: 'Siarczyny',
    name_de: 'Sulfite',
    name_fr: 'Sulfites',
    icon_url: '/icons/allergens/sulphites.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 12,
  },
  {
    id: 'allergen-13',
    code: 'A13',
    name_en: 'Lupin',
    name_pl: 'Lubin',
    name_de: 'Lupinen',
    name_fr: 'Lupin',
    icon_url: '/icons/allergens/lupin.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 13,
  },
  {
    id: 'allergen-14',
    code: 'A14',
    name_en: 'Molluscs',
    name_pl: 'Mieczaki',
    name_de: 'Weichtiere',
    name_fr: 'Mollusques',
    icon_url: '/icons/allergens/molluscs.svg',
    is_eu_mandatory: true,
    is_active: true,
    display_order: 14,
  },
]

/**
 * Mock Hooks
 */
vi.mock('@/lib/hooks/use-allergens', () => ({
  useAllergens: vi.fn(),
}))

import { useAllergens } from '@/lib/hooks/use-allergens'

let mockAllergens: any[] = []

describe('AllergensDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAllergens = create14EUAllergens()
  })

  describe('Rendering - Loading State', () => {
    it('should display loading skeleton', async () => {
      // GIVEN allergens are loading
      vi.mocked(useAllergens).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN loading skeleton displayed
      // expect(screen.getByText(/loading allergens/i)).toBeInTheDocument()

      // Placeholder - will fail until implementation exists
      expect(true).toBe(false)
    })
  })

  describe('Rendering - Success State (AC-AL-01)', () => {
    it('should render all 14 EU allergens within 200ms', async () => {
      // GIVEN allergens loaded
      const startTime = Date.now()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN 14 allergens displayed within 200ms
      const renderTime = Date.now() - startTime
      // expect(renderTime).toBeLessThan(200)
      // expect(screen.getAllByRole('row')).toHaveLength(15) // 14 data + 1 header

      expect(true).toBe(false)
    })

    it('should display all column headers (AC-AL-02)', async () => {
      // GIVEN allergens loaded
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN columns displayed: Code, Icon, Name (localized), Name EN, Name PL, Status
      // expect(screen.getByText('Code')).toBeInTheDocument()
      // expect(screen.getByText('Icon')).toBeInTheDocument()
      // expect(screen.getByText(/Name/i)).toBeInTheDocument()
      // expect(screen.getByText('Name EN')).toBeInTheDocument()
      // expect(screen.getByText('Name PL')).toBeInTheDocument()
      // expect(screen.getByText('Status')).toBeInTheDocument()

      expect(true).toBe(false)
    })

    it('should display allergens sorted by display_order (AC-AL-03)', async () => {
      // GIVEN allergens loaded (unsorted)
      const unsortedAllergens = [...mockAllergens].reverse()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: unsortedAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN allergens sorted by display_order (A01 first, A14 last)
      // const rows = screen.getAllByRole('row')
      // expect(within(rows[1]).getByText('A01')).toBeInTheDocument() // First data row
      // expect(within(rows[14]).getByText('A14')).toBeInTheDocument() // Last data row

      expect(true).toBe(false)
    })

    it('should display all allergen data (codes and names)', async () => {
      // GIVEN allergens loaded
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN all allergen codes visible
      // expect(screen.getByText('A01')).toBeInTheDocument()
      // expect(screen.getByText('A07')).toBeInTheDocument()
      // expect(screen.getByText('A14')).toBeInTheDocument()

      // THEN all allergen names visible
      // expect(screen.getByText('Gluten')).toBeInTheDocument()
      // expect(screen.getByText('Milk')).toBeInTheDocument()
      // expect(screen.getByText('Molluscs')).toBeInTheDocument()

      expect(true).toBe(false)
    })
  })

  describe('Allergen Icons (AC-AI-01, AC-AI-02)', () => {
    it('should display icon for each allergen at 24x24 size (AC-AI-01)', async () => {
      // GIVEN allergens with icons
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN all 14 icons displayed at 24x24
      // const icons = screen.getAllByRole('img')
      // expect(icons).toHaveLength(14)
      // icons.forEach(icon => {
      //   expect(icon).toHaveAttribute('width', '24')
      //   expect(icon).toHaveAttribute('height', '24')
      // })

      expect(true).toBe(false)
    })

    it('should display fallback icon when icon_url is null (AC-AI-02)', async () => {
      // GIVEN allergen without icon
      const allergensWithoutIcon = [...mockAllergens]
      allergensWithoutIcon[0] = { ...allergensWithoutIcon[0], icon_url: null }

      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: allergensWithoutIcon, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN fallback icon displayed (warning triangle or generic)
      // const fallbackIcon = screen.getByTestId('allergen-icon-fallback')
      // expect(fallbackIcon).toBeInTheDocument()

      expect(true).toBe(false)
    })

    it('should display icon with accessible alt text', async () => {
      // GIVEN allergens with icons
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN icons have alt text
      // const glutenIcon = screen.getByAltText(/gluten/i)
      // expect(glutenIcon).toBeInTheDocument()

      expect(true).toBe(false)
    })
  })

  describe('Search Functionality (AC-AS-01, AC-AS-02, AC-AS-03)', () => {
    it('should search by English name "milk" (AC-AS-01)', async () => {
      // GIVEN allergens displayed
      const user = userEvent.setup()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN searching for "milk"
      // render(<AllergensDataTable />)
      // const searchInput = screen.getByPlaceholderText(/search allergens/i)
      // await user.type(searchInput, 'milk')

      // THEN A07 (Milk) displayed within 100ms
      // await waitFor(() => {
      //   expect(screen.getByText('A07')).toBeInTheDocument()
      //   expect(screen.getByText('Milk')).toBeInTheDocument()
      //   expect(screen.queryByText('A01')).not.toBeInTheDocument()
      // }, { timeout: 100 })

      expect(true).toBe(false)
    })

    it('should search by Polish name "orzechy" (AC-AS-02)', async () => {
      // GIVEN allergens displayed
      const user = userEvent.setup()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN searching for "orzechy" (Polish for nuts)
      // render(<AllergensDataTable />)
      // const searchInput = screen.getByPlaceholderText(/search allergens/i)
      // await user.type(searchInput, 'orzechy')

      // THEN A08 (Nuts) displayed
      // await waitFor(() => {
      //   expect(screen.getByText('A08')).toBeInTheDocument()
      //   expect(screen.getByText('Nuts')).toBeInTheDocument()
      // })

      expect(true).toBe(false)
    })

    it('should search by allergen code "A05"', async () => {
      // GIVEN allergens displayed
      const user = userEvent.setup()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN searching for "A05"
      // render(<AllergensDataTable />)
      // const searchInput = screen.getByPlaceholderText(/search allergens/i)
      // await user.type(searchInput, 'A05')

      // THEN A05 (Peanuts) displayed
      // await waitFor(() => {
      //   expect(screen.getByText('A05')).toBeInTheDocument()
      //   expect(screen.getByText('Peanuts')).toBeInTheDocument()
      // })

      expect(true).toBe(false)
    })

    it('should search across all language fields (AC-AS-03)', async () => {
      // GIVEN allergens displayed
      const user = userEvent.setup()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN searching with term appearing in multiple languages
      // render(<AllergensDataTable />)
      // const searchInput = screen.getByPlaceholderText(/search allergens/i)

      // Test EN search
      // await user.clear(searchInput)
      // await user.type(searchInput, 'Gluten')
      // expect(screen.getByText('A01')).toBeInTheDocument()

      // Test PL search
      // await user.clear(searchInput)
      // await user.type(searchInput, 'Mleko')
      // expect(screen.getByText('A07')).toBeInTheDocument()

      // Test DE search
      // await user.clear(searchInput)
      // await user.type(searchInput, 'Senf')
      // expect(screen.getByText('A10')).toBeInTheDocument()

      // Test FR search
      // await user.clear(searchInput)
      // await user.type(searchInput, 'Poisson')
      // expect(screen.getByText('A04')).toBeInTheDocument()

      expect(true).toBe(false)
    })

    it('should handle case-insensitive search', async () => {
      // GIVEN allergens displayed
      const user = userEvent.setup()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN searching with uppercase
      // render(<AllergensDataTable />)
      // const searchInput = screen.getByPlaceholderText(/search allergens/i)
      // await user.type(searchInput, 'MILK')

      // THEN results found
      // await waitFor(() => {
      //   expect(screen.getByText('A07')).toBeInTheDocument()
      // })

      expect(true).toBe(false)
    })

    it('should show empty state when no matches found', async () => {
      // GIVEN allergens displayed
      const user = userEvent.setup()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: [], total: 0 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN searching for non-existent term
      // render(<AllergensDataTable />)
      // const searchInput = screen.getByPlaceholderText(/search allergens/i)
      // await user.type(searchInput, 'nonexistent')

      // THEN empty state displayed
      // expect(screen.getByText(/no allergens found/i)).toBeInTheDocument()

      expect(true).toBe(false)
    })

    it('should clear search and show all allergens', async () => {
      // GIVEN filtered results
      const user = userEvent.setup()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN clearing search
      // render(<AllergensDataTable />)
      // const searchInput = screen.getByPlaceholderText(/search allergens/i)
      // await user.type(searchInput, 'milk')
      // await user.clear(searchInput)

      // THEN all 14 allergens displayed
      // await waitFor(() => {
      //   expect(screen.getAllByRole('row')).toHaveLength(15) // 14 data + header
      // })

      expect(true).toBe(false)
    })
  })

  describe('Multi-Language Display (AC-ML-01)', () => {
    it('should show multi-language tooltip on row hover', async () => {
      // GIVEN allergens displayed
      const user = userEvent.setup()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN hovering over allergen row
      // render(<AllergensDataTable />)
      // const firstRow = screen.getAllByRole('row')[1]
      // await user.hover(firstRow)

      // THEN tooltip shows all translations
      // await waitFor(() => {
      //   expect(screen.getByText(/EN: Gluten/i)).toBeInTheDocument()
      //   expect(screen.getByText(/PL: Gluten/i)).toBeInTheDocument()
      //   expect(screen.getByText(/DE: Gluten/i)).toBeInTheDocument()
      //   expect(screen.getByText(/FR: Gluten/i)).toBeInTheDocument()
      // })

      expect(true).toBe(false)
    })

    it('should display localized name based on user language preference', async () => {
      // GIVEN user language is Polish
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering with Polish locale
      // render(<AllergensDataTable />, { locale: 'pl' })

      // THEN primary name column shows Polish names
      // expect(screen.getByText('Mleko')).toBeInTheDocument() // Polish for Milk
      // expect(screen.getByText('Orzechy')).toBeInTheDocument() // Polish for Nuts

      expect(true).toBe(false)
    })
  })

  describe('Read-Only Mode (AC-RO-01, AC-RO-03)', () => {
    it('should display read-only info banner (AC-RO-03)', async () => {
      // GIVEN allergens displayed
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN info banner displayed
      // expect(screen.getByText(/EU-mandated allergens are system-managed/i)).toBeInTheDocument()
      // expect(screen.getByText(/Contact support for custom allergen requests/i)).toBeInTheDocument()

      expect(true).toBe(false)
    })

    it('should NOT display Add button (AC-RO-01)', async () => {
      // GIVEN allergens displayed
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN no Add Allergen button
      // expect(screen.queryByRole('button', { name: /add allergen/i })).not.toBeInTheDocument()

      expect(true).toBe(false)
    })

    it('should NOT display Edit buttons (AC-RO-01)', async () => {
      // GIVEN allergens displayed
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN no edit buttons
      // expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()

      expect(true).toBe(false)
    })

    it('should NOT display Delete buttons (AC-RO-01)', async () => {
      // GIVEN allergens displayed
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN no delete buttons
      // expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()

      expect(true).toBe(false)
    })

    it('should NOT display Actions column', async () => {
      // GIVEN allergens displayed
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN no Actions column header
      // expect(screen.queryByText('Actions')).not.toBeInTheDocument()

      expect(true).toBe(false)
    })

    it('should be read-only even for SUPER_ADMIN', async () => {
      // GIVEN SUPER_ADMIN user
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />, { userRole: 'SUPER_ADMIN' })

      // THEN still no edit/delete actions
      // expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
      // expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument()

      expect(true).toBe(false)
    })
  })

  describe('Rendering - Error State', () => {
    it('should display error state when fetch fails', async () => {
      // GIVEN error occurred
      vi.mocked(useAllergens).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed to load allergens'),
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN error state displayed
      // expect(screen.getByText(/failed to load allergens/i)).toBeInTheDocument()
      // expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()

      expect(true).toBe(false)
    })
  })

  describe('No Pagination', () => {
    it('should NOT display pagination controls (only 14 items)', async () => {
      // GIVEN all 14 allergens
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN no pagination controls
      // expect(screen.queryByText(/page/i)).not.toBeInTheDocument()
      // expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
      // expect(screen.queryByRole('button', { name: /previous/i })).not.toBeInTheDocument()

      expect(true).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('should have accessible table structure', async () => {
      // GIVEN allergens displayed
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      // THEN table has proper ARIA attributes
      // const table = screen.getByRole('table')
      // expect(table).toHaveAttribute('aria-label')

      expect(true).toBe(false)
    })

    it('should support keyboard navigation', async () => {
      // GIVEN allergens displayed
      const user = userEvent.setup()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN navigating with keyboard
      // render(<AllergensDataTable />)
      // await user.tab()

      // THEN search input focused
      // const searchInput = screen.getByPlaceholderText(/search allergens/i)
      // expect(searchInput).toHaveFocus()

      expect(true).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should render within 200ms (AC-AL-01)', async () => {
      // GIVEN allergens loaded
      const startTime = performance.now()
      vi.mocked(useAllergens).mockReturnValue({
        data: { allergens: mockAllergens, total: 14 },
        isLoading: false,
        error: null,
      } as any)

      // WHEN rendering table
      // render(<AllergensDataTable />)

      const renderTime = performance.now() - startTime

      // THEN renders within 200ms
      // expect(renderTime).toBeLessThan(200)

      expect(true).toBe(false)
    })
  })
})
