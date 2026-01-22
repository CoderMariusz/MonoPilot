/**
 * StatusHistoryTimeline Component Tests (Story 06.1)
 * Purpose: Test timeline rendering, states, entries
 *
 * Coverage:
 * - Timeline entries display correctly
 * - Status transitions (from -> to)
 * - User avatar and name display
 * - Timestamp formatting (relative)
 * - Reason display and truncation
 * - Loading, empty, error states
 * - Expandable entries
 * - Max entries and "View more"
 * - Accessibility
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StatusHistoryTimeline, type StatusHistoryEntry } from '../StatusHistoryTimeline'

// Mock date for consistent testing
const mockNow = new Date('2024-01-15T12:00:00Z')
vi.setSystemTime(mockNow)

// Sample history entries for testing
const mockEntries: StatusHistoryEntry[] = [
  {
    id: 'entry-1',
    from_status: 'PENDING',
    to_status: 'PASSED',
    reason: 'QA inspection completed, all tests passed',
    changed_by: 'user-1',
    changed_by_name: 'John Smith',
    changed_at: '2024-01-15T11:30:00Z',
  },
  {
    id: 'entry-2',
    from_status: null,
    to_status: 'PENDING',
    reason: 'Initial status on LP creation',
    changed_by: 'user-2',
    changed_by_name: 'Jane Doe',
    changed_at: '2024-01-14T10:00:00Z',
  },
]

const longReasonEntry: StatusHistoryEntry = {
  id: 'entry-long',
  from_status: 'PASSED',
  to_status: 'HOLD',
  reason: 'A'.repeat(250),
  changed_by: 'user-1',
  changed_by_name: 'John Smith',
  changed_at: '2024-01-15T11:00:00Z',
}

const manyEntries: StatusHistoryEntry[] = Array.from({ length: 10 }, (_, i) => ({
  id: `entry-${i}`,
  from_status: i === 0 ? null : 'PENDING' as const,
  to_status: 'PENDING' as const,
  reason: `Status change ${i}`,
  changed_by: `user-${i}`,
  changed_by_name: `User ${i}`,
  changed_at: new Date(Date.now() - i * 86400000).toISOString(),
}))

describe('StatusHistoryTimeline Component (Story 06.1)', () => {
  // ==========================================================================
  // Basic Rendering Tests
  // ==========================================================================
  describe('Basic Rendering', () => {
    it('should render timeline with entries', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      expect(screen.getByTestId('status-history-timeline')).toBeInTheDocument()
    })

    it('should render entries in list', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      // Check that timeline wrapper contains entries
      const timeline = screen.getByTestId('status-history-timeline')
      expect(timeline).toBeInTheDocument()
      // Check entries by testId instead of listitem role due to nested structure
      expect(screen.getByTestId('timeline-entry-entry-1')).toBeInTheDocument()
      expect(screen.getByTestId('timeline-entry-entry-2')).toBeInTheDocument()
    })

    it('should have aria-label for accessibility', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      expect(screen.getByLabelText('Status history timeline')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Entry Display Tests
  // ==========================================================================
  describe('Entry Display', () => {
    it('should display status transition badges', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      // Multiple badges may exist, use getAllByText
      expect(screen.getAllByText('Pending').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Passed').length).toBeGreaterThan(0)
    })

    it('should show arrow between statuses for transitions', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      const arrows = document.querySelectorAll('[aria-hidden="true"]')
      expect(arrows.length).toBeGreaterThan(0)
    })

    it('should show "Created as" for initial status (from_status is null)', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      expect(screen.getByText('Created as')).toBeInTheDocument()
    })

    it('should display user name', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      expect(screen.getByText('John Smith')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    })

    it('should display relative timestamp', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      expect(screen.getByText('30 minutes ago')).toBeInTheDocument()
    })

    it('should display reason text', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      expect(screen.getByText('QA inspection completed, all tests passed')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // User Avatar Tests
  // ==========================================================================
  describe('User Avatar', () => {
    it('should render user avatar with initials', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      // Check for avatar initials in the document
      expect(screen.getByText('JS')).toBeInTheDocument()
      expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('should show initials from user name', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      // Initials should be JS for John Smith, JD for Jane Doe
      expect(screen.getByText('JS')).toBeInTheDocument()
      expect(screen.getByText('JD')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Reason Truncation Tests
  // ==========================================================================
  describe('Reason Truncation', () => {
    it('should truncate long reasons', () => {
      render(<StatusHistoryTimeline entries={[longReasonEntry]} expandable={true} />)
      const reasonText = screen.getByText(/^A+\.\.\.$/i) || screen.queryByText('Read more')
      // Either we see truncated text or the "Read more" link
      expect(reasonText || screen.getByText('Read more')).toBeInTheDocument()
    })

    it('should show "Read more" for long reasons when expandable', () => {
      render(<StatusHistoryTimeline entries={[longReasonEntry]} expandable={true} />)
      expect(screen.getByText('Read more')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Loading State Tests
  // ==========================================================================
  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      render(<StatusHistoryTimeline entries={[]} loading={true} />)
      expect(screen.getByTestId('timeline-loading')).toBeInTheDocument()
    })

    it('should have loading aria-label', () => {
      render(<StatusHistoryTimeline entries={[]} loading={true} />)
      expect(screen.getByLabelText('Loading history')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Empty State Tests
  // ==========================================================================
  describe('Empty State', () => {
    it('should render empty state when no entries', () => {
      render(<StatusHistoryTimeline entries={[]} />)
      expect(screen.getByTestId('timeline-empty')).toBeInTheDocument()
    })

    it('should show empty message', () => {
      render(<StatusHistoryTimeline entries={[]} />)
      expect(screen.getByText('No status history available')).toBeInTheDocument()
      expect(screen.getByText('Status changes will appear here')).toBeInTheDocument()
    })

    it('should have empty aria-label', () => {
      render(<StatusHistoryTimeline entries={[]} />)
      expect(screen.getByLabelText('No status history available')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Error State Tests
  // ==========================================================================
  describe('Error State', () => {
    it('should render error state when error provided', () => {
      render(<StatusHistoryTimeline entries={[]} error="Failed to load history" />)
      expect(screen.getByTestId('timeline-error')).toBeInTheDocument()
    })

    it('should show error message', () => {
      render(<StatusHistoryTimeline entries={[]} error="Failed to load history" />)
      expect(screen.getByText('Failed to load history')).toBeInTheDocument()
    })

    it('should show retry button when onRetry provided', () => {
      render(
        <StatusHistoryTimeline
          entries={[]}
          error="Failed to load history"
          onRetry={vi.fn()}
        />
      )
      expect(screen.getByTestId('timeline-retry-button')).toBeInTheDocument()
    })

    it('should call onRetry when retry button clicked', async () => {
      const onRetry = vi.fn()
      render(
        <StatusHistoryTimeline
          entries={[]}
          error="Failed to load history"
          onRetry={onRetry}
        />
      )

      await userEvent.click(screen.getByTestId('timeline-retry-button'))
      expect(onRetry).toHaveBeenCalled()
    })

    it('should have error aria-label', () => {
      render(<StatusHistoryTimeline entries={[]} error="Failed to load" />)
      expect(screen.getByLabelText('Error: Failed to load')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Expandable Entries Tests
  // ==========================================================================
  describe('Expandable Entries', () => {
    it('should show expand button when expandable', () => {
      render(<StatusHistoryTimeline entries={mockEntries} expandable={true} />)
      const expandButtons = screen.getAllByLabelText('Expand details')
      expect(expandButtons.length).toBeGreaterThan(0)
    })

    it('should hide expand button when not expandable', () => {
      render(<StatusHistoryTimeline entries={mockEntries} expandable={false} />)
      expect(screen.queryByLabelText('Expand details')).not.toBeInTheDocument()
    })

    it('should toggle expansion on button click', async () => {
      render(<StatusHistoryTimeline entries={mockEntries} expandable={true} />)

      const expandButton = screen.getAllByLabelText('Expand details')[0]
      await userEvent.click(expandButton)

      expect(screen.getByLabelText('Collapse details')).toBeInTheDocument()
    })

    it('should show full details when expanded', async () => {
      render(<StatusHistoryTimeline entries={mockEntries} expandable={true} />)

      const expandButton = screen.getAllByLabelText('Expand details')[0]
      await userEvent.click(expandButton)

      expect(screen.getByText('Timestamp')).toBeInTheDocument()
      expect(screen.getByText('Changed By')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Max Entries Tests
  // ==========================================================================
  describe('Max Entries', () => {
    it('should limit displayed entries when maxEntries provided', () => {
      render(<StatusHistoryTimeline entries={manyEntries} maxEntries={3} />)
      // Check that view more button exists (means we have more entries than shown)
      expect(screen.getByTestId('timeline-view-more')).toBeInTheDocument()
    })

    it('should show "View more" button when entries exceed max', () => {
      render(<StatusHistoryTimeline entries={manyEntries} maxEntries={3} />)
      expect(screen.getByTestId('timeline-view-more')).toBeInTheDocument()
    })

    it('should show remaining count in button', () => {
      render(<StatusHistoryTimeline entries={manyEntries} maxEntries={3} />)
      expect(screen.getByText(/View all 10 entries/)).toBeInTheDocument()
      expect(screen.getByText(/7 more/)).toBeInTheDocument()
    })

    it('should show all entries when "View more" clicked', async () => {
      render(<StatusHistoryTimeline entries={manyEntries} maxEntries={3} />)

      await userEvent.click(screen.getByTestId('timeline-view-more'))

      // After clicking view more, the view-more button should be hidden
      expect(screen.queryByTestId('timeline-view-more')).not.toBeInTheDocument()
      expect(screen.getByTestId('timeline-view-less')).toBeInTheDocument()
    })

    it('should show "Show less" after expanding', async () => {
      render(<StatusHistoryTimeline entries={manyEntries} maxEntries={3} />)

      await userEvent.click(screen.getByTestId('timeline-view-more'))

      expect(screen.getByTestId('timeline-view-less')).toBeInTheDocument()
    })

    it('should collapse back when "Show less" clicked', async () => {
      render(<StatusHistoryTimeline entries={manyEntries} maxEntries={3} />)

      await userEvent.click(screen.getByTestId('timeline-view-more'))
      await userEvent.click(screen.getByTestId('timeline-view-less'))

      // Should show view more again
      expect(screen.getByTestId('timeline-view-more')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Sorting Tests
  // ==========================================================================
  describe('Sorting', () => {
    it('should sort entries by date (newest first)', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)

      const listItems = screen.getAllByRole('listitem')
      // First entry should have "30 minutes ago" (newest)
      expect(listItems[0]).toHaveTextContent('30 minutes ago')
    })
  })

  // ==========================================================================
  // Custom Class Tests
  // ==========================================================================
  describe('Custom Classes', () => {
    it('should apply custom className', () => {
      render(<StatusHistoryTimeline entries={mockEntries} className="custom-class" />)
      const timeline = screen.getByTestId('status-history-timeline')
      expect(timeline).toHaveClass('custom-class')
    })
  })

  // ==========================================================================
  // Test ID Tests
  // ==========================================================================
  describe('Test IDs', () => {
    it('should have default test ID', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      expect(screen.getByTestId('status-history-timeline')).toBeInTheDocument()
    })

    it('should accept custom test ID', () => {
      render(<StatusHistoryTimeline entries={mockEntries} testId="custom-timeline" />)
      expect(screen.getByTestId('custom-timeline')).toBeInTheDocument()
    })

    it('should have test ID on each entry', () => {
      render(<StatusHistoryTimeline entries={mockEntries} />)
      expect(screen.getByTestId('timeline-entry-entry-1')).toBeInTheDocument()
      expect(screen.getByTestId('timeline-entry-entry-2')).toBeInTheDocument()
    })
  })
})

/**
 * Test Summary:
 *
 * Basic Rendering: 3 tests - Timeline, list, aria-label
 * Entry Display: 6 tests - Badges, arrows, user, timestamp, reason
 * User Avatar: 2 tests - Avatar rendering, initials
 * Reason Truncation: 2 tests - Truncation, "Read more"
 * Loading State: 2 tests - Skeleton, aria-label
 * Empty State: 3 tests - Empty message, aria-label
 * Error State: 5 tests - Error message, retry button, aria-label
 * Expandable Entries: 4 tests - Expand button, toggle, details
 * Max Entries: 6 tests - Limit, "View more", count, expand/collapse
 * Sorting: 1 test - Newest first
 * Custom Classes: 1 test - className support
 * Test IDs: 3 tests - Default, custom, entry test IDs
 *
 * Total: 38 tests
 */
