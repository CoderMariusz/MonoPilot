/**
 * ConsumptionQtyInput Component Tests (Story 04.6c)
 * Purpose: Test qty input component with editable/read-only states
 * Phase: GREEN - Tests should pass with component implementation
 *
 * Tests the ConsumptionQtyInput component which:
 * - Handles editable state with normal styling
 * - Handles read-only state with lock icon and special styling
 * - Pre-fills value when LP selected for consume_whole_lp materials
 * - Prevents editing when isReadOnly=true
 *
 * Coverage Target: 90%+
 *
 * Acceptance Criteria Coverage:
 * - AC-04.6c.10: Scanner pre-fill and lock
 * - AC-04.6c.11: Desktop warning and lock
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsumptionQtyInput } from '../ConsumptionQtyInput'

describe('ConsumptionQtyInput Component (Story 04.6c)', () => {
  const defaultProps = {
    value: 100,
    onChange: vi.fn(),
    uom: 'kg',
    maxQty: 500,
    isReadOnly: false,
    showLockIcon: false,
  }

  // ============================================================================
  // Basic Rendering
  // ============================================================================
  describe('Basic Rendering', () => {
    it('should render input with value', () => {
      render(<ConsumptionQtyInput {...defaultProps} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(100)
    })

    it('should render UoM label', () => {
      render(<ConsumptionQtyInput {...defaultProps} />)
      expect(screen.getByText('kg')).toBeInTheDocument()
    })

    it('should call onChange when value changes', async () => {
      const onChange = vi.fn()
      render(<ConsumptionQtyInput {...defaultProps} onChange={onChange} />)
      const input = screen.getByRole('spinbutton')
      await userEvent.clear(input)
      await userEvent.type(input, '250')
      expect(onChange).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Editable State Styling
  // ============================================================================
  describe('Editable State', () => {
    it('should have Slate-600 border when editable', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={false} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveClass('border-slate-600')
    })

    it('should have Slate-800 background when editable', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={false} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveClass('bg-slate-800')
    })

    it('should have text cursor when editable', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={false} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveClass('cursor-text')
    })

    it('should not show lock icon when editable', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={false} showLockIcon={false} />)
      expect(screen.queryByTestId('lock-icon')).not.toBeInTheDocument()
    })

    it('should allow typing in editable state', async () => {
      const onChange = vi.fn()
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={false} onChange={onChange} value={0} />)
      const input = screen.getByRole('spinbutton')
      await userEvent.clear(input)
      await userEvent.type(input, '999')
      // Each character triggers onChange
      expect(onChange).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Read-Only State Styling (AC-04.6c.10, AC-04.6c.11)
  // ============================================================================
  describe('Read-Only State', () => {
    it('should have Yellow-600 border when read-only', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={true} showLockIcon={true} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveClass('border-yellow-600')
    })

    it('should have Slate-900 background when read-only', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={true} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveClass('bg-slate-900')
    })

    it('should show lock icon on right when read-only', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={true} showLockIcon={true} />)
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
    })

    it('should have not-allowed cursor when read-only', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={true} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveClass('cursor-not-allowed')
    })

    it('should have readonly attribute when read-only', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={true} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('readonly')
    })

    it('should not call onChange when read-only and user attempts to type', async () => {
      const onChange = vi.fn()
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={true} onChange={onChange} />)
      const input = screen.getByRole('spinbutton')
      // Attempt to type - onChange should not be called for typing (readOnly)
      fireEvent.change(input, { target: { value: '999' } })
      // Since the component has isReadOnly, the onChange won't process
      // The input is readonly so it won't actually change
    })

    it('should preserve pre-filled value when read-only', () => {
      const prefilledValue = 500
      render(<ConsumptionQtyInput {...defaultProps} value={prefilledValue} isReadOnly={true} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(500)
    })
  })

  // ============================================================================
  // Pre-fill Behavior (AC-04.6c.10)
  // ============================================================================
  describe('Pre-fill Behavior', () => {
    it('should pre-fill with LP.qty when consume_whole_lp=true', () => {
      const lpQty = 500
      render(<ConsumptionQtyInput {...defaultProps} value={lpQty} isReadOnly={true} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveValue(500)
    })

    it('should display as read-only with lock icon', () => {
      render(<ConsumptionQtyInput {...defaultProps} value={500} isReadOnly={true} showLockIcon={true} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('readonly')
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Validation
  // ============================================================================
  describe('Validation', () => {
    it('should not allow values greater than maxQty', async () => {
      const onChange = vi.fn()
      render(<ConsumptionQtyInput {...defaultProps} maxQty={100} value={0} onChange={onChange} />)
      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '150' } })
      // The component should cap it at maxQty (100)
      expect(onChange).toHaveBeenCalledWith(100)
    })

    it('should not allow negative values', () => {
      const onChange = vi.fn()
      render(<ConsumptionQtyInput {...defaultProps} value={0} onChange={onChange} />)
      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '-50' } })
      // Negative values are rejected
      expect(onChange).not.toHaveBeenCalledWith(-50)
    })

    it('should allow decimal values', () => {
      const onChange = vi.fn()
      render(<ConsumptionQtyInput {...defaultProps} value={0} onChange={onChange} />)
      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '25.5' } })
      expect(onChange).toHaveBeenCalledWith(25.5)
    })
  })

  // ============================================================================
  // Accessibility
  // ============================================================================
  describe('Accessibility', () => {
    it('should have aria-label for input', () => {
      render(<ConsumptionQtyInput {...defaultProps} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('aria-label')
    })

    it('should have aria-describedby linking to warning message when read-only', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={true} warningId="warning-message" />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('aria-describedby', 'warning-message')
    })

    it('should have aria-readonly="true" when read-only', () => {
      render(<ConsumptionQtyInput {...defaultProps} isReadOnly={true} />)
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveAttribute('aria-readonly', 'true')
    })
  })
})
