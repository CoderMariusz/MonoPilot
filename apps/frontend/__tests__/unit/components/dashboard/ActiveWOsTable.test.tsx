import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveWOsTable } from '@/app/(authenticated)/production/dashboard/components/ActiveWOsTable';

describe('ActiveWOsTable Component', () => {
  const mockWOs = [
    {
      id: '1',
      wo_number: 'WO-001',
      product_name: 'Product A',
      status: 'In Progress',
      planned_qty: 100,
      actual_qty: 50,
      progress_percent: 50,
      line_name: 'Line 1',
      started_at: '2025-12-16T10:00:00Z',
    },
    {
      id: '2',
      wo_number: 'WO-002',
      product_name: 'Product B',
      status: 'Paused',
      planned_qty: 200,
      actual_qty: 0,
      progress_percent: 0,
      line_name: 'Line 2',
      started_at: '2025-12-16T09:00:00Z',
    },
  ];

  it('renders table headers correctly', () => {
    render(<ActiveWOsTable wos={mockWOs} total={2} loading={false} />);

    expect(screen.getByText('WO Number')).toBeInTheDocument();
    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Progress %')).toBeInTheDocument();
  });

  it('renders all provided work orders', () => {
    render(<ActiveWOsTable wos={mockWOs} total={2} loading={false} />);

    expect(screen.getByText('WO-001')).toBeInTheDocument();
    expect(screen.getByText('WO-002')).toBeInTheDocument();
  });

  it('displays correct status badge colors', () => {
    render(<ActiveWOsTable wos={mockWOs} total={2} loading={false} />);

    const inProgressBadge = screen.getByText('In Progress');
    const pausedBadge = screen.getByText('Paused');

    expect(inProgressBadge).toHaveClass('bg-blue-100');
    expect(pausedBadge).toHaveClass('bg-yellow-100');
  });

  it('shows empty state when no WOs provided', () => {
    render(<ActiveWOsTable wos={[]} total={0} loading={false} />);

    expect(screen.getByText(/No active work orders/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start WO/i })).toBeInTheDocument();
  });

  it('sorts by Started At when header clicked', async () => {
    const onSort = vi.fn();
    render(<ActiveWOsTable wos={mockWOs} total={2} loading={false} onSort={onSort} />);

    const startedAtHeader = screen.getByText('Started At');
    await userEvent.click(startedAtHeader);

    expect(onSort).toHaveBeenCalledWith('started_at');
  });

  it('expands row on click to show details', async () => {
    render(<ActiveWOsTable wos={mockWOs} total={2} loading={false} />);

    const row = screen.getByText('WO-001').closest('tr');
    await userEvent.click(row!);

    expect(screen.getByText('Materials list')).toBeInTheDocument();
  });
});
