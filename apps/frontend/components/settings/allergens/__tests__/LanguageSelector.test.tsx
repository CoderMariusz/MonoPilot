/**
 * LanguageSelector Component Tests
 * Story: TD-208 - Language Selector for Allergen Names
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LanguageSelector, LanguageSelectorCompact } from '../LanguageSelector'

describe('LanguageSelector', () => {
  const defaultProps = {
    value: 'en' as const,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render with current value displayed', () => {
      render(<LanguageSelector {...defaultProps} />)

      expect(screen.getByTestId('language-selector')).toBeInTheDocument()
      expect(screen.getByText('EN')).toBeInTheDocument()
      expect(screen.getByText('English')).toBeInTheDocument()
    })

    it('should render with Polish selected', () => {
      render(<LanguageSelector {...defaultProps} value="pl" />)

      expect(screen.getByText('PL')).toBeInTheDocument()
      expect(screen.getByText('Polski')).toBeInTheDocument()
    })

    it('should render with German selected', () => {
      render(<LanguageSelector {...defaultProps} value="de" />)

      expect(screen.getByText('DE')).toBeInTheDocument()
      expect(screen.getByText('Deutsch')).toBeInTheDocument()
    })

    it('should render with French selected', () => {
      render(<LanguageSelector {...defaultProps} value="fr" />)

      expect(screen.getByText('FR')).toBeInTheDocument()
      expect(screen.getByText('Francais')).toBeInTheDocument()
    })

    it('should render globe icon', () => {
      render(<LanguageSelector {...defaultProps} />)

      // Globe icon should be present (lucide-react)
      const trigger = screen.getByTestId('language-selector')
      expect(trigger.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<LanguageSelector {...defaultProps} disabled={true} />)

      const trigger = screen.getByTestId('language-selector')
      expect(trigger).toBeDisabled()
    })

    it('should be disabled when loading', () => {
      render(<LanguageSelector {...defaultProps} isLoading={true} />)

      const trigger = screen.getByTestId('language-selector')
      expect(trigger).toBeDisabled()
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('should open dropdown on click', async () => {
      const user = userEvent.setup()
      render(<LanguageSelector {...defaultProps} />)

      const trigger = screen.getByTestId('language-selector')
      await user.click(trigger)

      // All language options should be visible
      expect(screen.getByTestId('language-option-en')).toBeInTheDocument()
      expect(screen.getByTestId('language-option-pl')).toBeInTheDocument()
      expect(screen.getByTestId('language-option-de')).toBeInTheDocument()
      expect(screen.getByTestId('language-option-fr')).toBeInTheDocument()
    })

    it('should call onChange when selecting a language', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<LanguageSelector {...defaultProps} onChange={onChange} />)

      const trigger = screen.getByTestId('language-selector')
      await user.click(trigger)

      const plOption = screen.getByTestId('language-option-pl')
      await user.click(plOption)

      expect(onChange).toHaveBeenCalledWith('pl')
    })

    it('should call onChange with correct language code', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<LanguageSelector {...defaultProps} onChange={onChange} />)

      const trigger = screen.getByTestId('language-selector')
      await user.click(trigger)

      const deOption = screen.getByTestId('language-option-de')
      await user.click(deOption)

      expect(onChange).toHaveBeenCalledWith('de')
    })
  })

  describe('accessibility', () => {
    it('should have aria-label', () => {
      render(<LanguageSelector {...defaultProps} />)

      const trigger = screen.getByTestId('language-selector')
      expect(trigger).toHaveAttribute('aria-label', 'Select language for allergen names')
    })

    it('should support custom aria-label', () => {
      render(<LanguageSelector {...defaultProps} aria-label="Choose language" />)

      const trigger = screen.getByTestId('language-selector')
      expect(trigger).toHaveAttribute('aria-label', 'Choose language')
    })
  })

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <LanguageSelector {...defaultProps} className="custom-class" />
      )

      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })
})

describe('LanguageSelectorCompact', () => {
  const defaultProps = {
    value: 'en' as const,
    onChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render compact version', () => {
    render(<LanguageSelectorCompact {...defaultProps} />)

    expect(screen.getByTestId('language-selector-compact')).toBeInTheDocument()
    expect(screen.getByText('EN')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<LanguageSelectorCompact {...defaultProps} isLoading={true} />)

    expect(screen.getByText('...')).toBeInTheDocument()
  })

  it('should call onChange when selecting', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<LanguageSelectorCompact {...defaultProps} onChange={onChange} />)

    const trigger = screen.getByTestId('language-selector-compact')
    await user.click(trigger)

    const frOption = screen.getByTestId('language-option-compact-fr')
    await user.click(frOption)

    expect(onChange).toHaveBeenCalledWith('fr')
  })
})
