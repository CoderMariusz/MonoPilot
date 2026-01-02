/**
 * DiscountInput Component - Unit Tests
 * Story: 03.4 - PO Totals + Tax Calculations
 *
 * Tests the DiscountInput component which provides:
 * - Toggle between percentage and fixed amount modes
 * - Input validation (discount <= max)
 * - Keyboard navigation
 * - Loading, error, and success states
 *
 * Coverage Target: 80%+
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DiscountInput, DiscountMode } from '../DiscountInput'

// ============================================================================
// MOCK HELPERS
// ============================================================================

const defaultProps = {
  value: 0,
  onChange: vi.fn(),
  mode: 'percent' as DiscountMode,
  max: 100,
}

// ============================================================================
// RENDERING TESTS
// ============================================================================

describe('DiscountInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render input with label', () => {
      render(<DiscountInput {...defaultProps} label="Discount" />)

      expect(screen.getByLabelText('Discount')).toBeInTheDocument()
    })

    it('should render mode toggle buttons', () => {
      render(<DiscountInput {...defaultProps} />)

      expect(screen.getByRole('button', { name: 'Percentage mode' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Amount mode' })).toBeInTheDocument()
    })

    it('should show percent indicator in percent mode', () => {
      render(<DiscountInput {...defaultProps} mode="percent" />)

      expect(screen.getByText('%')).toBeInTheDocument()
    })

    it('should show currency in amount mode', () => {
      render(<DiscountInput {...defaultProps} mode="amount" currency="PLN" />)

      expect(screen.getByText('PLN')).toBeInTheDocument()
    })

    it('should display current value in input', () => {
      render(<DiscountInput {...defaultProps} value={10} mode="percent" />)

      expect(screen.getByRole('spinbutton')).toHaveValue(10)
    })
  })

  // ============================================================================
  // MODE TOGGLE
  // ============================================================================

  describe('Mode Toggle', () => {
    it('should highlight active mode button', () => {
      render(<DiscountInput {...defaultProps} mode="percent" />)

      const percentButton = screen.getByRole('button', { name: 'Percentage mode' })
      expect(percentButton).toHaveAttribute('aria-pressed', 'true')
    })

    it('should toggle from percent to amount mode', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} value={10} mode="percent" max={100} onChange={mockOnChange} />)

      const amountButton = screen.getByRole('button', { name: 'Amount mode' })
      await user.click(amountButton)

      // Should convert 10% to amount (10% of 100 = 10)
      expect(mockOnChange).toHaveBeenCalledWith(10, 'amount')
    })

    it('should toggle from amount to percent mode', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} value={25} mode="amount" max={100} onChange={mockOnChange} />)

      const percentButton = screen.getByRole('button', { name: 'Percentage mode' })
      await user.click(percentButton)

      // Should convert 25 amount to percent (25/100 = 25%)
      expect(mockOnChange).toHaveBeenCalledWith(25, 'percent')
    })

    it('should not trigger onChange when clicking already active mode', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} mode="percent" onChange={mockOnChange} />)

      const percentButton = screen.getByRole('button', { name: 'Percentage mode' })
      await user.click(percentButton)

      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // VALUE INPUT
  // ============================================================================

  describe('Value Input', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '15')

      expect(mockOnChange).toHaveBeenLastCalledWith(15, 'percent')
    })

    it('should accept decimal values in amount mode', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} mode="amount" onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '10.50')

      expect(mockOnChange).toHaveBeenLastCalledWith(10.5, 'amount')
    })

    it('should format value on blur in amount mode', async () => {
      const user = userEvent.setup()
      render(<DiscountInput {...defaultProps} value={10} mode="amount" />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '10.5')
      await user.tab()

      expect(input).toHaveValue(10.5)
    })
  })

  // ============================================================================
  // VALIDATION
  // ============================================================================

  describe('Validation', () => {
    it('should show error for negative discount', async () => {
      const user = userEvent.setup()
      render(<DiscountInput {...defaultProps} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '-5')

      expect(screen.getByRole('alert')).toHaveTextContent('Discount cannot be negative')
    })

    it('should show error when percent exceeds 100', async () => {
      const user = userEvent.setup()
      render(<DiscountInput {...defaultProps} mode="percent" />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '150')

      expect(screen.getByRole('alert')).toHaveTextContent('Discount cannot exceed 100%')
    })

    it('should show error when amount exceeds max', async () => {
      const user = userEvent.setup()
      render(<DiscountInput {...defaultProps} mode="amount" max={100} currency="USD" />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '150')

      expect(screen.getByRole('alert')).toHaveTextContent('Discount cannot exceed USD 100.00')
    })

    it('should set aria-invalid when validation fails', async () => {
      const user = userEvent.setup()
      render(<DiscountInput {...defaultProps} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '-5')

      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('should display external error prop', () => {
      render(<DiscountInput {...defaultProps} error="Custom error message" />)

      expect(screen.getByRole('alert')).toHaveTextContent('Custom error message')
    })
  })

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  describe('Keyboard Navigation', () => {
    it('should increment value with ArrowUp', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} value={10} mode="percent" onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowUp}')

      expect(mockOnChange).toHaveBeenCalledWith(11, 'percent')
    })

    it('should decrement value with ArrowDown', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} value={10} mode="percent" onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowDown}')

      expect(mockOnChange).toHaveBeenCalledWith(9, 'percent')
    })

    it('should not go below 0 with ArrowDown', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} value={0} mode="percent" onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowDown}')

      expect(mockOnChange).toHaveBeenCalledWith(0, 'percent')
    })

    it('should use 0.5 step in amount mode', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} value={10} mode="amount" onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowUp}')

      expect(mockOnChange).toHaveBeenCalledWith(10.5, 'amount')
    })
  })

  // ============================================================================
  // HELPER TEXT
  // ============================================================================

  describe('Helper Text', () => {
    it('should show calculated amount when in percent mode', () => {
      render(<DiscountInput {...defaultProps} value={10} mode="percent" max={100} currency="USD" />)

      expect(screen.getByText('Discount amount: USD 10.00')).toBeInTheDocument()
    })

    it('should show calculated percent when in amount mode', () => {
      render(<DiscountInput {...defaultProps} value={25} mode="amount" max={100} />)

      expect(screen.getByText('Discount percentage: 25.0%')).toBeInTheDocument()
    })

    it('should hide helper text when value is 0', () => {
      render(<DiscountInput {...defaultProps} value={0} mode="percent" max={100} />)

      expect(screen.queryByText(/Discount amount/)).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should render skeleton when isLoading is true', () => {
      const { container } = render(<DiscountInput {...defaultProps} isLoading={true} />)

      // Skeleton components use animate-pulse class
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('should not show input when loading', () => {
      render(<DiscountInput {...defaultProps} isLoading={true} />)

      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // DISABLED STATE
  // ============================================================================

  describe('Disabled State', () => {
    it('should disable input when disabled is true', () => {
      render(<DiscountInput {...defaultProps} disabled={true} />)

      expect(screen.getByRole('spinbutton')).toBeDisabled()
    })

    it('should disable mode toggle buttons when disabled', () => {
      render(<DiscountInput {...defaultProps} disabled={true} />)

      expect(screen.getByRole('button', { name: 'Percentage mode' })).toBeDisabled()
      expect(screen.getByRole('button', { name: 'Amount mode' })).toBeDisabled()
    })

    it('should not respond to keyboard navigation when disabled', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<DiscountInput {...defaultProps} disabled={true} onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowUp}')

      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })
})
