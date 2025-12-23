/**
 * WarehousesDataTable Component
 * Story: 01.8 - Warehouse Management CRUD
 *
 * Features:
 * - Search with 300ms debounce
 * - Filter by type, status
 * - Pagination (20 per page)
 * - Row actions (Edit, Set Default, Disable/Enable)
 * - Permission-based UI (readOnly prop)
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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { WarehouseTypeBadge } from './WarehouseTypeBadge'
import type { Warehouse, WarehouseListParams, WarehouseType } from '@/lib/types/warehouse'
import { WAREHOUSE_TYPE_LABELS } from '@/lib/types/warehouse'
import { MoreVertical, ChevronLeft, ChevronRight, Star } from 'lucide-react'

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
  isLoading?: boolean
  error?: string
  readOnly?: boolean
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

  // Truncate address for display
  const truncateAddress = (address: string | null) => {
    if (!address) return ''
    return address.length > 50 ? `${address.substring(0, 50)}...` : address
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[180px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="border rounded-md">
          <div data-testid="skeleton-loader">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[60px]" />
                <Skeleton className="h-4 w-[80px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  // Empty state
  if (!warehouses || warehouses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="text-center">
          <p className="text-lg font-semibold">No warehouses found</p>
          <p className="text-sm text-muted-foreground mt-2">
            {searchValue || typeFilter || statusFilter
              ? 'Try adjusting your search or filters'
              : "You haven't created any warehouses yet"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search warehouses..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1"
        />

        <select
          aria-label="Filter by type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          {Object.entries(WAREHOUSE_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[180px] h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="active">Status: Active</option>
          <option value="disabled">Status: Disabled</option>
        </select>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Locations</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Status</TableHead>
              {!readOnly && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {warehouses.map((warehouse) => (
              <TableRow key={warehouse.id}>
                <TableCell>
                  <div className="font-medium">{warehouse.code}</div>
                  {warehouse.address && (
                    <div className="text-sm text-muted-foreground">
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
                      className="h-4 w-4 text-yellow-500 fill-yellow-500"
                      aria-label="Default warehouse"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={warehouse.is_active ? 'default' : 'secondary'}
                    className={
                      warehouse.is_active
                        ? 'bg-green-100 text-green-800 border-none'
                        : 'bg-gray-100 text-gray-800 border-none'
                    }
                  >
                    {warehouse.is_active ? 'Active' : 'Disabled'}
                  </Badge>
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="Actions">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(warehouse)}>
                          Edit
                        </DropdownMenuItem>
                        {!warehouse.is_default && (
                          <DropdownMenuItem onClick={() => onSetDefault(warehouse)}>
                            Set as Default
                          </DropdownMenuItem>
                        )}
                        {warehouse.is_active ? (
                          <DropdownMenuItem onClick={() => onDisable(warehouse)}>
                            Disable
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => onEnable(warehouse)}>
                            Enable
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
