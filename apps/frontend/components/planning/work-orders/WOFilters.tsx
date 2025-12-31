/**
 * WO Filters Component
 * Story 03.10: Work Order CRUD
 * Search and filter controls per PLAN-013
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { WOStatus, WOPriority } from '@/lib/types/work-order'
import { WO_STATUS_CONFIG, WO_PRIORITY_CONFIG } from '@/lib/types/work-order'

export interface WOFiltersState {
  search: string
  status: string[]
  product_id: string | null
  line_id: string | null
  priority: WOPriority | null
  date_from: string | null
  date_to: string | null
}

interface WOFiltersProps {
  filters: WOFiltersState
  onFiltersChange: (filters: WOFiltersState) => void
  products?: Array<{ id: string; code: string; name: string }>
  productionLines?: Array<{ id: string; code: string; name: string }>
  isLoading?: boolean
  className?: string
}

const STATUS_OPTIONS: WOStatus[] = [
  'draft',
  'planned',
  'released',
  'in_progress',
  'on_hold',
  'completed',
  'closed',
  'cancelled',
]

const PRIORITY_OPTIONS: WOPriority[] = ['low', 'normal', 'high', 'critical']

export function WOFilters({
  filters,
  onFiltersChange,
  products = [],
  productionLines = [],
  isLoading = false,
  className,
}: WOFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch })
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [localSearch])

  // Update local search when filters change externally
  useEffect(() => {
    setLocalSearch(filters.search)
  }, [filters.search])

  const handleStatusChange = useCallback(
    (status: WOStatus) => {
      const newStatuses = filters.status.includes(status)
        ? filters.status.filter((s) => s !== status)
        : [...filters.status, status]
      onFiltersChange({ ...filters, status: newStatuses })
    },
    [filters, onFiltersChange]
  )

  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      search: '',
      status: [],
      product_id: null,
      line_id: null,
      priority: null,
      date_from: null,
      date_to: null,
    })
    setLocalSearch('')
  }, [onFiltersChange])

  const activeFilterCount =
    (filters.search ? 1 : 0) +
    filters.status.length +
    (filters.product_id ? 1 : 0) +
    (filters.line_id ? 1 : 0) +
    (filters.priority ? 1 : 0) +
    (filters.date_from || filters.date_to ? 1 : 0)

  const renderFilterContent = () => (
    <div className="flex flex-wrap gap-3">
      {/* Status Multi-Select */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'min-w-[140px] justify-between',
              filters.status.length > 0 && 'border-blue-500'
            )}
          >
            <span className="truncate">
              {filters.status.length === 0
                ? 'Status: All'
                : filters.status.length === 1
                ? WO_STATUS_CONFIG[filters.status[0] as WOStatus]?.label
                : `${filters.status.length} selected`}
            </span>
            <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            {STATUS_OPTIONS.map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-gray-100',
                  filters.status.includes(status) && 'bg-blue-50'
                )}
              >
                <div
                  className={cn(
                    'w-4 h-4 rounded border flex items-center justify-center',
                    filters.status.includes(status)
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'border-gray-300'
                  )}
                >
                  {filters.status.includes(status) && (
                    <svg
                      className="w-3 h-3"
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
                  className={cn(
                    WO_STATUS_CONFIG[status]?.bgColor,
                    WO_STATUS_CONFIG[status]?.textColor,
                    'text-xs font-medium border-0'
                  )}
                >
                  {WO_STATUS_CONFIG[status]?.label}
                </Badge>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Product Filter */}
      <Select
        value={filters.product_id || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            product_id: value === 'all' ? null : value,
          })
        }
      >
        <SelectTrigger
          className={cn(
            'w-[180px]',
            filters.product_id && 'border-blue-500'
          )}
        >
          <SelectValue placeholder="Product: All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Product: All</SelectItem>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id}>
              {product.code} - {product.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Production Line Filter */}
      <Select
        value={filters.line_id || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            line_id: value === 'all' ? null : value,
          })
        }
      >
        <SelectTrigger
          className={cn(
            'w-[180px]',
            filters.line_id && 'border-blue-500'
          )}
        >
          <SelectValue placeholder="Line: All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Line: All</SelectItem>
          {productionLines.map((line) => (
            <SelectItem key={line.id} value={line.id}>
              {line.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select
        value={filters.priority || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            priority: value === 'all' ? null : (value as WOPriority),
          })
        }
      >
        <SelectTrigger
          className={cn(
            'w-[140px]',
            filters.priority && 'border-blue-500'
          )}
        >
          <SelectValue placeholder="Priority: All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Priority: All</SelectItem>
          {PRIORITY_OPTIONS.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {WO_PRIORITY_CONFIG[priority]?.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Date Range */}
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={filters.date_from || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, date_from: e.target.value || null })
          }
          className={cn(
            'w-[140px]',
            filters.date_from && 'border-blue-500'
          )}
          placeholder="From"
        />
        <span className="text-gray-400">-</span>
        <Input
          type="date"
          value={filters.date_to || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, date_to: e.target.value || null })
          }
          className={cn(
            'w-[140px]',
            filters.date_to && 'border-blue-500'
          )}
          placeholder="To"
        />
      </div>
    </div>
  )

  return (
    <div className={cn('space-y-4', className)}>
      {/* Desktop Layout */}
      <div className="hidden md:flex flex-wrap items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by WO number or product..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10 pr-10"
            disabled={isLoading}
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('')
                onFiltersChange({ ...filters, search: '' })
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {renderFilterContent()}

        {/* Clear All */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear All ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
            disabled={isLoading}
          />
        </div>

        {/* Collapsible Filters */}
        <Collapsible open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                )}
              </span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  mobileFiltersOpen && 'rotate-180'
                )}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-3">
              {renderFilterContent()}
              {activeFilterCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-gray-500">Active Filters:</span>
          {filters.search && (
            <Badge variant="outline" className="gap-1">
              Search: "{filters.search}"
              <button
                onClick={() => {
                  setLocalSearch('')
                  onFiltersChange({ ...filters, search: '' })
                }}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status.map((status) => (
            <Badge key={status} variant="outline" className="gap-1">
              {WO_STATUS_CONFIG[status as WOStatus]?.label}
              <button
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    status: filters.status.filter((s) => s !== status),
                  })
                }
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.product_id && (
            <Badge variant="outline" className="gap-1">
              Product:{' '}
              {products.find((p) => p.id === filters.product_id)?.code || 'Selected'}
              <button
                onClick={() => onFiltersChange({ ...filters, product_id: null })}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.line_id && (
            <Badge variant="outline" className="gap-1">
              Line:{' '}
              {productionLines.find((l) => l.id === filters.line_id)?.name || 'Selected'}
              <button
                onClick={() => onFiltersChange({ ...filters, line_id: null })}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.priority && (
            <Badge variant="outline" className="gap-1">
              {WO_PRIORITY_CONFIG[filters.priority]?.label}
              <button
                onClick={() => onFiltersChange({ ...filters, priority: null })}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(filters.date_from || filters.date_to) && (
            <Badge variant="outline" className="gap-1">
              Date: {filters.date_from || '...'} - {filters.date_to || '...'}
              <button
                onClick={() =>
                  onFiltersChange({ ...filters, date_from: null, date_to: null })
                }
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}

export default WOFilters
