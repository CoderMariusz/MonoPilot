/**
 * Story 01.3: SetupInProgressMessage - Component Tests (TD-102)
 * Epic: 01-settings
 * Type: Unit Tests - React Component
 *
 * Tests the SetupInProgressMessage component.
 * Covers rendering, accessibility, and styling.
 *
 * Coverage Target: 85%
 *
 * Related Wireframes:
 * - SET-001: Onboarding Wizard Launcher
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SetupInProgressMessage } from '../SetupInProgressMessage'

describe('Story 01.3: SetupInProgressMessage Component', () => {
  describe('Component Rendering', () => {
    it('should render alert component', () => {
      render(<SetupInProgressMessage />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should display title text', () => {
      render(<SetupInProgressMessage />)

      expect(
        screen.getByText('Organization Setup in Progress')
      ).toBeInTheDocument()
    })

    it('should display description text', () => {
      render(<SetupInProgressMessage />)

      expect(
        screen.getByText(
          /your administrator is currently setting up the organization/i
        )
      ).toBeInTheDocument()
    })

    it('should mention limited features', () => {
      render(<SetupInProgressMessage />)

      expect(
        screen.getByText(/some features may be limited until setup is complete/i)
      ).toBeInTheDocument()
    })

    it('should render info icon', () => {
      render(<SetupInProgressMessage />)

      const alert = screen.getByRole('alert')
      // Info icon should be hidden from screen readers
      const icon = alert.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Custom Styling', () => {
    it('should accept custom className', () => {
      render(<SetupInProgressMessage className="custom-class" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('custom-class')
    })

    it('should merge custom className with default classes', () => {
      render(<SetupInProgressMessage className="my-4" />)

      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('my-4')
      // Should also have default alert classes
      expect(alert).toHaveClass('relative')
    })
  })

  describe('Accessibility', () => {
    it('should have alert role for screen readers', () => {
      render(<SetupInProgressMessage />)

      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have proper heading structure', () => {
      render(<SetupInProgressMessage />)

      // AlertTitle uses h5 element
      const title = screen.getByText('Organization Setup in Progress')
      expect(title.tagName).toBe('H5')
    })

    it('should hide decorative icon from screen readers', () => {
      render(<SetupInProgressMessage />)

      const alert = screen.getByRole('alert')
      const icon = alert.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Content Structure', () => {
    it('should render title before description', () => {
      render(<SetupInProgressMessage />)

      const alert = screen.getByRole('alert')
      const children = alert.children

      // Find title and description elements
      const titleElement = screen.getByText('Organization Setup in Progress')
      const descElement = screen.getByText(
        /your administrator is currently setting up/i
      )

      // Title should come before description in DOM order
      const titleIndex = Array.from(children).findIndex(
        (child) => child === titleElement || child.contains(titleElement)
      )
      const descIndex = Array.from(children).findIndex(
        (child) => child === descElement || child.contains(descElement)
      )

      expect(titleIndex).toBeLessThan(descIndex)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * - Component Rendering: 5 tests
 * - Custom Styling: 2 tests
 * - Accessibility: 3 tests
 * - Content Structure: 1 test
 *
 * Total: 11 test cases
 * Expected Coverage: 90%+
 */
