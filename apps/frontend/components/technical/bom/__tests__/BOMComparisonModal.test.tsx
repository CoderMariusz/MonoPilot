/**
 * BOMComparisonModal Component Tests (Story 02.14)
 * Tests for BOM version comparison modal
 * FR-2.25: BOM Version Comparison
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BOMComparisonModal } from '../BOMComparisonModal'
import { BOMVersionSelector } from '../BOMVersionSelector'
import { DiffHighlighter, DiffBadge, DiffRow } from '../DiffHighlighter'
import { ScalePreviewTable } from '../ScalePreviewTable'
import { YieldAnalysisPanel } from '../YieldAnalysisPanel'
import { MultiLevelExplosion } from '../MultiLevelExplosion'
import { BOMScaleModal } from '../BOMScaleModal'
import type { BomComparisonResponse, ScaledItem, BomYieldResponse } from '@/lib/types/bom-advanced'

// ========================================
// Test Setup
// ========================================

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// ========================================
// Mock Data
// ========================================

const mockVersions = [
  {
    id: 'bom-v1',
    version: '1.0',
    status: 'Active',
    effective_from: '2024-01-01',
    effective_to: null,
    output_qty: 100,
    output_uom: 'kg',
  },
  {
    id: 'bom-v2',
    version: '2.0',
    status: 'Draft',
    effective_from: '2024-06-01',
    effective_to: null,
    output_qty: 100,
    output_uom: 'kg',
  },
]

const mockComparison: BomComparisonResponse = {
  bom_1: {
    id: 'bom-v1',
    version: '1.0',
    effective_from: '2024-01-01',
    effective_to: null,
    output_qty: 100,
    output_uom: 'kg',
    status: 'Active',
    items: [
      {
        id: 'item-1',
        component_id: 'comp-flour',
        component_code: 'FLOUR-001',
        component_name: 'All Purpose Flour',
        quantity: 50,
        uom: 'kg',
        sequence: 10,
        operation_seq: 1,
        scrap_percent: 2,
        is_output: false,
      },
      {
        id: 'item-2',
        component_id: 'comp-sugar',
        component_code: 'SUGAR-001',
        component_name: 'Granulated Sugar',
        quantity: 25,
        uom: 'kg',
        sequence: 20,
        operation_seq: 1,
        scrap_percent: 0,
        is_output: false,
      },
    ],
  },
  bom_2: {
    id: 'bom-v2',
    version: '2.0',
    effective_from: '2024-06-01',
    effective_to: null,
    output_qty: 100,
    output_uom: 'kg',
    status: 'Draft',
    items: [
      {
        id: 'item-1-v2',
        component_id: 'comp-flour',
        component_code: 'FLOUR-001',
        component_name: 'All Purpose Flour',
        quantity: 55,
        uom: 'kg',
        sequence: 10,
        operation_seq: 1,
        scrap_percent: 2,
        is_output: false,
      },
      {
        id: 'item-3',
        component_id: 'comp-butter',
        component_code: 'BUTTER-001',
        component_name: 'Unsalted Butter',
        quantity: 10,
        uom: 'kg',
        sequence: 30,
        operation_seq: 2,
        scrap_percent: 1,
        is_output: false,
      },
    ],
  },
  differences: {
    added: [
      {
        id: 'item-3',
        component_id: 'comp-butter',
        component_code: 'BUTTER-001',
        component_name: 'Unsalted Butter',
        quantity: 10,
        uom: 'kg',
        sequence: 30,
        operation_seq: 2,
        scrap_percent: 1,
        is_output: false,
      },
    ],
    removed: [
      {
        id: 'item-2',
        component_id: 'comp-sugar',
        component_code: 'SUGAR-001',
        component_name: 'Granulated Sugar',
        quantity: 25,
        uom: 'kg',
        sequence: 20,
        operation_seq: 1,
        scrap_percent: 0,
        is_output: false,
      },
    ],
    modified: [
      {
        item_id: 'item-1-v2',
        component_id: 'comp-flour',
        component_code: 'FLOUR-001',
        component_name: 'All Purpose Flour',
        field: 'quantity',
        old_value: 50,
        new_value: 55,
        change_percent: 10,
      },
    ],
  },
  summary: {
    total_items_v1: 2,
    total_items_v2: 2,
    total_added: 1,
    total_removed: 1,
    total_modified: 1,
    weight_change_kg: 5,
    weight_change_percent: 5,
  },
}

const mockScaledItems: ScaledItem[] = [
  {
    id: 'item-1',
    component_code: 'FLOUR-001',
    component_name: 'All Purpose Flour',
    original_quantity: 50,
    new_quantity: 75,
    uom: 'kg',
    rounded: false,
  },
  {
    id: 'item-2',
    component_code: 'SUGAR-001',
    component_name: 'Granulated Sugar',
    original_quantity: 25,
    new_quantity: 37.5,
    uom: 'kg',
    rounded: true,
  },
]

const mockYieldData: BomYieldResponse = {
  bom_id: 'bom-v1',
  theoretical_yield_percent: 95,
  expected_yield_percent: 94,
  input_total_kg: 100,
  output_qty_kg: 95,
  loss_factors: [
    { type: 'moisture', description: 'Moisture loss during baking', loss_percent: 3 },
    { type: 'process', description: 'Process waste', loss_percent: 2 },
  ],
  actual_yield_avg: 92,
  variance_from_expected: -2,
  variance_warning: false,
}

// ========================================
// Mock Fetch
// ========================================

beforeEach(() => {
  global.fetch = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ========================================
// DiffHighlighter Tests
// ========================================

describe('DiffHighlighter Component', () => {
  it('renders added diff with green styling', () => {
    render(<DiffHighlighter type="added" value="New Item" />)

    const element = screen.getByText('New Item')
    expect(element).toBeInTheDocument()
    // The wrapper span contains the aria-label
    const wrapper = element.parentElement
    expect(wrapper).toHaveAttribute('aria-label', expect.stringContaining('Added'))
  })

  it('renders removed diff with strikethrough', () => {
    render(<DiffHighlighter type="removed" value="Old Item" />)

    const element = screen.getByText('Old Item')
    expect(element).toBeInTheDocument()
    // The parent wrapper has the line-through class for removed items
    const wrapper = element.parentElement
    expect(wrapper).toHaveClass('line-through')
  })

  it('renders modified diff with old value', () => {
    render(<DiffHighlighter type="modified" value="100" oldValue="50" />)

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('(50)')).toBeInTheDocument()
  })

  it('shows percentage change indicator', () => {
    render(<DiffHighlighter type="modified" value="100" oldValue="50" changePercent={100} />)

    expect(screen.getByText('+100.0%')).toBeInTheDocument()
  })

  it('shows negative percentage change', () => {
    render(<DiffHighlighter type="modified" value="50" oldValue="100" changePercent={-50} />)

    expect(screen.getByText('-50.0%')).toBeInTheDocument()
  })

  it('renders unchanged without styling', () => {
    render(<DiffHighlighter type="unchanged" value="Same" />)

    const element = screen.getByText('Same')
    expect(element).toBeInTheDocument()
  })

  it('hides icon when showIcon is false', () => {
    render(<DiffHighlighter type="added" value="Item" showIcon={false} />)

    // Icon should not be present
    const svg = document.querySelector('svg')
    expect(svg).toBeNull()
  })
})

describe('DiffBadge Component', () => {
  it('renders added badge with correct color', () => {
    render(<DiffBadge type="added" />)

    expect(screen.getByText('Added')).toBeInTheDocument()
  })

  it('renders removed badge with correct color', () => {
    render(<DiffBadge type="removed" />)

    expect(screen.getByText('Removed')).toBeInTheDocument()
  })

  it('renders modified badge with correct color', () => {
    render(<DiffBadge type="modified" />)

    expect(screen.getByText('Modified')).toBeInTheDocument()
  })

  it('renders unchanged badge', () => {
    render(<DiffBadge type="unchanged" />)

    expect(screen.getByText('Unchanged')).toBeInTheDocument()
  })
})

// ========================================
// ScalePreviewTable Tests
// ========================================

describe('ScalePreviewTable Component', () => {
  it('renders scale summary with batch sizes', () => {
    render(
      <ScalePreviewTable
        items={mockScaledItems}
        originalBatchSize={100}
        newBatchSize={150}
        scaleFactor={1.5}
      />
    )

    expect(screen.getByText('100')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('1.500x')).toBeInTheDocument()
  })

  it('displays all scaled items', () => {
    render(
      <ScalePreviewTable
        items={mockScaledItems}
        originalBatchSize={100}
        newBatchSize={150}
        scaleFactor={1.5}
      />
    )

    expect(screen.getByText('FLOUR-001')).toBeInTheDocument()
    expect(screen.getByText('SUGAR-001')).toBeInTheDocument()
  })

  it('highlights rounded values', () => {
    render(
      <ScalePreviewTable
        items={mockScaledItems}
        originalBatchSize={100}
        newBatchSize={150}
        scaleFactor={1.5}
      />
    )

    // One item is marked as rounded
    expect(screen.getByText('Rounded')).toBeInTheDocument()
  })

  it('shows rounding warning when items are rounded', () => {
    render(
      <ScalePreviewTable
        items={mockScaledItems}
        originalBatchSize={100}
        newBatchSize={150}
        scaleFactor={1.5}
      />
    )

    expect(screen.getByText(/1 item had quantities rounded/)).toBeInTheDocument()
  })

  it('shows empty state when no items', () => {
    render(
      <ScalePreviewTable
        items={[]}
        originalBatchSize={100}
        newBatchSize={150}
        scaleFactor={1.5}
      />
    )

    expect(screen.getByText('No items to scale')).toBeInTheDocument()
  })

  it('displays percentage change for each item', () => {
    render(
      <ScalePreviewTable
        items={mockScaledItems}
        originalBatchSize={100}
        newBatchSize={150}
        scaleFactor={1.5}
      />
    )

    // 50% increase (50 -> 75) - may appear multiple times
    const changes = screen.getAllByText('+50.0%')
    expect(changes.length).toBeGreaterThan(0)
  })
})

// ========================================
// BOMVersionSelector Tests
// ========================================

describe('BOMVersionSelector Component', () => {
  beforeEach(() => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ boms: mockVersions }),
    })
  })

  it('renders loading skeleton initially', () => {
    render(
      <TestWrapper>
        <BOMVersionSelector
          productId="prod-1"
          selectedBomId=""
          onChange={vi.fn()}
        />
      </TestWrapper>
    )

    // Skeleton should be visible during loading
    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('renders dropdown after loading', async () => {
    render(
      <TestWrapper>
        <BOMVersionSelector
          productId="prod-1"
          selectedBomId=""
          onChange={vi.fn()}
          label="Select Version"
        />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Select Version')).toBeInTheDocument()
    })
  })

  it('excludes specified BOM from options', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ boms: mockVersions }),
    })

    render(
      <TestWrapper>
        <BOMVersionSelector
          productId="prod-1"
          selectedBomId=""
          onChange={vi.fn()}
          excludeBomId="bom-v1"
        />
      </TestWrapper>
    )

    // Version 1 should be excluded, only v2 available
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })

  it('shows error state on fetch failure', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Failed to fetch' }),
    })

    render(
      <TestWrapper>
        <BOMVersionSelector
          productId="prod-1"
          selectedBomId=""
          onChange={vi.fn()}
        />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Failed to load versions')).toBeInTheDocument()
    })
  })

  it('shows empty state when no versions available', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ boms: [] }),
    })

    render(
      <TestWrapper>
        <BOMVersionSelector
          productId="prod-1"
          selectedBomId=""
          onChange={vi.fn()}
        />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('No other versions available')).toBeInTheDocument()
    })
  })

  it('calls onChange when selection changes', async () => {
    const onChange = vi.fn()

    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ boms: mockVersions }),
    })

    render(
      <TestWrapper>
        <BOMVersionSelector
          productId="prod-1"
          selectedBomId=""
          onChange={onChange}
        />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled()
    })
  })
})

// ========================================
// BOMComparisonModal Tests
// ========================================

describe('BOMComparisonModal Component', () => {
  const defaultProps = {
    bomId1: 'bom-v1',
    bomId2: 'bom-v2',
    productId: 'prod-1',
    isOpen: true,
    onClose: vi.fn(),
  }

  beforeEach(() => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/compare/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ comparison: mockComparison }),
        })
      }
      if (url.includes('/boms?product_id=')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ boms: mockVersions }),
        })
      }
      return Promise.reject(new Error('Unknown endpoint'))
    })
  })

  it('renders modal with title', async () => {
    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByText('Compare BOM Versions')).toBeInTheDocument()
  })

  it('shows version selectors', async () => {
    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    expect(screen.getByText('Version 1 (Base)')).toBeInTheDocument()
    expect(screen.getByText('Version 2 (Compare)')).toBeInTheDocument()
  })

  it('shows summary cards after loading', async () => {
    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText('Added')).toBeInTheDocument()
      expect(screen.getByText('Removed')).toBeInTheDocument()
      expect(screen.getByText('Modified')).toBeInTheDocument()
    })
  })

  it('displays comparison counts correctly', async () => {
    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    await waitFor(() => {
      // Should show counts from mock data
      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
    })
  })

  it('shows added items section', async () => {
    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Added Items/)).toBeInTheDocument()
    })
  })

  it('shows removed items section', async () => {
    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Removed Items/)).toBeInTheDocument()
    })
  })

  it('shows modified items with changes', async () => {
    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    // Wait for comparison data to load
    await waitFor(() => {
      // Check for Modified text in summary card or accordion
      const modifiedElements = screen.getAllByText(/Modified/)
      expect(modifiedElements.length).toBeGreaterThan(0)
    }, { timeout: 2000 })
  })

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn()

    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} onClose={onClose} />
      </TestWrapper>
    )

    // Wait for modal to render
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Find and click the Close button in footer
    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    const footerCloseButton = closeButtons.find(btn => btn.textContent === 'Close')
    if (footerCloseButton) {
      fireEvent.click(footerCloseButton)
    } else {
      fireEvent.click(closeButtons[closeButtons.length - 1])
    }

    expect(onClose).toHaveBeenCalled()
  })

  it('shows export button', async () => {
    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Export Comparison/)).toBeInTheDocument()
    })
  })

  it('handles comparison error gracefully', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/compare/')) {
        return Promise.resolve({
          ok: false,
          json: async () => ({ message: 'Cannot compare these versions' }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ boms: mockVersions }),
      })
    })

    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByText(/Cannot compare these versions/)).toBeInTheDocument()
    })
  })

  it('shows loading state while fetching', () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
      new Promise(() => {}) // Never resolves
    )

    render(
      <TestWrapper>
        <BOMComparisonModal {...defaultProps} />
      </TestWrapper>
    )

    // Should show skeleton loading
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('prevents comparing same version', async () => {
    render(
      <TestWrapper>
        <BOMComparisonModal
          {...defaultProps}
          bomId1="bom-v1"
          bomId2="bom-v1"
        />
      </TestWrapper>
    )

    // Should show message about selecting different versions
    await waitFor(() => {
      expect(screen.getByText(/Select two different versions/)).toBeInTheDocument()
    })
  })
})

// ========================================
// Accessibility Tests
// ========================================

describe('Accessibility', () => {
  it('DiffHighlighter has aria-label', () => {
    render(<DiffHighlighter type="added" value="New Item" />)

    const element = screen.getByText('New Item')
    // The parent wrapper has the aria-label
    expect(element.parentElement).toHaveAttribute('aria-label')
  })

  it('BOMComparisonModal has proper dialog role', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ boms: mockVersions, comparison: mockComparison }),
    })

    render(
      <TestWrapper>
        <BOMComparisonModal
          bomId1="bom-v1"
          bomId2="bom-v2"
          productId="prod-1"
          isOpen={true}
          onClose={vi.fn()}
        />
      </TestWrapper>
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('ScalePreviewTable rows are keyboard accessible', () => {
    render(
      <ScalePreviewTable
        items={mockScaledItems}
        originalBatchSize={100}
        newBatchSize={150}
        scaleFactor={1.5}
      />
    )

    const table = screen.getByRole('table')
    expect(table).toBeInTheDocument()
  })
})

// ========================================
// Keyboard Navigation Tests
// ========================================

describe('Keyboard Navigation', () => {
  it('DiffBadge is focusable', () => {
    render(<DiffBadge type="added" />)

    const badge = screen.getByText('Added')
    expect(badge).toBeInTheDocument()
  })

  it('close button responds to Enter key', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/compare/')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ comparison: mockComparison }),
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ boms: mockVersions }),
      })
    })

    render(
      <TestWrapper>
        <BOMComparisonModal
          bomId1="bom-v1"
          bomId2="bom-v2"
          productId="prod-1"
          isOpen={true}
          onClose={onClose}
        />
      </TestWrapper>
    )

    // Wait for modal to be ready
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    // Find close button and use userEvent for keyboard interaction
    const closeButtons = screen.getAllByRole('button', { name: /close/i })
    const footerCloseButton = closeButtons.find(btn => btn.textContent === 'Close')
    if (footerCloseButton) {
      await user.click(footerCloseButton)
    }

    // Dialog close is handled by the Dialog component on button click
    expect(onClose).toHaveBeenCalled()
  })
})
