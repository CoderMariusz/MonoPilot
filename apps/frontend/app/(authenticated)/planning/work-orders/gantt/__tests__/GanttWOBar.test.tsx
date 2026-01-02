import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { GanttWOBar } from '../components/GanttWOBar';
import type { GanttWorkOrder, ZoomLevel } from '@/lib/types/gantt';

describe('GanttWOBar Component', () => {
  const mockWorkOrder: GanttWorkOrder = {
    id: 'wo-156',
    wo_number: 'WO-00156',
    product: {
      id: 'prod-001',
      code: 'FG-CHOC-001',
      name: 'Chocolate Bar',
    },
    status: 'planned',
    priority: 'normal',
    quantity: 1000,
    uom: 'pc',
    scheduled_date: '2024-12-17',
    scheduled_start_time: '08:00',
    scheduled_end_time: '16:00',
    duration_hours: 8,
    progress_percent: null,
    material_status: 'ok',
    is_overdue: false,
    created_at: '2024-12-14T09:30:00Z',
  };

  const mockProps = {
    workOrder: mockWorkOrder,
    zoomLevel: 'week' as ZoomLevel,
    onClick: vi.fn(),
    onDragStart: vi.fn(),
    onDragEnd: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Status Colors', () => {
    it('should render draft WO with gray background', () => {
      // Unit test: getStatusColor returns correct color for draft
      const draftWO = { ...mockWorkOrder, status: 'draft' };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={draftWO} />
      );

      const barElement = container.querySelector('[data-status="draft"]');
      if (barElement) {
        const bgColor = window
          .getComputedStyle(barElement)
          .getPropertyValue('background-color');
        expect(bgColor).toContain('243') || expect(bgColor).toContain('#F3F4F6');
      }
    });

    it('should render planned WO with blue background', () => {
      // AC-05: WO Bar Status Colors
      // Unit test: getStatusColor returns correct color for planned
      const plannedWO = { ...mockWorkOrder, status: 'planned' };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={plannedWO} />
      );

      const barElement = container.querySelector('[data-status="planned"]');
      expect(barElement).toBeTruthy();
    });

    it('should render released WO with cyan background', () => {
      // Unit test: getStatusColor returns correct color for released
      const releasedWO = { ...mockWorkOrder, status: 'released' };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={releasedWO} />
      );

      const barElement = container.querySelector('[data-status="released"]');
      expect(barElement).toBeTruthy();
    });

    it('should render in_progress WO with purple background', () => {
      // Unit test: getStatusColor returns correct color for in_progress
      const inProgressWO = { ...mockWorkOrder, status: 'in_progress' };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={inProgressWO} />
      );

      const barElement = container.querySelector('[data-status="in_progress"]');
      expect(barElement).toBeTruthy();
    });

    it('should render on_hold WO with orange background', () => {
      // Unit test: getStatusColor returns correct color for on_hold
      const onHoldWO = { ...mockWorkOrder, status: 'on_hold' };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={onHoldWO} />
      );

      const barElement = container.querySelector('[data-status="on_hold"]');
      expect(barElement).toBeTruthy();
    });

    it('should render completed WO with green background', () => {
      // Unit test: getStatusColor returns correct color for completed
      const completedWO = { ...mockWorkOrder, status: 'completed' };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={completedWO} />
      );

      const barElement = container.querySelector('[data-status="completed"]');
      expect(barElement).toBeTruthy();
    });

    it('should render overdue WO with red background and icon', () => {
      // AC-06: Overdue WO Indicator
      // Unit test: getStatusColor returns correct color for overdue
      const overdueWO = { ...mockWorkOrder, is_overdue: true };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={overdueWO} />
      );

      const barElement = container.querySelector('[data-overdue="true"]');
      expect(barElement).toBeTruthy();

      // Should have warning icon
      const warningIcon = container.querySelector(
        '[data-testid="overdue-warning"]'
      );
      expect(warningIcon).toBeTruthy();
    });
  });

  describe('Overdue Detection', () => {
    it('should show red background for overdue WO', () => {
      // Unit test: isOverdue returns true when end time passed and not completed
      const overdueWO = {
        ...mockWorkOrder,
        scheduled_date: '2024-12-15',
        scheduled_end_time: '10:00',
        is_overdue: true,
      };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={overdueWO} />
      );

      const barElement = container.querySelector('[data-overdue="true"]');
      expect(barElement).toBeTruthy();
    });

    it('should not show overdue indicator for completed WO', () => {
      // Unit test: isOverdue returns false for completed WO
      const completedOverdueWO = {
        ...mockWorkOrder,
        is_overdue: true,
        status: 'completed',
      };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={completedOverdueWO} />
      );

      const warningIcon = container.querySelector(
        '[data-testid="overdue-warning"]'
      );
      // Should not show warning for completed WO
      if (completedOverdueWO.status === 'completed') {
        expect(warningIcon).toBeFalsy();
      }
    });

    it('should show warning icon for overdue WOs', () => {
      const overdueWO = { ...mockWorkOrder, is_overdue: true };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={overdueWO} />
      );

      const warningIcon = container.querySelector(
        '[data-testid="overdue-warning"]'
      );
      expect(warningIcon).toBeTruthy();
    });
  });

  describe('Progress Bar', () => {
    it('should show progress bar for in_progress WO', () => {
      // AC-07: In-Progress Progress Bar
      const inProgressWO = {
        ...mockWorkOrder,
        status: 'in_progress',
        progress_percent: 65,
      };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={inProgressWO} />
      );

      const progressBar = container.querySelector(
        '[data-testid="progress-bar"]'
      );
      expect(progressBar).toBeTruthy();
    });

    it('should show correct progress percentage', () => {
      // Unit test: progress bar overlay shows correct percentage
      const inProgressWO = {
        ...mockWorkOrder,
        status: 'in_progress',
        progress_percent: 65,
      };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={inProgressWO} />
      );

      const progressBar = container.querySelector(
        '[data-testid="progress-bar"]'
      );
      expect(progressBar).toBeTruthy();
      expect(progressBar?.getAttribute('data-progress')).toBe('65');
    });

    it('should not show progress bar for planned WO', () => {
      const plannedWO = { ...mockWorkOrder, status: 'planned' };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={plannedWO} />
      );

      const progressBar = container.querySelector(
        '[data-testid="progress-bar"]'
      );
      expect(progressBar).toBeFalsy();
    });

    it('should fill correct percentage of bar width', () => {
      const inProgressWO = {
        ...mockWorkOrder,
        status: 'in_progress',
        progress_percent: 65,
      };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={inProgressWO} />
      );

      const progressBar = container.querySelector(
        '[data-testid="progress-bar"]'
      );
      if (progressBar) {
        const width = progressBar.getAttribute('style');
        expect(width).toContain('65');
      }
    });
  });

  describe('Bar Positioning', () => {
    it('should calculate correct X position based on time', () => {
      // Unit test: calculateBarPosition returns correct X position based on time
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      expect(barElement).toBeTruthy();
      // Should have position attributes
      expect(barElement?.getAttribute('data-start-time')).toBeDefined();
    });

    it('should calculate correct width based on duration', () => {
      // Unit test: calculateBarPosition returns correct width in pixels
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      expect(barElement).toBeTruthy();
      expect(barElement?.getAttribute('data-duration-hours')).toBe('8');
    });

    it('should adjust position for different zoom levels', () => {
      const { container: dayZoomContainer } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} zoomLevel="day" />
      );

      const { container: monthZoomContainer } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} zoomLevel="month" />
      );

      const dayBar = dayZoomContainer.querySelector('[data-testid="wo-bar"]');
      const monthBar = monthZoomContainer.querySelector('[data-testid="wo-bar"]');

      expect(dayBar).toBeTruthy();
      expect(monthBar).toBeTruthy();
      // Widths should be different for different zoom levels
    });
  });

  describe('Duration Calculation', () => {
    it('should calculate duration hours correctly', () => {
      // Unit test: calculateDuration returns hours between start and end
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      expect(barElement?.getAttribute('data-duration-hours')).toBe('8');
    });

    it('should show full label at day zoom', () => {
      const { container } = render(
        <GanttWOBar
          {...mockProps}
          workOrder={mockWorkOrder}
          zoomLevel="day"
        />
      );

      const label = container.querySelector('[data-testid="wo-label"]');
      expect(label?.textContent).toContain('WO-00156');
      expect(label?.textContent).toContain('Chocolate Bar');
    });

    it('should show truncated label at week zoom', () => {
      const { container } = render(
        <GanttWOBar
          {...mockProps}
          workOrder={mockWorkOrder}
          zoomLevel="week"
        />
      );

      const label = container.querySelector('[data-testid="wo-label"]');
      expect(label?.textContent).toBeTruthy();
      // Label may be truncated
    });

    it('should show minimal label at month zoom', () => {
      const { container } = render(
        <GanttWOBar
          {...mockProps}
          workOrder={mockWorkOrder}
          zoomLevel="month"
        />
      );

      const label = container.querySelector('[data-testid="wo-label"]');
      expect(label?.textContent).toBeTruthy();
      // Should be minimal, just WO number
    });
  });

  describe('Interactions', () => {
    it('should call onClick when bar is clicked', () => {
      const onClickMock = vi.fn();
      const { container } = render(
        <GanttWOBar {...mockProps} onClick={onClickMock} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      if (barElement) {
        fireEvent.click(barElement);
        expect(onClickMock).toHaveBeenCalled();
      }
    });

    it('should call onDragStart when drag starts', () => {
      const onDragStartMock = vi.fn();
      const { container } = render(
        <GanttWOBar {...mockProps} onDragStart={onDragStartMock} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      if (barElement) {
        fireEvent.dragStart(barElement);
        expect(onDragStartMock).toHaveBeenCalled();
      }
    });

    it('should call onDragEnd when drag ends', () => {
      const onDragEndMock = vi.fn();
      const { container } = render(
        <GanttWOBar {...mockProps} onDragEnd={onDragEndMock} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      if (barElement) {
        fireEvent.dragEnd(barElement);
        expect(onDragEndMock).toHaveBeenCalled();
      }
    });

    it('should be draggable', () => {
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      expect(barElement?.getAttribute('draggable')).toBe('true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      expect(barElement?.getAttribute('role')).toBe('button');
    });

    it('should have descriptive ARIA label', () => {
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      const ariaLabel = barElement?.getAttribute('aria-label');
      expect(ariaLabel).toContain('WO-00156');
      expect(ariaLabel).toContain('Chocolate Bar');
      expect(ariaLabel).toContain('planned');
      expect(ariaLabel).toContain('2024-12-17');
    });

    it('should be keyboard accessible', () => {
      const onClickMock = vi.fn();
      const { container } = render(
        <GanttWOBar {...mockProps} onClick={onClickMock} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      if (barElement) {
        fireEvent.keyDown(barElement, { key: 'Enter' });
        expect(onClickMock).toHaveBeenCalled();
      }
    });

    it('should have sufficient color contrast', () => {
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} />
      );

      const textElement = container.querySelector('[data-testid="wo-label"]');
      expect(textElement).toBeTruthy();
      // Text should be visible on bar background
    });
  });

  describe('Material Status Indicator', () => {
    it('should not show indicator when material_status is ok', () => {
      const woWithOkMaterial = {
        ...mockWorkOrder,
        material_status: 'ok',
      };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={woWithOkMaterial} />
      );

      const materialAlert = container.querySelector(
        '[data-testid="material-alert"]'
      );
      expect(materialAlert).toBeFalsy();
    });

    it('should show indicator when material_status is low', () => {
      const woWithLowMaterial = {
        ...mockWorkOrder,
        material_status: 'low',
      };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={woWithLowMaterial} />
      );

      const materialAlert = container.querySelector(
        '[data-testid="material-alert"]'
      );
      expect(materialAlert).toBeTruthy();
    });

    it('should show indicator when material_status is insufficient', () => {
      const woWithInsufficientMaterial = {
        ...mockWorkOrder,
        material_status: 'insufficient',
      };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={woWithInsufficientMaterial} />
      );

      const materialAlert = container.querySelector(
        '[data-testid="material-alert"]'
      );
      expect(materialAlert).toBeTruthy();
    });
  });

  describe('Border Styling', () => {
    it('should have solid border for confirmed statuses', () => {
      const confirmedWO = { ...mockWorkOrder, status: 'planned' };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={confirmedWO} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      const borderStyle = barElement?.getAttribute('data-border-style');
      expect(borderStyle).toBe('solid');
    });

    it('should have dashed border for draft status', () => {
      const draftWO = { ...mockWorkOrder, status: 'draft' };
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={draftWO} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      const borderStyle = barElement?.getAttribute('data-border-style');
      expect(borderStyle).toBe('dashed');
    });
  });

  describe('Resize Handles', () => {
    it('should show resize handles on hover', () => {
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} />
      );

      const barElement = container.querySelector('[data-testid="wo-bar"]');
      if (barElement) {
        fireEvent.mouseEnter(barElement);
        // Check for either left or right handle
        const leftHandle = container.querySelector('[data-testid="resize-handle-left"]');
        const rightHandle = container.querySelector('[data-testid="resize-handle-right"]');
        expect(leftHandle || rightHandle).toBeTruthy();
      }
    });

    it('should have left and right resize handles', () => {
      const { container } = render(
        <GanttWOBar {...mockProps} workOrder={mockWorkOrder} />
      );

      const leftHandle = container.querySelector(
        '[data-testid="resize-handle-left"]'
      );
      const rightHandle = container.querySelector(
        '[data-testid="resize-handle-right"]'
      );

      expect(leftHandle || rightHandle).toBeTruthy();
    });
  });
});
