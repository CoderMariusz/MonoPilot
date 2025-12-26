/**
 * Component Tests: ModuleCard (TD-104)
 * Story: TD-104 - Module Grouping and Dependencies
 *
 * Tests the ModuleCard component for:
 * - Display: module name, description, epic badge
 * - Toggle: enabled/disabled state, switch interaction
 * - Dependencies: "Requires" and "Required for" indicators
 * - Pricing: pricing badge, upgrade button for premium
 * - Coming Soon: badge display, disabled toggle
 * - Accessibility: proper ARIA labels
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ModuleCard } from '../ModuleCard'
import type { Module } from '@/lib/config/modules'

const mockCoreModule: Module = {
  code: 'technical',
  name: 'Technical',
  description: 'Products, BOMs, Routings',
  defaultEnabled: true,
  epic: 2,
  group: 'core',
  pricing: 'Free',
  dependencies: ['settings'],
  required_for: ['planning', 'npd'],
}

const mockPremiumModule: Module = {
  code: 'npd',
  name: 'NPD',
  description: 'Formulation, Stage-Gate',
  defaultEnabled: false,
  epic: 8,
  group: 'premium',
  pricing: '$50/user/mo',
  dependencies: ['technical'],
}

const mockComingSoonModule: Module = {
  code: 'oee',
  name: 'OEE',
  description: 'Equipment Effectiveness',
  defaultEnabled: false,
  epic: 10,
  group: 'new',
  pricing: 'TBD',
  status: 'coming_soon',
}

describe('ModuleCard - Display', () => {
  const mockOnToggle = vi.fn()

  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  it('should display module name and description', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Technical')).toBeInTheDocument()
    expect(screen.getByText('Products, BOMs, Routings')).toBeInTheDocument()
  })

  it('should display epic badge when epic is defined', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Epic 2')).toBeInTheDocument()
  })

  it('should display recommended badge for default enabled modules', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Recommended')).toBeInTheDocument()
  })

  it('should display enabled badge when module is enabled', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={true}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Enabled')).toBeInTheDocument()
  })
})

describe('ModuleCard - Toggle', () => {
  const mockOnToggle = vi.fn()

  beforeEach(() => {
    mockOnToggle.mockClear()
  })

  it('should call onToggle when switch is clicked', async () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
      />
    )

    const toggle = screen.getByRole('switch')
    await userEvent.click(toggle)

    expect(mockOnToggle).toHaveBeenCalledWith(mockCoreModule, true)
  })

  it('should disable toggle when disabled prop is true', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        disabled={true}
        onToggle={mockOnToggle}
      />
    )

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
  })
})

describe('ModuleCard - Dependencies', () => {
  const mockOnToggle = vi.fn()

  it('should display "Requires" when module has dependencies', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
        showDependencies={true}
      />
    )

    expect(screen.getByText(/requires:/i)).toBeInTheDocument()
    expect(screen.getByText(/settings/i)).toBeInTheDocument()
  })

  it('should display "Required for" when module is required by others', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
        showDependencies={true}
      />
    )

    expect(screen.getByText(/required for:/i)).toBeInTheDocument()
    expect(screen.getByText(/planning, npd/i)).toBeInTheDocument()
  })

  it('should hide dependencies when showDependencies is false', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
        showDependencies={false}
      />
    )

    expect(screen.queryByText(/requires:/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/required for:/i)).not.toBeInTheDocument()
  })
})

describe('ModuleCard - Pricing', () => {
  const mockOnToggle = vi.fn()

  it('should display "Free" pricing badge for core modules', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
        showPricing={true}
      />
    )

    expect(screen.getByText('Free')).toBeInTheDocument()
  })

  it('should display pricing badge for premium modules', () => {
    render(
      <ModuleCard
        module={mockPremiumModule}
        enabled={false}
        onToggle={mockOnToggle}
        showPricing={true}
      />
    )

    expect(screen.getByText('$50/user/mo')).toBeInTheDocument()
  })

  it('should display upgrade button for disabled premium modules', () => {
    render(
      <ModuleCard
        module={mockPremiumModule}
        enabled={false}
        onToggle={mockOnToggle}
        showPricing={true}
      />
    )

    expect(screen.getByText('UPGRADE')).toBeInTheDocument()
  })

  it('should NOT display upgrade button for enabled premium modules', () => {
    render(
      <ModuleCard
        module={mockPremiumModule}
        enabled={true}
        onToggle={mockOnToggle}
        showPricing={true}
      />
    )

    expect(screen.queryByText('UPGRADE')).not.toBeInTheDocument()
  })
})

describe('ModuleCard - Coming Soon', () => {
  const mockOnToggle = vi.fn()

  it('should display coming soon badge', () => {
    render(
      <ModuleCard
        module={mockComingSoonModule}
        enabled={false}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
  })

  it('should disable toggle for coming soon modules', () => {
    render(
      <ModuleCard
        module={mockComingSoonModule}
        enabled={false}
        onToggle={mockOnToggle}
      />
    )

    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
  })

  it('should display TBD pricing for coming soon modules', () => {
    render(
      <ModuleCard
        module={mockComingSoonModule}
        enabled={false}
        onToggle={mockOnToggle}
        showPricing={true}
      />
    )

    expect(screen.getByText('TBD')).toBeInTheDocument()
  })
})

describe('ModuleCard - Accessibility', () => {
  const mockOnToggle = vi.fn()

  it('should have proper aria-label on toggle', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
      />
    )

    const toggle = screen.getByRole('switch')
    expect(toggle).toHaveAttribute('aria-label', 'Toggle Technical module')
  })

  it('should have testid for card', () => {
    render(
      <ModuleCard
        module={mockCoreModule}
        enabled={false}
        onToggle={mockOnToggle}
      />
    )

    expect(screen.getByTestId('module-card-technical')).toBeInTheDocument()
  })
})
