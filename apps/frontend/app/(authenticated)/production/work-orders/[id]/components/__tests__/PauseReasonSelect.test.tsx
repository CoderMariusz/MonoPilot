/**
 * PauseReasonSelect Component Tests
 * Story: 04.2b - WO Pause/Resume
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PauseReasonSelect, PAUSE_REASONS, getPauseReasonLabel } from '../PauseReasonSelect'

describe('PauseReasonSelect Component', () => {
  const mockOnValueChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render with placeholder when no value selected', () => {
      render(<PauseReasonSelect onValueChange={mockOnValueChange} />)

      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.getByText('Select a reason...')).toBeInTheDocument()
    })

    it('should render selected value with icon', () => {
      render(
        <PauseReasonSelect
          value="machine_breakdown"
          onValueChange={mockOnValueChange}
        />
      )

      expect(screen.getByText('Machine Breakdown')).toBeInTheDocument()
    })

    it('should render all 5 pause reason options', async () => {
      const user = userEvent.setup()
      render(<PauseReasonSelect onValueChange={mockOnValueChange} />)

      // Open the dropdown
      await user.click(screen.getByRole('combobox'))

      // Check all options are present
      expect(screen.getByText('Machine Breakdown')).toBeInTheDocument()
      expect(screen.getByText('Material Shortage')).toBeInTheDocument()
      expect(screen.getByText('Break/Lunch')).toBeInTheDocument()
      expect(screen.getByText('Quality Issue')).toBeInTheDocument()
      expect(screen.getByText('Other')).toBeInTheDocument()
    })

    it('should show option descriptions', async () => {
      const user = userEvent.setup()
      render(<PauseReasonSelect onValueChange={mockOnValueChange} />)

      await user.click(screen.getByRole('combobox'))

      expect(screen.getByText('Equipment failure or maintenance required')).toBeInTheDocument()
      expect(screen.getByText('Waiting for materials or supplies')).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('should call onValueChange when option selected', async () => {
      const user = userEvent.setup()
      render(<PauseReasonSelect onValueChange={mockOnValueChange} />)

      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('Machine Breakdown'))

      expect(mockOnValueChange).toHaveBeenCalledWith('machine_breakdown')
    })

    it('should update display when value prop changes', () => {
      const { rerender } = render(
        <PauseReasonSelect value="break" onValueChange={mockOnValueChange} />
      )

      expect(screen.getByText('Break/Lunch')).toBeInTheDocument()

      rerender(
        <PauseReasonSelect value="quality_issue" onValueChange={mockOnValueChange} />
      )

      expect(screen.getByText('Quality Issue')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should show error message when error prop provided', () => {
      render(
        <PauseReasonSelect
          onValueChange={mockOnValueChange}
          error="Please select a pause reason"
        />
      )

      expect(screen.getByText('Please select a pause reason')).toBeInTheDocument()
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have red border on error', () => {
      render(
        <PauseReasonSelect
          onValueChange={mockOnValueChange}
          error="Error message"
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveClass('border-red-500')
    })
  })

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(
        <PauseReasonSelect
          onValueChange={mockOnValueChange}
          disabled={true}
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toBeDisabled()
    })

    it('should not call onValueChange when disabled', async () => {
      const user = userEvent.setup()
      render(
        <PauseReasonSelect
          onValueChange={mockOnValueChange}
          disabled={true}
        />
      )

      const trigger = screen.getByRole('combobox')
      await user.click(trigger)

      expect(mockOnValueChange).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      render(<PauseReasonSelect onValueChange={mockOnValueChange} />)

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Pause reason')
    })

    it('should have aria-required=true', () => {
      render(<PauseReasonSelect onValueChange={mockOnValueChange} />)

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-required', 'true')
    })

    it('should have aria-invalid when error present', () => {
      render(
        <PauseReasonSelect
          onValueChange={mockOnValueChange}
          error="Error"
        />
      )

      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true')
    })

    it('should have aria-describedby linking to error message', () => {
      render(
        <PauseReasonSelect
          onValueChange={mockOnValueChange}
          error="Error message"
        />
      )

      const trigger = screen.getByRole('combobox')
      expect(trigger).toHaveAttribute('aria-describedby', 'pause-reason-error')
      expect(document.getElementById('pause-reason-error')).toHaveTextContent('Error message')
    })
  })

  describe('Helper Functions', () => {
    it('getPauseReasonLabel should return correct labels', () => {
      expect(getPauseReasonLabel('machine_breakdown')).toBe('Machine Breakdown')
      expect(getPauseReasonLabel('material_shortage')).toBe('Material Shortage')
      expect(getPauseReasonLabel('break')).toBe('Break/Lunch')
      expect(getPauseReasonLabel('quality_issue')).toBe('Quality Issue')
      expect(getPauseReasonLabel('other')).toBe('Other')
    })

    it('PAUSE_REASONS should have 5 options', () => {
      expect(PAUSE_REASONS).toHaveLength(5)
    })
  })
})
