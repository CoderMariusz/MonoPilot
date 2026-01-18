/**
 * AgingReportFilters Component
 * Story: WH-INV-001 - Inventory Browser (Aging Report Tab)
 *
 * Filter controls for aging report: Warehouse and Product Category dropdowns.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Filter, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AgingFilters {
  warehouse_id?: string
  product_category_id?: string
}

interface AgingReportFiltersProps {
  filters: AgingFilters
  onFiltersChange: (filters: AgingFilters) => void
  className?: string
}

interface Warehouse {
  id: string
  name: string
}

interface ProductCategory {
  id: string
  name: string
}

export function AgingReportFilters({
  filters,
  onFiltersChange,
  className,
}: AgingReportFiltersProps) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)

  // Fetch warehouses on mount
  useEffect(() => {
    async function fetchWarehouses() {
      try {
        const response = await fetch('/api/v1/settings/warehouses?status=active&limit=100')
        if (response.ok) {
          const data = await response.json()
          setWarehouses(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch warehouses:', error)
      } finally {
        setIsLoadingWarehouses(false)
      }
    }

    fetchWarehouses()
  }, [])

  // Fetch product categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/v1/technical/product-categories?limit=100')
        if (response.ok) {
          const data = await response.json()
          setCategories(data.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error)
      } finally {
        setIsLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Handle warehouse change
  const handleWarehouseChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        warehouse_id: value === 'all' ? undefined : value,
      })
    },
    [filters, onFiltersChange]
  )

  // Handle category change
  const handleCategoryChange = useCallback(
    (value: string) => {
      onFiltersChange({
        ...filters,
        product_category_id: value === 'all' ? undefined : value,
      })
    },
    [filters, onFiltersChange]
  )

  // Handle clear all filters
  const handleClearFilters = useCallback(() => {
    onFiltersChange({
      warehouse_id: undefined,
      product_category_id: undefined,
    })
  }, [onFiltersChange])

  const hasActiveFilters = filters.warehouse_id || filters.product_category_id

  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      {/* Warehouse Filter */}
      <div className="space-y-1.5">
        <Label htmlFor="warehouse-filter" className="text-xs text-muted-foreground">
          Warehouse
        </Label>
        <Select
          value={filters.warehouse_id || 'all'}
          onValueChange={handleWarehouseChange}
          disabled={isLoadingWarehouses}
        >
          <SelectTrigger
            id="warehouse-filter"
            className="w-[180px]"
            aria-label="Filter by warehouse"
          >
            <SelectValue placeholder="All Warehouses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Product Category Filter */}
      <div className="space-y-1.5">
        <Label htmlFor="category-filter" className="text-xs text-muted-foreground">
          Product Category
        </Label>
        <Select
          value={filters.product_category_id || 'all'}
          onValueChange={handleCategoryChange}
          disabled={isLoadingCategories}
        >
          <SelectTrigger
            id="category-filter"
            className="w-[180px]"
            aria-label="Filter by product category"
          >
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-10 text-muted-foreground hover:text-foreground"
          aria-label="Clear all filters"
        >
          <X className="h-4 w-4 mr-1" aria-hidden="true" />
          Clear
        </Button>
      )}
    </div>
  )
}
