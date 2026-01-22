/**
 * CustomerDataTable Component
 * Story: 07.1 - Customers CRUD
 *
 * Features:
 * - Displays customer list with columns (code, name, category, email, phone, status)
 * - Sorting on column headers
 * - Row click navigation
 * - Status badges (active/inactive)
 * - Category badges
 * - Empty state
 * - Loading state with skeleton
 * - Keyboard navigation
 *
 * Wireframe: SHIP-001
 */

'use client'

import { useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ArrowUp, ArrowDown, Plus, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Customer {
  id: string
  customer_code: string
  name: string
  category: 'retail' | 'wholesale' | 'distributor'
  email: string | null
  phone: string | null
  is_active: boolean
  created_at: string
}

interface CustomerDataTableProps {
  data: Customer[]
  isLoading: boolean
  onRowClick: (id: string) => void
  onSort: (field: string, order: 'asc' | 'desc') => void
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onCreate?: () => void
}

export function CustomerDataTable({
  data,
  isLoading,
  onRowClick,
  onSort,
  sortBy,
  sortOrder,
  onCreate,
}: CustomerDataTableProps) {
  const handleSort = useCallback(
    (field: string) => {
      const newOrder =
        sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
      onSort(field, newOrder)
    },
    [sortBy, sortOrder, onSort]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, customerId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onRowClick(customerId)
      }
    },
    [onRowClick]
  )

  const renderSortIndicator = (field: string) => {
    if (sortBy !== field) return null
    return sortOrder === 'asc' ? (
      <ArrowUp
        className="ml-1 h-4 w-4 inline"
        data-testid="sort-indicator-asc"
      />
    ) : (
      <ArrowDown
        className="ml-1 h-4 w-4 inline"
        data-testid="sort-indicator-desc"
      />
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-4">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            data-testid="loading-spinner"
          />
        </div>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} data-testid="skeleton-row">
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 space-y-4"
        data-testid="customers-empty"
      >
        <div className="text-center">
          <p className="text-lg font-semibold">No customers yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create one to get started.
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Customer
        </Button>
      </div>
    )
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('customer_code')}
              role="columnheader"
            >
              Code
              {renderSortIndicator('customer_code')}
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort('name')}
              role="columnheader"
            >
              Name
              {renderSortIndicator('name')}
            </TableHead>
            <TableHead role="columnheader">Category</TableHead>
            <TableHead role="columnheader">Email</TableHead>
            <TableHead role="columnheader">Phone</TableHead>
            <TableHead role="columnheader">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((customer) => (
            <TableRow
              key={customer.id}
              data-testid="customer-row"
              className="cursor-pointer hover:bg-muted"
              onClick={() => onRowClick(customer.id)}
              onKeyDown={(e) => handleKeyDown(e, customer.id)}
              tabIndex={0}
              role="row"
            >
              <TableCell className="font-mono font-medium">
                {customer.customer_code}
              </TableCell>
              <TableCell>{customer.name}</TableCell>
              <TableCell>
                <CategoryBadge category={customer.category} />
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.email ?? '-'}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {customer.phone ?? '-'}
              </TableCell>
              <TableCell>
                <StatusBadge isActive={customer.is_active} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  // Using both tailwind classes and test-friendly class names
  const baseClasses = 'inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold border-none'
  const statusClasses = isActive
    ? `${baseClasses} bg-green bg-green-100 text-green-800`
    : `${baseClasses} bg-gray bg-gray-100 text-gray-800`

  return (
    <span
      className={statusClasses}
      data-testid={isActive ? 'status-badge-active' : 'status-badge-inactive'}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

function CategoryBadge({ category }: { category: string }) {
  const categoryStyles: Record<string, string> = {
    retail: 'bg-blue-100 text-blue-800',
    wholesale: 'bg-purple-100 text-purple-800',
    distributor: 'bg-orange-100 text-orange-800',
  }

  return (
    <Badge
      variant="outline"
      className={cn('capitalize border-none', categoryStyles[category])}
      data-testid={`category-badge-${category}`}
    >
      {category}
    </Badge>
  )
}
