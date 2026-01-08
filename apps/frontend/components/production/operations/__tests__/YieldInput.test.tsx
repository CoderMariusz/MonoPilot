/**
 * YieldInput Component Tests
 * Story: 04.3 - Operation Start/Complete
 *
 * Tests the yield input component with slider and number input.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YieldInput } from '../YieldInput'

describe('YieldInput Component', () => {
  describe('Rendering', () => {
    it('should render label', () => {
      render(<YieldInput value={95} onChange={() => {}} />)
      expect(screen.getByText(/Actual Yield/i)).toBeInTheDocument()
    })

    it('should render slider', () => {
      render(<YieldInput value={95} onChange={() => {}} />)
      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('should render number input', () => {
      render(<YieldInput value={95} onChange={() => {}} />)
      expect(screen.getByRole('spinbutton')).toBeInTheDocument()
    })

    it('should display current value', () => {
      render(<YieldInput value={95} onChange={() => {}} />)
      const input = screen.getByRole('spinbutton') as HTMLInputElement
      expect(input.value).toBe('95.0')
    })

    it('should display min and max labels', () => {
      render(<YieldInput value={50} onChange={() => {}} />)
      expect(screen.getByText('0%')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })

  describe('User Interaction - Number Input', () => {
    it('should call onChange when number input changes', async () => {
      const onChange = vi.fn()
      render(<YieldInput value={95} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      await userEvent.clear(input)
      await userEvent.type(input, '85')

      expect(onChange).toHaveBeenCalled()
    })

    it('should clamp value to max when exceeding', async () => {
      const onChange = vi.fn()
      render(<YieldInput value={95} onChange={onChange} max={100} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '150' } })

      // Should clamp to 100
      expect(onChange).toHaveBeenCalledWith(100)
    })

    it('should clamp value to min when below', async () => {
      const onChange = vi.fn()
      render(<YieldInput value={50} onChange={onChange} min={0} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '-10' } })

      // Should clamp to 0
      expect(onChange).toHaveBeenCalledWith(0)
    })

    it('should handle empty input', async () => {
      const onChange = vi.fn()
      render(<YieldInput value={95} onChange={onChange} />)

      const input = screen.getByRole('spinbutton')
      fireEvent.change(input, { target: { value: '' } })

      expect(onChange).toHaveBeenCalledWith(0)
    })
  })

  describe('User Interaction - Slider', () => {
    it('should have correct aria attributes on slider', () => {
      render(<YieldInput value={75} onChange={() => {}} min={0} max={100} />)

      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('aria-valuemin', '0')
      expect(slider).toHaveAttribute('aria-valuemax', '100')
      expect(slider).toHaveAttribute('aria-valuenow', '75')
    })
  })

  describe('Color Feedback', () => {
    it('should show Excellent for yield >= 95%', () => {
      render(<YieldInput value={95} onChange={() => {}} />)
      expect(screen.getByText('Excellent')).toBeInTheDocument()
    })

    it('should show Good for yield 85-94%', () => {
      render(<YieldInput value={90} onChange={() => {}} />)
      expect(screen.getByText('Good')).toBeInTheDocument()
    })

    it('should show Below Target for yield 70-84%', () => {
      render(<YieldInput value={75} onChange={() => {}} />)
      expect(screen.getByText('Below Target')).toBeInTheDocument()
    })

    it('should show Low Yield for yield < 70%', () => {
      render(<YieldInput value={60} onChange={() => {}} />)
      expect(screen.getByText('Low Yield')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error message', () => {
      render(
        <YieldInput
          value={150}
          onChange={() => {}}
          error="Yield must be between 0% and 100%"
        />
      )
      expect(
        screen.getByText('Yield must be between 0% and 100%')
      ).toBeInTheDocument()
    })

    it('should apply error styling to input', () => {
      render(
        <YieldInput
          value={150}
          onChange={() => {}}
          error="Invalid value"
        />
      )
      const input = screen.getByRole('spinbutton')
      expect(input).toHaveClass('border-destructive')
    })

    it('should have aria-describedby linking to error', () => {
      render(
        <YieldInput
          value={150}
          onChange={() => {}}
          error="Invalid value"
        />
      )
      const slider = screen.getByRole('slider')
      expect(slider).toHaveAttribute('aria-describedby')
    })
  })

  describe('Disabled State', () => {
    it('should disable both inputs when disabled', () => {
      render(<YieldInput value={95} onChange={() => {}} disabled />)

      expect(screen.getByRole('spinbutton')).toBeDisabled()
    })
  })

  describe('Custom Props', () => {
    it('should respect custom min/max', () => {
      render(
        <YieldInput value={50} onChange={() => {}} min={10} max={90} />
      )
      expect(screen.getByText('10%')).toBeInTheDocument()
      expect(screen.getByText('90%')).toBeInTheDocument()
    })

    it('should use custom label', () => {
      render(
        <YieldInput
          value={95}
          onChange={() => {}}
          label="Custom Yield Label"
        />
      )
      expect(screen.getByText(/Custom Yield Label/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have screen reader description', () => {
      render(<YieldInput value={95} onChange={() => {}} />)
      expect(
        screen.getByText(/Enter yield percentage/i, { selector: '.sr-only' })
      ).toBeInTheDocument()
    })

    it('should have linked label for slider', () => {
      render(<YieldInput value={95} onChange={() => {}} />)
      const label = screen.getByText(/Actual Yield/i)
      expect(label).toHaveAttribute('for')
    })
  })
})
