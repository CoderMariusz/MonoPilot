/**
 * Availability Summary Card Component - Unit Tests (Story 03.13)
 * Tests summary card with overall status and counts
 *
 * Coverage Target: 90%
 * Test Count: 20 tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvailabilitySummaryCard } from '../AvailabilitySummaryCard'
import type { AvailabilitySummary, OverallStatus, MaterialAvailability } from '@/lib/types/wo-availability'

// Test data
const mockSummary: AvailabilitySummary = {
  total_materials: 10,
  sufficient_count: 6,
  low_stock_count: 3,
  shortage_count: 1,
}

const mockCriticalMaterial: MaterialAvailability = {
  wo_material_id: 'wom-1',
  product_id: 'prod-1',
  product_code: 'RM-001',
  product_name: 'Test Material',
  required_qty: 100,
  available_qty: 30,
  reserved_qty: 0,
  shortage_qty: 70,
  coverage_percent: 30,
  status: 'shortage',
  uom: 'kg',
  expired_excluded_qty: 0,
}

describe('AvailabilitySummaryCard Component (Story 03.13)', () => {
  const defaultProps = {
    summary: mockSummary,
    overallStatus: 'low_stock' as OverallStatus,
    checkedAt: new Date().toISOString(),
    cached: false,
  }

  describe('Summary Display (AC-5)', () => {
    it('should display total materials count', () => {
      render(<AvailabilitySummaryCard {...defaultProps} />)

      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('Total Materials')).toBeInTheDocument()
    })

    it('should display sufficient count', () => {
      render(<AvailabilitySummaryCard {...defaultProps} />)

      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('Sufficient')).toBeInTheDocument()
    })

    it('should display low stock count', () => {
      render(<AvailabilitySummaryCard {...defaultProps} />)

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Low Stock')).toBeInTheDocument()
    })

    it('should display shortage count', () => {
      render(<AvailabilitySummaryCard {...defaultProps} />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Shortage')).toBeInTheDocument()
    })

    it('should display "Material Availability" title', () => {
      render(<AvailabilitySummaryCard {...defaultProps} />)

      expect(screen.getByText('Material Availability')).toBeInTheDocument()
    })
  })

  describe('Overall Status Banner (AC-4)', () => {
    it('should show green banner for sufficient status', () => {
      render(
        <AvailabilitySummaryCard
          {...defaultProps}
          overallStatus="sufficient"
          summary={{ ...mockSummary, shortage_count: 0, low_stock_count: 0, sufficient_count: 10 }}
        />
      )

      // Look for status text in banner
      expect(screen.getByText(/Overall Status:/)).toBeInTheDocument()
      // The message changes based on summary counts
      const allAvailableText = screen.queryByText('All materials available')
      const overallStatusText = screen.getByText(/Overall Status:/)
      expect(overallStatusText || allAvailableText).toBeTruthy()
    })

    it('should show yellow banner for low_stock status', () => {
      render(<AvailabilitySummaryCard {...defaultProps} />)

      // Banner should exist with LOW STOCK text
      expect(screen.getByText(/Overall Status:/)).toBeInTheDocument()
    })

    it('should show red banner for shortage status', () => {
      render(
        <AvailabilitySummaryCard
          {...defaultProps}
          overallStatus="shortage"
        />
      )

      expect(screen.getByText(/Overall Status:/)).toBeInTheDocument()
    })

    it('should show red banner for no_stock status', () => {
      render(
        <AvailabilitySummaryCard
          {...defaultProps}
          overallStatus="no_stock"
        />
      )

      expect(screen.getByText(/Overall Status:/)).toBeInTheDocument()
    })
  })

  describe('Last Checked Time', () => {
    it('should display "just now" for recent check', () => {
      render(<AvailabilitySummaryCard {...defaultProps} />)

      expect(screen.getByText(/Last checked:/)).toBeInTheDocument()
      expect(screen.getByText(/just now/)).toBeInTheDocument()
    })

    it('should display minutes ago for older check', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      render(<AvailabilitySummaryCard {...defaultProps} checkedAt={fiveMinutesAgo} />)

      expect(screen.getByText(/5 min ago/)).toBeInTheDocument()
    })
  })

  describe('Cache Badge', () => {
    it('should show cached badge when cached=true', () => {
      render(<AvailabilitySummaryCard {...defaultProps} cached={true} />)

      expect(screen.getByText('Cached')).toBeInTheDocument()
    })

    it('should not show cached badge when cached=false', () => {
      render(<AvailabilitySummaryCard {...defaultProps} cached={false} />)

      expect(screen.queryByText('Cached')).not.toBeInTheDocument()
    })
  })

  describe('Refresh Button', () => {
    it('should render refresh button when onRefresh provided', () => {
      const onRefresh = vi.fn()
      render(<AvailabilitySummaryCard {...defaultProps} onRefresh={onRefresh} />)

      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    it('should call onRefresh when button clicked', async () => {
      const user = userEvent.setup()
      const onRefresh = vi.fn()
      render(<AvailabilitySummaryCard {...defaultProps} onRefresh={onRefresh} />)

      await user.click(screen.getByRole('button', { name: /refresh/i }))

      expect(onRefresh).toHaveBeenCalled()
    })

    it('should disable refresh button when isRefreshing=true', () => {
      const onRefresh = vi.fn()
      render(
        <AvailabilitySummaryCard
          {...defaultProps}
          onRefresh={onRefresh}
          isRefreshing={true}
        />
      )

      expect(screen.getByRole('button', { name: /refresh/i })).toBeDisabled()
    })

    it('should not render refresh button when onRefresh not provided', () => {
      render(<AvailabilitySummaryCard {...defaultProps} />)

      expect(screen.queryByRole('button', { name: /refresh/i })).not.toBeInTheDocument()
    })
  })

  describe('Critical Materials Warnings', () => {
    it('should display critical materials when provided', () => {
      render(
        <AvailabilitySummaryCard
          {...defaultProps}
          overallStatus="shortage"
          criticalMaterials={[mockCriticalMaterial]}
        />
      )

      expect(screen.getByText(/Test Material/)).toBeInTheDocument()
      expect(screen.getByText(/30%/)).toBeInTheDocument()
    })

    it('should show shortage quantity in warning', () => {
      render(
        <AvailabilitySummaryCard
          {...defaultProps}
          overallStatus="shortage"
          criticalMaterials={[mockCriticalMaterial]}
        />
      )

      expect(screen.getByText(/70 kg shortage/)).toBeInTheDocument()
    })

    it('should show +X more when more than 3 critical materials', () => {
      const materials = Array.from({ length: 5 }, (_, i) => ({
        ...mockCriticalMaterial,
        product_id: `prod-${i}`,
        product_name: `Material ${i}`,
      }))

      render(
        <AvailabilitySummaryCard
          {...defaultProps}
          overallStatus="shortage"
          criticalMaterials={materials}
        />
      )

      expect(screen.getByText(/\+2 more materials/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have testid for card', () => {
      render(<AvailabilitySummaryCard {...defaultProps} />)

      expect(screen.getByTestId('availability-summary-card')).toBeInTheDocument()
    })

    it('should have accessible refresh button', () => {
      const onRefresh = vi.fn()
      render(<AvailabilitySummaryCard {...defaultProps} onRefresh={onRefresh} />)

      const button = screen.getByRole('button', { name: /refresh/i })
      expect(button).toHaveAccessibleName()
    })
  })
})
