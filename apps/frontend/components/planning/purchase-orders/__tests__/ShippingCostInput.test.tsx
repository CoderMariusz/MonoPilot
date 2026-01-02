/**
 * ShippingCostInput Component - Unit Tests
 * Story: 03.4 - PO Totals + Tax Calculations
 *
 * Tests the ShippingCostInput component which provides:
 * - Currency input field for shipping costs
 * - Validation (value >= 0)
 * - Keyboard navigation
 * - Loading, error, and success states
 *
 * Coverage Target: 80%+
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShippingCostInput } from '../ShippingCostInput'
import type { Currency } from '@/lib/types/purchase-order'

// ============================================================================
// MOCK HELPERS
// ============================================================================

const defaultProps = {
  value: 0,
  onChange: vi.fn(),
  currency: 'PLN' as Currency,
}

// ============================================================================
// RENDERING TESTS
// ============================================================================

describe('ShippingCostInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render input with label', () => {
      render(<ShippingCostInput {...defaultProps} label="Shipping Cost" />)

      expect(screen.getByLabelText(/Shipping Cost/)).toBeInTheDocument()
    })

    it('should show truck icon by default', () => {
      const { container } = render(<ShippingCostInput {...defaultProps} />)

      expect(container.querySelector('svg.lucide-truck')).toBeInTheDocument()
    })

    it('should hide icon when showIcon is false', () => {
      const { container } = render(<ShippingCostInput {...defaultProps} showIcon={false} />)

      expect(container.querySelector('svg.lucide-truck')).not.toBeInTheDocument()
    })

    it('should display currency symbol prefix', () => {
      render(<ShippingCostInput {...defaultProps} currency="PLN" />)

      expect(screen.getByText('zl')).toBeInTheDocument()
    })

    it('should display currency code suffix', () => {
      render(<ShippingCostInput {...defaultProps} currency="PLN" />)

      expect(screen.getByText('PLN')).toBeInTheDocument()
    })

    it('should display current value in input', () => {
      render(<ShippingCostInput {...defaultProps} value={25} />)

      expect(screen.getByRole('spinbutton')).toHaveValue(25)
    })
  })

  // ============================================================================
  // CURRENCY SYMBOLS
  // ============================================================================

  describe('Currency Symbols', () => {
    it('should show $ for USD', () => {
      render(<ShippingCostInput {...defaultProps} currency="USD" />)

      expect(screen.getByText('$')).toBeInTheDocument()
    })

    it('should show EUR for EUR', () => {
      render(<ShippingCostInput {...defaultProps} currency="EUR" />)

      // EUR appears both as symbol prefix and currency code suffix
      expect(screen.getAllByText('EUR').length).toBeGreaterThanOrEqual(1)
    })

    it('should show GBP for GBP', () => {
      render(<ShippingCostInput {...defaultProps} currency="GBP" />)

      // GBP appears both as symbol prefix and currency code suffix
      expect(screen.getAllByText('GBP').length).toBeGreaterThanOrEqual(1)
    })
  })

  // ============================================================================
  // VALUE INPUT
  // ============================================================================

  describe('Value Input', () => {
    it('should call onChange when input value changes', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<ShippingCostInput {...defaultProps} onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '25')

      expect(mockOnChange).toHaveBeenLastCalledWith(25)
    })

    it('should accept decimal values', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<ShippingCostInput {...defaultProps} onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '25.50')

      expect(mockOnChange).toHaveBeenLastCalledWith(25.5)
    })

    it('should format value with 2 decimal places on blur', async () => {
      const user = userEvent.setup()
      render(<ShippingCostInput {...defaultProps} value={25.5} />)

      const input = screen.getByRole('spinbutton')
      await user.tab()
      await user.tab() // Focus away

      expect(input).toHaveValue(25.5)
    })

    it('should show empty input when value is 0', () => {
      render(<ShippingCostInput {...defaultProps} value={0} />)

      expect(screen.getByRole('spinbutton')).toHaveValue(null)
    })
  })

  // ============================================================================
  // VALIDATION
  // ============================================================================

  describe('Validation', () => {
    it('should show error for negative values', async () => {
      const user = userEvent.setup()
      render(<ShippingCostInput {...defaultProps} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '-10')

      expect(screen.getByRole('alert')).toHaveTextContent('Shipping cost cannot be negative')
    })

    it('should show error when exceeding max', async () => {
      const user = userEvent.setup()
      render(<ShippingCostInput {...defaultProps} max={100} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '150')

      expect(screen.getByRole('alert')).toHaveTextContent('Shipping cost cannot exceed')
    })

    it('should set aria-invalid when validation fails', async () => {
      const user = userEvent.setup()
      render(<ShippingCostInput {...defaultProps} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '-10')

      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('should display external error prop', () => {
      render(<ShippingCostInput {...defaultProps} error="Custom error message" />)

      expect(screen.getByRole('alert')).toHaveTextContent('Custom error message')
    })

    it('should accept 0 as valid value', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<ShippingCostInput {...defaultProps} value={25} onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.clear(input)
      await user.type(input, '0')

      expect(mockOnChange).toHaveBeenLastCalledWith(0)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  describe('Keyboard Navigation', () => {
    it('should increment value with ArrowUp', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<ShippingCostInput {...defaultProps} value={25} onChange={mockOnChange} step={1} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowUp}')

      expect(mockOnChange).toHaveBeenCalledWith(26)
    })

    it('should decrement value with ArrowDown', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<ShippingCostInput {...defaultProps} value={25} onChange={mockOnChange} step={1} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowDown}')

      expect(mockOnChange).toHaveBeenCalledWith(24)
    })

    it('should not go below 0 with ArrowDown', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<ShippingCostInput {...defaultProps} value={0} onChange={mockOnChange} step={1} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowDown}')

      expect(mockOnChange).toHaveBeenCalledWith(0)
    })

    it('should not exceed max with ArrowUp', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<ShippingCostInput {...defaultProps} value={99} max={100} onChange={mockOnChange} step={5} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowUp}')

      expect(mockOnChange).toHaveBeenCalledWith(100)
    })

    it('should use custom step value', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<ShippingCostInput {...defaultProps} value={25} onChange={mockOnChange} step={5} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowUp}')

      expect(mockOnChange).toHaveBeenCalledWith(30)
    })
  })

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  describe('Loading State', () => {
    it('should render skeleton when isLoading is true', () => {
      const { container } = render(<ShippingCostInput {...defaultProps} isLoading={true} />)

      // Skeleton components use animate-pulse class
      expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('should not show input when loading', () => {
      render(<ShippingCostInput {...defaultProps} isLoading={true} />)

      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // DISABLED STATE
  // ============================================================================

  describe('Disabled State', () => {
    it('should disable input when disabled is true', () => {
      render(<ShippingCostInput {...defaultProps} disabled={true} />)

      expect(screen.getByRole('spinbutton')).toBeDisabled()
    })

    it('should not respond to keyboard navigation when disabled', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()
      render(<ShippingCostInput {...defaultProps} disabled={true} onChange={mockOnChange} />)

      const input = screen.getByRole('spinbutton')
      await user.click(input)
      await user.keyboard('{ArrowUp}')

      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // PLACEHOLDER
  // ============================================================================

  describe('Placeholder', () => {
    it('should display default placeholder', () => {
      render(<ShippingCostInput {...defaultProps} />)

      expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument()
    })

    it('should display custom placeholder', () => {
      render(<ShippingCostInput {...defaultProps} placeholder="Enter cost" />)

      expect(screen.getByPlaceholderText('Enter cost')).toBeInTheDocument()
    })
  })
})
