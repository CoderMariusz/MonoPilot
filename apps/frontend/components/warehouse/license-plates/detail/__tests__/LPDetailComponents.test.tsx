/**
 * LP Detail Components - Unit Tests (Story 05.6)
 * Purpose: Test LP detail page components
 * Phase: RED - Tests will fail until components are implemented
 *
 * Tests components:
 * - LPStatusBadge: Status badge with correct colors
 * - LPExpiryIndicator: Expiry warning with color coding
 * - LPBlockModal: Block confirmation modal
 * - LPUnblockModal: Unblock confirmation modal
 * - LPIdentityCard: Identity section
 * - LPProductCard: Product information
 * - LPLocationCard: Location information
 * - LPTrackingCard: Batch and expiry tracking
 *
 * Coverage Target: 80%+
 * Test Count: 30+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-02: Overview Tab - Identity Section
 * - AC-03: Overview Tab - Product Section
 * - AC-04: Overview Tab - Location Section
 * - AC-05: Overview Tab - Tracking Section
 * - AC-10: Quick Actions - Block LP
 * - AC-11: Quick Actions - Unblock LP
 * - AC-17: Loading State
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'

import {
  LPStatusBadge,
  LPExpiryIndicator,
  LPBlockModal,
  LPUnblockModal,
  LPIdentityCard,
  LPProductCard,
  LPLocationCard,
  LPTrackingCard,
  LPFieldLabel,
  LPEmptyState,
} from '../index'

describe('LP Detail Components (Story 05.6)', () => {
  /**
   * Test Group: LPStatusBadge
   * AC-02: Status badges with correct colors
   */
  describe('LPStatusBadge', () => {
    it('should render available badge with green styling', () => {
      render(<LPStatusBadge status="available" />)

      const badge = screen.getByText('Available')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-800')
      expect(badge).toHaveClass('border-green-300')
    })

    it('should render reserved badge with yellow styling', () => {
      render(<LPStatusBadge status="reserved" />)

      const badge = screen.getByText('Reserved')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveClass('text-yellow-800')
    })

    it('should render consumed badge with gray styling', () => {
      render(<LPStatusBadge status="consumed" />)

      const badge = screen.getByText('Consumed')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-500')
    })

    it('should render blocked badge with red styling', () => {
      render(<LPStatusBadge status="blocked" />)

      const badge = screen.getByText('Blocked')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('bg-red-100')
      expect(badge).toHaveClass('text-red-800')
    })

    it('should display status icon', () => {
      const { container } = render(<LPStatusBadge status="available" />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  /**
   * Test Group: LPExpiryIndicator
   * AC-05: Expiry warning with color coding
   */
  describe('LPExpiryIndicator', () => {
    it('should show EXPIRED badge for past date', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      const expiryDate = pastDate.toISOString().split('T')[0]

      render(<LPExpiryIndicator expiryDate={expiryDate} />)

      const badge = screen.getByText('EXPIRED')
      expect(badge).toBeInTheDocument()
      expect(badge).toHaveClass('text-red-800')
      expect(badge).toHaveClass('bg-red-100')
      expect(badge).toHaveClass('border-red-300')
    })

    it('should show red warning for 0-7 days remaining', () => {
      const criticalDate = new Date()
      criticalDate.setDate(criticalDate.getDate() + 5)
      const expiryDate = criticalDate.toISOString().split('T')[0]

      render(<LPExpiryIndicator expiryDate={expiryDate} />)

      const text = screen.getByText(/days/)
      expect(text).toBeInTheDocument()
      expect(text).toHaveClass('text-red-600')
    })

    it('should show yellow warning for 8-30 days remaining', () => {
      const warningDate = new Date()
      warningDate.setDate(warningDate.getDate() + 20)
      const expiryDate = warningDate.toISOString().split('T')[0]

      render(<LPExpiryIndicator expiryDate={expiryDate} />)

      const text = screen.getByText(/days/)
      expect(text).toBeInTheDocument()
      expect(text).toHaveClass('text-yellow-600')
    })

    it('should show green text for >30 days remaining', () => {
      const normalDate = new Date()
      normalDate.setDate(normalDate.getDate() + 60)
      const expiryDate = normalDate.toISOString().split('T')[0]

      render(<LPExpiryIndicator expiryDate={expiryDate} />)

      const text = screen.getByText(/days/)
      expect(text).toBeInTheDocument()
      expect(text).toHaveClass('text-green-600')
    })

    it('should show N/A for null expiry date', () => {
      render(<LPExpiryIndicator expiryDate={null} />)

      const text = screen.getByText('N/A')
      expect(text).toBeInTheDocument()
      expect(text).toHaveClass('text-gray-400')
    })

    it('should display warning icon for critical dates', () => {
      const criticalDate = new Date()
      criticalDate.setDate(criticalDate.getDate() + 3)
      const expiryDate = criticalDate.toISOString().split('T')[0]

      const { container } = render(<LPExpiryIndicator expiryDate={expiryDate} />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  /**
   * Test Group: LPBlockModal
   * AC-10: Block LP confirmation modal
   */
  describe('LPBlockModal', () => {
    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()

    it('should render modal when open', () => {
      render(
        <LPBlockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/Block License Plate/i)).toBeInTheDocument()
      expect(screen.getByText('LP00000001')).toBeInTheDocument()
    })

    it('should not render when closed', () => {
      render(
        <LPBlockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={false}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.queryByText(/Block License Plate/i)).not.toBeInTheDocument()
    })

    it('should show validation error when reason is empty', async () => {
      render(
        <LPBlockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const blockButton = screen.getByRole('button', { name: /Block LP/i })
      fireEvent.click(blockButton)

      await waitFor(() => {
        expect(screen.getByText(/Reason is required/i)).toBeInTheDocument()
      })
    })

    it('should show validation error when reason exceeds 500 chars', async () => {
      render(
        <LPBlockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const textarea = screen.getByPlaceholderText(/Enter reason/i)
      fireEvent.change(textarea, { target: { value: 'x'.repeat(501) } })

      const blockButton = screen.getByRole('button', { name: /Block LP/i })
      fireEvent.click(blockButton)

      await waitFor(() => {
        expect(
          screen.getByText(/must be 500 characters or less/i)
        ).toBeInTheDocument()
      })
    })

    it('should submit with valid reason', async () => {
      render(
        <LPBlockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const textarea = screen.getByPlaceholderText(/Enter reason/i)
      fireEvent.change(textarea, { target: { value: 'Quality issue detected' } })

      const blockButton = screen.getByRole('button', { name: /Block LP/i })
      fireEvent.click(blockButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should call onClose when Cancel clicked', () => {
      render(
        <LPBlockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should show character count', () => {
      render(
        <LPBlockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const textarea = screen.getByPlaceholderText(/Enter reason/i)
      fireEvent.change(textarea, { target: { value: 'Test reason' } })

      expect(screen.getByText(/11 \/ 500/)).toBeInTheDocument()
    })
  })

  /**
   * Test Group: LPUnblockModal
   * AC-11: Unblock LP confirmation modal
   */
  describe('LPUnblockModal', () => {
    const mockOnClose = vi.fn()
    const mockOnSuccess = vi.fn()

    it('should render modal with original block reason', () => {
      render(
        <LPUnblockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          blockReason="Quality issue detected"
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/Unblock License Plate/i)).toBeInTheDocument()
      expect(screen.getByText('Quality issue detected')).toBeInTheDocument()
    })

    it('should show message when no block reason', () => {
      render(
        <LPUnblockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          blockReason={null}
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      expect(screen.getByText(/No reason provided/i)).toBeInTheDocument()
    })

    it('should call onSuccess when Unblock clicked', async () => {
      render(
        <LPUnblockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          blockReason="Test"
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const unblockButton = screen.getByRole('button', { name: /Unblock LP/i })
      fireEvent.click(unblockButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should call onClose when Cancel clicked', () => {
      render(
        <LPUnblockModal
          lpId="lp-001"
          lpNumber="LP00000001"
          blockReason="Test"
          isOpen={true}
          onClose={mockOnClose}
          onSuccess={mockOnSuccess}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /Cancel/i })
      fireEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  /**
   * Test Group: LPIdentityCard
   * AC-02: Identity section
   */
  describe('LPIdentityCard', () => {
    const mockProps = {
      lpNumber: 'LP00000001',
      status: 'available' as const,
      qaStatus: 'passed' as const,
      source: 'production' as const,
      createdAt: '2025-12-20T14:23:15Z',
      updatedAt: '2025-12-20T14:23:15Z',
    }

    it('should display LP number prominently', () => {
      render(<LPIdentityCard {...mockProps} />)

      const lpNumber = screen.getByText('LP00000001')
      expect(lpNumber).toBeInTheDocument()
      expect(lpNumber).toHaveClass('text-2xl', 'font-bold')
    })

    it('should display status and QA status badges', () => {
      render(<LPIdentityCard {...mockProps} />)

      expect(screen.getByText('Available')).toBeInTheDocument()
      expect(screen.getByText('Passed')).toBeInTheDocument()
    })

    it('should display source type', () => {
      render(<LPIdentityCard {...mockProps} />)

      expect(screen.getByText(/Production/i)).toBeInTheDocument()
    })

    it('should format dates correctly', () => {
      render(<LPIdentityCard {...mockProps} />)

      const dates = screen.getAllByText(/Dec 20, 2025 at 2:23 PM/i)
      expect(dates.length).toBeGreaterThan(0)
    })
  })

  /**
   * Test Group: LPProductCard
   * AC-03: Product section
   */
  describe('LPProductCard', () => {
    const mockProps = {
      product: {
        id: 'prod-001',
        name: 'Premium Chocolate Bar',
        code: 'CHOC-001',
      },
      quantity: 500.0,
      uom: 'KG',
      catchWeightKg: 505.3,
    }

    it('should display product name as link', () => {
      render(<LPProductCard {...mockProps} />)

      const link = screen.getByRole('link', { name: /Premium Chocolate Bar/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/technical/products/prod-001')
    })

    it('should display product code', () => {
      render(<LPProductCard {...mockProps} />)

      expect(screen.getByText('CHOC-001')).toBeInTheDocument()
    })

    it('should display quantity with UoM', () => {
      render(<LPProductCard {...mockProps} />)

      expect(screen.getByText(/500\.0 KG/i)).toBeInTheDocument()
    })

    it('should display catch weight when available', () => {
      render(<LPProductCard {...mockProps} />)

      expect(screen.getByText(/505\.3 kg/i)).toBeInTheDocument()
    })

    it('should not display catch weight when null', () => {
      render(<LPProductCard {...mockProps} catchWeightKg={null} />)

      expect(screen.queryByTestId('catch-weight')).not.toBeInTheDocument()
    })

    it('should display visual quantity indicator', () => {
      const { container } = render(<LPProductCard {...mockProps} />)

      const progressBar = container.querySelector('[role="progressbar"]')
      expect(progressBar).toBeInTheDocument()
    })
  })

  /**
   * Test Group: LPLocationCard
   * AC-04: Location section
   */
  describe('LPLocationCard', () => {
    const mockProps = {
      warehouse: {
        id: 'wh-001',
        name: 'Main Warehouse',
        code: 'WH-001',
      },
      location: {
        id: 'loc-001',
        full_path: 'WH-001 > Zone A > Bin 5',
      },
    }

    it('should display warehouse name and code as link', () => {
      render(<LPLocationCard {...mockProps} />)

      const link = screen.getByRole('link', { name: /Main Warehouse/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/settings/warehouses/wh-001')
    })

    it('should display full location path', () => {
      render(<LPLocationCard {...mockProps} />)

      expect(screen.getByText('WH-001 > Zone A > Bin 5')).toBeInTheDocument()
    })

    it('should display location icon', () => {
      const { container } = render(<LPLocationCard {...mockProps} />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  /**
   * Test Group: LPTrackingCard
   * AC-05: Batch and expiry tracking
   */
  describe('LPTrackingCard', () => {
    const mockProps = {
      batchNumber: 'BATCH-2025-001',
      supplierBatchNumber: 'SUP-BATCH-001',
      expiryDate: '2026-06-15',
      manufactureDate: '2025-06-15',
    }

    it('should display batch number', () => {
      render(<LPTrackingCard {...mockProps} />)

      expect(screen.getByText('BATCH-2025-001')).toBeInTheDocument()
    })

    it('should display supplier batch number', () => {
      render(<LPTrackingCard {...mockProps} />)

      expect(screen.getByText('SUP-BATCH-001')).toBeInTheDocument()
    })

    it('should display expiry date with indicator', () => {
      render(<LPTrackingCard {...mockProps} />)

      expect(screen.getByText(/Jun 15, 2026/i)).toBeInTheDocument()
    })

    it('should display manufacture date', () => {
      render(<LPTrackingCard {...mockProps} />)

      expect(screen.getByText(/Jun 15, 2025/i)).toBeInTheDocument()
    })

    it('should calculate and display days until expiry', () => {
      render(<LPTrackingCard {...mockProps} />)

      // Should show days remaining (calculated from today)
      expect(screen.getByText(/days/i)).toBeInTheDocument()
    })

    it('should show dash for missing fields', () => {
      render(
        <LPTrackingCard
          batchNumber={null}
          supplierBatchNumber={null}
          expiryDate={null}
          manufactureDate={null}
        />
      )

      const dashes = screen.getAllByText('-')
      expect(dashes.length).toBeGreaterThan(0)
    })
  })

  /**
   * Test Group: LPFieldLabel
   * Shared component for consistent field display
   */
  describe('LPFieldLabel', () => {
    it('should display label and value', () => {
      render(<LPFieldLabel label="Batch Number" value="BATCH-001" />)

      expect(screen.getByText('Batch Number')).toBeInTheDocument()
      expect(screen.getByText('BATCH-001')).toBeInTheDocument()
    })

    it('should show dash for empty value', () => {
      render(<LPFieldLabel label="Batch Number" value="" />)

      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('should use custom empty text', () => {
      render(
        <LPFieldLabel label="Batch Number" value="" emptyText="Not provided" />
      )

      expect(screen.getByText('Not provided')).toBeInTheDocument()
    })
  })

  /**
   * Test Group: LPEmptyState
   * AC-16: Empty state handling
   */
  describe('LPEmptyState', () => {
    it('should display title and description', () => {
      render(
        <LPEmptyState
          title="No genealogy history"
          description="This LP has no parent or child relationships"
        />
      )

      expect(screen.getByText('No genealogy history')).toBeInTheDocument()
      expect(
        screen.getByText('This LP has no parent or child relationships')
      ).toBeInTheDocument()
    })

    it('should display icon when provided', () => {
      const MockIcon = () => <svg data-testid="mock-icon" />

      const { getByTestId } = render(
        <LPEmptyState
          title="Empty"
          description="No data"
          icon={MockIcon}
        />
      )

      expect(getByTestId('mock-icon')).toBeInTheDocument()
    })
  })
})
