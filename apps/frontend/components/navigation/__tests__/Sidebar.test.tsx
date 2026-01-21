/**
 * Sidebar Component Tests
 * Tests navigation sidebar rendering and module visibility
 *
 * Covers:
 * - Scanner module visibility based on warehouse enabled status
 * - Module filtering based on enabledModules prop
 * - Scanner link routing
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '../Sidebar'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

describe('Sidebar - Scanner Module Visibility', () => {
  it('should show scanner when warehouse is enabled', () => {
    // GIVEN warehouse is in enabled modules
    render(<Sidebar enabledModules={['warehouse']} />)

    // THEN scanner should be visible
    expect(screen.getByText('Scanner')).toBeInTheDocument()
  })

  it('should hide scanner when warehouse is disabled', () => {
    // GIVEN warehouse is NOT in enabled modules
    render(<Sidebar enabledModules={['technical', 'planning']} />)

    // THEN scanner should NOT be visible
    expect(screen.queryByText('Scanner')).not.toBeInTheDocument()
  })

  it('should show scanner when warehouse is enabled along with other modules', () => {
    // GIVEN warehouse and other modules are enabled
    render(
      <Sidebar
        enabledModules={['technical', 'warehouse', 'production', 'quality']}
      />
    )

    // THEN scanner should be visible
    expect(screen.getByText('Scanner')).toBeInTheDocument()
    // AND warehouse should also be visible
    expect(screen.getByText('Warehouse')).toBeInTheDocument()
  })

  it('should hide scanner when no modules are enabled', () => {
    // GIVEN no modules enabled
    render(<Sidebar enabledModules={[]} />)

    // THEN scanner should NOT be visible
    expect(screen.queryByText('Scanner')).not.toBeInTheDocument()
    // BUT settings should still be visible (always shown)
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })
})

describe('Sidebar - Scanner Link Routing', () => {
  it('should render scanner link with correct href', () => {
    // GIVEN warehouse is enabled (scanner depends on it)
    render(<Sidebar enabledModules={['warehouse']} />)

    // WHEN finding the scanner link
    const scannerLink = screen.getByRole('link', { name: /scanner/i })

    // THEN it should have the correct href
    expect(scannerLink).toHaveAttribute('href', '/scanner')
  })

  it('should render scanner with teal color icon', () => {
    // GIVEN warehouse is enabled
    render(<Sidebar enabledModules={['warehouse']} />)

    // WHEN finding the scanner link
    const scannerLink = screen.getByRole('link', { name: /scanner/i })

    // THEN it should contain an icon with teal color class
    const icon = scannerLink.querySelector('svg')
    expect(icon).toHaveClass('text-teal-600')
  })
})

describe('Sidebar - Module Order', () => {
  it('should display scanner after warehouse in the menu', () => {
    // GIVEN all modules enabled
    render(
      <Sidebar
        enabledModules={[
          'settings',
          'technical',
          'planning',
          'production',
          'warehouse',
          'quality',
          'shipping',
          'npd',
        ]}
      />
    )

    // WHEN getting all navigation links
    const links = screen.getAllByRole('link')
    const linkTexts = links.map((link) => link.textContent)

    // THEN scanner should appear after warehouse
    const warehouseIndex = linkTexts.indexOf('Warehouse')
    const scannerIndex = linkTexts.indexOf('Scanner')

    expect(scannerIndex).toBeGreaterThan(warehouseIndex)
    expect(scannerIndex).toBe(warehouseIndex + 1)
  })

  it('should display scanner before quality in the menu', () => {
    // GIVEN warehouse and quality are enabled
    render(<Sidebar enabledModules={['warehouse', 'quality']} />)

    // WHEN getting all navigation links
    const links = screen.getAllByRole('link')
    const linkTexts = links.map((link) => link.textContent)

    // THEN scanner should appear before quality
    const scannerIndex = linkTexts.indexOf('Scanner')
    const qualityIndex = linkTexts.indexOf('Quality')

    expect(scannerIndex).toBeLessThan(qualityIndex)
  })
})

describe('Sidebar - Settings Always Visible', () => {
  it('should always show settings regardless of enabledModules', () => {
    // GIVEN empty enabledModules
    render(<Sidebar enabledModules={[]} />)

    // THEN settings should still be visible
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('should show settings along with scanner when warehouse enabled', () => {
    // GIVEN warehouse enabled
    render(<Sidebar enabledModules={['warehouse']} />)

    // THEN both settings and scanner should be visible
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('Scanner')).toBeInTheDocument()
  })
})
