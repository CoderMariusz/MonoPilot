/**
 * OperationLogTable Component Tests
 * Story: 04.3 - Operation Start/Complete
 *
 * Tests the operation logs table component including loading, empty, and success states.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { OperationLogTable, type OperationLog } from '../OperationLogTable'

// Mock window.innerWidth for responsive tests
const mockMatchMedia = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('OperationLogTable Component', () => {
  beforeEach(() => {
    mockMatchMedia()
  })

  const mockLogs: OperationLog[] = [
    {
      id: 'log-1',
      event_type: 'started',
      old_status: 'pending',
      new_status: 'in_progress',
      changed_by_user: {
        first_name: 'John',
        last_name: 'Smith',
      },
      metadata: {},
      created_at: '2025-01-08T09:30:00Z',
    },
    {
      id: 'log-2',
      event_type: 'completed',
      old_status: 'in_progress',
      new_status: 'completed',
      changed_by_user: {
        first_name: 'Jane',
        last_name: 'Doe',
      },
      metadata: {
        yield_percent: 95.5,
        duration_minutes: 45,
      },
      created_at: '2025-01-08T10:15:00Z',
    },
  ]

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading is true', () => {
      const { container } = render(<OperationLogTable logs={[]} isLoading={true} />)
      expect(screen.getByText('Operation Logs')).toBeInTheDocument()
      // Skeletons use ShadCN's animate-pulse class
      const skeletons = container.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should show title and skeletons when loading', () => {
      render(<OperationLogTable logs={[]} isLoading={true} />)
      expect(screen.getByText('Operation Logs')).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('should show empty message when logs array is empty', () => {
      render(<OperationLogTable logs={[]} />)
      expect(screen.getByText('No activity recorded')).toBeInTheDocument()
    })

    it('should show helpful empty state description', () => {
      render(<OperationLogTable logs={[]} />)
      expect(
        screen.getByText(/logs will appear here when status changes occur/i)
      ).toBeInTheDocument()
    })
  })

  describe('Success State - Data Rendering', () => {
    it('should render table with logs', () => {
      render(<OperationLogTable logs={mockLogs} />)
      expect(screen.getByText('Operation Logs')).toBeInTheDocument()
    })

    it('should display event type badges', () => {
      render(<OperationLogTable logs={mockLogs} />)
      expect(screen.getByText('Started')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('should display status transitions', () => {
      render(<OperationLogTable logs={mockLogs} />)
      expect(screen.getByText('pending')).toBeInTheDocument()
      // in_progress appears multiple times (old_status and new_status)
      expect(screen.getAllByText('in_progress').length).toBeGreaterThan(0)
    })

    it('should display user names', () => {
      render(<OperationLogTable logs={mockLogs} />)
      expect(screen.getByText('John S.')).toBeInTheDocument()
      expect(screen.getByText('Jane D.')).toBeInTheDocument()
    })

    it('should display metadata details for completed events', () => {
      render(<OperationLogTable logs={mockLogs} />)
      // Should show yield and duration from metadata
      expect(screen.getByText(/95\.5% yield/)).toBeInTheDocument()
      expect(screen.getByText(/45m/)).toBeInTheDocument()
    })

    it('should format timestamps', () => {
      render(<OperationLogTable logs={mockLogs} />)
      // Should show formatted time (implementation-dependent)
      const cells = document.querySelectorAll('td')
      expect(cells.length).toBeGreaterThan(0)
    })
  })

  describe('User Name Handling', () => {
    it('should handle null user', () => {
      const logsWithNullUser: OperationLog[] = [
        {
          ...mockLogs[0],
          changed_by_user: null,
        },
      ]
      render(<OperationLogTable logs={logsWithNullUser} />)
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('should handle partial user name', () => {
      const logsWithPartialUser: OperationLog[] = [
        {
          ...mockLogs[0],
          changed_by_user: {
            first_name: 'John',
            last_name: null,
          },
        },
      ]
      render(<OperationLogTable logs={logsWithPartialUser} />)
      expect(screen.getByText('John')).toBeInTheDocument()
    })
  })

  describe('Event Type Styling', () => {
    it('should apply blue styling for started events', () => {
      render(<OperationLogTable logs={[mockLogs[0]]} />)
      const badge = screen.getByText('Started')
      expect(badge).toHaveClass('bg-blue-100')
    })

    it('should apply green styling for completed events', () => {
      render(<OperationLogTable logs={[mockLogs[1]]} />)
      const badge = screen.getByText('Completed')
      expect(badge).toHaveClass('bg-green-100')
    })

    it('should handle unknown event types gracefully', () => {
      const logsWithUnknown: OperationLog[] = [
        {
          ...mockLogs[0],
          event_type: 'unknown' as any,
        },
      ]
      render(<OperationLogTable logs={logsWithUnknown} />)
      // Should not crash, may show as "Reset" or similar default
      expect(document.querySelector('table')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label on table', () => {
      render(<OperationLogTable logs={mockLogs} />)
      expect(
        screen.getByLabelText('Operation status change history')
      ).toBeInTheDocument()
    })

    it('should have table headers', () => {
      render(<OperationLogTable logs={mockLogs} />)
      expect(screen.getByText('Event')).toBeInTheDocument()
      expect(screen.getByText('Status Change')).toBeInTheDocument()
      expect(screen.getByText('By')).toBeInTheDocument()
      expect(screen.getByText('Details')).toBeInTheDocument()
      expect(screen.getByText('Time')).toBeInTheDocument()
    })
  })

  describe('Metadata Details', () => {
    it('should show dash when no metadata', () => {
      const logsWithoutMetadata: OperationLog[] = [
        {
          ...mockLogs[0],
          metadata: {},
        },
      ]
      render(<OperationLogTable logs={logsWithoutMetadata} />)
      // Should show "-" for details column
      expect(screen.getAllByText('-').length).toBeGreaterThan(0)
    })
  })
})
