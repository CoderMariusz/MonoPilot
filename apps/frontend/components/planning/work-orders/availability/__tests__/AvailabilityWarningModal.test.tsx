/**
 * Availability Warning Modal Component - Unit Tests (Story 03.13)
 * Tests warning modal for material shortages (AC-13)
 *
 * Coverage Target: 90%
 * Test Count: 15 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AvailabilityWarningModal } from '../AvailabilityWarningModal'
import type { MaterialAvailability } from '@/lib/types/wo-availability'

// Test data
const mockMaterialsWithIssues: MaterialAvailability[] = [
  {
    wo_material_id: 'wom-1',
    product_id: 'prod-1',
    product_code: 'RM-001',
    product_name: 'Cocoa Mass',
    required_qty: 100,
    available_qty: 30,
    reserved_qty: 0,
    shortage_qty: 70,
    coverage_percent: 30,
    status: 'shortage',
    uom: 'kg',
    expired_excluded_qty: 0,
  },
  {
    wo_material_id: 'wom-2',
    product_id: 'prod-2',
    product_code: 'RM-002',
    product_name: 'Sugar',
    required_qty: 50,
    available_qty: 40,
    reserved_qty: 0,
    shortage_qty: 10,
    coverage_percent: 80,
    status: 'low_stock',
    uom: 'kg',
    expired_excluded_qty: 0,
  },
]

describe('AvailabilityWarningModal Component (Story 03.13)', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    materials: mockMaterialsWithIssues,
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Modal Display (AC-13)', () => {
    it('should render when open=true', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    it('should not render when open=false', () => {
      render(<AvailabilityWarningModal {...defaultProps} open={false} />)

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    })

    it('should display warning title', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByText('Material Shortages Detected')).toBeInTheDocument()
    })

    it('should display warning description', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(
        screen.getByText(/Production may be delayed or incomplete/)
      ).toBeInTheDocument()
    })

    it('should display warning icon', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      // The modal should contain an AlertTriangle icon wrapper
      const iconWrapper = document.querySelector('.bg-yellow-100')
      expect(iconWrapper).toBeInTheDocument()
    })
  })

  describe('Materials List Display', () => {
    it('should display materials with issues', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByText('Cocoa Mass')).toBeInTheDocument()
      expect(screen.getByText('Sugar')).toBeInTheDocument()
    })

    it('should display shortage quantity and coverage', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByText(/70 kg/)).toBeInTheDocument()
      expect(screen.getByText(/30%/)).toBeInTheDocument()
    })

    it('should display material code in parentheses', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByText(/RM-001/)).toBeInTheDocument()
    })

    it('should show shortage count header', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByText('Materials with Issues:')).toBeInTheDocument()
      expect(screen.getByText(/1 shortage/)).toBeInTheDocument()
      expect(screen.getByText(/1 low stock/)).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should display Cancel button', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    })

    it('should display Proceed button', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByTestId('proceed-button')).toBeInTheDocument()
    })

    it('should call onCancel when Cancel clicked', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      render(<AvailabilityWarningModal {...defaultProps} onCancel={onCancel} />)

      await user.click(screen.getByTestId('cancel-button'))

      expect(onCancel).toHaveBeenCalled()
    })

    it('should call onConfirm when Proceed clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      render(<AvailabilityWarningModal {...defaultProps} onConfirm={onConfirm} />)

      await user.click(screen.getByTestId('proceed-button'))

      expect(onConfirm).toHaveBeenCalled()
    })

    it('should close modal when Cancel clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(
        <AvailabilityWarningModal {...defaultProps} onOpenChange={onOpenChange} />
      )

      await user.click(screen.getByTestId('cancel-button'))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })

    it('should close modal when Proceed clicked', async () => {
      const user = userEvent.setup()
      const onOpenChange = vi.fn()
      render(
        <AvailabilityWarningModal {...defaultProps} onOpenChange={onOpenChange} />
      )

      await user.click(screen.getByTestId('proceed-button'))

      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  describe('Loading State', () => {
    it('should disable Proceed button when isLoading=true', () => {
      render(<AvailabilityWarningModal {...defaultProps} isLoading={true} />)

      expect(screen.getByTestId('proceed-button')).toBeDisabled()
    })

    it('should show "Processing..." text when isLoading=true', () => {
      render(<AvailabilityWarningModal {...defaultProps} isLoading={true} />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })
  })

  describe('Custom Action Label', () => {
    it('should use custom actionLabel in description', () => {
      render(
        <AvailabilityWarningModal {...defaultProps} actionLabel="Save" />
      )

      expect(screen.getByText(/You are about to save this Work Order/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible dialog role', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    })

    it('should have accessible title and description', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByRole('alertdialog')).toHaveAccessibleName()
      expect(screen.getByRole('alertdialog')).toHaveAccessibleDescription()
    })
  })

  describe('Confirmation Text', () => {
    it('should display confirmation question', () => {
      render(<AvailabilityWarningModal {...defaultProps} />)

      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument()
    })
  })
})
