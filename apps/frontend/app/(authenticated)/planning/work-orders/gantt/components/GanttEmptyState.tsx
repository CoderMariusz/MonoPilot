'use client';

/**
 * GanttEmptyState Component (Story 03.15)
 * Empty state when no WOs are scheduled
 *
 * Features:
 * - Calendar icon
 * - "No Work Orders Scheduled" message
 * - Create First Work Order button
 * - Switch to List View link
 */

import React from 'react';
import { Calendar, Plus, List, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface GanttEmptyStateProps {
  onCreateClick?: () => void;
  type?: 'no_data' | 'filtered_empty';
  onClearFilters?: () => void;
}

export function GanttEmptyState({
  onCreateClick,
  type = 'no_data',
  onClearFilters,
}: GanttEmptyStateProps) {
  const isFiltered = type === 'filtered_empty';

  return (
    <div
      data-testid="empty-state"
      className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg border border-gray-200 p-8"
    >
      {/* Icon */}
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Calendar className="w-8 h-8 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {isFiltered
          ? 'No Matching Work Orders'
          : 'No Work Orders Scheduled'}
      </h3>

      {/* Description */}
      <p className="text-gray-500 text-center max-w-md mb-6">
        {isFiltered
          ? 'No work orders found matching your current filters. Try adjusting your filters or clear them to see all work orders.'
          : 'No work orders found for the selected date range. Create work orders and schedule them to production lines.'}
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
        {isFiltered ? (
          <Button
            variant="outline"
            onClick={onClearFilters}
            data-testid="clear-filters-btn"
          >
            Clear Filters
          </Button>
        ) : (
          <Button
            onClick={onCreateClick}
            data-testid="create-first-wo-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Work Order
          </Button>
        )}

        <Link href="/planning/work-orders">
          <Button
            variant="ghost"
            className="text-blue-600"
            data-testid="switch-to-list-view"
          >
            <List className="w-4 h-4 mr-2" />
            Switch to List View
          </Button>
        </Link>
      </div>

      {/* Quick Tip */}
      {!isFiltered && (
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-lg p-4 max-w-lg">
          <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 font-medium mb-1">Quick Tip</p>
            <p className="text-sm text-blue-700">
              Use the Gantt view to visualize line capacity and avoid scheduling
              conflicts. Drag & drop work orders to reschedule them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default GanttEmptyState;
