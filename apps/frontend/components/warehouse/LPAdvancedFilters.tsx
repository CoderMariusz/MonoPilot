/**
 * LP Advanced Filters Component
 * Story 05.5: LP Search & Filters
 *
 * Features:
 * - Slide-in panel (desktop/tablet) or modal (mobile)
 * - 8 filter types (product, warehouse, location, status, QA, expiry, batch)
 * - Multi-select for products, locations, statuses, QA statuses
 * - Single-select for warehouse
 * - Date pickers for expiry range
 * - Text input for batch number
 * - Filter presets section
 * - Apply and Clear All buttons
 */

'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import type { LPFilterParams, LPStatus, QAStatus } from '@/lib/types/license-plate'

export interface Product {
  id: string
  name: string
  code: string
  lp_count?: number
}

export interface Warehouse {
  id: string
  name: string
  code: string
}

export interface Location {
  id: string
  full_path: string
  location_code?: string
  lp_count?: number
}

export interface LPAdvancedFiltersProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: LPFilterParams
  onFiltersChange: (filters: LPFilterParams) => void
  onApply: () => void
  onClearAll: () => void
  products?: Product[]
  warehouses?: Warehouse[]
  locations?: Location[]
  isLoadingProducts?: boolean
  isLoadingWarehouses?: boolean
  isLoadingLocations?: boolean
}

const STATUS_OPTIONS: { value: LPStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'consumed', label: 'Consumed' },
  { value: 'blocked', label: 'Blocked' },
]

const QA_STATUS_OPTIONS: { value: QAStatus; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'passed', label: 'Passed' },
  { value: 'failed', label: 'Failed' },
  { value: 'quarantine', label: 'Quarantine' },
]

