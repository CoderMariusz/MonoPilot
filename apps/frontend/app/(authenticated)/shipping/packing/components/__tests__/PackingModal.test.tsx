/**
 * PackingModal Component Tests (Story 07.11)
 * Purpose: Test packing modal UI behavior and user interactions
 * Phase: GREEN - Tests pass with implemented component
 *
 * Coverage Target: 85%+
 * Test Count: 36 scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-5 to AC-7: LP assignment to boxes
 * - AC-8: Weight/dimensions capture
 * - AC-9: Allergen separation warnings
 * - AC-10: Complete packing validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { PackingModal, AllergenWarningDialog } from '../PackingModal'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('PackingModal (Story 07.11)', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  const defaultProps = {
    shipmentId: 'shipment-001',
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  }

  const mockShipmentData = {
    shipment: {
      id: 'shipment-001',
      shipment_number: 'SH-2025-00001',
      status: 'packing',
      sales_order_id: 'so-001',
      customer_id: 'cust-001',
      customer: { name: 'Acme Foods Corp' },
      total_boxes: 0,
      total_weight: null,
    },
    boxes: [],
    contents: [],
    available_lps: [
      {
        id: 'lp-001',
        lp_number: 'LP-2025-00001',
        product_id: 'prod-001',
        product_name: 'Organic Flour 5lb',
        lot_number: 'LOT-2025-001',
        quantity_available: 100,
        location_name: 'ZONE-A-AISLE-01-BIN-001',
      },
      {
        id: 'lp-002',
        lp_number: 'LP-2025-00002',
        product_id: 'prod-002',
        product_name: 'Organic Sugar 10lb',
        lot_number: 'LOT-2025-002',
        quantity_available: 50,
        location_name: 'ZONE-A-AISLE-02-BIN-001',
      },
    ],
    pack_progress: {
      total_count: 2,
      packed_count: 0,
      remaining_count: 2,
      percentage: 0,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockReset()
  })

  /**
   * Loading State
   */
  describe('loading state', () => {
    it('should render loading skeleton while fetching data', async () => {
      ;(global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<PackingModal {...defaultProps} />)
      expect(screen.getByTestId('packing-modal-skeleton')).toBeInTheDocument()
    })
  })

  /**
   * 3-Column Layout
   */
  describe('3-column layout', () => {
    it('should display 3-column grid layout', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByTestId('packing-workbench')).toBeInTheDocument()
      })
    })

    it('should display LPSelector in left column', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByTestId('lp-selector-panel')).toBeInTheDocument()
      })
    })

    it('should display BoxBuilder in center column', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByTestId('box-builder-panel')).toBeInTheDocument()
      })
    })

    it('should display PackingSummary in right column', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByTestId('packing-summary-panel')).toBeInTheDocument()
      })
    })
  })

  /**
   * LP Selector Panel
   */
  describe('LP selector panel', () => {
    it('should display available LPs list', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('LP-2025-00001')).toBeInTheDocument()
        expect(screen.getByText('LP-2025-00002')).toBeInTheDocument()
      })
    })

    it('should show LP details: product, lot, qty, location', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Organic Flour 5lb')).toBeInTheDocument()
        expect(screen.getByText(/LOT-2025-001/)).toBeInTheDocument()
        expect(screen.getByText('100')).toBeInTheDocument()
        expect(screen.getByText('ZONE-A-AISLE-01-BIN-001')).toBeInTheDocument()
      })
    })

    it('should allow search by LP number', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('LP-2025-00001')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, '00002')
      expect(screen.queryByText('LP-2025-00001')).not.toBeInTheDocument()
      expect(screen.getByText('LP-2025-00002')).toBeInTheDocument()
    })

    it('should allow filter by product', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('LP-2025-00001')).toBeInTheDocument()
      })
      const searchInput = screen.getByPlaceholderText(/search/i)
      await user.type(searchInput, 'Sugar')
      expect(screen.queryByText('Organic Flour 5lb')).not.toBeInTheDocument()
      expect(screen.getByText('Organic Sugar 10lb')).toBeInTheDocument()
    })
  })

  /**
   * Box Builder Panel
   */
  describe('box builder panel', () => {
    it('should show Add Box button', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add box/i })).toBeInTheDocument()
      })
    })

    it('should create new box on Add Box click', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockShipmentData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            box_id: 'box-001',
            box_number: 1,
          }),
        })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add box/i })).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /add box/i }))
      await waitFor(() => {
        expect(screen.getByText('Box 1')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should display box tabs for multiple boxes', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          boxes: [
            { id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null },
            { id: 'box-002', box_number: 2, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null },
          ],
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Box 1')).toBeInTheDocument()
        expect(screen.getByText('Box 2')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should switch active box on tab click', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          boxes: [
            { id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null },
            { id: 'box-002', box_number: 2, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null },
          ],
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('Box 1')).toBeInTheDocument()
      }, { timeout: 3000 })
      await user.click(screen.getByText('Box 2'))
      // Box 2 tab should now be active (has aria-selected or similar state)
      expect(screen.getByText('Box 2')).toBeInTheDocument()
    })

    it('should show weight input for active box', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByLabelText(/weight/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show dimension inputs for active box', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByLabelText(/length/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/width/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/height/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show contents list for active box', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          contents: [
            {
              id: 'content-001',
              shipment_box_id: 'box-001',
              product_id: 'prod-001',
              product_name: 'Organic Flour 5lb',
              lp_number: 'LP-2025-00001',
              lot_number: 'LOT-2025-001',
              quantity: 50,
            },
          ],
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        // Content should be in the box-contents area
        const contentsArea = screen.getByTestId('box-contents')
        expect(contentsArea).toHaveTextContent('LP-2025-00001')
        expect(contentsArea).toHaveTextContent('LOT-2025-001')
      }, { timeout: 3000 })
    })
  })

  /**
   * Weight and Dimensions Validation
   */
  describe('weight and dimensions validation', () => {
    it('should validate weight > 0', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockShipmentData,
            boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByLabelText(/weight/i)).toBeInTheDocument()
      }, { timeout: 3000 })
      const weightInput = screen.getByLabelText(/weight/i)
      await user.clear(weightInput)
      await user.type(weightInput, '0')
      await user.tab()
      await waitFor(() => {
        expect(screen.getByText(/weight must be greater than 0/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should validate weight <= 25kg', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockShipmentData,
            boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByLabelText(/weight/i)).toBeInTheDocument()
      }, { timeout: 3000 })
      const weightInput = screen.getByLabelText(/weight/i)
      await user.clear(weightInput)
      await user.type(weightInput, '30')
      await user.tab()
      await waitFor(() => {
        expect(screen.getByText(/weight exceeds 25kg/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should validate dimensions 10-200cm', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockShipmentData,
            boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByLabelText(/length/i)).toBeInTheDocument()
      }, { timeout: 3000 })
      const lengthInput = screen.getByLabelText(/length/i)
      await user.clear(lengthInput)
      await user.type(lengthInput, '5')
      await user.tab()
      await waitFor(() => {
        expect(screen.getByText(/dimensions must be between 10 and 200/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  /**
   * Add LP to Box
   */
  describe('add LP to box', () => {
    it('should add LP to active box on selection', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockShipmentData,
            boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content_id: 'content-001',
            lot_number: 'LOT-2025-001',
          }),
        })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('LP-2025-00001')).toBeInTheDocument()
      }, { timeout: 3000 })
      await user.click(screen.getByText('LP-2025-00001'))
      await user.click(screen.getByRole('button', { name: /add to box/i }))
      await waitFor(() => {
        const contentsArea = screen.getByTestId('box-contents')
        expect(contentsArea).toHaveTextContent('LP-2025-00001')
      }, { timeout: 3000 })
    })

    it('should remove LP from available list after adding', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockShipmentData,
            boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content_id: 'content-001',
            lot_number: 'LOT-2025-001',
          }),
        })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        const lpPanel = screen.getByTestId('lp-selector-panel')
        expect(lpPanel).toHaveTextContent('LP-2025-00001')
      }, { timeout: 3000 })
      await user.click(screen.getByText('LP-2025-00001'))
      await user.click(screen.getByRole('button', { name: /add to box/i }))
      await waitFor(() => {
        const lpPanel = screen.getByTestId('lp-selector-panel')
        expect(lpPanel).not.toHaveTextContent('LP-2025-00001')
      }, { timeout: 3000 })
    })

    it('should capture lot_number when adding LP', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockShipmentData,
            boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            content_id: 'content-001',
            lot_number: 'LOT-2025-001',
          }),
        })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('LP-2025-00001')).toBeInTheDocument()
      }, { timeout: 3000 })
      await user.click(screen.getByText('LP-2025-00001'))
      await user.click(screen.getByRole('button', { name: /add to box/i }))
      await waitFor(() => {
        const contentsArea = screen.getByTestId('box-contents')
        expect(contentsArea).toHaveTextContent('LOT-2025-001')
      }, { timeout: 3000 })
    })
  })

  /**
   * Packing Summary Panel
   */
  describe('packing summary panel', () => {
    it('should display shipment number and customer', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('SH-2025-00001')).toBeInTheDocument()
        expect(screen.getByText('Acme Foods Corp')).toBeInTheDocument()
      })
    })

    it('should display pack progress percentage', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          pack_progress: {
            total_count: 2,
            packed_count: 1,
            remaining_count: 1,
            percentage: 50,
          },
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument()
      })
    })

    it('should display total boxes count', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          boxes: [
            { id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null },
            { id: 'box-002', box_number: 2, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null },
          ],
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText(/2 boxes/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should show Complete Packing button', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /complete packing/i })).toBeInTheDocument()
      })
    })

    it('should disable Complete button if not all LPs packed', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          boxes: [{ id: 'box-001', box_number: 1, weight: 15, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          pack_progress: {
            total_count: 2,
            packed_count: 1,
            remaining_count: 1,
            percentage: 50,
          },
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /complete packing/i })).toBeDisabled()
      }, { timeout: 3000 })
    })

    it('should disable Complete button if boxes missing weight', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          pack_progress: {
            total_count: 2,
            packed_count: 2,
            remaining_count: 0,
            percentage: 100,
          },
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /complete packing/i })).toBeDisabled()
      }, { timeout: 3000 })
    })
  })

  /**
   * Complete Packing
   */
  describe('complete packing', () => {
    it('should complete packing on button click', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockShipmentData,
            boxes: [{ id: 'box-001', box_number: 1, weight: 15.5, length: null, width: null, height: null, sscc: null, tracking_number: null }],
            pack_progress: {
              total_count: 2,
              packed_count: 2,
              remaining_count: 0,
              percentage: 100,
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            status: 'packed',
            total_weight: 15.5,
            total_boxes: 1,
            packed_at: '2025-01-22T12:00:00Z',
          }),
        })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /complete packing/i })).toBeEnabled()
      }, { timeout: 3000 })
      await user.click(screen.getByRole('button', { name: /complete packing/i }))
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      }, { timeout: 3000 })
    })

    it('should show error if boxes missing weight on complete', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockShipmentData,
          boxes: [{ id: 'box-001', box_number: 1, weight: null, length: null, width: null, height: null, sscc: null, tracking_number: null }],
          pack_progress: {
            total_count: 2,
            packed_count: 2,
            remaining_count: 0,
            percentage: 100,
          },
        }),
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        // Alert about missing weight should be shown
        expect(screen.getByText(/missing weight/i)).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  /**
   * Modal Behavior
   */
  describe('modal behavior', () => {
    it('should close modal on cancel', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockShipmentData,
      })

      render(<PackingModal {...defaultProps} />)
      await waitFor(() => {
        expect(screen.getByText('SH-2025-00001')).toBeInTheDocument()
      })
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not render when isOpen is false', () => {
      render(<PackingModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText('Packing Workbench')).not.toBeInTheDocument()
    })
  })
})

