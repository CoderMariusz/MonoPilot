/**
 * MachinesDataTable Component
 * Story: 01.10 - Machines CRUD
 *
 * Features:
 * - Search with 300ms debounce
 * - Filter by type, status
 * - Pagination (25 per page)
 * - Row actions (Edit, Delete)
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
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { MachineTypeBadge } from './MachineTypeBadge'
import { MachineStatusBadge } from './MachineStatusBadge'
import { MachineCapacityDisplay } from './MachineCapacityDisplay'
import { MachineFilters } from './MachineFilters'
import type { Machine, MachineListParams, MachineType, MachineStatus } from '@/lib/types/machine'
import { MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'

interface MachinesDataTableProps {
  machines: Machine[]
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onFilter: (filters: Partial<MachineListParams>) => void
  onEdit: (machine: Machine) => void
  onDelete: (machine: Machine) => void
  isLoading?: boolean
  error?: string
  readOnly?: boolean
}

export function MachinesDataTable({
  machines,
  total,
  page,
  limit,
  onPageChange,
  onSearch,
  onFilter,
  onEdit,
  onDelete,
  isLoading = false,
  error,
  readOnly = false,
}: MachinesDataTableProps) {
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
    const filters: Partial<MachineListParams> = {}
    if (typeFilter) filters.type = typeFilter as MachineType
    if (statusFilter) filters.status = statusFilter as MachineStatus
    onFilter(filters)
  }, [typeFilter, statusFilter, onFilter])

  // Calculate pagination
  const totalPages = Math.ceil(total / limit)
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0
  const endItem = Math.min(page * limit, total)

  // Get location display
  const getLocationDisplay = (machine: Machine) => {
    if (!machine.location) return '-'
    return machine.location.full_path || machine.location.code
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
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-[60px]" />
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
  if (!machines || machines.length === 0) {
    return (
      <div className="space-y-4">
        <MachineFilters
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="text-center">
            <p className="text-lg font-semibold">No machines found</p>
            <p className="text-sm text-muted-foreground mt-2">
              {searchValue || typeFilter || statusFilter
                ? 'Try adjusting your search or filters'
                : "You haven't created any machines yet"}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <MachineFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Location</TableHead>
              {!readOnly && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {machines.map((machine) => (
              <TableRow key={machine.id}>
                <TableCell>
                  <div className="font-medium">{machine.code}</div>
                  {machine.description && (
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {machine.description}
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{machine.name}</TableCell>
                <TableCell>
                  <MachineTypeBadge type={machine.type} />
                </TableCell>
                <TableCell>
                  <MachineStatusBadge status={machine.status} />
                </TableCell>
                <TableCell>
                  <MachineCapacityDisplay
                    units_per_hour={machine.units_per_hour}
                    setup_time_minutes={machine.setup_time_minutes}
                    max_batch_size={machine.max_batch_size}
                  />
                </TableCell>
                <TableCell className="text-sm">
                  {getLocationDisplay(machine)}
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
                        <DropdownMenuItem onClick={() => onEdit(machine)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(machine)}
                          className="text-destructive"
                        >
                          Delete
                        </DropdownMenuItem>
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
          Showing {startItem} to {endItem} of {total} machines
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
