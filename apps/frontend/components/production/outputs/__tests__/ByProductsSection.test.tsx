/**
 * Unit Tests: ByProductsSection Component (Story 04.7a)
 *
 * Tests by-products section with:
 * - By-product list display (FR-PROD-013)
 * - Expected vs actual quantities
 * - Registration status badges
 * - Auto-create info banner
 * - Register actions
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ByProductsSection } from '../ByProductsSection'
import type { ByProduct } from '../ByProductsSection'

// Mock data
const mockByProducts: ByProduct[] = [
  {
    product_id: 'bp-1',
    product_name: 'Wheat Bran',
    product_code: 'SKU-BP-BRAN',
    material_id: 'mat-1',
    yield_percent: 5,
    expected_qty: 250,
    actual_qty: 160,
    uom: 'kg',
    lp_count: 6,
    status: 'registered',
    last_registered_at: '2025-01-15T08:15:00Z',
  },
  {
    product_id: 'bp-2',
    product_name: 'Flour Dust',
    product_code: 'SKU-BP-DUST',
    material_id: 'mat-2',
    yield_percent: 1,
    expected_qty: 50,
    actual_qty: 35,
    uom: 'kg',
    lp_count: 6,
    status: 'registered',
    last_registered_at: '2025-01-15T08:15:00Z',
  },
  {
    product_id: 'bp-3',
    product_name: 'Wheat Germ',
    product_code: 'SKU-BP-GERM',
    material_id: 'mat-3',
    yield_percent: 2,
    expected_qty: 100,
    actual_qty: 0,
    uom: 'kg',
    lp_count: 0,
    status: 'not_registered',
    last_registered_at: null,
  },
]

describe('ByProductsSection Component (Story 04.7a)', () => {
  const mockOnRegister = vi.fn()
  const mockOnRegisterAll = vi.fn()
  const mockOnViewLPs = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Basic Rendering Tests (FR-PROD-013)
  // ============================================================================
  describe('Basic Rendering', () => {
    it('AC: displays all by-products from BOM', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={true}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByText('Wheat Bran')).toBeInTheDocument()
      expect(screen.getByText('Flour Dust')).toBeInTheDocument()
      expect(screen.getByText('Wheat Germ')).toBeInTheDocument()
    })

    it('displays product codes', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={true}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByText('SKU-BP-BRAN')).toBeInTheDocument()
      expect(screen.getByText('SKU-BP-DUST')).toBeInTheDocument()
      expect(screen.getByText('SKU-BP-GERM')).toBeInTheDocument()
    })

    it('displays By-Products header', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={true}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByText('By-Products')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Expected vs Actual Tests (FR-PROD-013)
  // ============================================================================
  describe('Expected vs Actual Quantities', () => {
    it('AC: displays expected qty with yield percent', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      // Wheat Bran expected 250 kg at 5%
      expect(screen.getByText(/Expected \(5%\)/)).toBeInTheDocument()
      expect(screen.getByText(/250/)).toBeInTheDocument()
    })

    it('displays actual registered qty', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByText(/160/)).toBeInTheDocument()
    })

    it('displays LP count', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByText('6 LPs')).toBeInTheDocument()
    })

    it('displays progress bar', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      // Check progress percentage for Wheat Bran (160/250 = 64%)
      expect(screen.getByText('64%')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Status Badge Tests
  // ============================================================================
  describe('Status Badges', () => {
    it('displays Registered badge for registered by-products', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      const registeredBadges = screen.getAllByText('Registered')
      expect(registeredBadges.length).toBe(2)
    })

    it('displays Not Registered badge for unregistered by-products', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByText('Not Registered')).toBeInTheDocument()
    })

    it('shows missing warning for unregistered by-products', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByText('Missing expected by-product')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Auto-Create Banner Tests
  // ============================================================================
  describe('Auto-Create Banner', () => {
    it('AC: shows auto-create ON banner when enabled', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={true}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByText('Auto-Create: ON')).toBeInTheDocument()
      expect(screen.getByText(/By-products will be automatically created/)).toBeInTheDocument()
    })

    it('does not show banner when auto-create disabled', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.queryByText('Auto-Create: ON')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Action Buttons Tests
  // ============================================================================
  describe('Action Buttons', () => {
    it('displays Register Now button for unregistered by-products', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByRole('button', { name: /register now/i })).toBeInTheDocument()
    })

    it('calls onRegister when Register Now clicked', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      const registerButton = screen.getByRole('button', { name: /register now/i })
      fireEvent.click(registerButton)

      expect(mockOnRegister).toHaveBeenCalledWith(mockByProducts[2])
    })

    it('displays View LPs button for registered by-products', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      const viewButtons = screen.getAllByRole('button', { name: /view lps/i })
      expect(viewButtons.length).toBe(2)
    })

    it('calls onViewLPs when View LPs clicked', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      const viewButtons = screen.getAllByRole('button', { name: /view lps/i })
      fireEvent.click(viewButtons[0])

      expect(mockOnViewLPs).toHaveBeenCalledWith('mat-1')
    })

    it('displays Add More button for registered by-products', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      const addMoreButtons = screen.getAllByRole('button', { name: /add more/i })
      expect(addMoreButtons.length).toBe(2)
    })

    it('calls onRegister when Add More clicked', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      const addMoreButtons = screen.getAllByRole('button', { name: /add more/i })
      fireEvent.click(addMoreButtons[0])

      expect(mockOnRegister).toHaveBeenCalledWith(mockByProducts[0])
    })

    it('displays Register All button when unregistered by-products exist', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByRole('button', { name: /register all by-products/i })).toBeInTheDocument()
    })

    it('calls onRegisterAll when Register All clicked', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      const registerAllButton = screen.getByRole('button', { name: /register all by-products/i })
      fireEvent.click(registerAllButton)

      expect(mockOnRegisterAll).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Loading State Tests
  // ============================================================================
  describe('Loading State', () => {
    it('displays loading state', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={[]}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={true}
        />
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('has accessible loading label', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={[]}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={true}
        />
      )

      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Empty State Tests
  // ============================================================================
  describe('Empty State', () => {
    it('displays message when no by-products', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={[]}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(screen.getByText('No by-products defined for this WO')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Footer Info Tests
  // ============================================================================
  describe('Footer Info', () => {
    it('displays genealogy info', () => {
      render(
        <ByProductsSection
          woId="wo-1"
          autoCreateEnabled={false}
          byProducts={mockByProducts}
          onRegister={mockOnRegister}
          onRegisterAll={mockOnRegisterAll}
          onViewLPs={mockOnViewLPs}
          isLoading={false}
        />
      )

      expect(
        screen.getByText(/By-products share the same genealogy as main output/)
      ).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary for ByProductsSection (Story 04.7a)
 * =========================================================
 *
 * Basic Rendering: 3 tests
 *   - All by-products display
 *   - Product codes
 *   - Header
 *
 * Expected vs Actual: 4 tests
 *   - Expected qty with yield
 *   - Actual qty
 *   - LP count
 *   - Progress bar
 *
 * Status Badges: 3 tests
 *   - Registered badge
 *   - Not Registered badge
 *   - Missing warning
 *
 * Auto-Create Banner: 2 tests
 *   - Banner when enabled
 *   - No banner when disabled
 *
 * Action Buttons: 8 tests
 *   - Register Now display
 *   - Register Now callback
 *   - View LPs display
 *   - View LPs callback
 *   - Add More display
 *   - Add More callback
 *   - Register All display
 *   - Register All callback
 *
 * Loading State: 2 tests
 *   - Loading display
 *   - Accessible label
 *
 * Empty State: 1 test
 *   - No by-products message
 *
 * Footer Info: 1 test
 *   - Genealogy info
 *
 * Total: 24 tests
 */
