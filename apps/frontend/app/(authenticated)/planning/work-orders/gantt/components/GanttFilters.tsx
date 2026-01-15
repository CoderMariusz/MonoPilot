'use client';

/**
 * GanttFilters Component (Story 03.15)
 * Filter controls for Gantt chart
 *
 * Features:
 * - Date range selector with presets (Today, This Week, This Month, Custom)
 * - Status multi-select dropdown
 * - Production line multi-select dropdown
 * - Search input (WO number, product name)
 * - View by toggle (Line / Machine)
 * - Zoom level buttons (moved to separate component)
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, Filter, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { GanttFilters, ViewBy, WOStatus } from '@/lib/types/gantt';

interface GanttFiltersProps {
  filters: GanttFilters;
  onChange: (filters: GanttFilters) => void;
  productionLines?: Array<{ id: string; name: string }>;
  products?: Array<{ id: string; name: string }>;
  isLoading?: boolean;
}

const STATUS_OPTIONS: { value: WOStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'planned', label: 'Planned' },
  { value: 'released', label: 'Released' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
];

const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'next_week', label: 'Next Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
];

export function GanttFilters({
  filters,
  onChange,
  productionLines = [],
  products = [],
  isLoading,
}: GanttFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [datePreset, setDatePreset] = useState('this_week');
  const [statusOpen, setStatusOpen] = useState(false);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== filters.search) {
        onChange({ ...filters, search: searchValue || undefined });
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, filters, onChange]);

  // Handle view by change
  const handleViewByChange = (viewBy: ViewBy) => {
    onChange({ ...filters, view_by: viewBy });
  };

  // Handle status toggle
  const handleStatusToggle = (status: WOStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    onChange({ ...filters, status: newStatuses });
  };

  // Handle line selection
  const handleLineChange = (lineId: string) => {
    onChange({
      ...filters,
      line_id: lineId === 'all' ? undefined : lineId,
    });
  };

  // Handle date preset change
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);

    const today = new Date();
    let fromDate: Date;
    let toDate: Date;

    switch (preset) {
      case 'today':
        fromDate = toDate = today;
        break;
      case 'this_week': {
        const dayOfWeek = today.getDay();
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
        toDate = new Date(fromDate);
        toDate.setDate(fromDate.getDate() + 6);
        break;
      }
      case 'next_week': {
        const nextMonday = new Date(today);
        const currentDayOfWeek = today.getDay();
        const daysUntilNextMonday = currentDayOfWeek === 0 ? 1 : 8 - currentDayOfWeek;
        nextMonday.setDate(today.getDate() + daysUntilNextMonday);
        fromDate = nextMonday;
        toDate = new Date(nextMonday);
        toDate.setDate(nextMonday.getDate() + 6);
        break;
      }
      case 'this_month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;
      default:
        // Custom - don't change dates
        return;
    }

    onChange({
      ...filters,
      from_date: fromDate.toISOString().split('T')[0],
      to_date: toDate.toISOString().split('T')[0],
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchValue('');
    setDatePreset('this_week');
    onChange({
      view_by: 'line',
      status: ['planned', 'released', 'in_progress', 'on_hold'],
      from_date: undefined,
      to_date: undefined,
      line_id: undefined,
      product_id: undefined,
      search: undefined,
    });
  };

  // Count active filters
  const activeFilterCount = [
    filters.search,
    filters.line_id,
    filters.product_id,
    (filters.status?.length || 0) < 6 ? filters.status : null,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Main filter row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search WO number or product..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-9 pr-9"
            data-testid="search-input"
            disabled={isLoading}
          />
          {searchValue && (
            <button
              onClick={() => setSearchValue('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date range dropdown */}
        <Select
          value={datePreset}
          onValueChange={handleDatePresetChange}
          data-testid="date-range-dropdown"
        >
          <SelectTrigger className="w-[150px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            {DATE_PRESETS.map((preset) => (
              <SelectItem
                key={preset.value}
                value={preset.value}
                data-testid={`date-range-${preset.value.replace('_', '-')}`}
              >
                {preset.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="min-w-[120px]"
              data-testid="status-filter"
            >
              <Filter className="h-4 w-4 mr-2" />
              Status
              {filters.status && filters.status.length > 0 && filters.status.length < 6 && (
                <Badge variant="secondary" className="ml-2">
                  {filters.status.length}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-2" align="start">
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                >
                  <Checkbox
                    checked={filters.status?.includes(option.value) || false}
                    onCheckedChange={() => handleStatusToggle(option.value)}
                    data-testid={`status-${option.value.replace('_', '-')}`}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
              <hr className="my-2" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setStatusOpen(false)}
                data-testid="filter-apply"
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Line filter */}
        <Select
          value={filters.line_id || 'all'}
          onValueChange={handleLineChange}
          data-testid="line-filter"
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Lines" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Lines</SelectItem>
            {productionLines.map((line) => (
              <SelectItem
                key={line.id}
                value={line.id}
                data-testid={`line-option-${line.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {line.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View by toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <Button
            variant={filters.view_by === 'line' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewByChange('line')}
            className={cn(
              'text-sm',
              filters.view_by === 'line' && 'bg-white shadow-sm'
            )}
          >
            Line
          </Button>
          <Button
            variant={filters.view_by === 'machine' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleViewByChange('machine')}
            className={cn(
              'text-sm',
              filters.view_by === 'machine' && 'bg-white shadow-sm'
            )}
          >
            Machine
          </Button>
        </div>

        {/* Clear filters */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-500"
          >
            <X className="h-4 w-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {(filters.search || filters.line_id) && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.search && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.search}
              <button
                onClick={() => {
                  setSearchValue('');
                  onChange({ ...filters, search: undefined });
                }}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.line_id && (
            <Badge variant="secondary" className="gap-1">
              Line: {productionLines.find((l) => l.id === filters.line_id)?.name}
              <button
                onClick={() => onChange({ ...filters, line_id: undefined })}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

export default GanttFilters;
