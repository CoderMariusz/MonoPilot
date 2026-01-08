/**
 * Component Tests: ProductionSettingsForm
 * Story: 04.5 - Production Settings
 * Phase: RED - Tests should FAIL (component not yet implemented)
 *
 * Tests the Production Settings form UI component:
 * - Renders with all 15 settings in 6 sections
 * - Toggle settings functionality
 * - Number input validation
 * - Form submission
 * - Reset functionality
 * - Unsaved changes warning
 * - Phase tooltips
 *
 * Related PRD: docs/1-BASELINE/product/modules/production.md (FR-PROD-017)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductionSettingsForm } from '@/components/production/ProductionSettingsForm'
import type { ProductionSettings } from '@/lib/services/production-settings-service'

/**
 * Mock production settings data
 */
const createMockSettings = (overrides?: Partial<ProductionSettings>): ProductionSettings => ({
  id: 'settings-uuid',
  org_id: 'org-uuid',
  // WO Execution (Phase 0)
  allow_pause_wo: false,
  auto_complete_wo: false,
  require_operation_sequence: true,
  // Material Consumption (Phase 1)
  allow_over_consumption: false,
  allow_partial_lp_consumption: true,
  // Output (Phase 1)
  require_qa_on_output: true,
  auto_create_by_product_lp: true,
  // Reservations (Phase 1)
  enable_material_reservations: true,
  // Dashboard (Phase 0)
  dashboard_refresh_seconds: 30,
  show_material_alerts: true,
  show_delay_alerts: true,
  show_quality_alerts: true,
  // OEE (Phase 2)
  enable_oee_tracking: false,
  target_oee_percent: 85,
  enable_downtime_tracking: false,
  // Metadata
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

describe('ProductionSettingsForm Component', () => {
  let mockOnSave: ReturnType<typeof vi.fn>
  let mockOnReset: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnSave = vi.fn()
    mockOnReset = vi.fn()
    vi.clearAllMocks()
  })

  /**
   * AC-1: Settings Page Load with All Fields
   */
  describe('Initial Rendering (AC-1)', () => {
    it('should render component with all 15 settings', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByText(/Production Settings/i)).toBeInTheDocument()
    })

    it('should display all 6 sections', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByText(/WO Execution/i)).toBeInTheDocument()
      expect(screen.getByText(/Material Consumption/i)).toBeInTheDocument()
      expect(screen.getByText(/Output/i)).toBeInTheDocument()
      expect(screen.getByText(/Reservations/i)).toBeInTheDocument()
      expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
      expect(screen.getByText(/OEE/i)).toBeInTheDocument()
    })

    it('should display WO Execution settings (3 toggles)', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByLabelText(/Allow Pause WO/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Auto Complete WO/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Require Operation Sequence/i)).toBeInTheDocument()
    })

    it('should display Material Consumption settings (2 toggles)', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByLabelText(/Allow Over Consumption/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Allow Partial LP Consumption/i)).toBeInTheDocument()
    })

    it('should display Output settings (2 toggles)', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByLabelText(/Require QA on Output/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Auto Create By-Product LP/i)).toBeInTheDocument()
    })

    it('should display Reservations settings (1 toggle)', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByLabelText(/Enable Material Reservations/i)).toBeInTheDocument()
    })

    it('should display Dashboard settings (1 number + 3 toggles)', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByLabelText(/Dashboard Refresh/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Show Material Alerts/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Show Delay Alerts/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Show Quality Alerts/i)).toBeInTheDocument()
    })

    it('should display OEE settings (2 toggles + 1 number)', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      expect(screen.getByLabelText(/Enable OEE Tracking/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Target OEE/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Enable Downtime Tracking/i)).toBeInTheDocument()
    })

    it('should show correct ON/OFF state for toggles', () => {
      const settings = createMockSettings({
        allow_pause_wo: true,
        auto_complete_wo: false,
      })

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const pauseToggle = screen.getByRole('switch', { name: /Allow Pause WO/i })
      const autoCompleteToggle = screen.getByRole('switch', { name: /Auto Complete WO/i })

      expect(pauseToggle).toBeChecked()
      expect(autoCompleteToggle).not.toBeChecked()
    })

    it('should show numeric values in number inputs', () => {
      const settings = createMockSettings({
        dashboard_refresh_seconds: 15,
        target_oee_percent: 90,
      })

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const refreshInput = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      const oeeInput = screen.getByLabelText(/Target OEE/i) as HTMLInputElement

      expect(refreshInput.value).toBe('15')
      expect(oeeInput.value).toBe('90')
    })

    it('should display Phase 1 tooltips on Material Consumption settings', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Phase 1 tooltip indicator should be present
      const section = screen.getByText(/Material Consumption/i).closest('section')
      expect(within(section!).getByLabelText(/Available in Phase 1/i)).toBeInTheDocument()
    })

    it('should display Phase 2 tooltips on OEE settings', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Phase 2 tooltip indicator should be present
      const section = screen.getByText(/OEE/i).closest('section')
      expect(within(section!).getByLabelText(/Available in Phase 2/i)).toBeInTheDocument()
    })
  })

  /**
   * AC-2, AC-3: Toggle allow_pause_wo
   */
  describe('Toggle Settings (AC-2, AC-3)', () => {
    it('should toggle allow_pause_wo from OFF to ON', async () => {
      const settings = createMockSettings({ allow_pause_wo: false })

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const toggle = screen.getByRole('switch', { name: /Allow Pause WO/i })
      expect(toggle).not.toBeChecked()

      await userEvent.click(toggle)

      expect(toggle).toBeChecked()
    })

    it('should toggle allow_pause_wo from ON to OFF', async () => {
      const settings = createMockSettings({ allow_pause_wo: true })

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const toggle = screen.getByRole('switch', { name: /Allow Pause WO/i })
      expect(toggle).toBeChecked()

      await userEvent.click(toggle)

      expect(toggle).not.toBeChecked()
    })

    it('should toggle all boolean settings independently', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Toggle multiple settings
      const autoCompleteToggle = screen.getByRole('switch', { name: /Auto Complete WO/i })
      const materialAlertsToggle = screen.getByRole('switch', { name: /Show Material Alerts/i })

      await userEvent.click(autoCompleteToggle)
      await userEvent.click(materialAlertsToggle)

      expect(autoCompleteToggle).toBeChecked()
      expect(materialAlertsToggle).not.toBeChecked() // Was true, now false
    })
  })

  /**
   * AC-4, AC-5: dashboard_refresh_seconds Validation
   */
  describe('Number Input Validation - dashboard_refresh_seconds (AC-4, AC-5)', () => {
    it('should accept valid value (15)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '15')

      expect(input.value).toBe('15')
      expect(screen.queryByText(/at least 5 seconds/i)).not.toBeInTheDocument()
    })

    it('should show error for value below minimum (0)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '0')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByText(/at least 5 seconds/i)).toBeInTheDocument()
      })
    })

    it('should show error for value below minimum (4)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '4')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByText(/at least 5 seconds/i)).toBeInTheDocument()
      })
    })

    it('should show error for value above maximum (301)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '301')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByText(/exceed 300 seconds/i)).toBeInTheDocument()
      })
    })

    it('should highlight field in red on validation error', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '0')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(input).toHaveClass('border-red-500')
      })
    })

    it('should accept boundary value (5)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '5')
      fireEvent.blur(input)

      expect(screen.queryByText(/at least 5 seconds/i)).not.toBeInTheDocument()
    })

    it('should accept boundary value (300)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '300')
      fireEvent.blur(input)

      expect(screen.queryByText(/exceed 300 seconds/i)).not.toBeInTheDocument()
    })
  })

  /**
   * AC-6, AC-7: target_oee_percent Validation
   */
  describe('Number Input Validation - target_oee_percent (AC-6, AC-7)', () => {
    it('should accept valid value (85)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Target OEE/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '85')

      expect(input.value).toBe('85')
      expect(screen.queryByText(/between 0 and 100/i)).not.toBeInTheDocument()
    })

    it('should show error for value above 100 (110)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Target OEE/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '110')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByText(/between 0 and 100/i)).toBeInTheDocument()
      })
    })

    it('should show error for negative value (-5)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Target OEE/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '-5')
      fireEvent.blur(input)

      await waitFor(() => {
        expect(screen.getByText(/between 0 and 100/i)).toBeInTheDocument()
      })
    })

    it('should accept boundary value (0)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Target OEE/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '0')
      fireEvent.blur(input)

      expect(screen.queryByText(/between 0 and 100/i)).not.toBeInTheDocument()
    })

    it('should accept boundary value (100)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Target OEE/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '100')
      fireEvent.blur(input)

      expect(screen.queryByText(/between 0 and 100/i)).not.toBeInTheDocument()
    })

    it('should accept decimal values (85.5)', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const input = screen.getByLabelText(/Target OEE/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '85.5')

      expect(input.value).toBe('85.5')
    })
  })

  /**
   * AC-9: Multiple Settings Changed at Once
   */
  describe('Multiple Settings Update (AC-9)', () => {
    it('should allow changing multiple settings before save', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Change 3 settings
      const pauseToggle = screen.getByRole('switch', { name: /Allow Pause WO/i })
      const refreshInput = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      const alertsToggle = screen.getByRole('switch', { name: /Show Material Alerts/i })

      await userEvent.click(pauseToggle)
      await userEvent.clear(refreshInput)
      await userEvent.type(refreshInput, '15')
      await userEvent.click(alertsToggle)

      // All changes reflected
      expect(pauseToggle).toBeChecked()
      expect(refreshInput.value).toBe('15')
      expect(alertsToggle).not.toBeChecked()
    })

    it('should save all changed settings in single submission', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Change multiple settings
      await userEvent.click(screen.getByRole('switch', { name: /Allow Pause WO/i }))
      const refreshInput = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(refreshInput)
      await userEvent.type(refreshInput, '15')

      // Submit
      const saveButton = screen.getByRole('button', { name: /Save/i })
      await userEvent.click(saveButton)

      // Verify onSave called with all changes
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            allow_pause_wo: true,
            dashboard_refresh_seconds: 15,
          })
        )
      })
    })
  })

  /**
   * AC-10, AC-11: Unsaved Changes Warning
   */
  describe('Unsaved Changes Warning (AC-10, AC-11)', () => {
    it('should mark form as dirty when settings changed', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const toggle = screen.getByRole('switch', { name: /Allow Pause WO/i })
      await userEvent.click(toggle)

      // Form should indicate unsaved changes
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()
    })

    it('should clear dirty flag after successful save', async () => {
      const settings = createMockSettings()
      mockOnSave.mockResolvedValue(undefined)

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Make change
      const toggle = screen.getByRole('switch', { name: /Allow Pause WO/i })
      await userEvent.click(toggle)

      // Save
      const saveButton = screen.getByRole('button', { name: /Save/i })
      await userEvent.click(saveButton)

      // Wait for save completion
      await waitFor(() => {
        expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument()
      })
    })

    it('should show browser confirmation on navigation attempt with unsaved changes', async () => {
      const settings = createMockSettings()

      // Mock beforeunload event
      const mockAddEventListener = vi.fn()
      window.addEventListener = mockAddEventListener

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Make change
      const toggle = screen.getByRole('switch', { name: /Allow Pause WO/i })
      await userEvent.click(toggle)

      // Verify beforeunload listener was added
      expect(mockAddEventListener).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    })
  })

  /**
   * AC-18: Form Reset Button
   */
  describe('Form Reset (AC-18)', () => {
    it('should revert all fields to last saved values on reset', async () => {
      const settings = createMockSettings({
        allow_pause_wo: false,
        dashboard_refresh_seconds: 30,
      })

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Make changes
      const toggle = screen.getByRole('switch', { name: /Allow Pause WO/i })
      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement

      await userEvent.click(toggle)
      await userEvent.clear(input)
      await userEvent.type(input, '15')

      // Verify changes
      expect(toggle).toBeChecked()
      expect(input.value).toBe('15')

      // Click reset
      const resetButton = screen.getByRole('button', { name: /Reset/i })
      await userEvent.click(resetButton)

      // Verify reverted
      await waitFor(() => {
        expect(toggle).not.toBeChecked()
        expect(input.value).toBe('30')
      })
    })

    it('should call onReset callback', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Make change
      await userEvent.click(screen.getByRole('switch', { name: /Allow Pause WO/i }))

      // Reset
      const resetButton = screen.getByRole('button', { name: /Reset/i })
      await userEvent.click(resetButton)

      expect(mockOnReset).toHaveBeenCalled()
    })

    it('should not make API call on reset', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Make change and reset
      await userEvent.click(screen.getByRole('switch', { name: /Allow Pause WO/i }))
      const resetButton = screen.getByRole('button', { name: /Reset/i })
      await userEvent.click(resetButton)

      // onSave should NOT be called
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should clear unsaved changes indicator after reset', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Make change
      await userEvent.click(screen.getByRole('switch', { name: /Allow Pause WO/i }))
      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument()

      // Reset
      const resetButton = screen.getByRole('button', { name: /Reset/i })
      await userEvent.click(resetButton)

      await waitFor(() => {
        expect(screen.queryByText(/unsaved changes/i)).not.toBeInTheDocument()
      })
    })
  })

  /**
   * Save Button and Loading State
   */
  describe('Save Button and Loading State', () => {
    it('should call onSave with current form values', async () => {
      const settings = createMockSettings({
        allow_pause_wo: true,
        dashboard_refresh_seconds: 15,
      })

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save/i })
      await userEvent.click(saveButton)

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith(
          expect.objectContaining({
            allow_pause_wo: true,
            dashboard_refresh_seconds: 15,
          })
        )
      })
    })

    it('should disable Save button during loading', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
          isLoading={true}
        />
      )

      const saveButton = screen.getByRole('button', { name: /Save|Saving/i })
      expect(saveButton).toBeDisabled()
    })

    it('should show loading indicator during save', () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
          isLoading={true}
        />
      )

      expect(screen.getByRole('progressbar') || screen.getByText(/Saving/i)).toBeInTheDocument()
    })

    it('should not submit if form has validation errors', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Enter invalid value
      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '0')
      fireEvent.blur(input)

      // Try to save
      const saveButton = screen.getByRole('button', { name: /Save/i })
      await userEvent.click(saveButton)

      // Should NOT call onSave
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('should disable Save button when form has validation errors', async () => {
      const settings = createMockSettings()

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Enter invalid value
      const input = screen.getByLabelText(/Dashboard Refresh/i) as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '0')
      fireEvent.blur(input)

      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /Save/i })
        expect(saveButton).toBeDisabled()
      })
    })
  })

  /**
   * Success/Error Toast Notifications
   */
  describe('Toast Notifications', () => {
    it('should show success toast after save', async () => {
      const settings = createMockSettings()
      mockOnSave.mockResolvedValue(undefined)

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Make a change
      await userEvent.click(screen.getByRole('switch', { name: /Allow Pause WO/i }))

      // Save
      const saveButton = screen.getByRole('button', { name: /Save/i })
      await userEvent.click(saveButton)

      // Success message should appear
      await waitFor(() => {
        expect(screen.getByText(/Settings saved successfully/i)).toBeInTheDocument()
      })
    })

    it('should show error toast on save failure', async () => {
      const settings = createMockSettings()
      mockOnSave.mockRejectedValue(new Error('Save failed'))

      render(
        <ProductionSettingsForm
          settings={settings}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      // Make a change
      await userEvent.click(screen.getByRole('switch', { name: /Allow Pause WO/i }))

      // Save
      const saveButton = screen.getByRole('button', { name: /Save/i })
      await userEvent.click(saveButton)

      // Error message should appear
      await waitFor(() => {
        expect(screen.getByText(/Failed to save|Error/i)).toBeInTheDocument()
      })
    })
  })

  /**
   * Controlled Component Behavior
   */
  describe('Controlled Component Behavior', () => {
    it('should update form when settings prop changes', async () => {
      const settings1 = createMockSettings({ allow_pause_wo: false })

      const { rerender } = render(
        <ProductionSettingsForm
          settings={settings1}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      const toggle = screen.getByRole('switch', { name: /Allow Pause WO/i })
      expect(toggle).not.toBeChecked()

      // Update props
      const settings2 = createMockSettings({ allow_pause_wo: true })
      rerender(
        <ProductionSettingsForm
          settings={settings2}
          onSave={mockOnSave}
          onReset={mockOnReset}
        />
      )

      await waitFor(() => {
        expect(toggle).toBeChecked()
      })
    })
  })
})

