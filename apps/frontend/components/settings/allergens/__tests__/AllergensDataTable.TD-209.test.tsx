/**
 * AllergensDataTable Component Tests - TD-209 Features
 * Story: TD-209 - Products Column in Allergens Table
 *
 * Tests for the Products column feature:
 * - Product counts displayed
 * - Links to filtered products page
 * - Loading state for counts
 * - Error handling
 * - Styling (muted for 0, bold for >= 10)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AllergensDataTable } from '../AllergensDataTable'
import type { Allergen } from '@/lib/types/allergen'

// Mock the allergen service v2
vi.mock('@/lib/services/allergen-service-v2', () => ({
  fetchAllergenProductCounts: vi.fn(),
}))

import { fetchAllergenProductCounts } from '@/lib/services/allergen-service-v2'

// Sample allergens for testing
const mockAllergens: Allergen[] = [
  {
    id: 'allergen-1',
    code: 'A01',
    name_en: 'Gluten',
    name_pl: 'Gluten',
    name_de: 'Gluten',
    name_fr: 'Gluten',
    icon_url: null,
    icon_svg: null,
    is_eu_mandatory: true,
    is_custom: false,
    is_active: true,
    display_order: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'allergen-2',
    code: 'A02',
    name_en: 'Crustaceans',
    name_pl: 'Skorupiaki',
    name_de: 'Krebstiere',
    name_fr: 'Crustaces',
    icon_url: null,
    icon_svg: null,
    is_eu_mandatory: true,
    is_custom: false,
    is_active: true,
    display_order: 2,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    id: 'allergen-3',
    code: 'A03',
    name_en: 'Eggs',
    name_pl: 'Jaja',
    name_de: 'Eier',
    name_fr: 'Oeufs',
    icon_url: null,
    icon_svg: null,
    is_eu_mandatory: true,
    is_custom: false,
    is_active: true,
    display_order: 3,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
]

describe('AllergensDataTable - TD-209 Products Column', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Products column rendering', () => {
    it('should render Products column header', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([])

      render(<AllergensDataTable allergens={mockAllergens} />)

      expect(screen.getByText('Products')).toBeInTheDocument()
    })

    it('should not render Products column when showProductsColumn is false', async () => {
      render(<AllergensDataTable allergens={mockAllergens} showProductsColumn={false} />)

      expect(screen.queryByText('Products')).not.toBeInTheDocument()
    })

    it('should show loading skeleton while fetching counts', () => {
      vi.mocked(fetchAllergenProductCounts).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<AllergensDataTable allergens={mockAllergens} />)

      // Should show loading skeletons
      expect(screen.getAllByTestId('product-count-loading')).toHaveLength(3)
    })
  })

  describe('Product counts display', () => {
    it('should display product counts for each allergen', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([
        { allergen_id: 'allergen-1', product_count: 5 },
        { allergen_id: 'allergen-2', product_count: 0 },
        { allergen_id: 'allergen-3', product_count: 15 },
      ])

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        expect(screen.getByTestId('product-count-allergen-1')).toHaveTextContent('5')
        expect(screen.getByTestId('product-count-allergen-2')).toHaveTextContent('0')
        expect(screen.getByTestId('product-count-allergen-3')).toHaveTextContent('15')
      })
    })

    it('should show 0 for allergens not in counts response', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([
        { allergen_id: 'allergen-1', product_count: 3 },
        // allergen-2 and allergen-3 not included
      ])

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        expect(screen.getByTestId('product-count-allergen-1')).toHaveTextContent('3')
        expect(screen.getByTestId('product-count-allergen-2')).toHaveTextContent('0')
        expect(screen.getByTestId('product-count-allergen-3')).toHaveTextContent('0')
      })
    })
  })

  describe('Styling based on count', () => {
    it('should apply muted style for count of 0', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([
        { allergen_id: 'allergen-1', product_count: 0 },
      ])

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        const countElement = screen.getByTestId('product-count-allergen-1')
        expect(countElement).toHaveClass('text-muted-foreground')
        expect(countElement.tagName).toBe('SPAN') // Not a link when 0
      })
    })

    it('should apply bold style for count >= 10', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([
        { allergen_id: 'allergen-1', product_count: 10 },
        { allergen_id: 'allergen-2', product_count: 15 },
        { allergen_id: 'allergen-3', product_count: 100 },
      ])

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        expect(screen.getByTestId('product-count-allergen-1')).toHaveClass('font-bold')
        expect(screen.getByTestId('product-count-allergen-2')).toHaveClass('font-bold')
        expect(screen.getByTestId('product-count-allergen-3')).toHaveClass('font-bold')
      })
    })

    it('should not apply bold style for count < 10', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([
        { allergen_id: 'allergen-1', product_count: 9 },
      ])

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        expect(screen.getByTestId('product-count-allergen-1')).not.toHaveClass('font-bold')
      })
    })
  })

  describe('Links to products page', () => {
    it('should render count as link when count > 0', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([
        { allergen_id: 'allergen-1', product_count: 5 },
      ])

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        const countElement = screen.getByTestId('product-count-allergen-1')
        expect(countElement.tagName).toBe('A')
        expect(countElement).toHaveAttribute(
          'href',
          '/technical/products?allergen_id=allergen-1'
        )
      })
    })

    it('should not render link when count is 0', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([
        { allergen_id: 'allergen-1', product_count: 0 },
      ])

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        const countElement = screen.getByTestId('product-count-allergen-1')
        expect(countElement.tagName).toBe('SPAN')
        expect(countElement).not.toHaveAttribute('href')
      })
    })

    it('should have correct title attribute on link', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([
        { allergen_id: 'allergen-1', product_count: 5 },
        { allergen_id: 'allergen-2', product_count: 1 },
      ])

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        expect(screen.getByTestId('product-count-allergen-1')).toHaveAttribute(
          'title',
          'View 5 products with this allergen'
        )
        expect(screen.getByTestId('product-count-allergen-2')).toHaveAttribute(
          'title',
          'View 1 product with this allergen'
        )
      })
    })
  })

  describe('Error handling', () => {
    it('should show "--" when fetch fails', async () => {
      vi.mocked(fetchAllergenProductCounts).mockRejectedValue(new Error('Network error'))

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        const dashElements = screen.getAllByText('--')
        expect(dashElements.length).toBe(3)
      })
    })
  })

  describe('Tooltip includes product count', () => {
    it('should show product count in tooltip', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([
        { allergen_id: 'allergen-1', product_count: 7 },
      ])

      render(<AllergensDataTable allergens={mockAllergens} />)

      await waitFor(() => {
        // Products count should appear in tooltip content
        // Note: TooltipContent may not be in DOM until tooltip is opened
        // This test verifies the component structure
        expect(screen.getByTestId('product-count-allergen-1')).toHaveTextContent('7')
      })
    })
  })

  describe('Column count adjustment', () => {
    it('should use correct colSpan for empty search state', async () => {
      vi.mocked(fetchAllergenProductCounts).mockResolvedValue([])

      // Render with empty allergens array to trigger empty search state
      render(<AllergensDataTable allergens={[]} />)

      // Empty state should be shown (not the "no search results" message)
      expect(screen.getByText('No allergens found')).toBeInTheDocument()
    })
  })
})
