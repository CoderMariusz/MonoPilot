/**
 * Expiring Items Filters Component
 * Story: WH-INV-001 - Inventory Browser (Expiring Items Tab)
 *
 * Filter controls for warehouse, location, product, and tier
 */

'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Search, X } from 'lucide-react'
import type { ExpiryFilters } from '@/lib/api/expiring-items-api'
import type { ExpiryTier } from '@/lib/validation/expiry-alert-schema'

interface Warehouse {
  id: string
  name: string
}

interface Location {
  id: string
  code: string
  warehouse_id: string
}

interface ExpiringItemsFiltersProps {
  filters: ExpiryFilters
  onFiltersChange: (filters: ExpiryFilters) => void
  tierFilter: ExpiryTier | 'all'
  onTierFilterChange: (tier: ExpiryTier | 'all') => void
  className?: string
}

export function ExpiringItemsFilters({
  filters,
  onFiltersChange,
  tierFilter,
  onTierFilterChange,
  className,
}: ExpiringItemsFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ExpiryFilters>(filters)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true)
  const [isLoadingLocations, setIsLoadingLocations] = useState(false)

  // Fetch warehouses on mount
  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const response = await fetch('/api/v1/settings/warehouses?status=active&limit=100')
        if (response.ok) {
          const result = await response.json()
          setWarehouses(result.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch warehouses:', error)
      } finally {
        setIsLoadingWarehouses(false)
      }
    }
    fetchWarehouses()
  }, [])

  // Fetch locations when warehouse changes
  useEffect(() => {
    async function fetchLocations() {
      if (!localFilters.warehouse_id) {
        setLocations([])
        return
      }

      setIsLoadingLocations(true)
      try {
        const response = await fetch(
          `/api/settings/locations?warehouse_id=${localFilters.warehouse_id}`
        )
        if (response.ok) {
          const data = await response.json()
          setLocations(data.data || data.locations || [])
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error)
      } finally {
        setIsLoadingLocations(false)
      }
    }
    fetchLocations()
  }, [localFilters.warehouse_id])

  const handleWarehouseChange = (value: string) => {
    const newFilters = {
      ...localFilters,
      warehouse_id: value === 'all' ? undefined : value,
      location_id: undefined, // Reset location when warehouse changes
    }
    setLocalFilters(newFilters)
  }

  const handleLocationChange = (value: string) => {
    const newFilters = {
      ...localFilters,
      location_id: value === 'all' ? undefined : value,
    }
    setLocalFilters(newFilters)
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
  }

  const handleClear = () => {
    const clearedFilters: ExpiryFilters = {}
    setLocalFilters(clearedFilters)
    setProductSearch('')
    onFiltersChange(clearedFilters)
    onTierFilterChange('all')
  }

  const hasActiveFilters =
    localFilters.warehouse_id ||
    localFilters.location_id ||
    localFilters.product_id ||
    tierFilter !== 'all'

  return (
    <div
      className={cn('space-y-4 rounded-lg border p-4', className)}
      data-testid="expiring-items-filters"
    >
      <div className="flex flex-wrap items-end gap-4">
        {/* Warehouse filter */}
        <div className="flex-1 min-w-[150px]">
          <Label htmlFor="warehouse-filter" className="text-sm mb-1 block">
            Warehouse
          </Label>
          <Select
            value={localFilters.warehouse_id || 'all'}
            onValueChange={handleWarehouseChange}
            disabled={isLoadingWarehouses}
          >
            <SelectTrigger id="warehouse-filter" className="w-full">
              <SelectValue placeholder="All warehouses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All warehouses</SelectItem>
              {warehouses.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location filter */}
        <div className="flex-1 min-w-[150px]">
          <Label htmlFor="location-filter" className="text-sm mb-1 block">
            Location
          </Label>
          <Select
            value={localFilters.location_id || 'all'}
            onValueChange={handleLocationChange}
            disabled={!localFilters.warehouse_id || isLoadingLocations}
          >
            <SelectTrigger id="location-filter" className="w-full">
              <SelectValue
                placeholder={
                  localFilters.warehouse_id
                    ? 'All locations'
                    : 'Select warehouse first'
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Product search */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="product-search" className="text-sm mb-1 block">
            Product
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="product-search"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tier filter */}
        <div className="flex-1 min-w-[150px]">
          <Label htmlFor="tier-filter" className="text-sm mb-1 block">
            Status
          </Label>
          <Select
            value={tierFilter}
            onValueChange={(value) =>
              onTierFilterChange(value as ExpiryTier | 'all')
            }
          >
            <SelectTrigger id="tier-filter" className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="critical">Critical (0-7d)</SelectItem>
              <SelectItem value="warning">Warning (8-30d)</SelectItem>
              <SelectItem value="ok">OK (31+d)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-4 w-4" />
            Clear All
          </Button>
        )}
        <Button size="sm" onClick={handleApply}>
          Apply Filters
        </Button>
      </div>
    </div>
  )
}