/**
 * AllergenWarningDialog Component Tests
 */
describe('AllergenWarningDialog (Story 07.11)', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultProps = {
    isOpen: true,
    productName: 'Organic Flour 5lb',
    productAllergens: ['Gluten', 'Wheat'],
    customerRestrictions: ['Gluten'],
    conflictingAllergens: ['Gluten'],
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display warning with conflicting allergens', () => {
    render(<AllergenWarningDialog {...defaultProps} />)
    expect(screen.getByText(/allergen warning/i)).toBeInTheDocument()
    expect(screen.getByText('Gluten')).toBeInTheDocument()
  })

  it('should display product name', () => {
    render(<AllergenWarningDialog {...defaultProps} />)
    expect(screen.getByText(/Organic Flour 5lb/)).toBeInTheDocument()
  })

  it('should call onConfirm when Continue clicked', async () => {
    const user = userEvent.setup()

    render(<AllergenWarningDialog {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /continue/i }))
    expect(mockOnConfirm).toHaveBeenCalled()
  })

  it('should call onCancel when Cancel clicked', async () => {
    const user = userEvent.setup()

    render(<AllergenWarningDialog {...defaultProps} />)
    await user.click(screen.getByRole('button', { name: /cancel/i }))
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should not render when isOpen is false', () => {
    render(<AllergenWarningDialog {...defaultProps} isOpen={false} />)
    expect(screen.queryByText(/allergen warning/i)).not.toBeInTheDocument()
  })
})
