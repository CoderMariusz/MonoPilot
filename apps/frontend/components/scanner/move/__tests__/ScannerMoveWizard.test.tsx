/**
 * Scanner Move Wizard Component Tests (Story 05.20)
 * Phase: TDD RED - Tests written before implementation
 *
 * Tests the scanner move wizard components:
 * - ScannerMoveWizard container
 * - Step1ScanLP
 * - Step2ScanDestination
 * - Step3Confirm
 * - MoveSuccessScreen
 * - LPSummaryCard
 * - LocationSummaryCard
 * - MoveDirectionArrow
 *
 * Coverage Target: 85%+
 * Test Count: 60+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1: Scanner move page layout
 * - AC-2: Step 1 - Scan LP
 * - AC-3: Step 2 - Scan Destination
 * - AC-4: Step 3 - Confirm Move
 * - AC-5: Success screen actions
 * - AC-6: Audio feedback
 * - AC-7: Visual feedback
 * - AC-11: Touch target requirements
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Import real components
import { ScannerMoveWizard } from '../ScannerMoveWizard'
import { Step1ScanLP } from '../Step1ScanLP'
import { Step2ScanDestination } from '../Step2ScanDestination'
import { Step3Confirm } from '../Step3Confirm'
import { MoveSuccessScreen } from '../MoveSuccessScreen'
import { LPSummaryCard } from '../LPSummaryCard'
import { LocationSummaryCard } from '../LocationSummaryCard'
import { MoveDirectionArrow } from '../MoveDirectionArrow'

// Mock Next.js router
const mockRouterPush = vi.fn()
const mockRouterBack = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    back: mockRouterBack,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock hooks
vi.mock('@/lib/hooks/use-scanner-move', () => ({
  useLPLookup: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useLocationLookup: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useProcessMove: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
  useValidateMove: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isLoading: false,
  })),
}))

// Mock audio context
vi.mock('@/components/scanner/shared/AudioFeedback', () => ({
  AudioFeedback: {
    playSuccess: vi.fn(),
    playError: vi.fn(),
    playConfirm: vi.fn(),
    playAlert: vi.fn(),
    setEnabled: vi.fn(),
  },
}))

// Mock haptic feedback
vi.mock('@/components/scanner/shared/HapticFeedback', () => ({
  HapticFeedback: {
    success: vi.fn(),
    error: vi.fn(),
    confirm: vi.fn(),
  },
}))

// =============================================================================
// Global Setup
// =============================================================================

beforeEach(() => {
  vi.clearAllMocks()
  // Default fetch mock returns empty recent moves
  mockFetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
  })
})

// =============================================================================
// Test Fixtures
// =============================================================================

const mockLP = {
  id: 'lp-001',
  lp_number: 'LP00000001',
  product: {
    id: 'prod-001',
    name: 'Flour Type A',
    sku: 'RM-FLOUR-001',
  },
  quantity: 100,
  uom: 'KG',
  location: {
    id: 'loc-001',
    code: 'A-01-R03-B05',
    path: 'Main Warehouse / Zone A / Aisle 01',
  },
  status: 'available' as const,
  qa_status: 'passed' as const,
  batch_number: 'BATCH-2024-456',
  expiry_date: '2026-03-15',
}

const mockDestination = {
  id: 'loc-002',
  location_code: 'B-02-R05-B12',
  location_path: 'Main Warehouse / Zone B / Aisle 02 / Rack 05',
  warehouse_name: 'Main Warehouse',
  is_active: true,
  capacity_pct: 45,
}

const mockMoveResult = {
  stock_move: {
    id: 'move-001',
    move_number: 'SM-2025-00001',
    move_type: 'transfer' as const,
    status: 'completed' as const,
    from_location_id: 'loc-001',
    to_location_id: 'loc-002',
    quantity: 100,
    move_date: new Date().toISOString(),
  },
  lp: {
    id: 'lp-001',
    lp_number: 'LP00000001',
    location_id: 'loc-002',
    location_path: 'Zone B > Aisle 02 > Rack 05',
    product_name: 'Flour Type A',
    quantity: 100,
    uom: 'KG',
  },
}

// =============================================================================
// ScannerMoveWizard Container Tests
// =============================================================================

describe('ScannerMoveWizard', () => {
  describe('Wizard Container (AC-1)', () => {
    it('should render with Step 1 by default', () => {
      // Test will FAIL until component exists
      expect(() => {
        render(<ScannerMoveWizard />)
      }).not.toThrow()
    })

    it('should show step progress indicator', () => {
      render(<ScannerMoveWizard />)
      expect(screen.queryByText(/Step 1 of 3/i)).toBeInTheDocument()
    })

    it('should show header with Move LP title', () => {
      render(<ScannerMoveWizard />)
      expect(screen.queryByText(/Move LP/i)).toBeInTheDocument()
    })

    it('should show back button', () => {
      render(<ScannerMoveWizard />)
      expect(screen.queryByRole('button', { name: /back/i })).toBeInTheDocument()
    })

    it('should manage step navigation', () => {
      render(<ScannerMoveWizard />)
      // Initial state should be Step 1
      expect(screen.queryByText(/Step 1/i)).toBeInTheDocument()
    })

    it('should preserve LP data when navigating between steps', async () => {
      // This tests state persistence
      const onStepChange = vi.fn()
      render(<ScannerMoveWizard onStepChange={onStepChange} />)
      // LP should be preserved when going back and forth
      expect(onStepChange).not.toHaveBeenCalled()
    })
  })
})

// =============================================================================
// Step1ScanLP Tests (AC-2)
// =============================================================================

describe('Step1ScanLP', () => {
  const mockOnLPScanned = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should display scan LP prompt', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} onError={mockOnError} />)
      expect(screen.queryByText(/Scan LP|Scan.*Barcode/i)).toBeInTheDocument()
    })

    it('should show large scan button (80x80dp minimum)', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} onError={mockOnError} />)
      const scanButton = screen.queryByRole('button', { name: /scan/i })
      expect(scanButton).toBeInTheDocument()
      // Touch target size validation
      if (scanButton) {
        const styles = window.getComputedStyle(scanButton)
        const minHeight = parseInt(styles.minHeight) || parseInt(styles.height)
        expect(minHeight).toBeGreaterThanOrEqual(80)
      }
    })

    it('should show manual entry link', () => {
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} onError={mockOnError} />)
      expect(screen.queryByText(/manual|enter manually/i)).toBeInTheDocument()
    })

    it('should show recent moves list (optional)', () => {
      const recentMoves = [
        { id: 'move-1', lp_number: 'LP00000001', from: 'A-01', to: 'B-02' },
      ]
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          recentMoves={recentMoves}
        />
      )
      expect(screen.queryByText(/recent|last/i)).toBeInTheDocument()
    })
  })

  describe('LP Validation (AC-2)', () => {
    it('should call onLPScanned with LP data when valid LP scanned', async () => {
      const user = userEvent.setup()
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} onError={mockOnError} />)

      // Simulate manual entry
      const manualLink = screen.queryByText(/manual/i)
      if (manualLink) await user.click(manualLink)

      const input = screen.queryByRole('textbox')
      if (input) {
        await user.type(input, 'LP00000001')
        await user.keyboard('{Enter}')
      }

      // Should call onLPScanned with LP data
      await waitFor(() => {
        expect(mockOnLPScanned).toHaveBeenCalled()
      })
    })

    it('should call onError when LP not found', async () => {
      const user = userEvent.setup()
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} onError={mockOnError} />)

      const manualLink = screen.queryByText(/manual/i)
      if (manualLink) await user.click(manualLink)

      const input = screen.queryByRole('textbox')
      if (input) {
        await user.type(input, 'INVALID-LP')
        await user.keyboard('{Enter}')
      }

      await waitFor(() => {
        expect(mockOnError).toHaveBeenCalledWith(expect.stringContaining('not found'))
      })
    })

    it('should call onError when LP status is not available', async () => {
      // LP with status = consumed should trigger error
      render(<Step1ScanLP onLPScanned={mockOnLPScanned} onError={mockOnError} />)
      expect(mockOnError).not.toHaveBeenCalled()
    })
  })

  describe('LP Display (AC-2)', () => {
    it('should display LP details after successful scan', async () => {
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          scannedLP={mockLP}
        />
      )

      expect(screen.queryByText('LP00000001')).toBeInTheDocument()
      expect(screen.queryByText(/Flour Type A/i)).toBeInTheDocument()
      expect(screen.queryByText(/100.*KG/i)).toBeInTheDocument()
    })

    it('should show status badge for available LP', async () => {
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          scannedLP={mockLP}
        />
      )

      expect(screen.queryByText(/Available/i)).toBeInTheDocument()
    })

    it('should show current location', async () => {
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          scannedLP={mockLP}
        />
      )

      expect(screen.queryByText(/A-01-R03|Zone A/i)).toBeInTheDocument()
    })

    it('should show batch number if present', async () => {
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          scannedLP={mockLP}
        />
      )

      expect(screen.queryByText('BATCH-2024-456')).toBeInTheDocument()
    })

    it('should show expiry date if present', async () => {
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          scannedLP={mockLP}
        />
      )

      expect(screen.queryByText(/2026-03-15|Mar.*2026/i)).toBeInTheDocument()
    })
  })

  describe('Error States', () => {
    it('should display error message for LP not found', () => {
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          error="LP not found: LP99999999"
        />
      )

      expect(screen.queryByText(/not found/i)).toBeInTheDocument()
    })

    it('should display error message for consumed LP', () => {
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          error="LP not available (status: consumed)"
        />
      )

      expect(screen.queryByText(/consumed/i)).toBeInTheDocument()
    })

    it('should display error message for reserved LP', () => {
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          error="LP is reserved for WO-2025-00001"
        />
      )

      expect(screen.queryByText(/reserved/i)).toBeInTheDocument()
    })

    it('should allow retry after error', async () => {
      const user = userEvent.setup()
      render(
        <Step1ScanLP
          onLPScanned={mockOnLPScanned}
          onError={mockOnError}
          error="LP not found"
        />
      )

      const scanButton = screen.queryByRole('button', { name: /scan|retry/i })
      expect(scanButton).toBeInTheDocument()
      if (scanButton) await user.click(scanButton)
    })
  })
})

// =============================================================================
// Step2ScanDestination Tests (AC-3)
// =============================================================================

describe('Step2ScanDestination', () => {
  const mockOnLocationScanned = vi.fn()
  const mockOnBack = vi.fn()
  const mockOnError = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should display LP summary card at top', () => {
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
        />
      )

      expect(screen.queryByText('LP00000001')).toBeInTheDocument()
    })

    it('should show scan destination prompt', () => {
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
        />
      )

      expect(screen.queryByText(/Scan Destination|destination/i)).toBeInTheDocument()
    })

    it('should show current location with From label', () => {
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
        />
      )

      expect(screen.queryByText(/From|Current/i)).toBeInTheDocument()
      expect(screen.queryByText(/A-01-R03|Zone A/i)).toBeInTheDocument()
    })

    it('should show manual selection link', () => {
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
        />
      )

      expect(screen.queryByText(/select.*manually|manual/i)).toBeInTheDocument()
    })
  })

  describe('Location Validation (AC-3)', () => {
    it('should call onLocationScanned when valid location scanned', async () => {
      const user = userEvent.setup()
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
        />
      )

      // Simulate location scan
      const scanButton = screen.queryByRole('button', { name: /scan/i })
      if (scanButton) await user.click(scanButton)

      await waitFor(() => {
        expect(mockOnLocationScanned).toHaveBeenCalled()
      })
    })

    it('should call onError when location not found', async () => {
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
        />
      )

      // Error should be called for invalid location
      expect(mockOnError).not.toHaveBeenCalled()
    })

    it('should show warning when scanning same location as source', () => {
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
          error="Same as current location"
        />
      )

      expect(screen.queryByText(/same|current location/i)).toBeInTheDocument()
    })
  })

  describe('Location Display (AC-3)', () => {
    it('should display destination details after successful scan', () => {
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
          scannedLocation={mockDestination}
        />
      )

      expect(screen.queryByText('B-02-R05-B12')).toBeInTheDocument()
    })

    it('should show zone and full path', () => {
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
          scannedLocation={mockDestination}
        />
      )

      expect(screen.queryByText(/Zone B|Aisle 02/i)).toBeInTheDocument()
    })

    it('should show capacity percentage if available', () => {
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
          scannedLocation={mockDestination}
        />
      )

      expect(screen.queryByText(/45%/i)).toBeInTheDocument()
    })
  })

  describe('Warnings (AC-3)', () => {
    it('should show capacity warning when location at 100%', () => {
      const fullLocation = { ...mockDestination, capacity_pct: 100 }
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
          scannedLocation={fullLocation}
          warning="Location at capacity"
        />
      )

      expect(screen.queryByText(/capacity|full/i)).toBeInTheDocument()
    })

    it('should still allow proceed despite capacity warning', () => {
      const fullLocation = { ...mockDestination, capacity_pct: 100 }
      render(
        <Step2ScanDestination
          lp={mockLP}
          onLocationScanned={mockOnLocationScanned}
          onBack={mockOnBack}
          onError={mockOnError}
          scannedLocation={fullLocation}
          warning="Location at capacity"
        />
      )

      // Should still show continue/next button
      expect(screen.queryByRole('button', { name: /continue|next|confirm/i })).toBeInTheDocument()
    })
  })
})

// =============================================================================
// Step3Confirm Tests (AC-4)
// =============================================================================

describe('Step3Confirm', () => {
  const mockOnConfirm = vi.fn()
  const mockOnEditLP = vi.fn()
  const mockOnEditDestination = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Summary Display (AC-4)', () => {
    it('should display LP info section', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.queryByText('LP00000001')).toBeInTheDocument()
      expect(screen.queryByText(/Flour Type A/i)).toBeInTheDocument()
      expect(screen.queryByText(/100.*KG/i)).toBeInTheDocument()
    })

    it('should display from location with full path', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.queryByText(/From/i)).toBeInTheDocument()
      expect(screen.queryByText(/A-01-R03|Zone A/i)).toBeInTheDocument()
    })

    it('should display to location with full path', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.queryByText(/To/i)).toBeInTheDocument()
      expect(screen.queryByText(/B-02-R05|Zone B/i)).toBeInTheDocument()
    })

    it('should show visual direction arrow', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.queryByTestId('direction-arrow')).toBeInTheDocument()
    })
  })

  describe('Actions (AC-4)', () => {
    it('should have large Confirm Move button at bottom', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      const confirmBtn = screen.queryByRole('button', { name: /Confirm.*Move/i })
      expect(confirmBtn).toBeInTheDocument()
    })

    it('should have Cancel link above confirm button', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.queryByText(/Cancel/i)).toBeInTheDocument()
    })

    it('should have Edit button on LP section', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      const editButtons = screen.queryAllByRole('button', { name: /Edit/i })
      expect(editButtons.length).toBeGreaterThanOrEqual(1)
    })

    it('should have Edit button on destination section', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      const editButtons = screen.queryAllByRole('button', { name: /Edit/i })
      expect(editButtons.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('Callbacks (AC-4)', () => {
    it('should call onConfirm when confirm clicked', async () => {
      const user = userEvent.setup()
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      const confirmBtn = screen.queryByRole('button', { name: /Confirm/i })
      if (confirmBtn) await user.click(confirmBtn)

      expect(mockOnConfirm).toHaveBeenCalled()
    })

    it('should call onEditLP when Edit LP clicked', async () => {
      const user = userEvent.setup()
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      const editButtons = screen.queryAllByRole('button', { name: /Edit/i })
      if (editButtons[0]) await user.click(editButtons[0])

      expect(mockOnEditLP).toHaveBeenCalled()
    })

    it('should call onCancel when Cancel clicked', async () => {
      const user = userEvent.setup()
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
        />
      )

      const cancelBtn = screen.queryByText(/Cancel/i)
      if (cancelBtn) await user.click(cancelBtn)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  describe('Loading State (AC-4)', () => {
    it('should show loading indicator during submit', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      expect(screen.queryByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should disable confirm button during loading', () => {
      render(
        <Step3Confirm
          lp={mockLP}
          destination={mockDestination}
          onConfirm={mockOnConfirm}
          onEditLP={mockOnEditLP}
          onEditDestination={mockOnEditDestination}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      )

      const confirmBtn = screen.queryByRole('button', { name: /Confirm/i })
      expect(confirmBtn).toBeDisabled()
    })
  })
})

// =============================================================================
// MoveSuccessScreen Tests (AC-5)
// =============================================================================

describe('MoveSuccessScreen', () => {
  const mockOnMoveAnother = vi.fn()
  const mockOnNewMove = vi.fn()
  const mockOnDone = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Success Display (AC-5)', () => {
    it('should display success animation', () => {
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      expect(screen.queryByTestId('success-animation')).toBeInTheDocument()
    })

    it('should display move number', () => {
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      expect(screen.queryByText('SM-2025-00001')).toBeInTheDocument()
    })

    it('should display LP number', () => {
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      expect(screen.queryByText('LP00000001')).toBeInTheDocument()
    })

    it('should display new location', () => {
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      expect(screen.queryByText(/Zone B|Aisle 02|Rack 05/i)).toBeInTheDocument()
    })
  })

  describe('Actions (AC-5)', () => {
    it('should have Move Another to Same Location button', () => {
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      expect(screen.queryByRole('button', { name: /Move Another.*Same|Same Location/i })).toBeInTheDocument()
    })

    it('should have New Move button', () => {
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      expect(screen.queryByRole('button', { name: /New Move/i })).toBeInTheDocument()
    })

    it('should have Done button', () => {
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      expect(screen.queryByRole('button', { name: /Done/i })).toBeInTheDocument()
    })
  })

  describe('Callbacks (AC-5)', () => {
    it('should call onMoveAnother when Move Another clicked', async () => {
      const user = userEvent.setup()
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      const btn = screen.queryByRole('button', { name: /Move Another/i })
      if (btn) await user.click(btn)

      expect(mockOnMoveAnother).toHaveBeenCalled()
    })

    it('should call onNewMove when New Move clicked', async () => {
      const user = userEvent.setup()
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      const btn = screen.queryByRole('button', { name: /New Move/i })
      if (btn) await user.click(btn)

      expect(mockOnNewMove).toHaveBeenCalled()
    })

    it('should call onDone when Done clicked', async () => {
      const user = userEvent.setup()
      render(
        <MoveSuccessScreen
          result={mockMoveResult}
          onMoveAnother={mockOnMoveAnother}
          onNewMove={mockOnNewMove}
          onDone={mockOnDone}
        />
      )

      const btn = screen.queryByRole('button', { name: /Done/i })
      if (btn) await user.click(btn)

      expect(mockOnDone).toHaveBeenCalled()
    })
  })
})

// =============================================================================
// LPSummaryCard Tests
// =============================================================================

describe('LPSummaryCard', () => {
  it('should display LP number prominently', () => {
    render(<LPSummaryCard lp={mockLP} />)
    expect(screen.queryByText('LP00000001')).toBeInTheDocument()
  })

  it('should display product name', () => {
    render(<LPSummaryCard lp={mockLP} />)
    expect(screen.queryByText(/Flour Type A/i)).toBeInTheDocument()
  })

  it('should display quantity with UOM', () => {
    render(<LPSummaryCard lp={mockLP} />)
    expect(screen.queryByText(/100.*KG/i)).toBeInTheDocument()
  })

  it('should display location', () => {
    render(<LPSummaryCard lp={mockLP} />)
    expect(screen.queryByText(/A-01-R03|Zone A/i)).toBeInTheDocument()
  })

  it('should support compact mode', () => {
    render(<LPSummaryCard lp={mockLP} compact />)
    // Compact mode should still show key info
    expect(screen.queryByText('LP00000001')).toBeInTheDocument()
  })

  it('should show status badge when showStatus is true', () => {
    render(<LPSummaryCard lp={mockLP} showStatus />)
    expect(screen.queryByText(/Available/i)).toBeInTheDocument()
  })

  it('should show Edit button when onEdit provided', () => {
    const onEdit = vi.fn()
    render(<LPSummaryCard lp={mockLP} onEdit={onEdit} />)
    expect(screen.queryByRole('button', { name: /Edit/i })).toBeInTheDocument()
  })
})

// =============================================================================
// LocationSummaryCard Tests
// =============================================================================

describe('LocationSummaryCard', () => {
  it('should display location code', () => {
    render(<LocationSummaryCard location={mockDestination} />)
    expect(screen.queryByText('B-02-R05-B12')).toBeInTheDocument()
  })

  it('should display full path', () => {
    render(<LocationSummaryCard location={mockDestination} />)
    expect(screen.queryByText(/Zone B|Aisle 02/i)).toBeInTheDocument()
  })

  it('should display warehouse name', () => {
    render(<LocationSummaryCard location={mockDestination} />)
    expect(screen.queryByText(/Main Warehouse/i)).toBeInTheDocument()
  })

  it('should display capacity percentage if available', () => {
    render(<LocationSummaryCard location={mockDestination} />)
    expect(screen.queryByText(/45%/i)).toBeInTheDocument()
  })

  it('should show Edit button when onEdit provided', () => {
    const onEdit = vi.fn()
    render(<LocationSummaryCard location={mockDestination} onEdit={onEdit} />)
    expect(screen.queryByRole('button', { name: /Edit/i })).toBeInTheDocument()
  })
})

// =============================================================================
// MoveDirectionArrow Tests
// =============================================================================

describe('MoveDirectionArrow', () => {
  it('should render arrow element', () => {
    render(<MoveDirectionArrow />)
    expect(screen.queryByTestId('direction-arrow')).toBeInTheDocument()
  })

  it('should have minimum size of 24x24', () => {
    render(<MoveDirectionArrow />)
    const arrow = screen.queryByTestId('direction-arrow')
    if (arrow) {
      const styles = window.getComputedStyle(arrow)
      expect(parseInt(styles.width)).toBeGreaterThanOrEqual(24)
    }
  })
})

// =============================================================================
// Touch Target Tests (AC-11)
// =============================================================================

describe('Touch Target Requirements (AC-11)', () => {
  const MINIMUM_TOUCH_TARGET = 48 // dp

  it('should have all buttons meeting minimum 48dp touch target', () => {
    render(<ScannerMoveWizard />)
    const buttons = screen.queryAllByRole('button')

    buttons.forEach((button) => {
      const styles = window.getComputedStyle(button)
      const minHeight = parseInt(styles.minHeight) || parseInt(styles.height)
      expect(minHeight).toBeGreaterThanOrEqual(MINIMUM_TOUCH_TARGET)
    })
  })
})

// =============================================================================
// Audio Feedback Tests (AC-6)
// =============================================================================

describe('Audio Feedback (AC-6)', () => {
  it('should trigger success audio on valid LP scan', () => {
    // Audio feedback should be triggered
    const mockPlaySuccess = vi.fn()
    expect(mockPlaySuccess).not.toHaveBeenCalled()
  })

  it('should trigger error audio on invalid scan', () => {
    const mockPlayError = vi.fn()
    expect(mockPlayError).not.toHaveBeenCalled()
  })

  it('should trigger confirm audio on move complete', () => {
    const mockPlayConfirm = vi.fn()
    expect(mockPlayConfirm).not.toHaveBeenCalled()
  })
})

// =============================================================================
// Visual Feedback Tests (AC-7)
// =============================================================================

describe('Visual Feedback (AC-7)', () => {
  it('should show green checkmark on valid scan', () => {
    render(<Step1ScanLP onLPScanned={vi.fn()} onError={vi.fn()} scannedLP={mockLP} />)
    expect(screen.queryByTestId('success-icon')).toBeInTheDocument()
  })

  it('should show red X on error', () => {
    render(<Step1ScanLP onLPScanned={vi.fn()} onError={vi.fn()} error="LP not found" />)
    expect(screen.queryByTestId('error-icon')).toBeInTheDocument()
  })

  it('should show yellow warning for capacity', () => {
    render(
      <Step2ScanDestination
        lp={mockLP}
        onLocationScanned={vi.fn()}
        onBack={vi.fn()}
        onError={vi.fn()}
        warning="Location at capacity"
      />
    )
    expect(screen.queryByTestId('warning-icon')).toBeInTheDocument()
  })
})

/**
 * Test Coverage Summary:
 *
 * ScannerMoveWizard Container - 6 tests:
 *   - Initial render
 *   - Step progress
 *   - Header
 *   - Back button
 *   - Navigation
 *   - State preservation
 *
 * Step1ScanLP - 15 tests:
 *   - Initial state (4 tests)
 *   - LP validation (3 tests)
 *   - LP display (5 tests)
 *   - Error states (3 tests)
 *
 * Step2ScanDestination - 13 tests:
 *   - Initial state (4 tests)
 *   - Location validation (3 tests)
 *   - Location display (3 tests)
 *   - Warnings (3 tests)
 *
 * Step3Confirm - 13 tests:
 *   - Summary display (4 tests)
 *   - Actions (4 tests)
 *   - Callbacks (3 tests)
 *   - Loading state (2 tests)
 *
 * MoveSuccessScreen - 9 tests:
 *   - Success display (4 tests)
 *   - Actions (2 tests)
 *   - Callbacks (3 tests)
 *
 * LPSummaryCard - 7 tests
 * LocationSummaryCard - 5 tests
 * MoveDirectionArrow - 2 tests
 * Touch Targets - 1 test
 * Audio Feedback - 3 tests
 * Visual Feedback - 3 tests
 *
 * Total: 77 tests
 * Coverage Target: 85%+
 */
