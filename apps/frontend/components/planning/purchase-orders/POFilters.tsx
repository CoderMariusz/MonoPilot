/**
 * PO Filters Component
 * Story 03.3: PO CRUD + Lines
 * Search + status/supplier/date filters bar per PLAN-004
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { POStatus, POFilterParams } from '@/lib/types/purchase-order'
import { PO_STATUS_CONFIG } from '@/lib/types/purchase-order'
import type { Supplier } from '@/lib/types/supplier'
import type { Warehouse } from '@/lib/types/warehouse'

interface POFiltersProps {
  filters: POFilterParams
  onFilterChange: (filters: Partial<POFilterParams>) => void
  suppliers?: Supplier[]
  warehouses?: Warehouse[]
  isLoadingSuppliers?: boolean
  isLoadingWarehouses?: boolean
  className?: string
}

const STATUS_OPTIONS: POStatus[] = [
  'draft',
  'submitted',
  'pending_approval',
  'approved',
  'confirmed',
  'receiving',
  'closed',
  'cancelled',
]

const DATE_RANGE_OPTIONS = [
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom Range' },
]

export function POFilters({
  filters,
  onFilterChange,
  suppliers = [],
  warehouses = [],
  isLoadingSuppliers = false,
  isLoadingWarehouses = false,
  className,
}: POFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const [statusOpen, setStatusOpen] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange({ search: localSearch })
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, filters.search, onFilterChange])

  const handleStatusToggle = useCallback(
    (status: POStatus) => {
      const currentStatuses = filters.status || []
      const newStatuses = currentStatuses.includes(status)
        ? currentStatuses.filter((s) => s !== status)
        : [...currentStatuses, status]
      onFilterChange({ status: newStatuses })
    },
    [filters.status, onFilterChange]
  )

  const handleClearFilters = useCallback(() => {
    setLocalSearch('')
    onFilterChange({
      status: [],
      supplier_id: null,
      warehouse_id: null,
      date_range: null,
      from_date: null,
      to_date: null,
      search: '',
    })
  }, [onFilterChange])

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.supplier_id ||
    filters.warehouse_id ||
    filters.date_range ||
    filters.search

  const activeFilterCount = [
    filters.status.length > 0,
    !!filters.supplier_id,
    !!filters.warehouse_id,
    !!filters.date_range,
    !!filters.search,
  ].filter(Boolean).length

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main filters row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search PO number, supplier..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9 pr-8"
            aria-label="Search purchase orders"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Multi-Select */}
        <Popover open={statusOpen} onOpenChange={setStatusOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'min-w-[120px] justify-between',
                filters.status.length > 0 && 'border-blue-500'
              )}
              aria-label="Filter by status"
            >
              <span className="flex items-center gap-2">
                Status
                {filters.status.length > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {filters.status.length}
                  </Badge>
                )}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" align="start">
            <div className="space-y-1">
              {STATUS_OPTIONS.map((status) => {
                const config = PO_STATUS_CONFIG[status]
                const isSelected = filters.status.includes(status)
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusToggle(status)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors',
                      isSelected
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-100'
                    )}
                  >
                    <div
                      className={cn(
                        'w-4 h-4 rounded border flex items-center justify-center',
                        isSelected
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      )}
                    >
                      {isSelected && (
                        <svg
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(config.bgColor, config.textColor, 'text-xs')}
                    >
                      {config.label}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>

        {/* Supplier Select */}
        <Select
          value={filters.supplier_id || 'all'}
          onValueChange={(value) =>
            onFilterChange({ supplier_id: value === 'all' ? null : value })
          }
        >
          <SelectTrigger
            className={cn(
              'w-[180px]',
              filters.supplier_id && 'border-blue-500'
            )}
            aria-label="Filter by supplier"
          >
            <SelectValue placeholder="All Suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {isLoadingSuppliers ? (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            ) : (
              suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>

        {/* Date Range Select */}
        <Select
          value={filters.date_range || 'all'}
          onValueChange={(value) =>
            onFilterChange({
              date_range: value === 'all' ? null : (value as POFilterParams['date_range']),
            })
          }
        >
          <SelectTrigger
            className={cn(
              'w-[160px]',
              filters.date_range && 'border-blue-500'
            )}
            aria-label="Filter by date range"
          >
            <SelectValue placeholder="All Dates" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dates</SelectItem>
            {DATE_RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Active filter badges (mobile-friendly display) */}
      {filters.status.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {filters.status.map((status) => {
            const config = PO_STATUS_CONFIG[status]
            return (
              <Badge
                key={status}
                variant="secondary"
                className={cn(
                  config.bgColor,
                  config.textColor,
                  'text-xs pr-1 gap-1'
                )}
              >
                {config.label}
                <button
                  type="button"
                  onClick={() => handleStatusToggle(status)}
                  className="hover:bg-black/10 rounded p-0.5"
                  aria-label={`Remove ${config.label} filter`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default POFilters
