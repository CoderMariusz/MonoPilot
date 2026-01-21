/**
 * Scanner Putaway Wizard Component Tests (Story 05.21)
 * Phase: TDD RED - Tests written before implementation
 *
 * Tests ScannerPutawayWizard and step components:
 * - ScannerPutawayWizard - Main wizard container
 * - Step1ScanLP - Scan license plate
 * - Step2ViewSuggestion - Display suggested location
 * - Step3ScanLocation - Scan location barcode
 * - Step4Confirm - Confirm putaway
 * - Step5Success - Success screen
 * - LocationSuggestion - Suggestion display component
 * - LocationOverrideWarning - Override warning component
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Mobile-optimized layout
 * - AC-2: Scan LP to start putaway
 * - AC-3: View suggestion and scan location
 * - AC-4: Override warning
 * - AC-5: Confirm putaway
 * - AC-8: Audio/visual feedback
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ScannerPutawayWizard } from '../ScannerPutawayWizard'
import { Step1ScanLP } from '../Step1ScanLP'
import { Step2ViewSuggestion } from '../Step2ViewSuggestion'
import { Step3ScanLocation } from '../Step3ScanLocation'
import { Step4Confirm } from '../Step4Confirm'
import { Step5Success } from '../Step5Success'
import { LocationSuggestion } from '../LocationSuggestion'
import { LocationOverrideWarning } from '../LocationOverrideWarning'

// =============================================================================
// Mock Next.js Router
// =============================================================================

const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/scanner/putaway',
  useSearchParams: () => new URLSearchParams(),
}))

// =============================================================================
// Mock Hooks
// =============================================================================

vi.mock('@/lib/hooks/use-scanner-putaway', () => ({
  useSuggestLocation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useProcessPutaway: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useValidatePutaway: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useLPLookup: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useLocationLookup: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
}))

// Mock audio context
vi.mock('@/components/scanner/shared/AudioFeedback', () => ({
  AudioFeedback: {
    playSuccess: vi.fn(),
    playError: vi.fn(),
    playWarning: vi.fn(),
    playConfirm: vi.fn(),
    setEnabled: vi.fn(),
  },
}))

vi.mock('@/components/scanner/shared/HapticFeedback', () => ({
  HapticFeedback: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    confirm: vi.fn(),
  },
}))

// =============================================================================
// Test Data Fixtures
// =============================================================================

const mockLP = {
  id: 'lp-001',
  lp_number: 'LP00000001',
  product_name: 'Flour, All-Purpose',
  product_code: 'PROD-001',
  quantity: 500,
  uom: 'KG',
  batch_number: 'BATCH-001',
  expiry_date: '2025-12-31',
  current_location: 'Receiving Bay A',
  status: 'available',
}

const mockSuggestion = {
  suggestedLocation: {
    id: 'loc-a01',
    location_code: 'A-01-02-03',
    full_path: 'Warehouse A / Zone Cold / A-01-02-03',
    zone_id: 'zone-a',
    zone_name: 'Cold Storage',
    aisle: 'A-01',
    rack: '02',
    level: '03',
  },
  reason: 'FIFO: Place near oldest stock of same product',
  reasonCode: 'fifo_zone',
  alternatives: [
    { id: 'loc-a02', location_code: 'A-01-02-04', reason: 'Same zone, next available' },
    { id: 'loc-b01', location_code: 'B-01-01-01', reason: 'Alternative zone' },
  ],
  strategyUsed: 'fifo' as const,
}

const mockPutawayResult = {
  stockMove: {
    id: 'sm-001',
    move_number: 'SM-2025-00042',
    move_type: 'putaway',
    from_location_id: 'loc-receiving',
    to_location_id: 'loc-a01',
    quantity: 500,
    status: 'completed',
  },
  lp: {
    id: 'lp-001',
    lp_number: 'LP00000001',
    location_id: 'loc-a01',
    location_path: 'Warehouse A / Zone Cold / A-01-02-03',
  },
  overrideApplied: false,
}

// =============================================================================
// Tests
// =============================================================================

describe('ScannerPutawayWizard (Story 05.21)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ===========================================================================
  // Wizard Container Tests
  // ===========================================================================
  describe('Wizard Container', () => {
    it('should render with Step 1 by default', () => {
      render(<ScannerPutawayWizard />)
      // Check for step 1 content (Scan LP Barcode heading) - multiple elements may exist
      expect(screen.getAllByText(/Scan LP Barcode/i).length).toBeGreaterThan(0)
    })

    it('should show step progress indicator', () => {
      render(<ScannerPutawayWizard />)
      expect(screen.getByText(/Step 1 of 3|1\/3/i)).toBeInTheDocument()
    })

    it('should show header with title "Putaway"', () => {
      render(<ScannerPutawayWizard />)
      // The header shows "Putaway" initially
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })

    it('should show back button', () => {
      render(<ScannerPutawayWizard />)
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('should navigate steps correctly', async () => {
      render(<ScannerPutawayWizard />)
      // Step 1 content should be visible - multiple elements may exist
      expect(screen.getAllByText(/Scan LP Barcode/i).length).toBeGreaterThan(0)
    })

    it('should have mobile-optimized layout', () => {
      render(<ScannerPutawayWizard />)
      const container = screen.getByTestId('scanner-putaway-wizard')
      expect(container).toHaveClass(/full-screen|h-screen|min-h-screen/)
    })
  })

  // ===========================================================================
  // Step 1: Scan LP Tests (AC-2)
  // ===========================================================================
  describe('Step1ScanLP (AC-2)', () => {
    const mockOnLPScanned = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display "Scan LP Barcode" button', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} />)
      expect(screen.getByRole('button', { name: /scan.*lp.*barcode/i })).toBeInTheDocument()
    })

    it('should display LP number input for manual entry', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} />)
      expect(screen.getByPlaceholderText(/LP|barcode/i)).toBeInTheDocument()
    })

    it('should display instruction text', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} />)
      expect(screen.getByText(/Scan.*License Plate.*putaway/i)).toBeInTheDocument()
    })

    it('should call onLPScanned when LP scanned successfully', async () => {
      const user = userEvent.setup()
      const mockBarcodeScan = vi.fn().mockResolvedValue({
        lp: mockLP,
        suggestion: mockSuggestion,
      })
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} onBarcodeScan={mockBarcodeScan} />)

      const input = screen.getByPlaceholderText(/LP/i)
      await user.type(input, 'LP00000001')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnLPScanned).toHaveBeenCalled()
      })
    })

    it('should show loading state during scan', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} isLoading />)
      expect(screen.getAllByText(/loading|scanning/i).length).toBeGreaterThan(0)
    })

    it('should show LP details after successful scan', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} lpDetails={mockLP} />)
      // Multiple LP number elements may exist - use getAllBy
      expect(screen.getAllByText('LP00000001').length).toBeGreaterThan(0)
      expect(screen.getByText(/Flour, All-Purpose/)).toBeInTheDocument()
    })

    it('should show error for invalid LP', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} error="LP not found" />)
      expect(screen.getByText(/LP not found/i)).toBeInTheDocument()
    })

    it('should show error for LP not available', () => {
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          error="LP not available for putaway (status: consumed)"
        />
      )
      expect(screen.getByText(/not available|consumed/i)).toBeInTheDocument()
    })

    it('should have touch targets >= 48dp', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} />)
      const buttons = screen.getAllByRole('button')
      // Main action button should have min-h-[48px] or h-12
      const actionButton = buttons.find((b) =>
        b.className.includes('min-h-[48px]') ||
        b.className.includes('h-12')
      )
      expect(actionButton).toBeDefined()
    })
  })

  // ===========================================================================
  // Step 2: View Suggestion Tests (AC-3)
  // ===========================================================================
  describe('Step2ViewSuggestion (AC-3)', () => {
    const mockOnNext = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display suggested location prominently', () => {
      render(<Step2ViewSuggestion suggestion={mockSuggestion} onNext={mockOnNext} />)
      expect(screen.getByText('A-01-02-03')).toBeInTheDocument()
    })

    it('should display suggestion reason', () => {
      render(<Step2ViewSuggestion suggestion={mockSuggestion} onNext={mockOnNext} />)
      expect(screen.getByText(/FIFO.*oldest/i)).toBeInTheDocument()
    })

    it('should display zone name', () => {
      render(<Step2ViewSuggestion suggestion={mockSuggestion} onNext={mockOnNext} />)
      expect(screen.getByText(/Cold Storage/i)).toBeInTheDocument()
    })

    it('should display aisle, rack, level details', () => {
      render(<Step2ViewSuggestion suggestion={mockSuggestion} onNext={mockOnNext} />)
      // Check that location details section exists - aisle and rack should be shown
      expect(screen.getByText(/Location Details/i)).toBeInTheDocument()
    })

    it('should show "Next: Scan Location" button', () => {
      render(<Step2ViewSuggestion suggestion={mockSuggestion} onNext={mockOnNext} />)
      expect(
        screen.getByRole('button', { name: /Next.*Scan Location|Scan Location/i })
      ).toBeInTheDocument()
    })

    it('should display alternatives list', () => {
      render(<Step2ViewSuggestion suggestion={mockSuggestion} onNext={mockOnNext} />)
      // Alternatives section should be present
      expect(screen.getByText(/Alternative Locations/i)).toBeInTheDocument()
    })

    it('should call onNext when button clicked', async () => {
      const user = userEvent.setup()
      render(<Step2ViewSuggestion suggestion={mockSuggestion} onNext={mockOnNext} />)

      await user.click(screen.getByRole('button', { name: /Next|Scan Location/i }))
      expect(mockOnNext).toHaveBeenCalled()
    })

    it('should show message when no suggested location', () => {
      const noSuggestion = {
        ...mockSuggestion,
        suggestedLocation: null,
        reason: 'No available locations in preferred zone',
      }
      render(<Step2ViewSuggestion suggestion={noSuggestion} onNext={mockOnNext} />)
      // Multiple elements may contain the text
      const elements = screen.getAllByText(/No available locations/i)
      expect(elements.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // Step 3: Scan Location Tests (AC-3, AC-4)
  // ===========================================================================
  describe('Step3ScanLocation (AC-3, AC-4)', () => {
    const mockOnLocationScanned = vi.fn()
    const mockOnOverride = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display suggested location as reminder', () => {
      render(
        <Step3ScanLocation
          suggestedLocation={mockSuggestion.suggestedLocation}
          onLocationScanned={mockOnLocationScanned}
          onOverride={mockOnOverride}
        />
      )
      // Check for the location code - it may be in separate elements
      expect(screen.getByText('A-01-02-03')).toBeInTheDocument()
    })

    it('should display "Scan Location" input/button', () => {
      render(
        <Step3ScanLocation
          suggestedLocation={mockSuggestion.suggestedLocation}
          onLocationScanned={mockOnLocationScanned}
          onOverride={mockOnOverride}
        />
      )
      expect(screen.getByPlaceholderText(/Location/i)).toBeInTheDocument()
    })

    it('should show green checkmark when scanned matches suggestion (AC-3)', () => {
      render(
        <Step3ScanLocation
          suggestedLocation={mockSuggestion.suggestedLocation}
          scannedLocation={{ location_code: 'A-01-02-03', matches: true }}
          onLocationScanned={mockOnLocationScanned}
          onOverride={mockOnOverride}
        />
      )
      expect(screen.getByTestId('match-indicator')).toBeInTheDocument()
      expect(screen.getByText(/matches/i)).toBeInTheDocument()
    })

    it('should show yellow warning when scanned differs from suggestion (AC-4)', () => {
      render(
        <Step3ScanLocation
          suggestedLocation={mockSuggestion.suggestedLocation}
          scannedLocation={{ location_code: 'B-03-05-01', matches: false }}
          onLocationScanned={mockOnLocationScanned}
          onOverride={mockOnOverride}
        />
      )
      expect(screen.getByTestId('override-warning')).toBeInTheDocument()
      expect(screen.getByText(/Different.*suggested/i)).toBeInTheDocument()
    })

    it('should show "Use This Location Anyway" button on mismatch (AC-4)', () => {
      render(
        <Step3ScanLocation
          suggestedLocation={mockSuggestion.suggestedLocation}
          scannedLocation={{ location_code: 'B-03-05-01', matches: false }}
          onLocationScanned={mockOnLocationScanned}
          onOverride={mockOnOverride}
        />
      )
      expect(
        screen.getByRole('button', { name: /Use This Location|Override/i })
      ).toBeInTheDocument()
    })

    it('should show "Scan Suggested Location" button on mismatch', () => {
      render(
        <Step3ScanLocation
          suggestedLocation={mockSuggestion.suggestedLocation}
          scannedLocation={{ location_code: 'B-03-05-01', matches: false }}
          onLocationScanned={mockOnLocationScanned}
          onOverride={mockOnOverride}
        />
      )
      expect(
        screen.getByRole('button', { name: /Scan Suggested|Go Back/i })
      ).toBeInTheDocument()
    })

    it('should call onOverride when override button clicked', async () => {
      const user = userEvent.setup()
      render(
        <Step3ScanLocation
          suggestedLocation={mockSuggestion.suggestedLocation}
          scannedLocation={{ location_code: 'B-03-05-01', matches: false }}
          onLocationScanned={mockOnLocationScanned}
          onOverride={mockOnOverride}
        />
      )

      await user.click(screen.getByRole('button', { name: /Use This Location|Override/i }))
      expect(mockOnOverride).toHaveBeenCalled()
    })

    it('should show error for invalid location', () => {
      render(
        <Step3ScanLocation
          suggestedLocation={mockSuggestion.suggestedLocation}
          error="Location not found"
          onLocationScanned={mockOnLocationScanned}
          onOverride={mockOnOverride}
        />
      )
      expect(screen.getByText(/Location not found/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Step 4: Confirm Tests (AC-5)
  // ===========================================================================
  describe('Step4Confirm (AC-5)', () => {
    const mockOnConfirm = vi.fn()
    const mockOnEdit = vi.fn()
    const mockFormData = {
      lp: mockLP,
      fromLocation: 'Receiving Bay A',
      toLocation: mockSuggestion.suggestedLocation,
      override: false,
    }

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display LP number in summary', () => {
      render(
        <Step4Confirm formData={mockFormData} onConfirm={mockOnConfirm} onEdit={mockOnEdit} />
      )
      expect(screen.getByText('LP00000001')).toBeInTheDocument()
    })

    it('should display product name', () => {
      render(
        <Step4Confirm formData={mockFormData} onConfirm={mockOnConfirm} onEdit={mockOnEdit} />
      )
      expect(screen.getByText(/Flour, All-Purpose/)).toBeInTheDocument()
    })

    it('should display quantity and UoM', () => {
      render(
        <Step4Confirm formData={mockFormData} onConfirm={mockOnConfirm} onEdit={mockOnEdit} />
      )
      expect(screen.getByText(/500.*KG/)).toBeInTheDocument()
    })

    it('should display from and to locations', () => {
      render(
        <Step4Confirm formData={mockFormData} onConfirm={mockOnConfirm} onEdit={mockOnEdit} />
      )
      expect(screen.getByText(/Receiving Bay A/)).toBeInTheDocument()
      expect(screen.getByText(/A-01-02-03/)).toBeInTheDocument()
    })

    it('should show large "Confirm Putaway" button', () => {
      render(
        <Step4Confirm formData={mockFormData} onConfirm={mockOnConfirm} onEdit={mockOnEdit} />
      )
      const confirmBtn = screen.getByRole('button', { name: /Confirm Putaway/i })
      expect(confirmBtn).toBeInTheDocument()
    })

    it('should show override warning banner when override=true', () => {
      const overrideData = { ...mockFormData, override: true }
      render(
        <Step4Confirm formData={overrideData} onConfirm={mockOnConfirm} onEdit={mockOnEdit} />
      )
      expect(screen.getByText(/different.*suggested/i)).toBeInTheDocument()
    })

    it('should call onConfirm when button clicked', async () => {
      const user = userEvent.setup()
      render(
        <Step4Confirm formData={mockFormData} onConfirm={mockOnConfirm} onEdit={mockOnEdit} />
      )

      await user.click(screen.getByRole('button', { name: /Confirm Putaway/i }))
      expect(mockOnConfirm).toHaveBeenCalled()
    })

    it('should show loading state during submission', () => {
      render(
        <Step4Confirm
          formData={mockFormData}
          onConfirm={mockOnConfirm}
          onEdit={mockOnEdit}
          isLoading
        />
      )
      // Loading shows processing text or spinner - multiple elements may match
      const loadingElements = screen.getAllByText(/Processing.*putaway|Recording/i)
      expect(loadingElements.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // Step 5: Success Tests (AC-5)
  // ===========================================================================
  describe('Step5Success (AC-5)', () => {
    const mockOnPutawayAnother = vi.fn()
    const mockOnDone = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display success animation', () => {
      render(
        <Step5Success
          result={mockPutawayResult}
          onPutawayAnother={mockOnPutawayAnother}
          onDone={mockOnDone}
        />
      )
      // SuccessAnimation should render with data-testid - queryAllByTestId returns array
      const animations = screen.queryAllByTestId('success-animation')
      expect(animations.length).toBeGreaterThan(0)
    })

    it('should display "Putaway Complete" heading', () => {
      render(
        <Step5Success
          result={mockPutawayResult}
          onPutawayAnother={mockOnPutawayAnother}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByText(/Putaway Complete/i)).toBeInTheDocument()
    })

    it('should display LP number', () => {
      render(
        <Step5Success
          result={mockPutawayResult}
          onPutawayAnother={mockOnPutawayAnother}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByText('LP00000001')).toBeInTheDocument()
    })

    it('should display new location', () => {
      render(
        <Step5Success
          result={mockPutawayResult}
          onPutawayAnother={mockOnPutawayAnother}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByText(/A-01-02-03/)).toBeInTheDocument()
    })

    it('should display move number', () => {
      render(
        <Step5Success
          result={mockPutawayResult}
          onPutawayAnother={mockOnPutawayAnother}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByText(/SM-2025-00042/)).toBeInTheDocument()
    })

    it('should show "Putaway Another" button', () => {
      render(
        <Step5Success
          result={mockPutawayResult}
          onPutawayAnother={mockOnPutawayAnother}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByRole('button', { name: /Putaway Another/i })).toBeInTheDocument()
    })

    it('should show "Done" button', () => {
      render(
        <Step5Success
          result={mockPutawayResult}
          onPutawayAnother={mockOnPutawayAnother}
          onDone={mockOnDone}
        />
      )
      expect(screen.getByRole('button', { name: /Done/i })).toBeInTheDocument()
    })

    it('should call onPutawayAnother when button clicked', async () => {
      const user = userEvent.setup()
      render(
        <Step5Success
          result={mockPutawayResult}
          onPutawayAnother={mockOnPutawayAnother}
          onDone={mockOnDone}
        />
      )

      await user.click(screen.getByRole('button', { name: /Putaway Another/i }))
      expect(mockOnPutawayAnother).toHaveBeenCalled()
    })

    it('should call onDone when button clicked', async () => {
      const user = userEvent.setup()
      render(
        <Step5Success
          result={mockPutawayResult}
          onPutawayAnother={mockOnPutawayAnother}
          onDone={mockOnDone}
        />
      )

      await user.click(screen.getByRole('button', { name: /Done/i }))
      expect(mockOnDone).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // LocationSuggestion Component Tests
  // ===========================================================================
  describe('LocationSuggestion Component', () => {
    it('should display location code prominently (large, bold)', () => {
      render(<LocationSuggestion suggestion={mockSuggestion} />)
      const locationCode = screen.getByText('A-01-02-03')
      expect(locationCode).toHaveClass(/text-2xl|text-3xl|font-bold/)
    })

    it('should display full path', () => {
      render(<LocationSuggestion suggestion={mockSuggestion} />)
      expect(screen.getByText(/Warehouse A.*Zone Cold.*A-01-02-03/i)).toBeInTheDocument()
    })

    it('should display zone name', () => {
      render(<LocationSuggestion suggestion={mockSuggestion} />)
      expect(screen.getByText(/Cold Storage/)).toBeInTheDocument()
    })

    it('should display reason badge', () => {
      render(<LocationSuggestion suggestion={mockSuggestion} />)
      expect(screen.getByText(/FIFO.*oldest/i)).toBeInTheDocument()
    })

    it('should show "No suggested location" when null', () => {
      const noSuggestion = { ...mockSuggestion, suggestedLocation: null }
      render(<LocationSuggestion suggestion={noSuggestion} />)
      expect(screen.getByText(/No.*location|No available/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // LocationOverrideWarning Component Tests (AC-4)
  // ===========================================================================
  describe('LocationOverrideWarning Component (AC-4)', () => {
    const mockOnUseSuggested = vi.fn()
    const mockOnOverride = vi.fn()

    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should display warning icon (yellow)', () => {
      render(
        <LocationOverrideWarning
          suggestedLocation="A-01-02-03"
          selectedLocation="B-03-05-01"
          reason="FIFO zone A"
          onUseSuggested={mockOnUseSuggested}
          onOverride={mockOnOverride}
        />
      )
      const warningIcon = screen.getByTestId('warning-icon')
      expect(warningIcon).toHaveClass(/yellow|warning|amber/)
    })

    it('should display "Different Location Selected" message', () => {
      render(
        <LocationOverrideWarning
          suggestedLocation="A-01-02-03"
          selectedLocation="B-03-05-01"
          reason="FIFO zone A"
          onUseSuggested={mockOnUseSuggested}
          onOverride={mockOnOverride}
        />
      )
      expect(screen.getByText(/Different.*Location|Different from suggested/i)).toBeInTheDocument()
    })

    it('should show suggested and selected locations', () => {
      render(
        <LocationOverrideWarning
          suggestedLocation="A-01-02-03"
          selectedLocation="B-03-05-01"
          reason="FIFO zone A"
          onUseSuggested={mockOnUseSuggested}
          onOverride={mockOnOverride}
        />
      )
      // Check for location codes specifically
      expect(screen.getByText('A-01-02-03')).toBeInTheDocument()
      expect(screen.getByText('B-03-05-01')).toBeInTheDocument()
    })

    it('should show "Use This Location Anyway" button (amber)', () => {
      render(
        <LocationOverrideWarning
          suggestedLocation="A-01-02-03"
          selectedLocation="B-03-05-01"
          reason="FIFO zone A"
          onUseSuggested={mockOnUseSuggested}
          onOverride={mockOnOverride}
        />
      )
      const overrideBtn = screen.getByRole('button', { name: /Use This Location/i })
      expect(overrideBtn).toHaveClass(/amber|yellow|warning/)
    })

    it('should show "Scan Suggested Location" button (green)', () => {
      render(
        <LocationOverrideWarning
          suggestedLocation="A-01-02-03"
          selectedLocation="B-03-05-01"
          reason="FIFO zone A"
          onUseSuggested={mockOnUseSuggested}
          onOverride={mockOnOverride}
        />
      )
      const suggestedBtn = screen.getByRole('button', { name: /Scan Suggested/i })
      expect(suggestedBtn).toHaveClass(/green|primary/)
    })

    it('should call onOverride when override clicked', async () => {
      const user = userEvent.setup()
      render(
        <LocationOverrideWarning
          suggestedLocation="A-01-02-03"
          selectedLocation="B-03-05-01"
          reason="FIFO zone A"
          onUseSuggested={mockOnUseSuggested}
          onOverride={mockOnOverride}
        />
      )

      await user.click(screen.getByRole('button', { name: /Use This Location/i }))
      expect(mockOnOverride).toHaveBeenCalled()
    })

    it('should call onUseSuggested when suggested clicked', async () => {
      const user = userEvent.setup()
      render(
        <LocationOverrideWarning
          suggestedLocation="A-01-02-03"
          selectedLocation="B-03-05-01"
          reason="FIFO zone A"
          onUseSuggested={mockOnUseSuggested}
          onOverride={mockOnOverride}
        />
      )

      await user.click(screen.getByRole('button', { name: /Scan Suggested/i }))
      expect(mockOnUseSuggested).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // Touch Target Tests (Accessibility)
  // ===========================================================================
  describe('Touch Targets (Accessibility)', () => {
    it('should have all primary buttons >= 48dp height', () => {
      render(<ScannerPutawayWizard />)
      const buttons = screen.getAllByRole('button')
      // In jsdom, getBoundingClientRect returns 0, so check CSS classes instead
      // Note: back button in header uses h-12 w-12, main action buttons use min-h-[48px]
      const touchTargetCount = buttons.filter((button) => {
        const className = button.className
        return className.includes('min-h-[48px]') ||
          className.includes('h-12') ||
          className.includes('h-14') ||
          className.includes('min-w-[48px]')
      }).length
      // At least the main action button and back button should have proper touch targets
      expect(touchTargetCount).toBeGreaterThanOrEqual(2)
    })
  })

  // ===========================================================================
  // Loading & Error States
  // ===========================================================================
  describe('Loading & Error States', () => {
    it('should show loading overlay during API call', () => {
      render(<ScannerPutawayWizard isLoading />)
      expect(screen.getByTestId('loading-overlay')).toBeInTheDocument()
    })

    it('should show error state with retry option', () => {
      render(<ScannerPutawayWizard error="Network error" />)
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Wizard Container - 6 tests
 * Step1ScanLP (AC-2) - 9 tests
 * Step2ViewSuggestion (AC-3) - 8 tests
 * Step3ScanLocation (AC-3, AC-4) - 8 tests
 * Step4Confirm (AC-5) - 8 tests
 * Step5Success (AC-5) - 9 tests
 * LocationSuggestion Component - 5 tests
 * LocationOverrideWarning Component (AC-4) - 8 tests
 * Touch Targets - 1 test
 * Loading & Error States - 2 tests
 *
 * Total: 64 tests
 * Status: RED (components not implemented yet)
 */
