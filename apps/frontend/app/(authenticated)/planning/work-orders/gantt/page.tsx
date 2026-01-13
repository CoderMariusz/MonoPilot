'use client';

/**
 * WO Gantt Chart Page (Story 03.15)
 * Main Gantt chart page with filters and controls
 *
 * Features:
 * - Gantt chart visualization
 * - Filter controls (date range, status, line, search)
 * - Zoom level controls (Day, Week, Month)
 * - Legend
 * - Export to PDF
 * - All 4 states: Loading, Empty, Error, Success
 * - Responsive: Desktop Gantt, Mobile list view
 * - WCAG 2.1 AA compliant
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { List, Settings, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PlanningHeader } from '@/components/planning/PlanningHeader';
import { useGanttData } from '@/lib/hooks/use-gantt-data';
import { useGanttZoom } from '@/lib/hooks/use-gantt-zoom';
import { useRescheduleWO } from '@/lib/hooks/use-reschedule-wo';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import type { GanttFilters, GanttWorkOrder, DragPosition, ZoomLevel } from '@/lib/types/gantt';
import { getDefaultDateRange } from '@/lib/types/gantt';

import {
  GanttChart,
  GanttFilters as GanttFiltersComponent,
  GanttLegend,
  GanttExportButton,
  GanttEmptyState,
  GanttErrorState,
  GanttLoadingState,
  GanttMobileView,
  GanttQuickView,
} from './components';

// Default filters
const DEFAULT_STATUS_FILTER = ['planned', 'released', 'in_progress', 'on_hold'];

export default function GanttPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if mobile
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Zoom level state (persisted)
  const { zoomLevel, setZoomLevel } = useGanttZoom('week');

  // Reference data
  const [productionLines, setProductionLines] = useState<Array<{ id: string; name: string }>>([]);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);

  // Initialize filters from URL or defaults
  const defaultDateRange = getDefaultDateRange('week');
  const [filters, setFilters] = useState<GanttFilters>({
    view_by: (searchParams.get('view_by') as 'line' | 'machine') || 'line',
    status: searchParams.get('status')?.split(',').filter(Boolean) || DEFAULT_STATUS_FILTER,
    line_id: searchParams.get('line_id') || undefined,
    product_id: searchParams.get('product_id') || undefined,
    search: searchParams.get('search') || undefined,
    from_date: searchParams.get('from_date') || defaultDateRange.from_date,
    to_date: searchParams.get('to_date') || defaultDateRange.to_date,
  });

  // Quick view state
  const [selectedWO, setSelectedWO] = useState<GanttWorkOrder | null>(null);

  // Fetch Gantt data
  const { data, isLoading, error, refetch } = useGanttData(filters);

  // Reschedule mutation
  const rescheduleMutation = useRescheduleWO();

  // Fetch reference data
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [linesRes, productsRes] = await Promise.all([
          fetch('/api/settings/production-lines?is_active=true&limit=500'),
          fetch('/api/technical/products?type=FG&limit=500'),
        ]);

        if (linesRes.ok) {
          const data = await linesRes.json();
          setProductionLines(data.production_lines || data.data || []);
        }

        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };

    fetchReferenceData();
  }, []);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: GanttFilters) => {
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.view_by) params.set('view_by', newFilters.view_by);
    if (newFilters.status?.length) params.set('status', newFilters.status.join(','));
    if (newFilters.line_id) params.set('line_id', newFilters.line_id);
    if (newFilters.product_id) params.set('product_id', newFilters.product_id);
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.from_date) params.set('from_date', newFilters.from_date);
    if (newFilters.to_date) params.set('to_date', newFilters.to_date);

    const queryString = params.toString();
    router.replace(`/planning/work-orders/gantt${queryString ? `?${queryString}` : ''}`, {
      scroll: false,
    });
  }, [router]);

  // Handle reschedule from drag-drop
  const handleReschedule = useCallback(
    async (wo: GanttWorkOrder, newPosition: DragPosition) => {
      await rescheduleMutation.mutateAsync({
        woId: wo.id,
        params: {
          scheduled_date: newPosition.date,
          scheduled_start_time: newPosition.startTime,
          scheduled_end_time: newPosition.endTime,
          production_line_id: newPosition.swimlaneId,
        },
      });
    },
    [rescheduleMutation]
  );

  // Handle WO click (for quick view)
  const handleWOClick = useCallback((wo: GanttWorkOrder) => {
    setSelectedWO(wo);
  }, []);

  // Handle create WO
  const handleCreateWO = useCallback(() => {
    router.push('/planning/work-orders?create=true');
  }, [router]);

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    const defaultRange = getDefaultDateRange('week');
    handleFiltersChange({
      view_by: 'line',
      status: DEFAULT_STATUS_FILTER,
      from_date: defaultRange.from_date,
      to_date: defaultRange.to_date,
    });
  }, [handleFiltersChange]);

  // Determine empty state type
  const isEmpty = !isLoading && !error && (!data?.swimlanes || data.swimlanes.length === 0);
  const hasActiveFilters =
    filters.search ||
    filters.line_id ||
    filters.product_id ||
    (filters.status?.length || 0) < DEFAULT_STATUS_FILTER.length;
  const isFilteredEmpty = isEmpty && hasActiveFilters;

  return (
    <div className="min-h-screen bg-gray-50">
      <PlanningHeader currentPage="wo" />

      <div className="px-4 md:px-6 py-6 space-y-4 max-w-[1800px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Schedule View</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                Gantt
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Visual scheduling of work orders on production lines
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Switch to List View */}
            <Link href="/planning/work-orders">
              <Button variant="outline" size="sm">
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
            </Link>

            {/* Export */}
            <GanttExportButton filters={filters} disabled={isLoading || !!error} />

            {/* Settings placeholder */}
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>

            {/* Create WO */}
            <Button onClick={handleCreateWO}>
              <Plus className="h-4 w-4 mr-2" />
              Create WO
            </Button>
          </div>
        </div>

        {/* Filters */}
        <GanttFiltersComponent
          filters={filters}
          onChange={handleFiltersChange}
          productionLines={productionLines}
          products={products}
          isLoading={isLoading}
        />

        {/* Legend */}
        <GanttLegend collapsible={isMobile} />

        {/* Content */}
        {isLoading ? (
          <GanttLoadingState />
        ) : error ? (
          <GanttErrorState
            onRetry={() => refetch()}
            errorMessage={error.message}
          />
        ) : isEmpty ? (
          <GanttEmptyState
            type={isFilteredEmpty ? 'filtered_empty' : 'no_data'}
            onCreateClick={handleCreateWO}
            onClearFilters={handleClearFilters}
          />
        ) : isMobile ? (
          <GanttMobileView
            data={data!}
            onWOClick={handleWOClick}
            onWOReschedule={(wo) => setSelectedWO(wo)}
          />
        ) : (
          <div className="bg-white rounded-lg border shadow-sm min-h-[500px]">
            <GanttChart
              data={data!}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
              onReschedule={handleReschedule}
            />
          </div>
        )}
      </div>

      {/* Quick View (for mobile) */}
      <GanttQuickView
        workOrder={selectedWO}
        onClose={() => setSelectedWO(null)}
      />
    </div>
  );
}
