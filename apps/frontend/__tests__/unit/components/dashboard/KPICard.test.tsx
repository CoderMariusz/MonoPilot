import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KPICard } from '@/app/(authenticated)/production/dashboard/components/KPICard';

describe('KPICard Component', () => {
  const defaultProps = {
    title: 'Active WOs',
    value: '5',
    tooltip: 'Currently active work orders',
    accentColor: 'green',
    onClick: vi.fn(),
  };

  it('renders the title and value', () => {
    render(<KPICard {...defaultProps} />);

    expect(screen.getByText('Active WOs')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('displays tooltip on hover', () => {
    render(<KPICard {...defaultProps} />);

    const card = screen.getByText('Active WOs').closest('div');
    expect(card).toHaveAttribute('title', 'Currently active work orders');
  });

  it('applies correct accent color class', () => {
    const { container } = render(<KPICard {...defaultProps} accentColor="blue" />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('border-blue-500');
  });

  it('calls onClick handler when clicked', () => {
    render(<KPICard {...defaultProps} />);

    fireEvent.click(screen.getByText('5'));
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state when value is null', () => {
    render(<KPICard {...defaultProps} value={null} />);

    expect(screen.queryByText('5')).not.toBeInTheDocument();
    expect(screen.getByTestId('kpi-loading')).toBeInTheDocument();
  });
});
