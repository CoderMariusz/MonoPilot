/**
 * Unit Tests: LabelPreview Component (Story 07.13)
 * Purpose: Test SSCC label preview, BOL preview, and related UI components
 * Phase: RED - Tests will fail until components are implemented
 *
 * Tests the label preview components:
 * - SSCCLabelPreview: Barcode display, metadata, format selection
 * - BOLPreview: PDF viewer with zoom controls
 * - LabelActions: Action buttons for label/document generation
 * - PrintSettingsPanel: Printer selection, format options
 * - BatchLabelQueue: Multi-label management
 *
 * Coverage Target: 90%+
 * Test Count: 60+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC: SSCCLabelPreview displays barcode image, formatted SSCC, metadata, format selector
 * - AC: BOLPreview renders PDF with PDF.js, zoom controls, Print/Email/Download buttons
 * - AC: LabelActions component provides 4 buttons (Generate SSCC, Print Labels, BOL, Packing Slip)
 * - AC: Label format selector: [4x6"] [4x8"]
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock imports - components will be created by DEV agent
import { SSCCLabelPreview } from '../SSCCLabelPreview'
import { BOLPreview } from '../BOLPreview'
import { LabelActions } from '../LabelActions'
import { PrintSettingsPanel } from '../PrintSettingsPanel'
import { BatchLabelQueue } from '../BatchLabelQueue'
import { PackingSlipPreview } from '../PackingSlipPreview'

// =============================================================================
// SSCCLabelPreview Component
// =============================================================================

describe('SSCCLabelPreview Component (Story 07.13)', () => {
  const defaultProps = {
    sscc: '006141410000123452',
    ssccFormatted: '00 6141 4100 0012 3456 2',
    barcodeImage: 'data:image/png;base64,iVBORw0KGgoAAAA...',
    shipTo: {
      customerName: 'Blue Mountain Restaurant',
      addressLine1: '789 Main Street',
      cityStateZip: 'Denver, CO 80210',
    },
    orderNumber: 'SO-2025-00123',
    boxNumber: '1 of 2',
    weight: '48.5 kg',
    format: '4x6' as const,
  }

  describe('Barcode Display', () => {
    it('should display GS1-128 barcode image', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      const barcodeImage = screen.getByRole('img', { name: /barcode/i })
      expect(barcodeImage).toBeInTheDocument()
      expect(barcodeImage).toHaveAttribute('src', expect.stringContaining('data:image/png'))
    })

    it('should display human-readable SSCC with spaces', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      expect(screen.getByText('00 6141 4100 0012 3456 2')).toBeInTheDocument()
    })

    it('should include (00) AI prefix indicator', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      expect(screen.getByText(/\(00\)|AI.*00/i)).toBeInTheDocument()
    })

    it('should show barcode loading state', () => {
      render(<SSCCLabelPreview {...defaultProps} barcodeImage={undefined} loading />)
      expect(screen.getByText(/loading|generating/i)).toBeInTheDocument()
    })

    it('should show barcode error state', () => {
      render(<SSCCLabelPreview {...defaultProps} barcodeImage={undefined} error="Failed to generate barcode" />)
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument()
    })
  })

  describe('Label Content', () => {
    it('should display SHIP TO section with customer name', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      expect(screen.getByText(/SHIP TO/i)).toBeInTheDocument()
      expect(screen.getByText('Blue Mountain Restaurant')).toBeInTheDocument()
    })

    it('should display ship-to address', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      expect(screen.getByText('789 Main Street')).toBeInTheDocument()
      expect(screen.getByText('Denver, CO 80210')).toBeInTheDocument()
    })

    it('should display order number', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      expect(screen.getByText('SO-2025-00123')).toBeInTheDocument()
    })

    it('should display box number in "X of Y" format', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      expect(screen.getByText('1 of 2')).toBeInTheDocument()
    })

    it('should display weight with unit', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      expect(screen.getByText('48.5 kg')).toBeInTheDocument()
    })

    it('should display handling instructions when provided', () => {
      render(<SSCCLabelPreview {...defaultProps} handlingInstructions="Keep Refrigerated" />)
      expect(screen.getByText('Keep Refrigerated')).toBeInTheDocument()
    })

    it('should not display handling instructions section when not provided', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      expect(screen.queryByText(/handling/i)).not.toBeInTheDocument()
    })
  })

  describe('Format Selector', () => {
    it('should display format selector with 4x6 and 4x8 options', () => {
      render(<SSCCLabelPreview {...defaultProps} showFormatSelector />)
      const selector = screen.getByRole('combobox', { name: /format/i }) ||
                       screen.getByTestId('format-selector')
      expect(selector).toBeInTheDocument()
    })

    it('should have 4x6 selected by default', () => {
      render(<SSCCLabelPreview {...defaultProps} showFormatSelector />)
      const selector = screen.getByRole('combobox', { name: /format/i }) ||
                       screen.getByTestId('format-selector')
      expect(selector).toHaveValue('4x6')
    })

    it('should call onFormatChange when format changes', () => {
      const onFormatChange = vi.fn()
      render(<SSCCLabelPreview {...defaultProps} showFormatSelector onFormatChange={onFormatChange} />)
      const selector = screen.getByRole('combobox', { name: /format/i }) ||
                       screen.getByTestId('format-selector')
      fireEvent.change(selector, { target: { value: '4x8' } })
      expect(onFormatChange).toHaveBeenCalledWith('4x8')
    })
  })

  describe('Scale Controls', () => {
    it('should display scale controls', () => {
      render(<SSCCLabelPreview {...defaultProps} showScaleControls />)
      expect(screen.getByText(/100%|scale/i)).toBeInTheDocument()
    })

    it('should have scale up button', () => {
      render(<SSCCLabelPreview {...defaultProps} showScaleControls />)
      const scaleUp = screen.getByRole('button', { name: /zoom.*in|\+|scale.*up/i })
      expect(scaleUp).toBeInTheDocument()
    })

    it('should have scale down button', () => {
      render(<SSCCLabelPreview {...defaultProps} showScaleControls />)
      const scaleDown = screen.getByRole('button', { name: /zoom.*out|-|scale.*down/i })
      expect(scaleDown).toBeInTheDocument()
    })

    it('should update scale when buttons clicked', () => {
      render(<SSCCLabelPreview {...defaultProps} showScaleControls />)
      const scaleUp = screen.getByRole('button', { name: /zoom.*in|\+/i })
      fireEvent.click(scaleUp)
      // Scale should increase (check for updated display)
      expect(screen.getByText(/1[1-5]0%/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label for barcode image', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      const barcodeImage = screen.getByRole('img')
      expect(barcodeImage).toHaveAttribute('alt', expect.stringContaining('SSCC'))
    })

    it('should have data-testid for testing', () => {
      render(<SSCCLabelPreview {...defaultProps} />)
      expect(screen.getByTestId('sscc-label-preview')).toBeInTheDocument()
    })
  })
})

// =============================================================================
// BOLPreview Component
// =============================================================================

describe('BOLPreview Component (Story 07.13)', () => {
  const defaultProps = {
    pdfUrl: 'https://storage.supabase.co/object/public/bol/org-id/shipment-id.pdf',
    bolNumber: 'BOL-2025-001234',
    generatedAt: '2025-01-15T14:30:00Z',
    fileSizeKb: 245,
  }

  describe('PDF Display', () => {
    it('should render PDF viewer', () => {
      render(<BOLPreview {...defaultProps} />)
      const pdfViewer = screen.getByTestId('pdf-viewer') ||
                        screen.getByRole('document')
      expect(pdfViewer).toBeInTheDocument()
    })

    it('should display BOL number', () => {
      render(<BOLPreview {...defaultProps} />)
      expect(screen.getByText('BOL-2025-001234')).toBeInTheDocument()
    })

    it('should show loading state while PDF loads', () => {
      render(<BOLPreview {...defaultProps} loading />)
      expect(screen.getByText(/loading|generating/i)).toBeInTheDocument()
    })

    it('should show error state when PDF fails to load', () => {
      render(<BOLPreview {...defaultProps} error="Failed to load PDF" />)
      expect(screen.getByText(/failed|error/i)).toBeInTheDocument()
    })
  })

  describe('Zoom Controls', () => {
    it('should display zoom control buttons', () => {
      render(<BOLPreview {...defaultProps} />)
      // Multiple zoom level buttons are displayed
      const zoomButtons = screen.getAllByText(/50%|75%|100%|125%|150%/)
      expect(zoomButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('should have Fit Width option', () => {
      render(<BOLPreview {...defaultProps} />)
      expect(screen.getByRole('button', { name: /fit.*width/i })).toBeInTheDocument()
    })

    it('should change zoom level when option clicked', () => {
      render(<BOLPreview {...defaultProps} />)
      const zoom125 = screen.getByRole('button', { name: /125%/i })
      fireEvent.click(zoom125)
      expect(zoom125).toHaveClass('selected', { exact: false })
    })

    it('should display current zoom level', () => {
      render(<BOLPreview {...defaultProps} initialZoom={100} />)
      // There may be multiple "100%" (zoom level display + button)
      const zoomElements = screen.getAllByText('100%')
      expect(zoomElements.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Action Buttons', () => {
    it('should have Print button', () => {
      render(<BOLPreview {...defaultProps} />)
      expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
    })

    it('should have Email button', () => {
      render(<BOLPreview {...defaultProps} />)
      expect(screen.getByRole('button', { name: /email/i })).toBeInTheDocument()
    })

    it('should have Download button', () => {
      render(<BOLPreview {...defaultProps} />)
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
    })

    it('should have Back button', () => {
      render(<BOLPreview {...defaultProps} />)
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('should call onPrint when Print clicked', () => {
      const onPrint = vi.fn()
      render(<BOLPreview {...defaultProps} onPrint={onPrint} />)
      fireEvent.click(screen.getByRole('button', { name: /print/i }))
      expect(onPrint).toHaveBeenCalled()
    })

    it('should call onEmail when Email clicked', () => {
      const onEmail = vi.fn()
      render(<BOLPreview {...defaultProps} onEmail={onEmail} />)
      fireEvent.click(screen.getByRole('button', { name: /email/i }))
      expect(onEmail).toHaveBeenCalled()
    })

    it('should call onDownload when Download clicked', () => {
      const onDownload = vi.fn()
      render(<BOLPreview {...defaultProps} onDownload={onDownload} />)
      fireEvent.click(screen.getByRole('button', { name: /download/i }))
      expect(onDownload).toHaveBeenCalled()
    })

    it('should call onBack when Back clicked', () => {
      const onBack = vi.fn()
      render(<BOLPreview {...defaultProps} onBack={onBack} />)
      fireEvent.click(screen.getByRole('button', { name: /back/i }))
      expect(onBack).toHaveBeenCalled()
    })
  })

  describe('Metadata Display', () => {
    it('should display generated timestamp', () => {
      render(<BOLPreview {...defaultProps} />)
      expect(screen.getByText(/2025-01-15|generated/i)).toBeInTheDocument()
    })

    it('should display file size', () => {
      render(<BOLPreview {...defaultProps} />)
      expect(screen.getByText(/245.*kb/i)).toBeInTheDocument()
    })
  })
})

// =============================================================================
// LabelActions Component
// =============================================================================

describe('LabelActions Component (Story 07.13)', () => {
  const defaultProps = {
    shipmentId: 'shipment-uuid-123',
    hasSSCC: false,
    hasCarrier: true,
    shipmentStatus: 'packed' as const,
  }

  describe('Button Rendering', () => {
    it('should render Generate SSCC button', () => {
      render(<LabelActions {...defaultProps} />)
      expect(screen.getByRole('button', { name: /generate.*sscc/i })).toBeInTheDocument()
    })

    it('should render Print Labels button', () => {
      render(<LabelActions {...defaultProps} />)
      expect(screen.getByRole('button', { name: /print.*labels/i })).toBeInTheDocument()
    })

    it('should render Generate BOL button', () => {
      render(<LabelActions {...defaultProps} />)
      expect(screen.getByRole('button', { name: /generate.*bol|bill.*lading/i })).toBeInTheDocument()
    })

    it('should render Packing Slip button', () => {
      render(<LabelActions {...defaultProps} />)
      expect(screen.getByRole('button', { name: /packing.*slip/i })).toBeInTheDocument()
    })
  })

  describe('Button States - Before SSCC', () => {
    it('should enable Generate SSCC button when no SSCC exists', () => {
      render(<LabelActions {...defaultProps} hasSSCC={false} />)
      const button = screen.getByRole('button', { name: /generate.*sscc/i })
      expect(button).not.toBeDisabled()
    })

    it('should disable Print Labels button when no SSCC exists', () => {
      render(<LabelActions {...defaultProps} hasSSCC={false} />)
      const button = screen.getByRole('button', { name: /print.*labels/i })
      expect(button).toBeDisabled()
    })

    it('should disable Generate BOL button when no SSCC exists', () => {
      render(<LabelActions {...defaultProps} hasSSCC={false} />)
      const button = screen.getByRole('button', { name: /generate.*bol/i })
      expect(button).toBeDisabled()
    })

    it('should disable Packing Slip button when no SSCC exists', () => {
      render(<LabelActions {...defaultProps} hasSSCC={false} />)
      const button = screen.getByRole('button', { name: /packing.*slip/i })
      expect(button).toBeDisabled()
    })
  })

  describe('Button States - After SSCC', () => {
    it('should show checkmark/regenerate for Generate SSCC when SSCC exists', () => {
      render(<LabelActions {...defaultProps} hasSSCC />)
      const button = screen.getByRole('button', { name: /generate.*sscc|regenerate/i })
      expect(button).toHaveTextContent(/regenerate|\u2713|generated/i)
    })

    it('should enable Print Labels button when SSCC exists', () => {
      render(<LabelActions {...defaultProps} hasSSCC />)
      const button = screen.getByRole('button', { name: /print.*labels/i })
      expect(button).not.toBeDisabled()
    })

    it('should enable Generate BOL button when SSCC exists and carrier assigned', () => {
      render(<LabelActions {...defaultProps} hasSSCC hasCarrier />)
      const button = screen.getByRole('button', { name: /generate.*bol/i })
      expect(button).not.toBeDisabled()
    })

    it('should enable Packing Slip button when SSCC exists', () => {
      render(<LabelActions {...defaultProps} hasSSCC />)
      const button = screen.getByRole('button', { name: /packing.*slip/i })
      expect(button).not.toBeDisabled()
    })
  })

  describe('Button States - Missing Carrier', () => {
    it('should disable Generate BOL button when carrier not assigned', () => {
      render(<LabelActions {...defaultProps} hasSSCC hasCarrier={false} />)
      const button = screen.getByRole('button', { name: /generate.*bol/i })
      expect(button).toBeDisabled()
    })

    it('should show tooltip about missing carrier', () => {
      render(<LabelActions {...defaultProps} hasSSCC hasCarrier={false} />)
      const button = screen.getByRole('button', { name: /generate.*bol/i })
      // Title attribute should mention carrier
      expect(button).toHaveAttribute('title')
      expect(button.getAttribute('title')).toMatch(/carrier/i)
    })
  })

  describe('Click Handlers', () => {
    it('should call onGenerateSSCC when Generate SSCC clicked', () => {
      const onGenerateSSCC = vi.fn()
      render(<LabelActions {...defaultProps} onGenerateSSCC={onGenerateSSCC} />)
      fireEvent.click(screen.getByRole('button', { name: /generate.*sscc/i }))
      expect(onGenerateSSCC).toHaveBeenCalled()
    })

    it('should call onPrintLabels when Print Labels clicked', () => {
      const onPrintLabels = vi.fn()
      render(<LabelActions {...defaultProps} hasSSCC onPrintLabels={onPrintLabels} />)
      fireEvent.click(screen.getByRole('button', { name: /print.*labels/i }))
      expect(onPrintLabels).toHaveBeenCalled()
    })

    it('should call onGenerateBOL when Generate BOL clicked', () => {
      const onGenerateBOL = vi.fn()
      render(<LabelActions {...defaultProps} hasSSCC hasCarrier onGenerateBOL={onGenerateBOL} />)
      fireEvent.click(screen.getByRole('button', { name: /generate.*bol/i }))
      expect(onGenerateBOL).toHaveBeenCalled()
    })

    it('should call onPackingSlip when Packing Slip clicked', () => {
      const onPackingSlip = vi.fn()
      render(<LabelActions {...defaultProps} hasSSCC onPackingSlip={onPackingSlip} />)
      fireEvent.click(screen.getByRole('button', { name: /packing.*slip/i }))
      expect(onPackingSlip).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner on Generate SSCC when loading', () => {
      render(<LabelActions {...defaultProps} generatingSSCC />)
      const button = screen.getByRole('button', { name: /generate.*sscc/i })
      expect(button).toContainHTML('spinner')
    })

    it('should disable all buttons while generating SSCC', () => {
      render(<LabelActions {...defaultProps} generatingSSCC />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toBeDisabled()
      })
    })
  })
})

// =============================================================================
// PrintSettingsPanel Component
// =============================================================================

describe('PrintSettingsPanel Component (Story 07.13)', () => {
  const defaultProps = {
    onPrint: vi.fn(),
    onCancel: vi.fn(),
  }

  describe('Printer Selection', () => {
    it('should display printer dropdown', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByRole('combobox', { name: /printer/i })).toBeInTheDocument()
    })

    it('should list available printers', () => {
      const printers = ['Zebra ZD430 (Dock 1)', 'Brother QL-800', 'Generic PDF']
      render(<PrintSettingsPanel {...defaultProps} printers={printers} />)
      printers.forEach(printer => {
        expect(screen.getByText(printer)).toBeInTheDocument()
      })
    })

    it('should show Printer Setup link', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByText(/printer.*setup/i)).toBeInTheDocument()
    })
  })

  describe('Format Selection', () => {
    it('should display format radio buttons', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByRole('radio', { name: /4x6/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /4x8/i })).toBeInTheDocument()
    })

    it('should have 4x6 selected by default', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByRole('radio', { name: /4x6/i })).toBeChecked()
    })
  })

  describe('Output Format', () => {
    it('should display output format options (ZPL/PDF)', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByRole('radio', { name: /zpl|zebra/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /pdf|universal/i })).toBeInTheDocument()
    })
  })

  describe('Copies', () => {
    it('should display copies input', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByRole('spinbutton', { name: /copies/i })).toBeInTheDocument()
    })

    it('should default to 1 copy', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByRole('spinbutton', { name: /copies/i })).toHaveValue(1)
    })

    it('should have +/- buttons for copies', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByRole('button', { name: /increase|plus|\+/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /decrease|minus|-/i })).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should have Print Now button', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByRole('button', { name: /print.*now|print/i })).toBeInTheDocument()
    })

    it('should have Cancel button', () => {
      render(<PrintSettingsPanel {...defaultProps} />)
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should call onPrint with settings when Print clicked', () => {
      const onPrint = vi.fn()
      render(<PrintSettingsPanel {...defaultProps} onPrint={onPrint} />)
      fireEvent.click(screen.getByRole('button', { name: /print/i }))
      expect(onPrint).toHaveBeenCalledWith(expect.objectContaining({
        format: expect.stringMatching(/4x6|4x8/),
        output: expect.stringMatching(/zpl|pdf/),
        copies: expect.any(Number),
      }))
    })
  })
})

// =============================================================================
// BatchLabelQueue Component
// =============================================================================

describe('BatchLabelQueue Component (Story 07.13)', () => {
  const mockBoxes = [
    { id: 'box-1', boxNumber: 1, sscc: '006141410000123452', status: 'ready', weight: 48.5 },
    { id: 'box-2', boxNumber: 2, sscc: '006141410000123469', status: 'ready', weight: 42.3 },
    { id: 'box-3', boxNumber: 3, sscc: null, status: 'error', error: 'GS1 prefix not configured' },
  ]

  const defaultProps = {
    boxes: mockBoxes,
    onGenerateAll: vi.fn(),
    onPrintAll: vi.fn(),
    onPrintSingle: vi.fn(),
    onRetry: vi.fn(),
  }

  describe('Queue Table', () => {
    it('should display table with all boxes', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('row')).toHaveLength(4) // Header + 3 boxes
    })

    it('should show box number column', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should show SSCC column with formatted SSCC', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      // SSCC is formatted with spaces, there may be multiple matches (one per box)
      const ssccCells = screen.getAllByText(/00 6141 4100/)
      expect(ssccCells.length).toBeGreaterThanOrEqual(1)
    })

    it('should show weight column', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      expect(screen.getByText(/48.5.*kg/i)).toBeInTheDocument()
      expect(screen.getByText(/42.3.*kg/i)).toBeInTheDocument()
    })

    it('should show status column', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      // There are 2 ready badges in table + summary text
      const table = screen.getByRole('table')
      const readyBadges = table.querySelectorAll('.green')
      expect(readyBadges.length).toBe(2)
      // Error badge in table
      const errorBadge = table.querySelector('.red')
      expect(errorBadge).toBeInTheDocument()
    })
  })

  describe('Status Badges', () => {
    it('should show green badge for Ready status', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      // Get status badges from the table rows (not the summary)
      const table = screen.getByRole('table')
      const readyBadges = table.querySelectorAll('.green')
      expect(readyBadges.length).toBe(2)
    })

    it('should show red badge for Error status', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      // Get status badge from the table rows (not the summary)
      const table = screen.getByRole('table')
      const errorBadge = table.querySelector('.red')
      expect(errorBadge).toBeInTheDocument()
    })

    it('should show error message for failed boxes', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      expect(screen.getByText(/GS1 prefix not configured/i)).toBeInTheDocument()
    })
  })

  describe('Bulk Actions', () => {
    it('should have Generate All button', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      expect(screen.getByRole('button', { name: /generate.*all/i })).toBeInTheDocument()
    })

    it('should have Print All button', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      expect(screen.getByRole('button', { name: /print.*all/i })).toBeInTheDocument()
    })

    it('should show count on Print All button', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      expect(screen.getByRole('button', { name: /print.*all.*\(2\)/i })).toBeInTheDocument()
    })

    it('should call onGenerateAll when clicked', () => {
      const onGenerateAll = vi.fn()
      render(<BatchLabelQueue {...defaultProps} onGenerateAll={onGenerateAll} />)
      fireEvent.click(screen.getByRole('button', { name: /generate.*all/i }))
      expect(onGenerateAll).toHaveBeenCalled()
    })

    it('should call onPrintAll when clicked', () => {
      const onPrintAll = vi.fn()
      render(<BatchLabelQueue {...defaultProps} onPrintAll={onPrintAll} />)
      fireEvent.click(screen.getByRole('button', { name: /print.*all/i }))
      expect(onPrintAll).toHaveBeenCalled()
    })
  })

  describe('Row Actions', () => {
    it('should have Print button per row', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      const printButtons = screen.getAllByRole('button', { name: /^print$/i })
      expect(printButtons).toHaveLength(2) // Only ready boxes have print
    })

    it('should have Preview button per row', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      const previewButtons = screen.getAllByRole('button', { name: /preview/i })
      expect(previewButtons).toHaveLength(2)
    })

    it('should have Retry button for error rows', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      expect(screen.getByRole('button', { name: /retry|regen/i })).toBeInTheDocument()
    })

    it('should call onRetry when Retry clicked', () => {
      const onRetry = vi.fn()
      render(<BatchLabelQueue {...defaultProps} onRetry={onRetry} />)
      fireEvent.click(screen.getByRole('button', { name: /retry|regen/i }))
      expect(onRetry).toHaveBeenCalledWith('box-3')
    })
  })

  describe('Batch Summary', () => {
    it('should display summary counts', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      // Summary shows "Total: X ready" and "Total: X error"
      const summary = screen.getByTestId('batch-summary')
      expect(summary).toHaveTextContent(/2.*ready/i)
      // Error count may be shown separately
      expect(screen.getByTestId('error-count') || summary.textContent?.includes('error')).toBeTruthy()
    })
  })

  describe('Selection', () => {
    it('should have checkbox per row', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThanOrEqual(3)
    })

    it('should have Select All checkbox', () => {
      render(<BatchLabelQueue {...defaultProps} />)
      expect(screen.getByRole('checkbox', { name: /select.*all/i })).toBeInTheDocument()
    })
  })
})

// =============================================================================
// PackingSlipPreview Component
// =============================================================================

describe('PackingSlipPreview Component (Story 07.13)', () => {
  const defaultProps = {
    pdfUrl: 'https://storage.supabase.co/object/public/packing-slip/org-id/shipment-id.pdf',
    shipmentNumber: 'SH-2025-001234',
    generatedAt: '2025-01-15T14:30:00Z',
    fileSizeKb: 180,
  }

  describe('PDF Display', () => {
    it('should render PDF viewer', () => {
      render(<PackingSlipPreview {...defaultProps} />)
      const pdfViewer = screen.getByTestId('pdf-viewer') ||
                        screen.getByRole('document')
      expect(pdfViewer).toBeInTheDocument()
    })

    it('should display shipment number', () => {
      render(<PackingSlipPreview {...defaultProps} />)
      expect(screen.getByText('SH-2025-001234')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should have Print button', () => {
      render(<PackingSlipPreview {...defaultProps} />)
      expect(screen.getByRole('button', { name: /print/i })).toBeInTheDocument()
    })

    it('should have Download button', () => {
      render(<PackingSlipPreview {...defaultProps} />)
      expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument()
    })

    it('should have Back button', () => {
      render(<PackingSlipPreview {...defaultProps} />)
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary for Label Components (Story 07.13)
 * ========================================================
 *
 * SSCCLabelPreview: 17 tests
 *   - Barcode display: 5 tests
 *   - Label content: 7 tests
 *   - Format selector: 3 tests
 *   - Scale controls: 4 tests
 *   - Accessibility: 2 tests
 *
 * BOLPreview: 15 tests
 *   - PDF display: 4 tests
 *   - Zoom controls: 4 tests
 *   - Action buttons: 8 tests
 *   - Metadata: 2 tests
 *
 * LabelActions: 17 tests
 *   - Button rendering: 4 tests
 *   - Button states before SSCC: 4 tests
 *   - Button states after SSCC: 4 tests
 *   - Missing carrier: 2 tests
 *   - Click handlers: 4 tests
 *   - Loading states: 2 tests
 *
 * PrintSettingsPanel: 10 tests
 *   - Printer selection: 3 tests
 *   - Format selection: 2 tests
 *   - Output format: 1 test
 *   - Copies: 3 tests
 *   - Action buttons: 3 tests
 *
 * BatchLabelQueue: 16 tests
 *   - Queue table: 5 tests
 *   - Status badges: 3 tests
 *   - Bulk actions: 5 tests
 *   - Row actions: 4 tests
 *   - Batch summary: 1 test
 *   - Selection: 2 tests
 *
 * PackingSlipPreview: 5 tests
 *   - PDF display: 2 tests
 *   - Action buttons: 3 tests
 *
 * Total: 80 tests
 * Coverage Target: 90%+
 */
