/**
 * Component Tests: MaterialAvailabilityCard (Story 04.2a - WO Start)
 * Phase: GREEN - Tests should PASS
 *
 * Tests the MaterialAvailabilityCard component:
 * - Display material availability data
 * - Visual indicators for availability status
 * - Color coding for shortage warnings
 *
 * Acceptance Criteria Coverage:
 * - AC-4: Material availability check and display
 * - AC-7: Material list in modal
 *
 * Coverage Target: 90%
 * Test Count: 18 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MaterialAvailabilityCard } from '@/components/production/work-orders/MaterialAvailabilityCard'

// Mock material data
const mockMaterials = [
  {
    wo_material_id: 'mat-1',
    product_id: 'prod-1',
    product_name: 'Flour',
    required_qty: 100,
    available_qty: 100,
    availability_percent: 100,
    uom: 'kg',
  },
  {
    wo_material_id: 'mat-2',
    product_id: 'prod-2',
    product_name: 'Sugar',
    required_qty: 50,
    available_qty: 45,
    availability_percent: 90,
    uom: 'kg',
  },
  {
    wo_material_id: 'mat-3',
    product_id: 'prod-3',
    product_name: 'Butter',
    required_qty: 20,
    available_qty: 0,
    availability_percent: 0,
    uom: 'kg',
  },
]

describe('MaterialAvailabilityCard Component (Story 04.2a)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // AC-7: Material Data Display
  // ============================================================================
  describe('AC-7: Material Data Display', () => {
    it('should render material name', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[0]]}
          overallPercent={100}
        />
      )

      expect(screen.getByText('Flour')).toBeInTheDocument()
    })

    it('should render required quantity with UOM', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[0]]}
          overallPercent={100}
        />
      )

      // Both required and available are 100 kg, so there are 2 matches - this is expected
      expect(screen.getAllByText(/100 kg/).length).toBeGreaterThanOrEqual(1)
    })

    it('should render available quantity with UOM', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[1]]}
          overallPercent={90}
        />
      )

      expect(screen.getByText(/45 kg/)).toBeInTheDocument()
    })

    it('should render availability percentage', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[1]]}
          overallPercent={90}
        />
      )

      // Check for the material's 90% availability
      const percentEl = screen.getByTestId('percent-prod-2')
      expect(percentEl).toHaveTextContent('90%')
    })

    it('should render all materials in list', () => {
      render(
        <MaterialAvailabilityCard
          materials={mockMaterials}
          overallPercent={63}
        />
      )

      expect(screen.getByText('Flour')).toBeInTheDocument()
      expect(screen.getByText('Sugar')).toBeInTheDocument()
      expect(screen.getByText('Butter')).toBeInTheDocument()
    })

    it('should display overall availability percentage in header', () => {
      render(
        <MaterialAvailabilityCard
          materials={mockMaterials}
          overallPercent={63}
        />
      )

      const overallEl = screen.getByTestId('overall-percent')
      expect(overallEl).toHaveTextContent('63%')
    })
  })

  // ============================================================================
  // AC-4: Visual Indicators
  // ============================================================================
  describe('AC-4: Visual Indicators', () => {
    it('should show green indicator for 100% availability', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[0]]}
          overallPercent={100}
        />
      )

      const percentEl = screen.getByTestId('percent-prod-1')
      expect(percentEl).toHaveClass('text-green-600')
    })

    it('should show yellow/warning indicator for partial availability (50-99%)', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[1]]}
          overallPercent={90}
        />
      )

      const percentEl = screen.getByTestId('percent-prod-2')
      expect(percentEl).toHaveClass('text-yellow-600')
    })

    it('should show red indicator for 0% availability', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[2]]}
          overallPercent={0}
        />
      )

      const percentEl = screen.getByTestId('percent-prod-3')
      expect(percentEl).toHaveClass('text-red-600')
    })

    it('should show progress bar for each material', () => {
      render(
        <MaterialAvailabilityCard
          materials={mockMaterials}
          overallPercent={63}
        />
      )

      const progressBars = screen.getAllByRole('progressbar')
      expect(progressBars).toHaveLength(3)
    })

    it('should fill progress bar to correct percentage', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[1]]}
          overallPercent={90}
        />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toHaveAttribute('aria-valuenow', '90')
    })
  })

  // ============================================================================
  // Empty State
  // ============================================================================
  describe('Empty State', () => {
    it('should show "No materials required" when materials array is empty', () => {
      render(
        <MaterialAvailabilityCard
          materials={[]}
          overallPercent={100}
        />
      )

      expect(screen.getByText(/no materials required/i)).toBeInTheDocument()
    })

    it('should show 100% overall when no materials', () => {
      render(
        <MaterialAvailabilityCard
          materials={[]}
          overallPercent={100}
        />
      )

      const overallEl = screen.getByTestId('overall-percent')
      expect(overallEl).toHaveTextContent('100%')
    })
  })

  // ============================================================================
  // Card Layout
  // ============================================================================
  describe('Card Layout', () => {
    it('should have card title "Material Availability"', () => {
      render(
        <MaterialAvailabilityCard
          materials={mockMaterials}
          overallPercent={63}
        />
      )

      expect(screen.getByText(/material availability/i)).toBeInTheDocument()
    })

    it('should render as a table with headers', () => {
      render(
        <MaterialAvailabilityCard
          materials={mockMaterials}
          overallPercent={63}
        />
      )

      expect(screen.getByText('Material')).toBeInTheDocument()
      expect(screen.getByText('Required')).toBeInTheDocument()
      expect(screen.getByText('Available')).toBeInTheDocument()
      expect(screen.getByText('%')).toBeInTheDocument()
    })

    it('should be accessible with proper ARIA attributes', () => {
      render(
        <MaterialAvailabilityCard
          materials={mockMaterials}
          overallPercent={63}
        />
      )

      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Shortage Highlighting
  // ============================================================================
  describe('Shortage Highlighting', () => {
    it('should highlight shortage amount', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[1]]}
          overallPercent={90}
        />
      )

      // Sugar has required 50, available 45, shortage is 5
      const shortageEl = screen.getByTestId('shortage-prod-2')
      expect(shortageEl).toHaveTextContent(/-5 kg/)
    })

    it('should NOT show shortage for fully available materials', () => {
      render(
        <MaterialAvailabilityCard
          materials={[mockMaterials[0]]}
          overallPercent={100}
        />
      )

      // Flour has required 100, available 100, no shortage
      expect(screen.queryByTestId('shortage-prod-1')).not.toBeInTheDocument()
    })
  })
})

/**
 * Test Summary for Story 04.2a - MaterialAvailabilityCard Component
 * =================================================================
 *
 * Test Coverage:
 * - AC-7 (Data Display): 6 tests
 * - AC-4 (Visual Indicators): 5 tests
 * - Empty State: 2 tests
 * - Card Layout: 3 tests
 * - Shortage Highlighting: 2 tests
 *
 * Total: 18 test cases
 *
 * Expected Status: ALL TESTS PASS (GREEN phase)
 */
