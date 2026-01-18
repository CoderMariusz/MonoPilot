/**
 * Inventory Overview Filters Component
 * Wireframe: WH-INV-001 - Overview Tab
 * PRD: FR-WH Inventory Visibility
 *
 * Filter controls for inventory overview:
 * - Warehouse dropdown
 * - Location dropdown
 * - Product search
 * - Date range picker
 * - Status dropdown
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-new'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import type { InventoryFilters, InventoryStatus } from '@/lib/types/inventory-overview'
import type { Warehouse } from '@/lib/types/warehouse'
import type { Location } from '@/lib/types/location'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { useMediaQuery } from '@/lib/hooks/use-media-query'

// =============================================================================
// Types
// =============================================================================

interface InventoryOverviewFiltersProps {
  filters: InventoryFilters
  onFiltersChange: (filters: Partial<InventoryFilters>) => void
  onClearAll: () => void
  warehouses: Warehouse[]
  locations: Location[]
  isLoadingWarehouses?: boolean
  isLoadingLocations?: boolean
  disabled?: boolean
}

// =============================================================================
// Constants
// =============================================================================

const STATUS_OPTIONS: { value: InventoryStatus; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'blocked', label: 'Blocked' },
]

// =============================================================================
// Loading Skeleton
// =============================================================================

function FiltersSkeleton() {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card" data-testid="filters-skeleton">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Component
// =============================================================================

export function InventoryOverviewFilters({
  filters,
  onFiltersChange,
  onClearAll,
  warehouses,
  locations,
  isLoadingWarehouses = false,
  isLoadingLocations = false,
  disabled = false,
}: InventoryOverviewFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Sync search value with filters
  useEffect(() => {
    setSearchValue(filters.search || '')
  }, [filters.search])

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)

    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }

    const timeout = setTimeout(() => {
      onFiltersChange({ search: value })
    }, 300)

    setSearchTimeout(timeout)
  }, [onFiltersChange, searchTimeout])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // Check if any filters are active
  const hasActiveFilters =
    filters.warehouse_id ||
    filters.location_id ||
    filters.status !== 'available' ||
    filters.search ||
    filters.date_from ||
    filters.date_to

  // Filter locations by selected warehouse
  const filteredLocations = filters.warehouse_id
    ? locations.filter(loc => loc.warehouse_id === filters.warehouse_id)
    : locations

  // Loading state
  if (isLoadingWarehouses && isLoadingLocations) {
    return <FiltersSkeleton />
  }

  // Filter content
  const filterContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Warehouse Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-warehouse" className="text-sm font-medium">
          Warehouse
        </Label>
        <Select
          value={filters.warehouse_id || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              warehouse_id: value === 'all' ? undefined : value,
              location_id: undefined, // Reset location when warehouse changes
            })
          }
          disabled={disabled}
          name="warehouse"
        >
          <SelectTrigger id="filter-warehouse" data-testid="filter-warehouse">
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-location" className="text-sm font-medium">
          Location
        </Label>
        <Select
          value={filters.location_id || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ location_id: value === 'all' ? undefined : value })
          }
          disabled={disabled || !filters.warehouse_id}
          name="location"
        >
          <SelectTrigger id="filter-location" data-testid="filter-location">
            <SelectValue placeholder={filters.warehouse_id ? 'All Locations' : 'Select Warehouse First'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {filteredLocations.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.code} - {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label htmlFor="filter-status" className="text-sm font-medium">
          Status
        </Label>
        <Select
          value={filters.status}
          onValueChange={(value) => onFiltersChange({ status: value as InventoryStatus })}
          disabled={disabled}
          name="status"
        >
          <SelectTrigger id="filter-status" data-testid="filter-status">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="filter-search" className="text-sm font-medium">
          Search
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="filter-search"
            type="text"
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
            disabled={disabled}
            data-testid="filter-search"
            aria-label="Search products"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <Label className="text-sm font-medium opacity-0">Actions</Label>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={onClearAll}
            disabled={disabled || !hasActiveFilters}
            className="flex-1"
            data-testid="clear-filters"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  )

  // Mobile: Collapsible accordion
  if (isMobile) {
    return (
      <div className="border rounded-lg bg-card" data-testid="inventory-overview-filters">
        <Accordion type="single" collapsible defaultValue="">
          <AccordionItem value="filters" className="border-0">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filters</span>
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                    Active
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {filterContent}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    )
  }

  // Desktop: Always visible
  return (
    <div
      className="space-y-4 p-4 border rounded-lg bg-card"
      data-testid="inventory-overview-filters"
    >
      {filterContent}
    </div>
  )
}
