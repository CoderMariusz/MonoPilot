/**
 * WarehousesDataTable Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Features:
 * - Search with 300ms debounce
 * - Filter by type, status
 * - Pagination (20 per page)
 * - Row actions (Edit, Set Default, Disable/Enable)
 * - Default warehouse star icon
 * - Type and status badges
 * - Secondary row with truncated address
 * - Loading, empty, error states
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Star, Warehouse as WarehouseIcon } from 'lucide-react'
import { WarehouseTypeBadge } from './WarehouseTypeBadge'
import { WarehouseStatusBadge } from './WarehouseStatusBadge'
import { WarehouseActionsMenu } from './WarehouseActionsMenu'
import { WarehouseFilters } from './WarehouseFilters'
import type { Warehouse, WarehouseListParams, WarehouseType } from '@/lib/types/warehouse'

interface WarehousesDataTableProps {
  warehouses: Warehouse[]
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onFilter: (filters: Partial<WarehouseListParams>) => void
  onEdit: (warehouse: Warehouse) => void
  onSetDefault: (warehouse: Warehouse) => void
  onDisable: (warehouse: Warehouse) => void
  onEnable: (warehouse: Warehouse) => void
  onManageLocations?: (warehouse: Warehouse) => void
  isLoading?: boolean
  error?: string
  readOnly?: boolean
}

// Truncate address for display
function truncateAddress(address: string | null, maxLength = 50): string {
  if (!address) return ''
  if (address.length <= maxLength) return address
  return `${address.substring(0, maxLength)}...`
}

export function WarehousesDataTable({
  warehouses,
  total,
  page,
  limit,
  onPageChange,
  onSearch,
  onFilter,
  onEdit,
  onSetDefault,
  onDisable,
  onEnable,
  onManageLocations,
  isLoading = false,
  error,
  readOnly = false,
}: WarehousesDataTableProps) {
  const [searchValue, setSearchValue] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Debounced search (300ms)
  useEffect(() => {
    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current)
    }

    // Set new timer
    searchTimerRef.current = setTimeout(() => {
      onSearch(searchValue)
    }, 300)

    // Cleanup
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current)
      }
    }
  }, [searchValue, onSearch])

  // Handle filter changes
  useEffect(() => {
    const filters: Partial<WarehouseListParams> = {}
    if (typeFilter) filters.type = typeFilter as WarehouseType
    if (statusFilter) filters.status = statusFilter as 'active' | 'disabled'
    onFilter(filters)
  }, [typeFilter, statusFilter, onFilter])

  // Calculate pagination
  const totalPages = Math.ceil(total / limit)
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0
  const endItem = Math.min(page * limit, total)

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[140px]" />
        </div>
        <div className="border rounded-md">
          <div data-testid="skeleton-loader">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[40px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[40px]" />
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Loading warehouses...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Failed to Load Warehouses</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  // Empty state
  if (!warehouses || warehouses.length === 0) {
    const hasFilters = searchValue || typeFilter || statusFilter

    return (
      <div className="space-y-4">
        <WarehouseFilters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <WarehouseIcon className="h-12 w-12 text-muted-foreground" />
          <div className="text-center">
            <p className="text-lg font-semibold">No Warehouses Found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {hasFilters
                ? 'Try adjusting your search or filters'
                : "You haven't created any warehouses yet. Start by adding your first warehouse location."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <WarehouseFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Table */}
      <div className="border-2 border-gray-300 rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Status</TableHead>
              {!readOnly && <TableHead className="w-[50px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <TableCell>
                  <div className="font-medium">{warehouse.code}</div>
                  {warehouse.address && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {truncateAddress(warehouse.address)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{warehouse.name}</TableCell>
                <TableCell>
                  <WarehouseTypeBadge type={warehouse.type} />
                </TableCell>
                <TableCell className="text-center">{warehouse.location_count}</TableCell>
                <TableCell>
                  {warehouse.is_default && (
                    <Star
                      className="h-5 w-5 text-yellow-500 fill-yellow-500"
                      aria-label="Default warehouse"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <WarehouseStatusBadge status={warehouse.is_active ? 'active' : 'disabled'} />
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <WarehouseActionsMenu
                      warehouse={warehouse}
                      onEdit={() => onEdit(warehouse)}
                      onSetDefault={() => onSetDefault(warehouse)}
                      onDisable={() => onDisable(warehouse)}
                      onEnable={() => onEnable(warehouse)}
                      onManageLocations={
                        onManageLocations ? () => onManageLocations(warehouse) : undefined
                      }
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {total} warehouses
        </p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages || 1}
          </p>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
