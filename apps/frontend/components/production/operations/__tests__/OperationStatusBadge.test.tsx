/**
 * OperationStatusBadge Component Tests
 * Story: 04.3 - Operation Start/Complete
 *
 * Tests the status badge component for proper rendering and accessibility.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OperationStatusBadge } from '../OperationStatusBadge'

describe('OperationStatusBadge Component', () => {
  describe('Status Rendering', () => {
    it('should render pending status with correct label', () => {
      render(<OperationStatusBadge status="pending" />)
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should render in_progress status with correct label', () => {
      render(<OperationStatusBadge status="in_progress" />)
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should render completed status with correct label', () => {
      render(<OperationStatusBadge status="completed" />)
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('should render skipped status with correct label', () => {
      render(<OperationStatusBadge status="skipped" />)
      expect(screen.getByText('Skipped')).toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('should render small size', () => {
      render(<OperationStatusBadge status="pending" size="sm" />)
      const badge = screen.getByText('Pending').closest('div')
      expect(badge).toHaveClass('text-xs')
    })

    it('should render medium size (default)', () => {
      render(<OperationStatusBadge status="pending" />)
      const badge = screen.getByText('Pending').closest('div')
      expect(badge).toHaveClass('text-sm')
    })

    it('should render large size', () => {
      render(<OperationStatusBadge status="pending" size="lg" />)
      const badge = screen.getByText('Pending').closest('div')
      expect(badge).toHaveClass('text-base')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label with status', () => {
      render(<OperationStatusBadge status="completed" />)
      expect(screen.getByLabelText('Status: Completed')).toBeInTheDocument()
    })

    it('should include icon with aria-hidden', () => {
      render(<OperationStatusBadge status="in_progress" />)
      const icon = document.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Color Coding', () => {
    it('should apply gray colors for pending', () => {
      render(<OperationStatusBadge status="pending" />)
      const badge = screen.getByLabelText('Status: Pending')
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-700')
    })

    it('should apply blue colors for in_progress', () => {
      render(<OperationStatusBadge status="in_progress" />)
      const badge = screen.getByLabelText('Status: In Progress')
      expect(badge).toHaveClass('bg-blue-100')
      expect(badge).toHaveClass('text-blue-800')
    })

    it('should apply green colors for completed', () => {
      render(<OperationStatusBadge status="completed" />)
      const badge = screen.getByLabelText('Status: Completed')
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-800')
    })

    it('should apply orange colors for skipped', () => {
      render(<OperationStatusBadge status="skipped" />)
      const badge = screen.getByLabelText('Status: Skipped')
      expect(badge).toHaveClass('bg-orange-100')
      expect(badge).toHaveClass('text-orange-800')
    })
  })
})
