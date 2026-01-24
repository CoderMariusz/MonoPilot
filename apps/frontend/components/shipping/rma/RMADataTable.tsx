/**
 * RMADataTable Component
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * Features:
 * - Displays RMA list with columns (rma_number, customer, status, reason, lines, created_at)
 * - Sorting on column headers
 * - Search/filter functionality
 * - Row actions (View, Edit, Delete, Approve)
 * - Status badges with colors
 * - Reason code badges
 * - Disposition badges
 * - Loading, empty, error states
 * - Keyboard navigation
 *
 * Wireframe: RMA-001
 */

'use client'

import { useCallback, useMemo, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowUp,
  ArrowDown,
  Plus,
  Loader2,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Search,
  X,
  PackageX,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  RMA_STATUS_LABELS,
  RMA_REASON_LABELS,
  type RMAStatus,
  type RMAReasonCode,
} from '@/lib/validation/rma-schemas'

export interface RMAListItem {
  id: string
  rma_number: string
  customer_id: string
  customer_name: string
  status: RMAStatus
  reason_code: RMAReasonCode
  line_count: number
  total_value: number | null
  created_at: string
}

interface RMADataTableProps {
  data: RMAListItem[]
  loading?: boolean
  error?: string | null
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  onApprove?: (id: string) => void
  onSort?: (field: string, order: 'asc' | 'desc') => void
  onCreate?: () => void
  canEdit?: boolean
  canDelete?: boolean
  canApprove?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  testId?: string
}

export function RMADataTable({
  data,
  loading = false,
  error = null,
  onView,
  onEdit,
  onDelete,
  onApprove,
  onSort,
  onCreate,
  canEdit = false,
  canDelete = false,
  canApprove = false,
  sortBy,
  sortOrder,
  testId = 'rma-data-table',
}: RMADataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<RMAStatus | 'all'>('all')

  const handleSort = useCallback(
    (field: string) => {
      if (!onSort) return
      const newOrder =
        sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc'
      onSort(field, newOrder)
    },
    [sortBy, sortOrder, onSort]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, rmaId: string) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onView?.(rmaId)
      }
    },
    [onView]
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

  // Filter data based on search and status
  const filteredData = useMemo(() => {
    let result = data

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (rma) =>
          rma.rma_number.toLowerCase().includes(term) ||
          rma.customer_name.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((rma) => rma.status === statusFilter)
    }

    return result
  }, [data, searchTerm, statusFilter])

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4" data-testid={testId}>
        <div className="flex items-center justify-center py-4">
          <Loader2
            className="h-6 w-6 animate-spin text-muted-foreground"
            data-testid="loading-spinner"
          />
        </div>
        <div className="border rounded-md" data-testid="loading-skeleton">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>RMA Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Lines</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i} data-testid="skeleton-row">
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 space-y-4 border rounded-md"
        data-testid="error-state"
      >
        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
          <PackageX className="h-8 w-8 text-red-600" />
        </div>
        <p className="text-lg font-semibold text-red-600">{error}</p>
        <Button variant="outline" onClick={onCreate}>
          Retry
        </Button>
      </div>
    )
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 space-y-4 border rounded-md"
        data-testid="rma-empty"
      >
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <PackageX className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold">No RMAs yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first RMA to get started with returns management.
          </p>
        </div>
        <Button onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create RMA
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid={testId}>
      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search RMAs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
              data-testid="clear-search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as RMAStatus | 'all')}
        >
          <SelectTrigger className="w-40" data-testid="status-filter">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="receiving">Receiving</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="processed">Processed</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('rma_number')}
                aria-sort={sortBy === 'rma_number' ? sortOrder : undefined}
                {...({} as any)}
              >
                RMA Number
                {renderSortIndicator('rma_number')}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('customer_name')}
                aria-sort={sortBy === 'customer_name' ? sortOrder : undefined}
                {...({} as any)}
              >
                Customer
                &nbsp;{renderSortIndicator('customer_name')}
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Lines</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('created_at')}
                aria-sort={sortBy === 'created_at' ? sortOrder : undefined}
                {...({} as any)}
              >
                Created
                &nbsp;{renderSortIndicator('created_at')}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map((rma) => (
              <TableRow
                key={rma.id}
                data-testid="rma-row"
                className="cursor-pointer hover:bg-muted"
                onClick={() => onView?.(rma.id)}
                onKeyDown={(e) => handleKeyDown(e, rma.id)}
                tabIndex={0}
                role="row"
              >
                <TableCell className="font-mono font-medium">
                  {rma.rma_number}
                </TableCell>
                <TableCell>{rma.customer_name}</TableCell>
                <TableCell>
                  <RMAStatusBadge status={rma.status} />
                </TableCell>
                <TableCell>
                  <RMAReasonBadge reason={rma.reason_code} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {rma.line_count}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(rma.created_at)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Actions"
                        data-testid={`actions-${rma.id}`}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onView?.(rma.id)}
                        data-testid={`view-${rma.id}`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>

                      {canEdit && rma.status === 'pending' && (
                        <DropdownMenuItem
                          onClick={() => onEdit?.(rma.id)}
                          data-testid={`edit-${rma.id}`}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}

                      {canApprove && rma.status === 'pending' && (
                        <DropdownMenuItem
                          onClick={() => onApprove?.(rma.id)}
                          data-testid={`approve-${rma.id}`}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Approve
                        </DropdownMenuItem>
                      )}

                      {canDelete && rma.status === 'pending' && (
                        <DropdownMenuItem
                          onClick={() => onDelete?.(rma.id)}
                          className="text-red-600 focus:text-red-600"
                          data-testid={`delete-${rma.id}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Empty filtered results */}
      {filteredData.length === 0 && data.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No RMAs match your filters. Try adjusting your search or filters.
        </div>
      )}
    </div>
  )
}

/**
 * Status Badge Component
 */
function RMAStatusBadge({ status }: { status: RMAStatus }) {
  const statusStyles: Record<RMAStatus, string> = {
    pending: 'bg-gray-100 text-gray-800',
    approved: 'bg-blue-100 text-blue-800',
    receiving: 'bg-purple-100 text-purple-800',
    received: 'bg-yellow-100 text-yellow-800',
    processed: 'bg-orange-100 text-orange-800',
    closed: 'bg-green-100 text-green-800',
  }

  return (
    <Badge
      variant="outline"
      className={cn('capitalize border-none', statusStyles[status])}
      data-testid={`status-badge-${status}`}
    >
      {RMA_STATUS_LABELS[status]}
    </Badge>
  )
}

/**
 * Reason Code Badge Component
 */
function RMAReasonBadge({ reason }: { reason: RMAReasonCode }) {
  const reasonStyles: Record<RMAReasonCode, string> = {
    damaged: 'bg-red-100 text-red-800',
    expired: 'bg-orange-100 text-orange-800',
    wrong_product: 'bg-yellow-100 text-yellow-800',
    quality_issue: 'bg-purple-100 text-purple-800',
    customer_change: 'bg-blue-100 text-blue-800',
    other: 'bg-gray-100 text-gray-800',
  }

  return (
    <Badge
      variant="outline"
      className={cn('capitalize border-none', reasonStyles[reason])}
      data-testid={`reason-badge-${reason}`}
    >
      {RMA_REASON_LABELS[reason]}
    </Badge>
  )
}

export { RMAStatusBadge, RMAReasonBadge }
