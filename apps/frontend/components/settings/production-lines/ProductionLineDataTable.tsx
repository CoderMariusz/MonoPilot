/**
 * Production Line DataTable Component
 * Story: 01.11 - Production Lines CRUD
 * Purpose: DataTable with sorting, filtering, pagination, machine sequence preview
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductionLineStatusBadge } from './ProductionLineStatusBadge'
import { CapacityCalculatorDisplay } from './CapacityCalculatorDisplay'
import type {
  ProductionLine,
  ProductionLineListParams,
  ProductionLineStatus,
} from '@/lib/types/production-line'
import { MoreVertical, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'

interface ProductionLineDataTableProps {
  productionLines: ProductionLine[]
  total: number
  page: number
  limit: number
  onPageChange: (page: number) => void
  onSearch: (search: string) => void
  onFilter: (filters: Partial<ProductionLineListParams>) => void
  onEdit: (line: ProductionLine) => void
  onDelete: (line: ProductionLine) => void
  isLoading?: boolean
  error?: string
  readOnly?: boolean
}

export function ProductionLineDataTable({
  productionLines,
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
}: ProductionLineDataTableProps) {
  const [searchValue, setSearchValue] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
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
    const filters: Partial<ProductionLineListParams> = {}
    if (statusFilter && statusFilter !== 'all') filters.status = statusFilter as ProductionLineStatus
    onFilter(filters)
  }, [statusFilter, onFilter])

  // Calculate pagination
  const totalPages = Math.ceil(total / limit)
  const startItem = total > 0 ? (page - 1) * limit + 1 : 0
  const endItem = Math.min(page * limit, total)

  // Get machine flow display (Mixer -> Oven -> Cooler)
  const getMachineFlow = (line: ProductionLine) => {
    if (!line.machines || line.machines.length === 0) {
      return 'No machines'
    }
    return line.machines
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map((m) => m.code)
      .join(' → ')
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[180px]" />
        </div>
        <div className="border rounded-md">
          <div data-testid="skeleton-loader">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border-b last:border-b-0">
                <Skeleton className="h-4 w-[120px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-4 w-[80px]" />
                <Skeleton className="h-4 w-[100px]" />
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
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Input
          type="text"
          placeholder="Search by code or name..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="flex-1"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="setup">Setup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {productionLines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-md space-y-2">
          <p className="text-lg font-medium text-muted-foreground">
            No production lines found
          </p>
          <p className="text-sm text-muted-foreground">
            {searchValue || statusFilter
              ? 'Try adjusting your filters'
              : 'Create your first production line to get started'}
          </p>
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-center">Machine Count</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productionLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">{line.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{line.name}</p>
                      {line.machines && line.machines.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          {getMachineFlow(line)}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {line.machines?.length || 0}
                  </TableCell>
                  <TableCell>
                    <CapacityCalculatorDisplay
                      capacity={line.calculated_capacity}
                      bottleneckMachineCode={line.bottleneck_machine_code}
                    />
                  </TableCell>
                  <TableCell>
                    <ProductionLineStatusBadge status={line.status} />
                  </TableCell>
                  <TableCell>
                    {!readOnly && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(line)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(line)}
                            className="text-destructive"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startItem} to {endItem} of {total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
