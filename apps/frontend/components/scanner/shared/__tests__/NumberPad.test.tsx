/**
 * NumberPad Component Tests - Disabled State (Story 04.6c)
 * Purpose: Test NumberPad disabled prop for 1:1 consumption enforcement
 * Phase: GREEN - Tests should pass with disabled prop implementation
 *
 * Tests the NumberPad component disabled state which:
 * - Disables all keys when disabled=true
 * - Applies 50% opacity when disabled
 * - Ignores key clicks when disabled
 * - Works normally when disabled=false
 *
 * Coverage Target: 90%+
 *
 * Acceptance Criteria Coverage:
 * - AC-04.6c.12: Scanner number pad disabled state
 * - AC-04.6c.13: Number pad 50% opacity when disabled
 * - AC-04.6c.14: Number pad keys ignored when disabled
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NumberPad } from '../NumberPad'

describe('NumberPad Component - Disabled State (Story 04.6c)', () => {
  // ============================================================================
  // Normal Operation (disabled=false)
  // ============================================================================
  describe('Normal Operation (disabled=false)', () => {
    it('should work normally when disabled=false', async () => {
      const onChange = vi.fn()
      render(<NumberPad value="" onChange={onChange} />)

      // Click digit 5
      const button5 = screen.getByRole('button', { name: '5' })
      await userEvent.click(button5)

      expect(onChange).toHaveBeenCalledWith('5')
    })

    it('should allow all digit clicks when not disabled', async () => {
      const onChange = vi.fn()
      render(<NumberPad value="" onChange={onChange} />)

      // Click multiple digits
      await userEvent.click(screen.getByRole('button', { name: '1' }))
      await userEvent.click(screen.getByRole('button', { name: '2' }))
      await userEvent.click(screen.getByRole('button', { name: '3' }))

      expect(onChange).toHaveBeenCalledTimes(3)
    })

    it('should allow decimal click when not disabled', async () => {
      const onChange = vi.fn()
      render(<NumberPad value="10" onChange={onChange} allowDecimal={true} />)

      const decimalButton = screen.getByRole('button', { name: '.' })
      await userEvent.click(decimalButton)

      expect(onChange).toHaveBeenCalledWith('10.')
    })

    it('should allow backspace when not disabled', async () => {
      const onChange = vi.fn()
      render(<NumberPad value="123" onChange={onChange} />)

      const backspaceButton = screen.getByRole('button', { name: 'backspace' })
      await userEvent.click(backspaceButton)

      expect(onChange).toHaveBeenCalledWith('12')
    })

    it('should not have opacity class when not disabled', () => {
      render(<NumberPad value="" onChange={vi.fn()} />)

      // Container should not have opacity-50
      const container = screen.getByRole('group', { name: 'Number pad' })
      expect(container).not.toHaveClass('opacity-50')
    })
  })

  // ============================================================================
  // Disabled State - Key Interactions (AC-04.6c.14)
  // ============================================================================
  describe('Disabled State - Key Interactions', () => {
    it('should ignore digit clicks when disabled=true', async () => {
      // GIVEN: consume_whole_lp=true on scanner
      // WHEN: number pad key tapped
      // THEN: key tap ignored, qty value unchanged

      const onChange = vi.fn()
      render(<NumberPad value="100" onChange={onChange} disabled={true} />)
      const button5 = screen.getByRole('button', { name: '5' })
      await userEvent.click(button5)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should ignore all key clicks when disabled', async () => {
      const onChange = vi.fn()
      render(<NumberPad value="100" onChange={onChange} disabled={true} />)

      // Try all digit buttons 0-9
      for (let i = 0; i <= 9; i++) {
        const button = screen.getByRole('button', { name: String(i) })
        await userEvent.click(button)
      }

      expect(onChange).not.toHaveBeenCalled()
    })

    it('should ignore decimal click when disabled', async () => {
      const onChange = vi.fn()
      render(<NumberPad value="100" onChange={onChange} disabled={true} allowDecimal={true} />)
      const decimalButton = screen.getByRole('button', { name: '.' })
      await userEvent.click(decimalButton)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should ignore backspace click when disabled', async () => {
      const onChange = vi.fn()
      render(<NumberPad value="100" onChange={onChange} disabled={true} />)
      const backspaceButton = screen.getByRole('button', { name: 'backspace' })
      await userEvent.click(backspaceButton)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should ignore clear button click when disabled', async () => {
      const onChange = vi.fn()
      render(<NumberPad value="100" onChange={onChange} disabled={true} />)
      const clearButton = screen.getByRole('button', { name: /clear/i })
      await userEvent.click(clearButton)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should ignore quick adjust buttons (+1, -1, +10, -10) when disabled', async () => {
      const onChange = vi.fn()
      render(<NumberPad value="100" onChange={onChange} disabled={true} />)
      const plusOneButton = screen.getByRole('button', { name: '+1' })
      await userEvent.click(plusOneButton)
      expect(onChange).not.toHaveBeenCalled()
    })

    it('should preserve value when disabled keys are clicked', async () => {
      const originalValue = '500'
      const onChange = vi.fn()
      render(<NumberPad value={originalValue} onChange={onChange} disabled={true} />)
      // Try to modify value
      await userEvent.click(screen.getByRole('button', { name: '1' }))
      await userEvent.click(screen.getByRole('button', { name: '2' }))
      // onChange should not have been called
      expect(onChange).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Disabled State - Visual Styling (AC-04.6c.13)
  // ============================================================================
  describe('Disabled State - Visual Styling', () => {
    it('should apply 50% opacity when disabled', () => {
      // GIVEN: consume_whole_lp=true on scanner
      // WHEN: Step 3 (Enter Qty) displayed
      // THEN: number pad is disabled (grayed out, 50% opacity, not interactive)

      render(<NumberPad value="100" onChange={vi.fn()} disabled={true} />)
      const container = screen.getByRole('group', { name: 'Number pad' })
      expect(container).toHaveClass('opacity-50')
    })

    it('should have not-allowed cursor when disabled', () => {
      render(<NumberPad value="100" onChange={vi.fn()} disabled={true} />)
      const button = screen.getByRole('button', { name: '5' })
      expect(button).toHaveClass('cursor-not-allowed')
    })

    it('should apply disabled styling to digit buttons', () => {
      render(<NumberPad value="100" onChange={vi.fn()} disabled={true} />)
      // Check digit buttons specifically (they have cursor-not-allowed in their className)
      const digitButtons = [
        screen.getByRole('button', { name: '1' }),
        screen.getByRole('button', { name: '5' }),
        screen.getByRole('button', { name: '9' }),
      ]
      digitButtons.forEach(button => {
        expect(button).toHaveClass('cursor-not-allowed')
      })
    })

    it('should have aria-disabled="true" on container when disabled', () => {
      render(<NumberPad value="100" onChange={vi.fn()} disabled={true} />)
      const container = screen.getByRole('group', { name: 'Number pad' })
      expect(container).toHaveAttribute('aria-disabled', 'true')
    })
  })

  // ============================================================================
  // Accessibility
  // ============================================================================
  describe('Accessibility', () => {
    it('should have aria-disabled="true" on container when disabled', () => {
      render(<NumberPad value="100" onChange={vi.fn()} disabled={true} />)
      const container = screen.getByRole('group', { name: 'Number pad' })
      expect(container).toHaveAttribute('aria-disabled', 'true')
    })

    it('should have role="group" on container', () => {
      render(<NumberPad value="100" onChange={vi.fn()} />)
      const container = screen.getByRole('group', { name: 'Number pad' })
      expect(container).toBeInTheDocument()
    })
  })

  // ============================================================================
  // State Transitions
  // ============================================================================
  describe('State Transitions', () => {
    it('should transition from enabled to disabled', async () => {
      const onChange = vi.fn()

      const { rerender } = render(<NumberPad value="100" onChange={onChange} disabled={false} />)

      // Initially enabled
      const button = screen.getByRole('button', { name: '5' })
      expect(button).not.toHaveClass('cursor-not-allowed')

      // Transition to disabled
      rerender(<NumberPad value="100" onChange={onChange} disabled={true} />)
      expect(button).toHaveClass('cursor-not-allowed')
    })

    it('should transition from disabled to enabled', async () => {
      const onChange = vi.fn()

      const { rerender } = render(<NumberPad value="100" onChange={onChange} disabled={true} />)

      // Initially disabled
      const button = screen.getByRole('button', { name: '5' })
      expect(button).toHaveClass('cursor-not-allowed')

      // Transition to enabled
      rerender(<NumberPad value="100" onChange={onChange} disabled={false} />)
      expect(button).not.toHaveClass('cursor-not-allowed')
      await userEvent.click(button)
      expect(onChange).toHaveBeenCalledWith('1005')
    })
  })
})
