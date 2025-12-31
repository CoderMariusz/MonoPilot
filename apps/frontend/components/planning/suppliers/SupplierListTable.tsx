/**
 * Supplier List Table Component
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Main table with columns, selection, sorting, pagination
 */

'use client'

import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import { SupplierRow } from './SupplierRow'
import { SupplierCard } from './SupplierCard'
import type { Supplier, PaginationMeta } from '@/lib/types/supplier'

interface SupplierListTableProps {
  data: Supplier[]
  selectedIds: string[]
  loading?: boolean
  pagination?: PaginationMeta
  isMobile?: boolean
  onSelect: (id: string) => void
  onEdit: (supplier: Supplier) => void
  onViewDetails: (supplier: Supplier) => void
  onDeactivate?: (supplier: Supplier) => void
  onActivate?: (supplier: Supplier) => void
  onDelete?: (supplier: Supplier) => void
  onExport?: (supplier: Supplier) => void
  onPageChange?: (page: number) => void
  onLoadMore?: () => void
  onSort?: (column: string) => void
  sortColumn?: string
  sortOrder?: 'asc' | 'desc'
}

export function SupplierListTable({
  data,
  selectedIds,
  loading = false,
  pagination,
  isMobile = false,
  onSelect,
  onEdit,
  onViewDetails,
  onDeactivate,
  onActivate,
  onDelete,
  onExport,
  onPageChange,
  onLoadMore,
  onSort,
  sortColumn,
  sortOrder,
}: SupplierListTableProps) {
  // Loading state - Skeleton
  if (loading) {
    if (isMobile) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border rounded-lg space-y-3">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
          <p className="text-center text-muted-foreground">Loading suppliers...</p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <div className="border rounded-lg">
          <Table role="table" aria-label="Suppliers list">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Select</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Contact Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Products Count</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-center text-muted-foreground">Loading suppliers...</p>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return null // Let parent handle empty state
  }

  const SortableHeader = ({
    column,
    children,
    className = '',
  }: {
    column: string
    children: React.ReactNode
    className?: string
  }) => (
    <TableHead className={className}>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-0 font-medium hover:bg-transparent"
        onClick={() => onSort?.(column)}
      >
        {children}
        <ArrowUpDown
          className={`ml-2 h-4 w-4 ${
            sortColumn === column ? 'opacity-100' : 'opacity-40'
          }`}
        />
      </Button>
    </TableHead>
  )

  // Mobile view - Cards
  if (isMobile) {
    return (
      <div className="space-y-4">
        {data.map((supplier) => (
          <SupplierCard
            key={supplier.id}
            supplier={supplier}
            selected={selectedIds.includes(supplier.id)}
            onSelect={() => onSelect(supplier.id)}
            onEdit={() => onEdit(supplier)}
            onViewDetails={() => onViewDetails(supplier)}
            onDeactivate={onDeactivate ? () => onDeactivate(supplier) : undefined}
            onActivate={onActivate ? () => onActivate(supplier) : undefined}
            onDelete={onDelete ? () => onDelete(supplier) : undefined}
          />
        ))}

        {/* Load More Button (Mobile) */}
        {pagination && pagination.page < pagination.pages && onLoadMore && (
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={onLoadMore}
            data-testid="button-load-more"
          >
            Load More
          </Button>
        )}
      </div>
    )
  }

  // Desktop view - Table
  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <Table role="table" aria-label="Suppliers list" aria-describedby="supplier-count">
          <span id="supplier-count" className="sr-only">
            Showing {data.length} of {pagination?.total || data.length} suppliers
          </span>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-12">
                Select
              </TableHead>
              <SortableHeader column="code">Code</SortableHeader>
              <SortableHeader column="name">Name</SortableHeader>
              <SortableHeader column="contact_name">Contact Name</SortableHeader>
              <TableHead scope="col">Email</TableHead>
              <TableHead scope="col">Phone</TableHead>
              <TableHead scope="col" className="text-right">
                Products Count
              </TableHead>
              <TableHead scope="col" className="w-24">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((supplier) => (
              <SupplierRow
                key={supplier.id}
                supplier={supplier}
                selected={selectedIds.includes(supplier.id)}
                onSelect={() => onSelect(supplier.id)}
                onEdit={() => onEdit(supplier)}
                onViewDetails={() => onViewDetails(supplier)}
                onDeactivate={onDeactivate ? () => onDeactivate(supplier) : undefined}
                onActivate={onActivate ? () => onActivate(supplier) : undefined}
                onDelete={onDelete ? () => onDelete(supplier) : undefined}
                onExport={onExport ? () => onExport(supplier) : undefined}
                hasOpenPOs={supplier.has_open_pos}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination (Desktop/Tablet) */}
      {pagination && pagination.pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            Suppliers
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                let pageNum: number
                if (pagination.pages <= 5) {
                  pageNum = i + 1
                } else if (pagination.page <= 3) {
                  pageNum = i + 1
                } else if (pagination.page >= pagination.pages - 2) {
                  pageNum = pagination.pages - 4 + i
                } else {
                  pageNum = pagination.page - 2 + i
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => onPageChange?.(pageNum)}
                    aria-label={`Go to page ${pageNum}`}
                    aria-current={pagination.page === pageNum ? 'page' : undefined}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.pages}
              aria-label="Go to next page"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
