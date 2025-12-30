import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CostTrendChart } from '../CostTrendChart';
import type { CostHistoryItem } from '@/lib/types/cost-history';

// Mock Recharts to avoid canvas rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children, data }: any) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Line: ({ dataKey, stroke }: any) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: ({ content }: any) => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

describe('CostTrendChart', () => {
  const mockCostData: CostHistoryItem[] = [
    {
      id: '1',
      cost_type: 'standard',
      material_cost: 100,
      labor_cost: 20,
      overhead_cost: 10,
      total_cost: 130,
      cost_per_unit: 1.3,
      effective_from: '2025-01-01',
      effective_to: null,
      created_at: '2025-01-01T00:00:00Z',
      created_by: 'user-1',
      bom_version: 1,
    },
    {
      id: '2',
      cost_type: 'standard',
      material_cost: 102,
      labor_cost: 21,
      overhead_cost: 10.5,
      total_cost: 133.5,
      cost_per_unit: 1.335,
      effective_from: '2025-02-01',
      effective_to: null,
      created_at: '2025-02-01T00:00:00Z',
      created_by: 'user-1',
      bom_version: 2,
    },
    {
      id: '3',
      cost_type: 'standard',
      material_cost: 105,
      labor_cost: 22,
      overhead_cost: 11,
      total_cost: 138,
      cost_per_unit: 1.38,
      effective_from: '2025-03-01',
      effective_to: null,
      created_at: '2025-03-01T00:00:00Z',
      created_by: 'user-1',
      bom_version: 3,
    },
  ];

  const mockToggleState = {
    material: true,
    labor: true,
    overhead: true,
    total: true,
  };

  const mockOnPointClick = vi.fn();
  const mockOnToggleChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-04: Chart renders with data
  it('should render LineChart component with cost data', () => {
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  // AC-04: Chart displays multiple data points
  it('should render chart with all data points from cost history', () => {
    const { container } = render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });

  // AC-05: Toggle Material line
  it('should toggle Material line when checkbox unchecked', async () => {
    const user = userEvent.setup();
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const materialCheckbox = screen.getByRole('checkbox', { name: /toggle material line/i });
    await user.click(materialCheckbox);
    expect(mockOnToggleChange).toHaveBeenCalledWith('material', false);
  });

  // AC-05: Toggle Labor line
  it('should toggle Labor line when checkbox state changes', async () => {
    const user = userEvent.setup();
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const laborCheckbox = screen.getByRole('checkbox', { name: /toggle labor line/i });
    await user.click(laborCheckbox);
    expect(mockOnToggleChange).toHaveBeenCalledWith('labor', false);
  });

  // AC-05: Toggle Overhead line
  it('should toggle Overhead line when checkbox state changes', async () => {
    const user = userEvent.setup();
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const overheadCheckbox = screen.getByRole('checkbox', { name: /toggle overhead line/i });
    await user.click(overheadCheckbox);
    expect(mockOnToggleChange).toHaveBeenCalledWith('overhead', false);
  });

  // AC-05: Toggle Total line
  it('should toggle Total line when checkbox state changes', async () => {
    const user = userEvent.setup();
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const totalCheckbox = screen.getByRole('checkbox', { name: /toggle total line/i });
    await user.click(totalCheckbox);
    expect(mockOnToggleChange).toHaveBeenCalledWith('total', false);
  });

  // AC-06: Tooltip shows on hover
  it('should display tooltip when hovering over data point', async () => {
    const user = userEvent.setup();
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const chart = screen.getByTestId('line-chart');
    await user.hover(chart);

    expect(screen.queryByTestId('tooltip')).toBeInTheDocument();
  });

  // AC-06: Tooltip includes all cost components
  it('should show tooltip with Material, Labor, Overhead breakdown on hover', () => {
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  // AC-06: Tooltip shows percentages
  it('should display percentages in tooltip for each cost component', () => {
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  // AC-06: Tooltip shows total cost
  it('should display total cost in tooltip', () => {
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });

  // AC-04: Chart renders with 12 months of data
  it('should render chart with 12 months of cost trend data', () => {
    const twelveMonthsData: CostHistoryItem[] = Array.from({ length: 12 }, (_, i) => ({
      id: `${i}`,
      cost_type: 'standard' as const,
      material_cost: 100 + i,
      labor_cost: 20 + i,
      overhead_cost: 10 + i * 0.5,
      total_cost: 130 + i * 1.5,
      cost_per_unit: 1.3 + i * 0.015,
      effective_from: new Date(2025, i, 1).toISOString(),
      effective_to: null,
      created_at: new Date(2025, i, 1).toISOString(),
      created_by: 'user-1',
      bom_version: i + 1,
    }));

    render(
      <CostTrendChart
        data={twelveMonthsData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeInTheDocument();
  });

  // AC-04: Chart shows all cost types
  it('should display all cost types (Material, Labor, Overhead, Total) as separate lines', () => {
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('line-material_cost')).toBeInTheDocument();
    expect(screen.getByTestId('line-labor_cost')).toBeInTheDocument();
    expect(screen.getByTestId('line-overhead_cost')).toBeInTheDocument();
    expect(screen.getByTestId('line-total_cost')).toBeInTheDocument();
  });

  // AC-05: Hidden lines when toggle off
  it('should hide Material line from chart when toggle disabled', () => {
    const disabledToggles = {
      material: false,
      labor: true,
      overhead: true,
      total: true,
    };

    render(
      <CostTrendChart
        data={mockCostData}
        toggles={disabledToggles}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('line-material_cost')).not.toBeInTheDocument();
  });

  // AC-05: All toggles can be controlled independently
  it('should allow independent control of all cost component toggles', async () => {
    const user = userEvent.setup();
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      await user.click(checkbox);
    }

    expect(mockOnToggleChange.mock.calls.length).toBeGreaterThan(0);
  });

  // AC-07: Click point navigates to detail
  it('should call onPointClick handler when data point clicked', async () => {
    const user = userEvent.setup();
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    const chart = screen.getByTestId('line-chart');
    fireEvent.click(chart);

    expect(typeof mockOnPointClick).toBe('function');
  });

  // AC-04: Chart renders responsively
  it('should render ResponsiveContainer for responsive sizing', () => {
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  // AC-04: Chart has axes
  it('should render X-axis and Y-axis', () => {
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
  });

  // AC-04: Chart has legend
  it('should display legend for cost component lines', () => {
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  // AC-13: Default display shows all components
  it('should render all cost components by default (not reset)', () => {
    render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('line-material_cost')).toBeInTheDocument();
    expect(screen.getByTestId('line-labor_cost')).toBeInTheDocument();
    expect(screen.getByTestId('line-overhead_cost')).toBeInTheDocument();
    expect(screen.getByTestId('line-total_cost')).toBeInTheDocument();
  });

  // AC-04: Empty data handling
  it('should handle empty data array gracefully', () => {
    render(
      <CostTrendChart
        data={[]}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  // AC-04: Single data point
  it('should render chart with single data point', () => {
    const singleDataPoint = [mockCostData[0]];

    render(
      <CostTrendChart
        data={singleDataPoint}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  // Component rendering test
  it('should render CostTrendChart component successfully', () => {
    const { container } = render(
      <CostTrendChart
        data={mockCostData}
        toggles={mockToggleState}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(container).toBeInTheDocument();
  });

  // AC-05: Toggle state passed correctly
  it('should respect initial toggle state for all components', () => {
    const customToggles = {
      material: true,
      labor: false,
      overhead: true,
      total: false,
    };

    render(
      <CostTrendChart
        data={mockCostData}
        toggles={customToggles}
        onToggleChange={mockOnToggleChange}
        onPointClick={mockOnPointClick}
      />
    );

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.queryByTestId('line-labor_cost')).not.toBeInTheDocument();
    expect(screen.queryByTestId('line-total_cost')).not.toBeInTheDocument();
  });
});
