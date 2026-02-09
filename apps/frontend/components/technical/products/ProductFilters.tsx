/**
 * ProductFilters Component (Story 02.1 - TEC-001)
 * Filter bar with search, type, and status filters
 *
 * Features:
 * - Debounced search (300ms)
 * - Type dropdown (RM, WIP, FG, PKG, BP)
 * - Status dropdown (active, inactive, discontinued)
 * - Responsive layout (mobile/desktop)
 * - WCAG 2.1 AA compliant
 */

'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, Archive } from 'lucide-react'

export interface ProductFilters {
  search: string
  type: string | null
  status: string | null
  archived: boolean
}

interface ProductFiltersProps {
  filters: ProductFilters
  onChange: (filters: ProductFilters) => void
  loading?: boolean
  className?: string
}

const PRODUCT_TYPES = [
  { value: 'RM', label: 'Raw Material' },
  { value: 'WIP', label: 'Work in Progress' },
  { value: 'FG', label: 'Finished Goods' },
  { value: 'PKG', label: 'Packaging' },
  { value: 'BP', label: 'Byproduct' },
]

const PRODUCT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'discontinued', label: 'Discontinued' },
]

export function ProductFilters({
  filters,
  onChange,
  loading = false,
  className,
}: ProductFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search)

  // Debounced search (300ms)
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchValue !== filters.search) {
        onChange({ ...filters, search: searchValue })
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchValue])

  // Sync external filter changes
  useEffect(() => {
    setSearchValue(filters.search)
  }, [filters.search])

  const handleTypeChange = (value: string) => {
    onChange({
      ...filters,
      type: value === 'all' ? null : value,
    })
  }

  const handleStatusChange = (value: string) => {
    onChange({
      ...filters,
      status: value === 'all' ? null : value,
    })
  }

  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-end md:gap-2 ${className || ''}`}
    >
      {/* Search Input */}
      <div className="flex-1 min-w-0">
        <Label htmlFor="search-products" className="sr-only">
          Search products by code or name
        </Label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
            aria-hidden="true"
          />
          <Input
            id="search-products"
            type="text"
            placeholder="Search products..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            disabled={loading}
            className="pl-9 h-10 md:h-10"
            aria-label="Search products by code or name"
          />
        </div>
      </div>

      {/* Type Filter */}
      <div className="w-full md:w-48">
        <Label htmlFor="filter-type" className="sr-only">
          Filter by product type
        </Label>
        <Select
          value={filters.type || 'all'}
          onValueChange={handleTypeChange}
          disabled={loading}
        >
          <SelectTrigger
            id="filter-type"
            className="h-10 md:h-10"
            aria-label="Filter by product type"
          >
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PRODUCT_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status Filter */}
      <div className="w-full md:w-48">
        <Label htmlFor="filter-status" className="sr-only">
          Filter by status
        </Label>
        <Select
          value={filters.status || 'all'}
          onValueChange={handleStatusChange}
          disabled={loading}
        >
          <SelectTrigger
            id="filter-status"
            className="h-10 md:h-10"
            aria-label="Filter by status"
          >
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {PRODUCT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Archived Toggle */}
      <Button
        variant={filters.archived ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange({ ...filters, archived: !filters.archived })}
        disabled={loading}
        title={filters.archived ? 'Showing archived products' : 'Show archived products'}
        className="h-10"
      >
        <Archive className="w-4 h-4 mr-2" />
        {filters.archived ? 'Archived' : 'Active'}
      </Button>
    </div>
  )
}
