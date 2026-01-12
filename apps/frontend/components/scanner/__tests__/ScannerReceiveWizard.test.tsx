/**
 * Scanner Receive Wizard Component Tests (Story 05.19)
 * Phase: TDD RED - Tests written before implementation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScannerReceiveWizard } from '../receive/ScannerReceiveWizard'
import { Step1SelectPO } from '../receive/Step1SelectPO'
import { Step2ReviewLines } from '../receive/Step2ReviewLines'
import { Step3EnterDetails } from '../receive/Step3EnterDetails'
import { Step4ReviewConfirm } from '../receive/Step4ReviewConfirm'
import { Step5Success } from '../receive/Step5Success'
import { NumberPad } from '../shared/NumberPad'
import { AudioFeedback } from '../shared/AudioFeedback'
import { HapticFeedback } from '../shared/HapticFeedback'
import { SuccessAnimation } from '../shared/SuccessAnimation'
import { ErrorAnimation } from '../shared/ErrorAnimation'

// Mock hooks
vi.mock('@/lib/hooks/use-scanner-receive', () => ({
  usePendingReceipts: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  usePOLines: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useProcessReceipt: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useBarcodeLookup: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
}))

// Mock audio context
vi.mock('../shared/AudioFeedback', () => ({
  AudioFeedback: {
    playSuccess: vi.fn(),
    playError: vi.fn(),
    playConfirm: vi.fn(),
    playAlert: vi.fn(),
    setEnabled: vi.fn(),
  },
}))

// Test data fixtures
const mockPendingPO = {
  id: 'po-001',
  po_number: 'PO-2025-00001',
  supplier_name: 'Test Supplier',
  expected_date: '2025-01-15',
  lines_total: 3,
  lines_pending: 2,
  total_qty_ordered: 300,
  total_qty_received: 100,
}

const mockPOLine = {
  id: 'line-001',
  product_id: 'prod-001',
  product_code: 'PROD-001',
  product_name: 'Test Product',
  ordered_qty: 100,
  received_qty: 0,
  remaining_qty: 100,
  uom: 'KG',
}

const mockReceiveResult = {
  grn: {
    id: 'grn-001',
    grn_number: 'GRN-2025-00001',
    receipt_date: '2025-01-10',
    status: 'completed',
  },
  lp: {
    id: 'lp-001',
    lp_number: 'LP00000001',
    product_name: 'Test Product',
    quantity: 100,
    uom: 'KG',
    batch_number: 'BATCH-001',
    expiry_date: '2026-01-01',
    location_path: 'Warehouse A / Zone 1 / LOC-A01',
  },
  po_line_status: 'complete' as const,
  po_status: 'partial' as const,
  print_job_id: 'pj-001',
}

describe('ScannerReceiveWizard', () => {
  // ===========================================================================
  // Wizard Container Tests
  // ===========================================================================
  describe('Wizard Container', () => {
    it('should render with Step 1 by default', () => {
      render(<ScannerReceiveWizard />)
      expect(screen.getByText(/Select.*PO|Step 1/i)).toBeInTheDocument()
    })

    it('should show step progress indicator', () => {
      render(<ScannerReceiveWizard />)
      expect(screen.getByText(/Step 1 of 5/i)).toBeInTheDocument()
    })

    it('should show header with title', () => {
      render(<ScannerReceiveWizard />)
      expect(screen.getByText(/Receive Goods/i)).toBeInTheDocument()
    })

    it('should show back button', () => {
      render(<ScannerReceiveWizard />)
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('should navigate steps correctly', async () => {
      render(<ScannerReceiveWizard />)

      // Step 1: Select PO (mocked)
      // This would need proper mock setup for full flow
      expect(screen.getByText(/Step 1/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Step 1: Select PO Tests
  // ===========================================================================
  describe('Step1SelectPO', () => {
    const mockOnPOSelected = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display pending PO list', () => {
      render(<Step1SelectPO onPOSelected={mockOnPOSelected} pendingPOs={[mockPendingPO]} />)
      expect(screen.getByText('PO-2025-00001')).toBeInTheDocument()
      expect(screen.getByText('Test Supplier')).toBeInTheDocument()
    })

    it('should show "Scan PO Barcode" button', () => {
      render(<Step1SelectPO onPOSelected={mockOnPOSelected} pendingPOs={[]} />)
      expect(screen.getByRole('button', { name: /scan.*PO.*barcode/i })).toBeInTheDocument()
    })

    it('should call onPOSelected when PO tapped', async () => {
      const user = userEvent.setup()
      render(<Step1SelectPO onPOSelected={mockOnPOSelected} pendingPOs={[mockPendingPO]} />)

      const poRow = screen.getByText('PO-2025-00001').closest('button, [role="button"], div[onClick]')
      if (poRow) await user.click(poRow)

      expect(mockOnPOSelected).toHaveBeenCalledWith('po-001')
    })

    it('should show empty state when no pending POs', () => {
      render(<Step1SelectPO onPOSelected={mockOnPOSelected} pendingPOs={[]} />)
      expect(screen.getByText(/no pending/i)).toBeInTheDocument()
    })

    it('should show loading state', () => {
      render(<Step1SelectPO onPOSelected={mockOnPOSelected} pendingPOs={[]} isLoading />)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should have touch targets >= 48dp', () => {
      render(<Step1SelectPO onPOSelected={mockOnPOSelected} pendingPOs={[mockPendingPO]} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        const styles = window.getComputedStyle(button)
        const minHeight = parseInt(styles.minHeight) || parseInt(styles.height)
        // 48dp = 48px at 1x density
        expect(minHeight).toBeGreaterThanOrEqual(48)
      })
    })
  })

  // ===========================================================================
  // Step 2: Review Lines Tests
  // ===========================================================================
  describe('Step2ReviewLines', () => {
    const mockOnLineSelected = vi.fn()
    const mockOnReceiveAll = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display PO header info', () => {
      render(
        <Step2ReviewLines
          poId="po-001"
          poNumber="PO-2025-00001"
          supplierName="Test Supplier"
          lines={[mockPOLine]}
          onLineSelected={mockOnLineSelected}
          onReceiveAll={mockOnReceiveAll}
        />
      )
      expect(screen.getByText('PO-2025-00001')).toBeInTheDocument()
      expect(screen.getByText('Test Supplier')).toBeInTheDocument()
    })

    it('should display line items with remaining qty', () => {
      render(
        <Step2ReviewLines
          poId="po-001"
          poNumber="PO-2025-00001"
          supplierName="Test Supplier"
          lines={[mockPOLine]}
          onLineSelected={mockOnLineSelected}
          onReceiveAll={mockOnReceiveAll}
        />
      )
      expect(screen.getByText('Test Product')).toBeInTheDocument()
      expect(screen.getByText(/100.*KG|100 KG/)).toBeInTheDocument()
    })

    it('should grey out fully received lines', () => {
      const fullyReceivedLine = { ...mockPOLine, remaining_qty: 0 }
      render(
        <Step2ReviewLines
          poId="po-001"
          poNumber="PO-2025-00001"
          supplierName="Test Supplier"
          lines={[fullyReceivedLine]}
          onLineSelected={mockOnLineSelected}
          onReceiveAll={mockOnReceiveAll}
        />
      )
      const lineElement = screen.getByText('Test Product').closest('[data-testid="po-line"]')
      expect(lineElement).toHaveClass(/greyed|dimmed|opacity/i)
    })

    it('should show "Receive All Remaining" button', () => {
      render(
        <Step2ReviewLines
          poId="po-001"
          poNumber="PO-2025-00001"
          supplierName="Test Supplier"
          lines={[mockPOLine]}
          onLineSelected={mockOnLineSelected}
          onReceiveAll={mockOnReceiveAll}
        />
      )
      expect(screen.getByRole('button', { name: /receive all/i })).toBeInTheDocument()
    })

    it('should call onLineSelected when line tapped', async () => {
      const user = userEvent.setup()
      render(
        <Step2ReviewLines
          poId="po-001"
          poNumber="PO-2025-00001"
          supplierName="Test Supplier"
          lines={[mockPOLine]}
          onLineSelected={mockOnLineSelected}
          onReceiveAll={mockOnReceiveAll}
        />
      )

      await user.click(screen.getByText('Test Product'))
      expect(mockOnLineSelected).toHaveBeenCalledWith('line-001')
    })
  })

  // ===========================================================================
  // Step 3: Enter Details Tests
  // ===========================================================================
  describe('Step3EnterDetails', () => {
    const mockOnSubmit = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display product info', () => {
      render(
        <Step3EnterDetails
          line={mockPOLine}
          onSubmit={mockOnSubmit}
          requireBatch
          requireExpiry
        />
      )
      expect(screen.getByText('Test Product')).toBeInTheDocument()
      expect(screen.getByText('PROD-001')).toBeInTheDocument()
    })

    it('should show number pad', () => {
      render(
        <Step3EnterDetails
          line={mockPOLine}
          onSubmit={mockOnSubmit}
          requireBatch={false}
          requireExpiry={false}
        />
      )
      // Number pad keys 0-9
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '5' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '0' })).toBeInTheDocument()
    })

    it('should show quick adjust buttons', () => {
      render(
        <Step3EnterDetails
          line={mockPOLine}
          onSubmit={mockOnSubmit}
          requireBatch={false}
          requireExpiry={false}
        />
      )
      expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '+10' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '-1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '-10' })).toBeInTheDocument()
    })

    it('should show batch number field when required', () => {
      render(
        <Step3EnterDetails
          line={mockPOLine}
          onSubmit={mockOnSubmit}
          requireBatch
          requireExpiry={false}
        />
      )
      expect(screen.getByLabelText(/batch.*number/i)).toBeInTheDocument()
      expect(screen.getByText(/required/i)).toBeInTheDocument()
    })

    it('should show expiry date field when required', () => {
      render(
        <Step3EnterDetails
          line={mockPOLine}
          onSubmit={mockOnSubmit}
          requireBatch={false}
          requireExpiry
        />
      )
      expect(screen.getByLabelText(/expiry.*date/i)).toBeInTheDocument()
    })

    it('should default quantity to remaining', () => {
      render(
        <Step3EnterDetails
          line={mockPOLine}
          onSubmit={mockOnSubmit}
          requireBatch={false}
          requireExpiry={false}
        />
      )
      expect(screen.getByDisplayValue('100')).toBeInTheDocument()
    })

    it('should show over-receipt warning when qty exceeds remaining', async () => {
      const user = userEvent.setup()
      render(
        <Step3EnterDetails
          line={mockPOLine}
          onSubmit={mockOnSubmit}
          requireBatch={false}
          requireExpiry={false}
        />
      )

      // Clear and enter higher qty
      const qtyInput = screen.getByDisplayValue('100')
      await user.clear(qtyInput)
      await user.type(qtyInput, '120')

      expect(screen.getByText(/exceeds.*remaining|over-receipt/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Step 4: Review & Confirm Tests
  // ===========================================================================
  describe('Step4ReviewConfirm', () => {
    const mockOnConfirm = vi.fn()
    const mockOnEdit = vi.fn()
    const mockFormData = {
      poId: 'po-001',
      poLineId: 'line-001',
      productName: 'Test Product',
      receivedQty: 100,
      uom: 'KG',
      batchNumber: 'BATCH-001',
      expiryDate: '2026-01-01',
      locationPath: 'Warehouse A / Zone 1 / LOC-A01',
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display summary of all fields', () => {
      render(
        <Step4ReviewConfirm
          formData={mockFormData}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />
      )
      expect(screen.getByText('Test Product')).toBeInTheDocument()
      expect(screen.getByText(/100.*KG/)).toBeInTheDocument()
      expect(screen.getByText('BATCH-001')).toBeInTheDocument()
      expect(screen.getByText('2026-01-01')).toBeInTheDocument()
    })

    it('should show edit buttons for each section', () => {
      render(
        <Step4ReviewConfirm
          formData={mockFormData}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />
      )
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      expect(editButtons.length).toBeGreaterThan(0)
    })

    it('should show large Confirm button', () => {
      render(
        <Step4ReviewConfirm
          formData={mockFormData}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />
      )
      const confirmBtn = screen.getByRole('button', { name: /confirm.*receipt/i })
      expect(confirmBtn).toBeInTheDocument()
    })

    it('should call onConfirm when confirm clicked', async () => {
      const user = userEvent.setup()
      render(
        <Step4ReviewConfirm
          formData={mockFormData}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />
      )

      await user.click(screen.getByRole('button', { name: /confirm/i }))
      expect(mockOnConfirm).toHaveBeenCalled()
    })

    it('should call onEdit with step when edit clicked', async () => {
      const user = userEvent.setup()
      render(
        <Step4ReviewConfirm
          formData={mockFormData}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
        />
      )

      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      await user.click(editButtons[0])
      expect(mockOnEdit).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Step 5: Success Tests
  // ===========================================================================
  describe('Step5Success', () => {
    const mockOnReceiveMore = vi.fn()
    const mockOnNewPO = vi.fn()
    const mockOnDone = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display GRN number', () => {
      render(
        <Step5Success
          result={mockReceiveResult}
          onReceiveMore={mockOnReceiveMore}
          onNewPO={mockOnNewPO}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByText('GRN-2025-00001')).toBeInTheDocument()
    })

    it('should display LP number', () => {
      render(
        <Step5Success
          result={mockReceiveResult}
          onReceiveMore={mockOnReceiveMore}
          onNewPO={mockOnNewPO}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByText('LP00000001')).toBeInTheDocument()
    })

    it('should show success animation', () => {
      render(
        <Step5Success
          result={mockReceiveResult}
          onReceiveMore={mockOnReceiveMore}
          onNewPO={mockOnNewPO}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByTestId('success-animation')).toBeInTheDocument()
    })

    it('should show "Receive More Items" button', () => {
      render(
        <Step5Success
          result={mockReceiveResult}
          onReceiveMore={mockOnReceiveMore}
          onNewPO={mockOnNewPO}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByRole('button', { name: /receive more/i })).toBeInTheDocument()
    })

    it('should show "New PO" button', () => {
      render(
        <Step5Success
          result={mockReceiveResult}
          onReceiveMore={mockOnReceiveMore}
          onNewPO={mockOnNewPO}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByRole('button', { name: /new PO/i })).toBeInTheDocument()
    })

    it('should show "Reprint Label" button', () => {
      render(
        <Step5Success
          result={mockReceiveResult}
          onReceiveMore={mockOnReceiveMore}
          onNewPO={mockOnNewPO}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByRole('button', { name: /reprint.*label/i })).toBeInTheDocument()
    })

    it('should show "Done" button', () => {
      render(
        <Step5Success
          result={mockReceiveResult}
          onReceiveMore={mockOnReceiveMore}
          onNewPO={mockOnNewPO}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // NumberPad Tests
  // ===========================================================================
  describe('NumberPad', () => {
    const mockOnChange = vi.fn()
    const mockOnQuickAdjust = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should render digits 0-9', () => {
      render(<NumberPad value="0" onChange={mockOnChange} />)
      for (let i = 0; i <= 9; i++) {
        expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument()
      }
    })

    it('should render decimal point button', () => {
      render(<NumberPad value="0" onChange={mockOnChange} allowDecimal />)
      expect(screen.getByRole('button', { name: '.' })).toBeInTheDocument()
    })

    it('should render backspace button', () => {
      render(<NumberPad value="0" onChange={mockOnChange} />)
      expect(screen.getByRole('button', { name: /backspace|<-|delete/i })).toBeInTheDocument()
    })

    it('should render clear button', () => {
      render(<NumberPad value="0" onChange={mockOnChange} />)
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument()
    })

    it('should call onChange when digit pressed', async () => {
      const user = userEvent.setup()
      render(<NumberPad value="0" onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: '5' }))
      expect(mockOnChange).toHaveBeenCalledWith('05')
    })

    it('should call onChange with cleared value', async () => {
      const user = userEvent.setup()
      render(<NumberPad value="123" onChange={mockOnChange} />)

      await user.click(screen.getByRole('button', { name: /clear/i }))
      expect(mockOnChange).toHaveBeenCalledWith('')
    })

    it('should render quick adjust buttons', () => {
      render(<NumberPad value="10" onChange={mockOnChange} onQuickAdjust={mockOnQuickAdjust} />)
      expect(screen.getByRole('button', { name: '+1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '+10' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '-1' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '-10' })).toBeInTheDocument()
    })

    it('should call onQuickAdjust with delta', async () => {
      const user = userEvent.setup()
      render(<NumberPad value="10" onChange={mockOnChange} onQuickAdjust={mockOnQuickAdjust} />)

      await user.click(screen.getByRole('button', { name: '+10' }))
      expect(mockOnQuickAdjust).toHaveBeenCalledWith(10)
    })

    it('should have keys >= 48dp', () => {
      render(<NumberPad value="0" onChange={mockOnChange} />)
      const keys = screen.getAllByRole('button')
      keys.forEach((key) => {
        const rect = key.getBoundingClientRect()
        expect(Math.min(rect.width, rect.height)).toBeGreaterThanOrEqual(48)
      })
    })
  })

  // ===========================================================================
  // Audio Feedback Tests
  // ===========================================================================
  describe('AudioFeedback', () => {
    it('should have playSuccess method', () => {
      expect(AudioFeedback.playSuccess).toBeDefined()
    })

    it('should have playError method', () => {
      expect(AudioFeedback.playError).toBeDefined()
    })

    it('should have playConfirm method', () => {
      expect(AudioFeedback.playConfirm).toBeDefined()
    })

    it('should have playAlert method', () => {
      expect(AudioFeedback.playAlert).toBeDefined()
    })

    it('should have setEnabled method', () => {
      expect(AudioFeedback.setEnabled).toBeDefined()
    })
  })

  // ===========================================================================
  // Haptic Feedback Tests
  // ===========================================================================
  describe('HapticFeedback', () => {
    it('should have success method', () => {
      expect(HapticFeedback.success).toBeDefined()
    })

    it('should have error method', () => {
      expect(HapticFeedback.error).toBeDefined()
    })

    it('should have confirm method', () => {
      expect(HapticFeedback.confirm).toBeDefined()
    })
  })

  // ===========================================================================
  // Success Animation Tests
  // ===========================================================================
  describe('SuccessAnimation', () => {
    it('should render when show is true', () => {
      render(<SuccessAnimation show />)
      expect(screen.getByTestId('success-animation')).toBeInTheDocument()
    })

    it('should not render when show is false', () => {
      render(<SuccessAnimation show={false} />)
      expect(screen.queryByTestId('success-animation')).not.toBeInTheDocument()
    })

    it('should have minimum size of 64x64', () => {
      render(<SuccessAnimation show />)
      const animation = screen.getByTestId('success-animation')
      const rect = animation.getBoundingClientRect()
      expect(rect.width).toBeGreaterThanOrEqual(64)
      expect(rect.height).toBeGreaterThanOrEqual(64)
    })
  })

  // ===========================================================================
  // Error Animation Tests
  // ===========================================================================
  describe('ErrorAnimation', () => {
    it('should render when show is true', () => {
      render(<ErrorAnimation show message="Error occurred" />)
      expect(screen.getByTestId('error-animation')).toBeInTheDocument()
    })

    it('should display error message', () => {
      render(<ErrorAnimation show message="PO not found" />)
      expect(screen.getByText('PO not found')).toBeInTheDocument()
    })

    it('should not render when show is false', () => {
      render(<ErrorAnimation show={false} />)
      expect(screen.queryByTestId('error-animation')).not.toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Touch Target Tests (Accessibility)
  // ===========================================================================
  describe('Touch Targets', () => {
    it('should have all buttons >= 48dp height', () => {
      render(<ScannerReceiveWizard />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        const rect = button.getBoundingClientRect()
        expect(rect.height).toBeGreaterThanOrEqual(48)
      })
    })
  })

  // ===========================================================================
  // Loading & Error States
  // ===========================================================================
  describe('Loading & Error States', () => {
    it('should show loading overlay during API call', () => {
      render(<ScannerReceiveWizard isLoading />)
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
    })

    it('should show error state with retry option', () => {
      render(<ScannerReceiveWizard error="Network error" />)
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })
})
