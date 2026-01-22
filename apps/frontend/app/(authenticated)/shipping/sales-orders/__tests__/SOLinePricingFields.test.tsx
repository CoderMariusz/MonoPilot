/**
 * Component Tests: SOLinePricingFields
 * Story: 07.4 - SO Line Pricing
 * Phase: RED - Tests will fail until component implementation exists
 *
 * Tests SO line pricing UI components:
 * - Auto-populate price on product select
 * - Real-time line total calculation
 * - Discount input validation
 * - SO total display
 *
 * Coverage:
 * - AC1: Auto-populate unit_price from product master
 * - AC8: Validate positive unit_price
 * - AC9: Validate non-negative discount
 * - AC10: Validate percentage discount <= 100%
 * - AC11: Handle products without std_price
 * - AC12: Real-time total display in SO form
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SOLineForm } from '../components/SOLineForm'
import { SOLineTable } from '../components/SOLineTable'
import { SOTotalDisplay } from '../components/SOTotalDisplay'
import { DiscountInput } from '../components/DiscountInput'

// Mock fetch for API calls
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock product data
const mockProducts = [
  { id: 'prod-juice-box', name: 'Juice Box', std_price: 5.5 },
  { id: 'prod-milk-box', name: 'Milk Box', std_price: 8.0 },
  { id: 'prod-no-price', name: 'Product Without Price', std_price: null },
]

describe('SOLineForm Component', () => {
  const defaultProps = {
    salesOrderId: 'so-001',
    onLineChange: vi.fn(),
    onLineSave: vi.fn(),
    products: mockProducts,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockProducts[0] }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('AC1: Auto-populate price on product select', () => {
    it('should auto-populate unit_price when product is selected', async () => {
      const user = userEvent.setup()
      render(<SOLineForm {...defaultProps} />)

      // Select product from dropdown
      await user.click(screen.getByRole('combobox', { name: /product/i }))
      await user.click(screen.getByRole('option', { name: 'Juice Box' }))

      // Verify unit_price field populated with std_price
      await waitFor(() => {
        const priceInput = screen.getByLabelText(/unit price/i)
        expect(priceInput).toHaveValue(5.5)
      })
    })

    it('should keep unit_price field editable after auto-population', async () => {
      const user = userEvent.setup()
      render(<SOLineForm {...defaultProps} />)

      // Select product
      await user.click(screen.getByRole('combobox', { name: /product/i }))
      await user.click(screen.getByRole('option', { name: 'Juice Box' }))

      // Wait for auto-populate
      await waitFor(() => {
        expect(screen.getByLabelText(/unit price/i)).toHaveValue(5.5)
      })

      // Manually override
      const priceInput = screen.getByLabelText(/unit price/i)
      await user.clear(priceInput)
      await user.type(priceInput, '6.00')

      expect(priceInput).toHaveValue(6.0)
    })
  })

  describe('AC11: Handle products without std_price', () => {
    it('should show warning when product has no standard price', async () => {
      const user = userEvent.setup()
      render(<SOLineForm {...defaultProps} />)

      // Select product without price
      await user.click(screen.getByRole('combobox', { name: /product/i }))
      await user.click(screen.getByRole('option', { name: 'Product Without Price' }))

      // Verify warning message
      await waitFor(() => {
        expect(
          screen.getByText(/product has no standard price/i)
        ).toBeInTheDocument()
      })
    })

    it('should default unit_price to 0 when product has no std_price', async () => {
      const user = userEvent.setup()
      render(<SOLineForm {...defaultProps} />)

      // Select product without price
      await user.click(screen.getByRole('combobox', { name: /product/i }))
      await user.click(screen.getByRole('option', { name: 'Product Without Price' }))

      await waitFor(() => {
        const priceInput = screen.getByLabelText(/unit price/i)
        expect(priceInput).toHaveValue(0)
      })
    })

    it('should allow manual entry when product has no price', async () => {
      const user = userEvent.setup()
      render(<SOLineForm {...defaultProps} />)

      // Select product without price
      await user.click(screen.getByRole('combobox', { name: /product/i }))
      await user.click(screen.getByRole('option', { name: 'Product Without Price' }))

      // Enter manual price
      const priceInput = screen.getByLabelText(/unit price/i)
      await user.clear(priceInput)
      await user.type(priceInput, '15.00')

      expect(priceInput).toHaveValue(15.0)
    })
  })

  describe('AC12: Real-time line total calculation', () => {
    it('should calculate line total as quantity * unit_price', async () => {
      const user = userEvent.setup()
      render(<SOLineForm {...defaultProps} />)

      // Enter quantity
      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.type(qtyInput, '100')

      // Enter unit price
      const priceInput = screen.getByLabelText(/unit price/i)
      await user.type(priceInput, '12.50')

      // Verify line total display
      await waitFor(() => {
        expect(screen.getByText('$1,250.00')).toBeInTheDocument()
      })
    })

    it('should update line total in real-time as user types', async () => {
      const user = userEvent.setup()
      render(<SOLineForm {...defaultProps} />)

      const qtyInput = screen.getByLabelText(/quantity/i)
      const priceInput = screen.getByLabelText(/unit price/i)

      // Initial entry
      await user.type(qtyInput, '10')
      await user.type(priceInput, '10.00')

      await waitFor(() => {
        expect(screen.getByText('$100.00')).toBeInTheDocument()
      })

      // Update quantity
      await user.clear(qtyInput)
      await user.type(qtyInput, '20')

      await waitFor(() => {
        expect(screen.getByText('$200.00')).toBeInTheDocument()
      })
    })

    it('should call onLineChange callback with calculated total', async () => {
      const user = userEvent.setup()
      const onLineChange = vi.fn()
      render(<SOLineForm {...defaultProps} onLineChange={onLineChange} />)

      const qtyInput = screen.getByLabelText(/quantity/i)
      const priceInput = screen.getByLabelText(/unit price/i)

      await user.type(qtyInput, '50')
      await user.type(priceInput, '20.00')

      await waitFor(() => {
        expect(onLineChange).toHaveBeenCalledWith(
          expect.objectContaining({
            line_total: 1000.0,
          })
        )
      })
    })
  })

  describe('Real-time calculation with discount', () => {
    it('should update line total when discount is applied', async () => {
      const user = userEvent.setup()
      render(<SOLineForm {...defaultProps} />)

      // Set quantity and price
      const qtyInput = screen.getByLabelText(/quantity/i)
      const priceInput = screen.getByLabelText(/unit price/i)
      await user.type(qtyInput, '50')
      await user.type(priceInput, '20.00')

      // Apply 10% discount
      await user.click(screen.getByRole('combobox', { name: /discount type/i }))
      await user.click(screen.getByRole('option', { name: 'Percentage' }))

      const discountInput = screen.getByLabelText(/discount value/i)
      await user.type(discountInput, '10')

      // Verify: 50 * 20.00 = 1000, 10% off = 900
      await waitFor(() => {
        expect(screen.getByText('$900.00')).toBeInTheDocument()
      })
    })
  })
})

describe('DiscountInput Component', () => {
  const defaultProps = {
    value: null,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC9: Validate non-negative discount', () => {
    it('should show error when discount value is negative', async () => {
      const user = userEvent.setup()
      render(<DiscountInput {...defaultProps} />)

      // Select percent type
      await user.click(screen.getByRole('combobox', { name: /discount type/i }))
      await user.click(screen.getByRole('option', { name: 'Percentage' }))

      // Enter negative value using fireEvent (userEvent.type doesn't handle negative numbers well)
      const input = screen.getByLabelText(/discount value/i)
      fireEvent.change(input, { target: { value: '-10' } })

      await waitFor(() => {
        expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC10: Validate percentage discount <= 100%', () => {
    it('should show error when percentage discount exceeds 100', async () => {
      const user = userEvent.setup()
      render(<DiscountInput {...defaultProps} />)

      // Select percent type
      await user.click(screen.getByRole('combobox', { name: /discount type/i }))
      await user.click(screen.getByRole('option', { name: 'Percentage' }))

      // Enter value > 100
      const input = screen.getByLabelText(/discount value/i)
      await user.type(input, '150')

      await waitFor(() => {
        expect(
          screen.getByText(/cannot exceed 100%/i)
        ).toBeInTheDocument()
      })
    })

    it('should accept percentage discount of exactly 100', async () => {
      const user = userEvent.setup()
      render(<DiscountInput {...defaultProps} />)

      await user.click(screen.getByRole('combobox', { name: /discount type/i }))
      await user.click(screen.getByRole('option', { name: 'Percentage' }))

      const input = screen.getByLabelText(/discount value/i)
      await user.type(input, '100')

      await waitFor(() => {
        expect(
          screen.queryByText(/cannot exceed 100%/i)
        ).not.toBeInTheDocument()
      })
    })

    it('should NOT apply 100% cap to fixed discount', async () => {
      const user = userEvent.setup()
      render(<DiscountInput {...defaultProps} />)

      await user.click(screen.getByRole('combobox', { name: /discount type/i }))
      await user.click(screen.getByRole('option', { name: 'Fixed Amount' }))

      const input = screen.getByLabelText(/discount value/i)
      await user.type(input, '500')

      // Should NOT show error for fixed discount > 100
      await waitFor(() => {
        expect(
          screen.queryByText(/cannot exceed 100%/i)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Input Behavior', () => {
    it('should call onChange with discount object', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<DiscountInput {...defaultProps} onChange={onChange} />)

      await user.click(screen.getByRole('combobox', { name: /discount type/i }))
      await user.click(screen.getByRole('option', { name: 'Percentage' }))

      const input = screen.getByLabelText(/discount value/i)
      await user.type(input, '15')

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith({ type: 'percent', value: 15 })
      })
    })

    it('should clear discount when type set to None', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <DiscountInput
          {...defaultProps}
          value={{ type: 'percent', value: 10 }}
          onChange={onChange}
        />
      )

      await user.click(screen.getByRole('combobox', { name: /discount type/i }))
      await user.click(screen.getByRole('option', { name: 'None' }))

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(null)
      })
    })
  })
})

describe('SOLineTable Component', () => {
  const mockLines = [
    {
      id: 'line-1',
      product: { name: 'Juice Box' },
      quantity_ordered: 100,
      unit_price: 5.5,
      discount: null,
      line_total: 550.0,
    },
    {
      id: 'line-2',
      product: { name: 'Milk Box' },
      quantity_ordered: 50,
      unit_price: 8.0,
      discount: { type: 'percent', value: 10 },
      line_total: 360.0,
    },
    {
      id: 'line-3',
      product: { name: 'Water Bottle' },
      quantity_ordered: 25,
      unit_price: 2.0,
      discount: { type: 'fixed', value: 5.0 },
      line_total: 45.0,
    },
  ]

  it('should render pricing columns', () => {
    render(<SOLineTable lines={mockLines} onEdit={vi.fn()} onDelete={vi.fn()} />)

    // Verify column headers exist
    expect(screen.getByText('Unit Price')).toBeInTheDocument()
    expect(screen.getByText('Discount')).toBeInTheDocument()
    expect(screen.getByText('Line Total')).toBeInTheDocument()
  })

  it('should format currency values correctly', () => {
    render(<SOLineTable lines={mockLines} onEdit={vi.fn()} onDelete={vi.fn()} />)

    // Check formatted values
    expect(screen.getByText('$5.50')).toBeInTheDocument()
    expect(screen.getByText('$8.00')).toBeInTheDocument()
    expect(screen.getByText('$550.00')).toBeInTheDocument()
    expect(screen.getByText('$360.00')).toBeInTheDocument()
  })

  it('should display discount type and value', () => {
    render(<SOLineTable lines={mockLines} onEdit={vi.fn()} onDelete={vi.fn()} />)

    // Verify discount display
    expect(screen.getByText('10%')).toBeInTheDocument()
    expect(screen.getByText('$5.00')).toBeInTheDocument()
  })

  it('should show dash for lines without discount', () => {
    render(<SOLineTable lines={mockLines} onEdit={vi.fn()} onDelete={vi.fn()} />)

    // Line 1 has no discount - should show dash or empty
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThan(1) // Header + data rows
  })
})

describe('SOTotalDisplay Component', () => {
  it('should display calculated total from lines', () => {
    const lines = [
      { line_total: 500.0 },
      { line_total: 750.0 },
      { line_total: 250.0 },
    ]

    render(<SOTotalDisplay lines={lines} />)

    expect(screen.getByText('Order Total:')).toBeInTheDocument()
    expect(screen.getByText('$1,500.00')).toBeInTheDocument()
  })

  it('should format total with currency symbol', () => {
    const lines = [{ line_total: 999.99 }]

    render(<SOTotalDisplay lines={lines} />)

    expect(screen.getByText('$999.99')).toBeInTheDocument()
  })

  it('should handle empty lines array', () => {
    render(<SOTotalDisplay lines={[]} />)

    expect(screen.getByText('$0.00')).toBeInTheDocument()
  })

  it('should handle null line_total values', () => {
    const lines = [{ line_total: 500.0 }, { line_total: null }, { line_total: 250.0 }]

    render(<SOTotalDisplay lines={lines} />)

    expect(screen.getByText('$750.00')).toBeInTheDocument()
  })

  it('should update when lines change', async () => {
    const { rerender } = render(
      <SOTotalDisplay lines={[{ line_total: 100.0 }]} />
    )

    expect(screen.getByText('$100.00')).toBeInTheDocument()

    rerender(
      <SOTotalDisplay lines={[{ line_total: 100.0 }, { line_total: 200.0 }]} />
    )

    expect(screen.getByText('$300.00')).toBeInTheDocument()
  })

  it('should be prominently displayed', () => {
    const lines = [{ line_total: 1500.0 }]

    render(<SOTotalDisplay lines={lines} />)

    const totalElement = screen.getByText('$1,500.00')
    // Should have prominent styling (font-bold, text-lg, etc.)
    expect(totalElement).toHaveClass('font-bold')
  })
})

describe('AC8: Validate positive unit_price in form', () => {
  const defaultProps = {
    salesOrderId: 'so-001',
    onLineChange: vi.fn(),
    onLineSave: vi.fn(),
    products: mockProducts,
  }

  it('should show error when unit_price is 0', async () => {
    const user = userEvent.setup()
    render(<SOLineForm {...defaultProps} />)

    const priceInput = screen.getByLabelText(/unit price/i)
    await user.type(priceInput, '0')

    // Trigger validation (e.g., by blurring or trying to save)
    await user.tab()

    await waitFor(() => {
      expect(
        screen.getByText(/must be greater than zero/i)
      ).toBeInTheDocument()
    })
  })

  it('should show error when unit_price is negative', async () => {
    const user = userEvent.setup()
    render(<SOLineForm {...defaultProps} />)

    const priceInput = screen.getByLabelText(/unit price/i) as HTMLInputElement
    // Use fireEvent to directly set negative value (userEvent.type may not work for negative numbers)
    await user.clear(priceInput)
    // Fire a change event with negative value
    priceInput.value = '-5'
    priceInput.dispatchEvent(new Event('input', { bubbles: true }))
    priceInput.dispatchEvent(new Event('change', { bubbles: true }))
    priceInput.dispatchEvent(new Event('blur', { bubbles: true }))

    await waitFor(() => {
      expect(
        screen.getByText(/must be greater than zero/i)
      ).toBeInTheDocument()
    })
  })

  it('should disable save button when validation fails', async () => {
    const user = userEvent.setup()
    render(<SOLineForm {...defaultProps} />)

    // Enter invalid price
    const priceInput = screen.getByLabelText(/unit price/i)
    await user.type(priceInput, '0')

    // Save button should be disabled
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeDisabled()
  })
})

describe('Form Save Behavior', () => {
  const defaultProps = {
    salesOrderId: 'so-001',
    onLineChange: vi.fn(),
    onLineSave: vi.fn(),
    products: mockProducts,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { id: 'line-new', line_total: 550.0 },
        }),
    })
  })

  it('should call onLineSave with form data on save', async () => {
    const user = userEvent.setup()
    const onLineSave = vi.fn()
    render(<SOLineForm {...defaultProps} onLineSave={onLineSave} />)

    // Select product
    await user.click(screen.getByRole('combobox', { name: /product/i }))
    await user.click(screen.getByRole('option', { name: 'Juice Box' }))

    // Enter quantity
    const qtyInput = screen.getByLabelText(/quantity/i)
    await user.type(qtyInput, '100')

    // Save
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(onLineSave).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: 'prod-juice-box',
          quantity_ordered: 100,
          unit_price: 5.5,
        })
      )
    })
  })

  it('should show loading state while saving', async () => {
    const user = userEvent.setup()
    let resolvePromise: (value: unknown) => void
    const savePromise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    const onLineSave = vi.fn(() => savePromise)

    render(<SOLineForm {...defaultProps} onLineSave={onLineSave} />)

    await user.click(screen.getByRole('combobox', { name: /product/i }))
    await user.click(screen.getByRole('option', { name: 'Juice Box' }))

    const qtyInput = screen.getByLabelText(/quantity/i)
    await user.type(qtyInput, '100')

    await user.click(screen.getByRole('button', { name: /save/i }))

    expect(screen.getByText(/saving/i)).toBeInTheDocument()

    // Resolve the promise to clean up
    resolvePromise!(undefined)
  })
})
