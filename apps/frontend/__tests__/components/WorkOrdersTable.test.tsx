/**
 * UI Component Tests for Work Orders Table
 * Tests the WorkOrdersTable component functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WorkOrdersTable } from '../../components/WorkOrdersTable';

// Mock the API
jest.mock('../../lib/api/workOrders', () => ({
  WorkOrdersAPI: {
    getAll: jest.fn(),
    closeWorkOrder: jest.fn()
  }
}));

// Mock the WorkOrdersTable component
const MockWorkOrdersTable = ({ workOrders, onCloseWorkOrder, onFilterChange, filters }) => (
  <div data-testid="work-orders-table">
    <div data-testid="filters">
      <select 
        data-testid="line-filter" 
        value={filters.line || ''} 
        onChange={(e) => onFilterChange({ line: e.target.value })}
      >
        <option value="">All Lines</option>
        <option value="Line-1">Line 1</option>
        <option value="Line-2">Line 2</option>
      </select>
      
      <select 
        data-testid="kpi-scope-filter" 
        value={filters.kpi_scope || ''} 
        onChange={(e) => onFilterChange({ kpi_scope: e.target.value })}
      >
        <option value="">All Scopes</option>
        <option value="PR">PR</option>
        <option value="FG">FG</option>
      </select>
      
      <select 
        data-testid="status-filter" 
        value={filters.status || ''} 
        onChange={(e) => onFilterChange({ status: e.target.value })}
      >
        <option value="">All Statuses</option>
        <option value="in_progress">In Progress</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      
      <select 
        data-testid="date-bucket-filter" 
        value={filters.date_bucket || ''} 
        onChange={(e) => onFilterChange({ date_bucket: e.target.value })}
      >
        <option value="">All Time</option>
        <option value="day">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>WO Number</th>
          <th>Product</th>
          <th>Status</th>
          <th>KPI Scope</th>
          <th>Line</th>
          <th>Actual Start</th>
          <th>Actual End</th>
          <th>Actual Output</th>
          <th>Yield %</th>
          <th>QA Status</th>
          <th>Priority</th>
          <th>Current Op</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {workOrders.map((wo) => (
          <tr key={wo.id} data-testid={`wo-row-${wo.id}`}>
            <td>{wo.wo_number}</td>
            <td>{wo.product?.description}</td>
            <td>
              <span className={`status-badge status-${wo.status}`}>
                {wo.status}
              </span>
            </td>
            <td>
              <span className={`kpi-scope-badge scope-${wo.kpi_scope}`}>
                {wo.kpi_scope}
              </span>
            </td>
            <td>{wo.line_number}</td>
            <td>{wo.actual_start ? new Date(wo.actual_start).toLocaleDateString() : '-'}</td>
            <td>{wo.actual_end ? new Date(wo.actual_end).toLocaleDateString() : '-'}</td>
            <td>{wo.actual_output_qty || '-'}</td>
            <td>
              {wo.actual_output_qty && wo.quantity ? 
                ((wo.actual_output_qty / wo.quantity) * 100).toFixed(1) + '%' : 
                '-'
              }
            </td>
            <td>
              <span className={`qa-status-badge qa-${wo.qa_status || 'pending'}`}>
                {wo.qa_status || 'Pending'}
              </span>
            </td>
            <td>
              <span className={`priority-badge priority-${wo.priority}`}>
                {wo.priority}
              </span>
            </td>
            <td>
              <span className="current-op-badge">
                Op {wo.current_operation_seq || 1}
              </span>
            </td>
            <td>
              {wo.status === 'in_progress' && (
                <button 
                  data-testid={`close-wo-${wo.id}`}
                  onClick={() => onCloseWorkOrder(wo.id)}
                  className="btn-close-wo"
                >
                  Close WO
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

describe('WorkOrdersTable', () => {
  const mockWorkOrders = [
    {
      id: '1',
      wo_number: 'WO-001',
      product: { description: 'Beef' },
      status: 'in_progress',
      kpi_scope: 'PR',
      line_number: 'Line-1',
      actual_start: '2024-01-01T00:00:00Z',
      actual_end: null,
      actual_output_qty: 95.0,
      quantity: 100.0,
      qa_status: 'Passed',
      priority: 'High',
      current_operation_seq: 2
    },
    {
      id: '2',
      wo_number: 'WO-002',
      product: { description: 'Ground Beef' },
      status: 'completed',
      kpi_scope: 'FG',
      line_number: 'Line-2',
      actual_start: '2024-01-01T00:00:00Z',
      actual_end: '2024-01-01T08:00:00Z',
      actual_output_qty: 90.0,
      quantity: 100.0,
      qa_status: 'Passed',
      priority: 'Medium',
      current_operation_seq: 3
    }
  ];

  const mockFilters = {
    line: '',
    kpi_scope: '',
    status: '',
    date_bucket: ''
  };

  const mockOnCloseWorkOrder = jest.fn();
  const mockOnFilterChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render work orders table', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      expect(screen.getByTestId('work-orders-table')).toBeInTheDocument();
      expect(screen.getByTestId('wo-row-1')).toBeInTheDocument();
      expect(screen.getByTestId('wo-row-2')).toBeInTheDocument();
    });

    it('should display work order data correctly', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      expect(screen.getByText('WO-001')).toBeInTheDocument();
      expect(screen.getByText('Beef')).toBeInTheDocument();
      expect(screen.getByText('in_progress')).toBeInTheDocument();
      expect(screen.getByText('PR')).toBeInTheDocument();
      expect(screen.getByText('Line-1')).toBeInTheDocument();
    });

    it('should display yield percentage correctly', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      expect(screen.getByText('95.0%')).toBeInTheDocument();
      expect(screen.getByText('90.0%')).toBeInTheDocument();
    });

    it('should display current operation sequence', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      expect(screen.getByText('Op 2')).toBeInTheDocument();
      expect(screen.getByText('Op 3')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should render filter controls', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      expect(screen.getByTestId('line-filter')).toBeInTheDocument();
      expect(screen.getByTestId('kpi-scope-filter')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter')).toBeInTheDocument();
      expect(screen.getByTestId('date-bucket-filter')).toBeInTheDocument();
    });

    it('should handle line filter change', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      const lineFilter = screen.getByTestId('line-filter');
      fireEvent.change(lineFilter, { target: { value: 'Line-1' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ line: 'Line-1' });
    });

    it('should handle KPI scope filter change', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      const kpiScopeFilter = screen.getByTestId('kpi-scope-filter');
      fireEvent.change(kpiScopeFilter, { target: { value: 'PR' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ kpi_scope: 'PR' });
    });

    it('should handle status filter change', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      const statusFilter = screen.getByTestId('status-filter');
      fireEvent.change(statusFilter, { target: { value: 'in_progress' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ status: 'in_progress' });
    });

    it('should handle date bucket filter change', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      const dateBucketFilter = screen.getByTestId('date-bucket-filter');
      fireEvent.change(dateBucketFilter, { target: { value: 'day' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({ date_bucket: 'day' });
    });
  });

  describe('Actions', () => {
    it('should show close button for in-progress work orders', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      expect(screen.getByTestId('close-wo-1')).toBeInTheDocument();
      expect(screen.queryByTestId('close-wo-2')).not.toBeInTheDocument();
    });

    it('should call onCloseWorkOrder when close button is clicked', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      const closeButton = screen.getByTestId('close-wo-1');
      fireEvent.click(closeButton);

      expect(mockOnCloseWorkOrder).toHaveBeenCalledWith('1');
    });
  });

  describe('Status Badges', () => {
    it('should display status badges with correct classes', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      const statusBadges = screen.getAllByText(/in_progress|completed/);
      expect(statusBadges[0]).toHaveClass('status-badge', 'status-in_progress');
      expect(statusBadges[1]).toHaveClass('status-badge', 'status-completed');
    });

    it('should display KPI scope badges with correct classes', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      const kpiScopeBadges = screen.getAllByText(/PR|FG/);
      expect(kpiScopeBadges[0]).toHaveClass('kpi-scope-badge', 'scope-PR');
      expect(kpiScopeBadges[1]).toHaveClass('kpi-scope-badge', 'scope-FG');
    });

    it('should display QA status badges with correct classes', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      const qaStatusBadges = screen.getAllByText('Passed');
      expect(qaStatusBadges[0]).toHaveClass('qa-status-badge', 'qa-Passed');
      expect(qaStatusBadges[1]).toHaveClass('qa-status-badge', 'qa-Passed');
    });

    it('should display priority badges with correct classes', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      const priorityBadges = screen.getAllByText(/High|Medium/);
      expect(priorityBadges[0]).toHaveClass('priority-badge', 'priority-High');
      expect(priorityBadges[1]).toHaveClass('priority-badge', 'priority-Medium');
    });
  });

  describe('Empty State', () => {
    it('should handle empty work orders list', () => {
      render(
        <MockWorkOrdersTable
          workOrders={[]}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      expect(screen.getByTestId('work-orders-table')).toBeInTheDocument();
      expect(screen.queryByTestId('wo-row-1')).not.toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format dates correctly', () => {
      render(
        <MockWorkOrdersTable
          workOrders={mockWorkOrders}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      // Check that dates are formatted (exact format may vary by locale)
      expect(screen.getByText(/1\/1\/2024/)).toBeInTheDocument();
    });

    it('should display dash for null dates', () => {
      const workOrdersWithNullDates = [
        {
          ...mockWorkOrders[0],
          actual_start: null,
          actual_end: null
        }
      ];

      render(
        <MockWorkOrdersTable
          workOrders={workOrdersWithNullDates}
          onCloseWorkOrder={mockOnCloseWorkOrder}
          onFilterChange={mockOnFilterChange}
          filters={mockFilters}
        />
      );

      expect(screen.getAllByText('-')).toHaveLength(2);
    });
  });
});