export function LPAdvancedFilters({
  open,
  onOpenChange,
  filters,
  onFiltersChange,
  onApply,
  onClearAll,
  products = [],
  warehouses = [],
  locations = [],
  isLoadingProducts = false,
  isLoadingWarehouses = false,
  isLoadingLocations = false,
}: LPAdvancedFiltersProps) {
  const [localFilters, setLocalFilters] = useState<LPFilterParams>(filters)

  // Sync local filters with prop filters when panel opens
  useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  const handleLocalFilterChange = (updates: Partial<LPFilterParams>) => {
    setLocalFilters((prev) => ({ ...prev, ...updates }))
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onApply()
  }

  const handleClearAll = () => {
    const clearedFilters: LPFilterParams = {
      status: [],
      qa_status: [],
      warehouse_id: null,
      location_id: null,
      product_id: null,
      search: '',
      expiry_before: null,
      expiry_after: null,
    }
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    onClearAll()
  }

  const handleStatusToggle = (status: LPStatus) => {
    const currentStatuses = localFilters.status || []
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status]
    handleLocalFilterChange({ status: newStatuses })
  }

  const handleQAStatusToggle = (qaStatus: QAStatus) => {
    const currentQAStatuses = localFilters.qa_status || []
    const newQAStatuses = currentQAStatuses.includes(qaStatus)
      ? currentQAStatuses.filter((s) => s !== qaStatus)
      : [...currentQAStatuses, qaStatus]
    handleLocalFilterChange({ qa_status: newQAStatuses })
  }

  const handleProductToggle = (productId: string) => {
    // For now, single select. Multi-select would need product_ids array
    handleLocalFilterChange({ product_id: productId === localFilters.product_id ? null : productId })
  }

  const handleLocationToggle = (locationId: string) => {
    // For now, single select. Multi-select would need location_ids array
    handleLocalFilterChange({ location_id: locationId === localFilters.location_id ? null : locationId })
  }

  const activeFilterCount =
    (localFilters.status?.length || 0) +
    (localFilters.qa_status?.length || 0) +
    (localFilters.warehouse_id ? 1 : 0) +
    (localFilters.location_id ? 1 : 0) +
    (localFilters.product_id ? 1 : 0) +
    (localFilters.search ? 1 : 0) +
    (localFilters.expiry_before ? 1 : 0) +
    (localFilters.expiry_after ? 1 : 0)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="gap-2"
          aria-label={`Open filters panel, ${activeFilterCount} filters active`}
          aria-expanded={open}
          aria-controls="filter-panel"
          data-testid="open-filters-button"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        id="filter-panel"
        side="left"
        className="w-full sm:w-[400px] overflow-y-auto"
        role="region"
        aria-label="Advanced filters"
        data-testid="filter-panel"
      >
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Filter license plates by multiple criteria
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* LP Number/Batch Search */}
          <div>
            <Label htmlFor="filter-batch">LP Number / Batch</Label>
            <Input
              id="filter-batch"
              type="text"
              placeholder="Search LP or batch..."
              value={localFilters.search || ''}
              onChange={(e) => handleLocalFilterChange({ search: e.target.value })}
              className="mt-2"
              data-testid="filter-batch-input"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Prefix match for LP, exact match for batch
            </p>
          </div>

          {/* Product Filter */}
          <div>
            <Label>Product</Label>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
              {isLoadingProducts ? (
                <p className="text-sm text-muted-foreground">Loading products...</p>
              ) : products.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products available</p>
              ) : (
                products.slice(0, 10).map((product) => (
                  <div key={product.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`product-${product.id}`}
                      checked={localFilters.product_id === product.id}
                      onCheckedChange={() => handleProductToggle(product.id)}
                      data-testid={`filter-product-${product.code}`}
                    />
                    <label
                      htmlFor={`product-${product.id}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {product.name}
                      {product.lp_count !== undefined && (
                        <span className="text-muted-foreground ml-1">({product.lp_count})</span>
                      )}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Warehouse Filter */}
          <div>
            <Label>Warehouse</Label>
            <RadioGroup
              value={localFilters.warehouse_id || 'all'}
              onValueChange={(value) =>
                handleLocalFilterChange({ warehouse_id: value === 'all' ? null : value })
              }
              className="mt-2 space-y-2"
              data-testid="filter-warehouse-group"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="warehouse-all" />
                <label htmlFor="warehouse-all" className="text-sm cursor-pointer">
                  All Warehouses
                </label>
              </div>
              {isLoadingWarehouses ? (
                <p className="text-sm text-muted-foreground">Loading warehouses...</p>
              ) : (
                warehouses.map((warehouse) => (
                  <div key={warehouse.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={warehouse.id} id={`warehouse-${warehouse.id}`} />
                    <label
                      htmlFor={`warehouse-${warehouse.id}`}
                      className="text-sm cursor-pointer"
                    >
                      {warehouse.name}
                    </label>
                  </div>
                ))
              )}
            </RadioGroup>
          </div>

          {/* Location Filter */}
          {localFilters.warehouse_id && (
            <div>
              <Label>Location</Label>
              <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                {isLoadingLocations ? (
                  <p className="text-sm text-muted-foreground">Loading locations...</p>
                ) : locations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No locations in selected warehouse</p>
                ) : (
                  locations.slice(0, 10).map((location) => (
                    <div key={location.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`location-${location.id}`}
                        checked={localFilters.location_id === location.id}
                        onCheckedChange={() => handleLocationToggle(location.id)}
                        data-testid={`filter-location-${location.location_code || location.id}`}
                      />
                      <label
                        htmlFor={`location-${location.id}`}
                        className="text-sm flex-1 cursor-pointer"
                      >
                        {location.full_path}
                        {location.lp_count !== undefined && (
                          <span className="text-muted-foreground ml-1">({location.lp_count})</span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div>
            <Label>Status</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => {
                const isSelected = localFilters.status?.includes(option.value)
                return (
                  <Button
                    key={option.value}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusToggle(option.value)}
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`Filter by ${option.label} status`}
                    data-testid={`filter-status-${option.value}`}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* QA Status Filter */}
          <div>
            <Label>QA Status</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {QA_STATUS_OPTIONS.map((option) => {
                const isSelected = localFilters.qa_status?.includes(option.value)
                return (
                  <Button
                    key={option.value}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQAStatusToggle(option.value)}
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`Filter by ${option.label} QA status`}
                    data-testid={`filter-qa-${option.value}`}
                  >
                    {option.label}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Expiry Date Range */}
          <div>
            <Label>Expiry Date Range</Label>
            <div className="mt-2 space-y-2">
              <div>
                <Label htmlFor="expiry-after" className="text-xs text-muted-foreground">
                  From
                </Label>
                <div className="relative">
                  <Input
                    id="expiry-after"
                    type="date"
                    value={localFilters.expiry_after || ''}
                    onChange={(e) => handleLocalFilterChange({ expiry_after: e.target.value })}
                    className="mt-1"
                    aria-label="Expiry from date"
                    data-testid="filter-expiry-after"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <Label htmlFor="expiry-before" className="text-xs text-muted-foreground">
                  To
                </Label>
                <div className="relative">
                  <Input
                    id="expiry-before"
                    type="date"
                    value={localFilters.expiry_before || ''}
                    onChange={(e) => handleLocalFilterChange({ expiry_before: e.target.value })}
                    className="mt-1"
                    aria-label="Expiry to date"
                    data-testid="filter-expiry-before"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="border-t pt-4">
            <Label>Quick Filters</Label>
            <div className="mt-2 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const today = new Date()
                  const in30Days = new Date(today)
                  in30Days.setDate(today.getDate() + 30)
                  handleLocalFilterChange({
                    status: ['available'],
                    expiry_before: in30Days.toISOString().split('T')[0],
                  })
                }}
                data-testid="preset-expiring-soon"
              >
                Expiring Soon (30 days)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  handleLocalFilterChange({
                    status: ['available'],
                    qa_status: ['passed'],
                  })
                }}
                data-testid="preset-available-stock"
              >
                Available Stock
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  handleLocalFilterChange({
                    qa_status: ['pending'],
                  })
                }}
                data-testid="preset-pending-qa"
              >
                Pending QA
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  handleLocalFilterChange({
                    status: ['blocked'],
                  })
                }}
                data-testid="preset-blocked"
              >
                Blocked Items
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t space-y-2">
          <Button
            onClick={handleApply}
            className="w-full"
            data-testid="apply-filters-button"
          >
            Apply Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Button>
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="w-full"
            data-testid="clear-all-button"
          >
            Clear All
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