/**
 * Test Summary for Story 04.5 - ProductionSettingsForm Component
 * ==============================================================
 *
 * Test Coverage:
 * - Initial Rendering (AC-1): 12 tests
 * - Toggle Settings (AC-2, AC-3): 3 tests
 * - dashboard_refresh_seconds Validation (AC-4, AC-5): 7 tests
 * - target_oee_percent Validation (AC-6, AC-7): 6 tests
 * - Multiple Settings Update (AC-9): 2 tests
 * - Unsaved Changes Warning (AC-10, AC-11): 3 tests
 * - Form Reset (AC-18): 4 tests
 * - Save Button and Loading: 5 tests
 * - Toast Notifications: 2 tests
 * - Controlled Behavior: 1 test
 *
 * Total: 45 test cases
 *
 * Acceptance Criteria Covered:
 * - AC-1: Settings page load with all fields
 * - AC-2: Toggle allow_pause_wo ON
 * - AC-3: Toggle allow_pause_wo OFF
 * - AC-4: dashboard_refresh_seconds validation error
 * - AC-5: dashboard_refresh_seconds valid value
 * - AC-6: target_oee_percent validation error
 * - AC-7: target_oee_percent valid value
 * - AC-9: Multiple settings changed at once
 * - AC-10: Unsaved changes warning
 * - AC-11: No warning after save
 * - AC-18: Form reset button
 */
