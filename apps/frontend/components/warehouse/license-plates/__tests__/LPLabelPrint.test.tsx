/**
 * LP Label Print - Component Tests (Story 05.14)
 * Purpose: Test LP label printing UI components
 * Phase: RED - Tests will fail until components are implemented
 *
 * Tests UI components:
 * - PrintLabelButton (button component)
 * - PrintLabelModal (main modal with preview)
 * - LabelPreview (visual label preview)
 * - CopiesInput (number input for copies)
 * - BulkPrintModal (bulk print for multiple LPs)
 *
 * Coverage Target: 80%+
 * Test Count: 35+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-5: Print button on LP detail page
 * - AC-6: Bulk print from LP list
 * - AC-7: Label preview modal
 * - AC-11: Validation (copies 1-100)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Components to test (will be implemented)
import { PrintLabelButton } from '../PrintLabelButton'
import { PrintLabelModal } from '../PrintLabelModal'
import { LabelPreview } from '../LabelPreview'
import { CopiesInput } from '../CopiesInput'
import { BulkPrintModal } from '../BulkPrintModal'

// Mock data
const mockLP = {
  id: 'lp-001',
  lp_number: 'LP00000001',
  product_id: 'prod-001',
  product: { name: 'Flour Type 00', code: 'FLOUR-00' },
  quantity: 1000,
  uom: 'KG',
  batch_number: 'FLOUR-2025-001',
  expiry_date: '2026-06-01',
  manufacture_date: '2025-01-01',
  location_id: 'loc-001',
  location: { id: 'loc-001', full_path: 'WH-001/ZONE-A/RACK-01' },
  warehouse_id: 'wh-001',
  warehouse: { id: 'wh-001', name: 'Main Warehouse', code: 'WH-001' },
  status: 'available',
  qa_status: 'passed',
}

const mockLabelData = {
  lp_number: 'LP00000001',
  product_name: 'Flour Type 00',
  quantity: 1000,
  uom: 'KG',
  batch_number: 'FLOUR-2025-001',
  expiry_date: '2026-06-01',
  manufacture_date: '2025-01-01',
  location_path: 'WH-001/ZONE-A/RACK-01',
}

const mockPrintResponse = {
  zpl: '^XA^FO50,50^BCN,100,Y,N,N^FDLP00000001^FS^XZ',
  lp_number: 'LP00000001',
  product_name: 'Flour Type 00',
  copies: 1,
  label_size: '4x6',
  generated_at: '2026-01-09T10:00:00Z',
  download_filename: 'LP00000001.zpl',
}

const mockBulkLPs = [
  { ...mockLP, id: 'lp-001', lp_number: 'LP00000001' },
  { ...mockLP, id: 'lp-002', lp_number: 'LP00000002' },
  { ...mockLP, id: 'lp-003', lp_number: 'LP00000003' },
]

// Mock functions
const mockOnPrintComplete = vi.fn()
const mockOnClose = vi.fn()
const mockOnChange = vi.fn()

describe('LP Label Print Components (Story 05.14)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock fetch for API calls
    global.fetch = vi.fn()
  })

  // ==========================================================================
  // AC-5: Desktop UI - Print Button on LP Detail Page
  // ==========================================================================
  describe('PrintLabelButton - Print Button (AC-5)', () => {
    it('should render print button with printer icon', () => {
      render(
        <PrintLabelButton
          lpId="lp-001"
          lpNumber="LP00000001"
        />
      )

      const button = screen.getByRole('button', { name: /print label/i })
      expect(button).toBeInTheDocument()
      expect(button.querySelector('svg')).toBeInTheDocument() // Printer icon
    })

    it('should render icon-only variant', () => {
      render(
        <PrintLabelButton
          lpId="lp-001"
          lpNumber="LP00000001"
          variant="icon"
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button.querySelector('svg')).toBeInTheDocument()
    })

    it('should open print modal when clicked', async () => {
      render(
        <PrintLabelButton
          lpId="lp-001"
          lpNumber="LP00000001"
        />
      )

      const button = screen.getByRole('button', { name: /print label/i })
      await userEvent.click(button)

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should be disabled when disabled prop is true', () => {
      render(
        <PrintLabelButton
          lpId="lp-001"
          lpNumber="LP00000001"
          disabled
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should call onPrintComplete after successful print', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrintResponse),
      })

      render(
        <PrintLabelButton
          lpId="lp-001"
          lpNumber="LP00000001"
          onPrintComplete={mockOnPrintComplete}
        />
      )

      const button = screen.getByRole('button', { name: /print label/i })
      await userEvent.click(button)

      // Download ZPL from modal
      const downloadButton = screen.getByRole('button', { name: /download zpl/i })
      await userEvent.click(downloadButton)

      await waitFor(() => {
        expect(mockOnPrintComplete).toHaveBeenCalled()
      })
    })
  })

  // ==========================================================================
  // AC-7: Label Preview Modal
  // ==========================================================================
  describe('PrintLabelModal - Print Modal (AC-5, AC-7)', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/print label for LP00000001/i)).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={false}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should display LP info summary', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('Flour Type 00')).toBeInTheDocument()
        expect(screen.getByText('1000')).toBeInTheDocument()
        expect(screen.getByText('KG')).toBeInTheDocument()
      })
    })

    it('should display batch number', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('FLOUR-2025-001')).toBeInTheDocument()
      })
    })

    it('should display expiry date', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('2026-06-01')).toBeInTheDocument()
      })
    })

    it('should have copies input with default from settings', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
          defaultCopies={2}
        />
      )

      const copiesInput = await screen.findByLabelText(/copies/i)
      expect(copiesInput).toHaveValue(2)
    })

    it('should display label preview', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByTestId('label-preview')).toBeInTheDocument()
      })
    })

    it('should have Download ZPL button', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download zpl/i })).toBeInTheDocument()
      })
    })

    it('should close modal when close button clicked', async () => {
      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByRole('button', { name: /close|cancel/i })
      await userEvent.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should download ZPL file when Download clicked', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockLP }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPrintResponse),
        })

      // Mock createObjectURL and click
      const mockCreateObjectURL = vi.fn(() => 'blob:test')
      const mockRevokeObjectURL = vi.fn()
      global.URL.createObjectURL = mockCreateObjectURL
      global.URL.revokeObjectURL = mockRevokeObjectURL

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const downloadButton = await screen.findByRole('button', { name: /download zpl/i })
      await userEvent.click(downloadButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/warehouse/license-plates/lp-001/print-label'),
          expect.any(Object)
        )
      })
    })

    it('should show loading state during download', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockLP }),
        })
        .mockImplementationOnce(() => new Promise((resolve) => setTimeout(resolve, 1000)))

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const downloadButton = await screen.findByRole('button', { name: /download zpl/i })
      await userEvent.click(downloadButton)

      expect(screen.getByText(/generating/i)).toBeInTheDocument()
    })

    it('should show error message on API failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockLP }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ message: 'Failed to generate label' }),
        })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const downloadButton = await screen.findByRole('button', { name: /download zpl/i })
      await userEvent.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText(/failed to generate label/i)).toBeInTheDocument()
      })
    })

    it('should update copies text when copies changed', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const copiesInput = await screen.findByLabelText(/copies/i)
      await userEvent.clear(copiesInput)
      await userEvent.type(copiesInput, '3')

      expect(screen.getByText(/3 copies will be printed/i)).toBeInTheDocument()
    })

    it('should show info message when no printer configured', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
          printerConfigured={false}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/no printer configured/i)).toBeInTheDocument()
      })
    })
  })

  // ==========================================================================
  // LabelPreview - Visual Label Preview
  // ==========================================================================
  describe('LabelPreview - Label Preview (AC-7)', () => {
    it('should render label preview container', () => {
      render(<LabelPreview data={mockLabelData} />)

      expect(screen.getByTestId('label-preview')).toBeInTheDocument()
    })

    it('should display LP number with barcode placeholder', () => {
      render(<LabelPreview data={mockLabelData} />)

      expect(screen.getByText('LP00000001')).toBeInTheDocument()
      expect(screen.getByTestId('barcode-placeholder')).toBeInTheDocument()
    })

    it('should display product name', () => {
      render(<LabelPreview data={mockLabelData} />)

      expect(screen.getByText('Flour Type 00')).toBeInTheDocument()
    })

    it('should display quantity with UoM', () => {
      render(<LabelPreview data={mockLabelData} />)

      expect(screen.getByText(/1000/)).toBeInTheDocument()
      expect(screen.getByText(/KG/)).toBeInTheDocument()
    })

    it('should display batch number', () => {
      render(<LabelPreview data={mockLabelData} />)

      expect(screen.getByText('FLOUR-2025-001')).toBeInTheDocument()
    })

    it('should display expiry date', () => {
      render(<LabelPreview data={mockLabelData} />)

      expect(screen.getByText('2026-06-01')).toBeInTheDocument()
    })

    it('should display location path', () => {
      render(<LabelPreview data={mockLabelData} />)

      expect(screen.getByText('WH-001/ZONE-A/RACK-01')).toBeInTheDocument()
    })

    it('should display QR code placeholder', () => {
      render(<LabelPreview data={mockLabelData} />)

      expect(screen.getByTestId('qr-placeholder')).toBeInTheDocument()
    })

    it('should show -- for null batch number', () => {
      const dataWithNullBatch = { ...mockLabelData, batch_number: null }
      render(<LabelPreview data={dataWithNullBatch} />)

      expect(screen.getByText('--')).toBeInTheDocument()
    })

    it('should show -- for null expiry date', () => {
      const dataWithNullExpiry = { ...mockLabelData, expiry_date: null }
      render(<LabelPreview data={dataWithNullExpiry} />)

      expect(screen.getByText('--')).toBeInTheDocument()
    })

    it('should truncate long product name', () => {
      const dataWithLongName = {
        ...mockLabelData,
        product_name: 'Premium Organic Wholemeal Bread Flour Type 00 Stone Ground',
      }
      render(<LabelPreview data={dataWithLongName} />)

      // Should truncate to ~40 characters
      const truncatedText = screen.getByText(/Premium Organic.*\.\.\./i)
      expect(truncatedText).toBeInTheDocument()
    })

    it('should have 4:6 aspect ratio styling', () => {
      render(<LabelPreview data={mockLabelData} />)

      const preview = screen.getByTestId('label-preview')
      expect(preview).toHaveClass('aspect-[4/6]')
    })
  })

  // ==========================================================================
  // CopiesInput - Copies Number Input
  // ==========================================================================
  describe('CopiesInput - Copies Input (AC-11)', () => {
    it('should render number input', () => {
      render(
        <CopiesInput
          value={1}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      expect(input).toBeInTheDocument()
      expect(input).toHaveValue(1)
    })

    it('should have increment button', () => {
      render(
        <CopiesInput
          value={1}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByRole('button', { name: /increase/i })).toBeInTheDocument()
    })

    it('should have decrement button', () => {
      render(
        <CopiesInput
          value={2}
          onChange={mockOnChange}
        />
      )

      expect(screen.getByRole('button', { name: /decrease/i })).toBeInTheDocument()
    })

    it('should increment value when + clicked', async () => {
      render(
        <CopiesInput
          value={1}
          onChange={mockOnChange}
        />
      )

      const incrementButton = screen.getByRole('button', { name: /increase/i })
      await userEvent.click(incrementButton)

      expect(mockOnChange).toHaveBeenCalledWith(2)
    })

    it('should decrement value when - clicked', async () => {
      render(
        <CopiesInput
          value={3}
          onChange={mockOnChange}
        />
      )

      const decrementButton = screen.getByRole('button', { name: /decrease/i })
      await userEvent.click(decrementButton)

      expect(mockOnChange).toHaveBeenCalledWith(2)
    })

    it('should not go below 1', async () => {
      render(
        <CopiesInput
          value={1}
          onChange={mockOnChange}
        />
      )

      const decrementButton = screen.getByRole('button', { name: /decrease/i })
      await userEvent.click(decrementButton)

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('should not exceed 100', async () => {
      render(
        <CopiesInput
          value={100}
          onChange={mockOnChange}
        />
      )

      const incrementButton = screen.getByRole('button', { name: /increase/i })
      await userEvent.click(incrementButton)

      expect(mockOnChange).not.toHaveBeenCalled()
    })

    it('should allow typing valid value', async () => {
      render(
        <CopiesInput
          value={1}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      await userEvent.clear(input)
      await userEvent.type(input, '5')

      expect(mockOnChange).toHaveBeenCalledWith(5)
    })

    it('should reject invalid input (0)', async () => {
      render(
        <CopiesInput
          value={1}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      await userEvent.clear(input)
      await userEvent.type(input, '0')

      expect(mockOnChange).not.toHaveBeenCalledWith(0)
    })

    it('should reject invalid input (>100)', async () => {
      render(
        <CopiesInput
          value={1}
          onChange={mockOnChange}
        />
      )

      const input = screen.getByRole('spinbutton')
      await userEvent.clear(input)
      await userEvent.type(input, '150')

      expect(mockOnChange).not.toHaveBeenCalledWith(150)
    })

    it('should show error state for invalid value', () => {
      render(
        <CopiesInput
          value={150}
          onChange={mockOnChange}
          error="Copies must be between 1 and 100"
        />
      )

      expect(screen.getByText(/must be between 1 and 100/i)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // AC-6: Desktop UI - Bulk Print from LP List
  // ==========================================================================
  describe('BulkPrintModal - Bulk Print (AC-6)', () => {
    it('should render modal when isOpen is true', () => {
      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/print labels for 3 lps/i)).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={false}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should display list of selected LPs', () => {
      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('LP00000001')).toBeInTheDocument()
      expect(screen.getByText('LP00000002')).toBeInTheDocument()
      expect(screen.getByText('LP00000003')).toBeInTheDocument()
    })

    it('should have copies input that applies to all', () => {
      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const copiesInput = screen.getByLabelText(/copies/i)
      expect(copiesInput).toBeInTheDocument()
    })

    it('should have Download All ZPL button', () => {
      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('button', { name: /download all/i })).toBeInTheDocument()
    })

    it('should close modal when Cancel clicked', async () => {
      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await userEvent.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should download ZIP when Download All clicked', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob(['zip content'])),
      })

      const mockCreateObjectURL = vi.fn(() => 'blob:test')
      global.URL.createObjectURL = mockCreateObjectURL

      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const downloadButton = screen.getByRole('button', { name: /download all/i })
      await userEvent.click(downloadButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/warehouse/license-plates/print-bulk',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('lp_ids'),
          })
        )
      })
    })

    it('should show loading state during bulk download', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const downloadButton = screen.getByRole('button', { name: /download all/i })
      await userEvent.click(downloadButton)

      expect(screen.getByText(/generating/i)).toBeInTheDocument()
    })

    it('should show error on bulk download failure', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Bulk print failed' }),
      })

      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const downloadButton = screen.getByRole('button', { name: /download all/i })
      await userEvent.click(downloadButton)

      await waitFor(() => {
        expect(screen.getByText(/bulk print failed/i)).toBeInTheDocument()
      })
    })

    it('should reject more than 100 LPs', () => {
      const tooManyLPs = Array.from({ length: 101 }, (_, i) => ({
        ...mockLP,
        id: `lp-${i}`,
        lp_number: `LP${String(i).padStart(8, '0')}`,
      }))

      render(
        <BulkPrintModal
          selectedLPs={tooManyLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/maximum 100 lps/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /download all/i })).toBeDisabled()
    })

    it('should update total copies label', async () => {
      render(
        <BulkPrintModal
          selectedLPs={mockBulkLPs}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const copiesInput = screen.getByLabelText(/copies/i)
      await userEvent.clear(copiesInput)
      await userEvent.type(copiesInput, '2')

      expect(screen.getByText(/6 total labels/i)).toBeInTheDocument() // 3 LPs * 2 copies
    })
  })

  // ==========================================================================
  // Integration Tests
  // ==========================================================================
  describe('Integration - Print Workflow', () => {
    it('should complete single LP print flow', async () => {
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: mockLP }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPrintResponse),
        })

      const mockCreateObjectURL = vi.fn(() => 'blob:test')
      global.URL.createObjectURL = mockCreateObjectURL

      render(
        <PrintLabelButton
          lpId="lp-001"
          lpNumber="LP00000001"
          onPrintComplete={mockOnPrintComplete}
        />
      )

      // Open modal
      const button = screen.getByRole('button', { name: /print label/i })
      await userEvent.click(button)

      // Modal should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      // Download ZPL
      const downloadButton = await screen.findByRole('button', { name: /download zpl/i })
      await userEvent.click(downloadButton)

      // Should complete
      await waitFor(() => {
        expect(mockOnPrintComplete).toHaveBeenCalled()
      })
    })
  })

  // ==========================================================================
  // Accessibility Tests
  // ==========================================================================
  describe('Accessibility', () => {
    it('PrintLabelButton should have accessible name', () => {
      render(
        <PrintLabelButton
          lpId="lp-001"
          lpNumber="LP00000001"
        />
      )

      expect(screen.getByRole('button', { name: /print label/i })).toBeInTheDocument()
    })

    it('PrintLabelModal should trap focus', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // Focus should be in modal
      const dialog = screen.getByRole('dialog')
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    })

    it('CopiesInput should have label', () => {
      render(
        <CopiesInput
          value={1}
          onChange={mockOnChange}
          label="Number of copies"
        />
      )

      expect(screen.getByLabelText(/number of copies/i)).toBeInTheDocument()
    })

    it('should support keyboard navigation in modal', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: mockLP }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // Press Escape to close
      await userEvent.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle LP with missing optional fields', async () => {
      const lpWithMissingFields = {
        ...mockLP,
        batch_number: null,
        expiry_date: null,
        manufacture_date: null,
      }

      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: lpWithMissingFields }),
      })

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        // Should show -- for missing fields
        const dashes = screen.getAllByText('--')
        expect(dashes.length).toBeGreaterThan(0)
      })
    })

    it('should handle network error gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error('Network error'))

      render(
        <PrintLabelModal
          lpId="lp-001"
          lpNumber="LP00000001"
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
      })
    })

    it('should handle empty bulk selection', () => {
      render(
        <BulkPrintModal
          selectedLPs={[]}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/no lps selected/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /download all/i })).toBeDisabled()
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * PrintLabelButton - Print Button (AC-5) - 5 tests:
 *   - Render with icon
 *   - Icon-only variant
 *   - Open modal on click
 *   - Disabled state
 *   - Call onPrintComplete
 *
 * PrintLabelModal - Print Modal (AC-5, AC-7) - 14 tests:
 *   - Render when open
 *   - Not render when closed
 *   - Display LP info
 *   - Display batch number
 *   - Display expiry date
 *   - Copies input with default
 *   - Label preview
 *   - Download ZPL button
 *   - Close on button click
 *   - Download ZPL file
 *   - Loading state
 *   - Error message
 *   - Update copies text
 *   - No printer message
 *
 * LabelPreview - Label Preview (AC-7) - 12 tests:
 *   - Render container
 *   - LP number with barcode
 *   - Product name
 *   - Quantity with UoM
 *   - Batch number
 *   - Expiry date
 *   - Location path
 *   - QR placeholder
 *   - Null batch handling
 *   - Null expiry handling
 *   - Long name truncation
 *   - 4:6 aspect ratio
 *
 * CopiesInput - Copies Input (AC-11) - 11 tests:
 *   - Render input
 *   - Increment button
 *   - Decrement button
 *   - Increment value
 *   - Decrement value
 *   - Min value (1)
 *   - Max value (100)
 *   - Type valid value
 *   - Reject 0
 *   - Reject >100
 *   - Error state
 *
 * BulkPrintModal - Bulk Print (AC-6) - 10 tests:
 *   - Render when open
 *   - Not render when closed
 *   - Display LP list
 *   - Copies input
 *   - Download All button
 *   - Cancel button
 *   - Download ZIP
 *   - Loading state
 *   - Error handling
 *   - Max 100 LPs
 *   - Total copies label
 *
 * Integration - 1 test:
 *   - Complete print flow
 *
 * Accessibility - 4 tests:
 *   - Button accessible name
 *   - Focus trap
 *   - Input label
 *   - Keyboard navigation
 *
 * Edge Cases - 3 tests:
 *   - Missing optional fields
 *   - Network error
 *   - Empty selection
 *
 * Total: 60 tests
 * Coverage: 80%+ (all UI scenarios tested)
 * Status: RED (components not implemented yet)
 */
