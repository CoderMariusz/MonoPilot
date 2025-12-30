/**
 * WarehouseFilters Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Search and filter controls for warehouse list
 * Filters: Search (code/name), Type, Status
 */

'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import type { WarehouseType } from '@/lib/types/warehouse'
import { WAREHOUSE_TYPE_LABELS } from '@/lib/types/warehouse'

const WAREHOUSE_TYPES: WarehouseType[] = [
  'GENERAL',
  'RAW_MATERIALS',
  'WIP',
  'FINISHED_GOODS',
  'QUARANTINE',
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'disabled', label: 'Disabled' },
]

interface WarehouseFiltersProps {
  searchValue: string
  onSearchChange: (value: string) => void
  typeFilter: string
  onTypeChange: (value: string) => void
  statusFilter: string
  onStatusChange: (value: string) => void
}

export function WarehouseFilters({
  searchValue,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
}: WarehouseFiltersProps) {
  const hasActiveFilters = searchValue || typeFilter || statusFilter

  const handleClearFilters = () => {
    onSearchChange('')
    onTypeChange('')
    onStatusChange('')
  }

  return (
    <div className="flex gap-4 items-center flex-wrap">
      <Input
        placeholder="Search by code or name..."
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 min-w-[200px]"
        aria-label="Search warehouses"
      />

      <select
        aria-label="Filter by type"
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value)}
        className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <option value="">All types</option>
        {WAREHOUSE_TYPES.map((type) => (
          <option key={type} value={type}>
            {WAREHOUSE_TYPE_LABELS[type]}
          </option>
        ))}
      </select>

      <select
        aria-label="Filter by status"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value)}
        className="w-[140px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Clear all filters"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}
