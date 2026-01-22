/**
 * QualityStatusBadge Component Tests (Story 06.1)
 * Purpose: Test badge rendering, colors, icons, states
 *
 * Coverage:
 * - All 7 status types render correctly
 * - Color coding matches specifications
 * - Icons display for each status
 * - Size variants (sm, md, lg)
 * - Loading and error states
 * - Accessibility attributes
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  QualityStatusBadge,
  getStatusConfig,
  getAllStatusConfigs,
  isShipmentAllowed,
  isConsumptionAllowed,
  type QualityStatus,
} from '../QualityStatusBadge'

describe('QualityStatusBadge Component (Story 06.1)', () => {
  // ==========================================================================
  // Status Rendering Tests
  // ==========================================================================
  describe('Status Rendering', () => {
    it('should render PENDING status with correct label', () => {
      render(<QualityStatusBadge status="PENDING" />)
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should render PASSED status with correct label', () => {
      render(<QualityStatusBadge status="PASSED" />)
      expect(screen.getByText('Passed')).toBeInTheDocument()
    })

    it('should render FAILED status with correct label', () => {
      render(<QualityStatusBadge status="FAILED" />)
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('should render HOLD status with correct label', () => {
      render(<QualityStatusBadge status="HOLD" />)
      expect(screen.getByText('Hold')).toBeInTheDocument()
    })

    it('should render RELEASED status with correct label', () => {
      render(<QualityStatusBadge status="RELEASED" />)
      expect(screen.getByText('Released')).toBeInTheDocument()
    })

    it('should render QUARANTINED status with correct label', () => {
      render(<QualityStatusBadge status="QUARANTINED" />)
      expect(screen.getByText('Quarantined')).toBeInTheDocument()
    })

    it('should render COND_APPROVED status with correct label', () => {
      render(<QualityStatusBadge status="COND_APPROVED" />)
      expect(screen.getByText('Conditionally Approved')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Color Coding Tests
  // ==========================================================================
  describe('Color Coding', () => {
    it('should apply gray colors for PENDING', () => {
      render(<QualityStatusBadge status="PENDING" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-700')
    })

    it('should apply green colors for PASSED', () => {
      render(<QualityStatusBadge status="PASSED" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-800')
    })

    it('should apply red colors for FAILED', () => {
      render(<QualityStatusBadge status="FAILED" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-red-100')
      expect(badge).toHaveClass('text-red-800')
    })

    it('should apply orange colors for HOLD', () => {
      render(<QualityStatusBadge status="HOLD" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-orange-100')
      expect(badge).toHaveClass('text-orange-800')
    })

    it('should apply blue colors for RELEASED', () => {
      render(<QualityStatusBadge status="RELEASED" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-blue-100')
      expect(badge).toHaveClass('text-blue-800')
    })

    it('should apply dark red colors for QUARANTINED', () => {
      render(<QualityStatusBadge status="QUARANTINED" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-red-200')
      expect(badge).toHaveClass('text-red-900')
    })

    it('should apply yellow colors for COND_APPROVED', () => {
      render(<QualityStatusBadge status="COND_APPROVED" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveClass('text-yellow-800')
    })
  })

  // ==========================================================================
  // Icon Tests
  // ==========================================================================
  describe('Icons', () => {
    it('should render icon by default', () => {
      render(<QualityStatusBadge status="PENDING" />)
      const badge = screen.getByRole('status')
      const icon = badge.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should hide icon when showIcon is false', () => {
      render(<QualityStatusBadge status="PENDING" showIcon={false} />)
      const badge = screen.getByRole('status')
      const icon = badge.querySelector('svg')
      expect(icon).not.toBeInTheDocument()
    })

    it('should render CheckCircle icon for PASSED', () => {
      render(<QualityStatusBadge status="PASSED" />)
      const badge = screen.getByRole('status')
      const icon = badge.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should render XCircle icon for FAILED', () => {
      render(<QualityStatusBadge status="FAILED" />)
      const badge = screen.getByRole('status')
      const icon = badge.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Size Variants Tests
  // ==========================================================================
  describe('Size Variants', () => {
    it('should render small size (sm)', () => {
      render(<QualityStatusBadge status="PENDING" size="sm" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('text-xs')
      expect(badge).toHaveClass('px-2')
      expect(badge).toHaveClass('py-0.5')
    })

    it('should render medium size (md) by default', () => {
      render(<QualityStatusBadge status="PENDING" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('text-sm')
      expect(badge).toHaveClass('px-2.5')
      expect(badge).toHaveClass('py-1')
    })

    it('should render large size (lg)', () => {
      render(<QualityStatusBadge status="PENDING" size="lg" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('text-base')
      expect(badge).toHaveClass('px-3')
      expect(badge).toHaveClass('py-1.5')
    })
  })

  // ==========================================================================
  // Loading State Tests
  // ==========================================================================
  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      render(<QualityStatusBadge status="PENDING" loading={true} />)
      expect(screen.getByTestId('quality-status-badge-loading')).toBeInTheDocument()
    })

    it('should not render badge content when loading', () => {
      render(<QualityStatusBadge status="PENDING" loading={true} />)
      expect(screen.queryByText('Pending')).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Error State Tests
  // ==========================================================================
  describe('Error State', () => {
    it('should render error state when error provided', () => {
      render(<QualityStatusBadge status="PENDING" error="Failed to load" />)
      expect(screen.getByTestId('quality-status-badge-error')).toBeInTheDocument()
    })

    it('should show error text', () => {
      render(<QualityStatusBadge status="PENDING" error="Failed to load" />)
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('should have alert role for error state', () => {
      render(<QualityStatusBadge status="PENDING" error="Failed to load" />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Unknown Status Tests
  // ==========================================================================
  describe('Unknown Status', () => {
    it('should render unknown state for invalid status', () => {
      // @ts-expect-error Testing invalid status
      render(<QualityStatusBadge status="INVALID" />)
      expect(screen.getByTestId('quality-status-badge-unknown')).toBeInTheDocument()
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================
  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<QualityStatusBadge status="PENDING" />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should have aria-label with status name', () => {
      render(<QualityStatusBadge status="PASSED" />)
      expect(screen.getByLabelText('Quality Status: Passed')).toBeInTheDocument()
    })

    it('should hide icon from screen readers', () => {
      render(<QualityStatusBadge status="PENDING" />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  // ==========================================================================
  // Helper Function Tests
  // ==========================================================================
  describe('Helper Functions', () => {
    it('getStatusConfig should return config for valid status', () => {
      const config = getStatusConfig('PASSED')
      expect(config).toBeDefined()
      expect(config?.label).toBe('Passed')
      expect(config?.color).toBe('green')
    })

    it('getStatusConfig should return undefined for invalid status', () => {
      // @ts-expect-error Testing invalid status
      const config = getStatusConfig('INVALID')
      expect(config).toBeUndefined()
    })

    it('getAllStatusConfigs should return all 7 statuses', () => {
      const configs = getAllStatusConfigs()
      expect(Object.keys(configs)).toHaveLength(7)
      expect(configs.PENDING).toBeDefined()
      expect(configs.PASSED).toBeDefined()
      expect(configs.FAILED).toBeDefined()
      expect(configs.HOLD).toBeDefined()
      expect(configs.RELEASED).toBeDefined()
      expect(configs.QUARANTINED).toBeDefined()
      expect(configs.COND_APPROVED).toBeDefined()
    })

    it('isShipmentAllowed should return correct values', () => {
      expect(isShipmentAllowed('PASSED')).toBe(true)
      expect(isShipmentAllowed('RELEASED')).toBe(true)
      expect(isShipmentAllowed('PENDING')).toBe(false)
      expect(isShipmentAllowed('FAILED')).toBe(false)
      expect(isShipmentAllowed('HOLD')).toBe(false)
      expect(isShipmentAllowed('QUARANTINED')).toBe(false)
      expect(isShipmentAllowed('COND_APPROVED')).toBe(false)
    })

    it('isConsumptionAllowed should return correct values', () => {
      expect(isConsumptionAllowed('PASSED')).toBe(true)
      expect(isConsumptionAllowed('RELEASED')).toBe(true)
      expect(isConsumptionAllowed('COND_APPROVED')).toBe(true)
      expect(isConsumptionAllowed('PENDING')).toBe(false)
      expect(isConsumptionAllowed('FAILED')).toBe(false)
      expect(isConsumptionAllowed('HOLD')).toBe(false)
      expect(isConsumptionAllowed('QUARANTINED')).toBe(false)
    })
  })

  // ==========================================================================
  // Custom Class Tests
  // ==========================================================================
  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      render(<QualityStatusBadge status="PENDING" className="custom-class" />)
      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('custom-class')
    })
  })

  // ==========================================================================
  // Test ID Tests
  // ==========================================================================
  describe('Test IDs', () => {
    it('should have default test ID', () => {
      render(<QualityStatusBadge status="PENDING" />)
      expect(screen.getByTestId('quality-status-badge')).toBeInTheDocument()
    })

    it('should accept custom test ID', () => {
      render(<QualityStatusBadge status="PENDING" testId="custom-badge" />)
      expect(screen.getByTestId('custom-badge')).toBeInTheDocument()
    })
  })
})

/**
 * Test Summary:
 *
 * Status Rendering: 7 tests - All 7 statuses render with correct labels
 * Color Coding: 7 tests - Each status has correct color classes
 * Icons: 4 tests - Icons render correctly with aria-hidden
 * Size Variants: 3 tests - sm, md, lg sizes work correctly
 * Loading State: 2 tests - Skeleton renders during loading
 * Error State: 3 tests - Error display with alert role
 * Unknown Status: 1 test - Unknown status handled gracefully
 * Accessibility: 3 tests - ARIA attributes present
 * Helper Functions: 5 tests - Utility functions work correctly
 * Custom Classes: 1 test - Custom className supported
 * Test IDs: 2 tests - Test IDs work correctly
 *
 * Total: 38 tests
 */
