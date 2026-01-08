/**
 * WOPauseHistory Component Tests
 * Story: 04.2b - WO Pause/Resume
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WOPauseHistory, WOPauseHistorySkeleton } from '../WOPauseHistory'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('WOPauseHistory Component', () => {
  const mockPauses = [
    {
      id: 'pause-1',
      work_order_id: 'wo-123',
      paused_at: '2025-01-08T10:00:00Z',
      resumed_at: '2025-01-08T10:45:00Z',
      duration_minutes: 45,
      pause_reason: 'machine_breakdown' as const,
      notes: 'Motor replacement',
      paused_by_user: { id: 'user-1', full_name: 'John Doe' },
      resumed_by_user: { id: 'user-2', full_name: 'Jane Smith' },
    },
    {
      id: 'pause-2',
      work_order_id: 'wo-123',
      paused_at: '2025-01-08T14:00:00Z',
      resumed_at: '2025-01-08T14:30:00Z',
      duration_minutes: 30,
      pause_reason: 'break' as const,
      notes: null,
      paused_by_user: { id: 'user-1', full_name: 'John Doe' },
      resumed_by_user: { id: 'user-1', full_name: 'John Doe' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { pauses: mockPauses } }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Loading State', () => {
    it('should show skeleton while loading', () => {
      render(<WOPauseHistorySkeleton />)

      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })

    it('should show loading state initially when fetching', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
      render(<WOPauseHistory workOrderId="wo-123" />)

      // Should show skeleton
      expect(document.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should show empty state when no pauses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { pauses: [] } }),
      })

      render(<WOPauseHistory workOrderId="wo-123" />)

      await waitFor(() => {
        expect(screen.getByText('No pauses recorded')).toBeInTheDocument()
        expect(screen.getByText('This work order has not been paused.')).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    it('should show error state on API failure', async () => {
      // Reset and set up mock for this specific test
      mockFetch.mockReset()
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'API error message' }),
      })

      render(<WOPauseHistory workOrderId="wo-123" />)

      await waitFor(() => {
        // Multiple elements may match - use getAllBy
        expect(screen.getAllByText('Failed to load pause history').length).toBeGreaterThan(0)
      })
    })

    it('should have retry button on error', async () => {
      mockFetch.mockReset()
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed' }),
      })

      render(<WOPauseHistory workOrderId="wo-123" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should retry fetch on retry button click', async () => {
      const user = userEvent.setup()

      mockFetch.mockReset()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed' }),
      })

      render(<WOPauseHistory workOrderId="wo-123" />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { pauses: mockPauses } }),
      })

      await user.click(screen.getByRole('button', { name: /try again/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Data Display', () => {
    it('should display pause records', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} />)

      // Multiple elements expected (table + cards)
      expect(screen.getAllByText('Machine Breakdown').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Break/Lunch').length).toBeGreaterThan(0)
    })

    it('should show paused by user', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} />)

      expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0)
    })

    it('should show formatted duration', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} />)

      // Multiple elements expected (table + cards), use getAllByText
      expect(screen.getAllByText('45 min').length).toBeGreaterThan(0)
      expect(screen.getAllByText('30 min').length).toBeGreaterThan(0)
    })

    it('should show notes when present', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} />)

      // Multiple elements expected (table + cards)
      expect(screen.getAllByText('Motor replacement').length).toBeGreaterThan(0)
    })
  })

  describe('Summary Section', () => {
    it('should show summary when showSummary=true', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} showSummary={true} />)

      expect(screen.getByText('Total Pauses')).toBeInTheDocument()
      expect(screen.getByText('Total Downtime')).toBeInTheDocument()
      expect(screen.getByText('Average Pause')).toBeInTheDocument()
    })

    it('should calculate total count correctly', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} showSummary={true} />)

      // Find the summary section and check total count
      const summarySection = document.querySelector('.grid.grid-cols-2')
      expect(summarySection).toBeInTheDocument()
      expect(summarySection?.textContent).toContain('2')
    })

    it('should calculate total duration correctly', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} showSummary={true} />)

      // 45 + 30 = 75 minutes = 1h 15m
      // Find in the Total Downtime section of summary
      const summarySection = document.querySelector('.grid.grid-cols-2')
      expect(summarySection).toBeInTheDocument()
      expect(summarySection?.textContent).toContain('1h 15m')
    })
  })

  describe('Active Pause Highlight', () => {
    it('should highlight active pause', async () => {
      const pausesWithActive = [
        ...mockPauses,
        {
          id: 'pause-3',
          work_order_id: 'wo-123',
          paused_at: '2025-01-08T16:00:00Z',
          resumed_at: null,
          duration_minutes: null,
          pause_reason: 'quality_issue' as const,
          notes: 'Investigation in progress',
          paused_by_user: { id: 'user-1', full_name: 'John Doe' },
          resumed_by_user: null,
        },
      ]

      render(<WOPauseHistory workOrderId="wo-123" pauses={pausesWithActive} />)

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('should show indication for active pause', async () => {
      const activePause = [
        {
          id: 'pause-1',
          work_order_id: 'wo-123',
          paused_at: '2025-01-08T16:00:00Z',
          resumed_at: null,
          duration_minutes: null,
          pause_reason: 'quality_issue' as const,
          notes: null,
          paused_by_user: { id: 'user-1', full_name: 'John Doe' },
          resumed_by_user: null,
        },
      ]

      render(<WOPauseHistory workOrderId="wo-123" pauses={activePause} />)

      // Check for "Currently Paused" in mobile or "Still paused"/"Active" in desktop view
      expect(
        screen.queryByText('Currently Paused') ||
        screen.queryByText('Still paused') ||
        screen.queryByText('Active')
      ).toBeTruthy()
    })
  })

  describe('maxItems Prop', () => {
    it('should limit displayed items when maxItems is set', async () => {
      const manyPauses = Array.from({ length: 10 }, (_, i) => ({
        id: `pause-${i}`,
        work_order_id: 'wo-123',
        paused_at: `2025-01-0${(i % 9) + 1}T10:00:00Z`,
        resumed_at: `2025-01-0${(i % 9) + 1}T10:30:00Z`,
        duration_minutes: 30,
        pause_reason: 'break' as const,
        notes: null,
        paused_by_user: { id: 'user-1', full_name: 'John Doe' },
        resumed_by_user: { id: 'user-1', full_name: 'John Doe' },
      }))

      render(<WOPauseHistory workOrderId="wo-123" pauses={manyPauses} maxItems={3} />)

      // Should show "View all X pauses" button
      expect(screen.getByText('View all 10 pauses')).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should render table on desktop', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} />)

      // Table should exist (hidden on mobile via CSS)
      expect(document.querySelector('table')).toBeInTheDocument()
    })
  })

  describe('API Integration', () => {
    it('should fetch pause history when pauses prop not provided', async () => {
      render(<WOPauseHistory workOrderId="wo-123" />)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/production/work-orders/wo-123/pause-history')
      })
    })

    it('should NOT fetch when pauses prop is provided', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} />)

      expect(mockFetch).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper table structure', async () => {
      render(<WOPauseHistory workOrderId="wo-123" pauses={mockPauses} />)

      expect(document.querySelector('thead')).toBeInTheDocument()
      expect(document.querySelector('tbody')).toBeInTheDocument()
    })
  })
})
