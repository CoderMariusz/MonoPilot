/**
 * LP Filters Component
 * Story 05.1: License Plates UI
 */

'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select-new'
import type { LPFilterParams, LPStatus, QAStatus } from '@/lib/types/license-plate'
import type { Warehouse } from '@/lib/types/warehouse'
import { Search, X } from 'lucide-react'

interface LPFiltersProps {
  filters: LPFilterParams
  onFilterChange: (filters: Partial<LPFilterParams>) => void
  warehouses: Warehouse[]
  isLoadingWarehouses?: boolean
}

export function LPFilters({ filters, onFilterChange, warehouses, isLoadingWarehouses }: LPFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '')

  const handleSearchChange = (value: string) => {
    setSearchValue(value)
    // Debounce search (300ms)
    const timeoutId = setTimeout(() => {
      onFilterChange({ search: value })
    }, 300)
    return () => clearTimeout(timeoutId)
  }

  const handleClearAll = () => {
    setSearchValue('')
    onFilterChange({
      status: [],
      qa_status: [],
      warehouse_id: null,
      location_id: null,
      product_id: null,
      search: '',
      expiry_before: null,
      expiry_after: null,
    })
  }

  const hasActiveFilters =
    (filters.status && filters.status.length > 0) ||
    (filters.qa_status && filters.qa_status.length > 0) ||
    filters.warehouse_id ||
    filters.search

  return (
    <div data-testid="lp-filters" className="space-y-4 p-4 border rounded-lg bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Warehouse Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Warehouse</label>
          <Select
            value={filters.warehouse_id || 'all'}
            onValueChange={(value) =>
              onFilterChange({ warehouse_id: value === 'all' ? null : value })
            }
            data-testid="filter-warehouse"
            name="warehouse"
          >
            <SelectTrigger>
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

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select
            value={(filters.status && filters.status[0]) || 'all'}
            onValueChange={(value) =>
              onFilterChange({ status: value === 'all' ? [] : [value as LPStatus] })
            }
            data-testid="filter-status"
            name="status"
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="consumed">Consumed</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* QA Status Filter */}
        <div>
          <label className="text-sm font-medium mb-2 block">QA Status</label>
          <Select
            value={(filters.qa_status && filters.qa_status[0]) || 'all'}
            onValueChange={(value) =>
              onFilterChange({ qa_status: value === 'all' ? [] : [value as QAStatus] })
            }
            data-testid="filter-qa-status"
            name="qa_status"
          >
            <SelectTrigger>
              <SelectValue placeholder="All QA Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All QA Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="quarantine">Quarantine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search */}
        <div>
          <label className="text-sm font-medium mb-2 block">Search LP Number</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search LP..."
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              data-testid="lp-search"
            />
          </div>
        </div>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <X className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  )
}
