/**
 * Pick List Data Table Component
 * Story 07.8: Pick List Generation
 *
 * Data table for viewing and managing pick lists:
 * - Filtering by status, priority, assigned user
 * - Sorting and pagination
 * - Actions: View, Assign, Cancel
 * - Priority badges
 * - Progress indicators
 */

'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import {
  Search,
  MoreHorizontal,
  Eye,
  UserPlus,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Package,
  Layers,
  RefreshCw,
} from 'lucide-react'
import type { PickList, PickListStatus, PickListPriority } from '@/lib/hooks/use-pick-lists'

// =============================================================================
// Types
// =============================================================================

export interface PickListDataTableProps {
  pickLists: PickList[]
  isLoading?: boolean
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  onPageChange?: (page: number) => void
  onView?: (pickList: PickList) => void
  onAssign?: (pickList: PickList) => void
  onCancel?: (pickList: PickList) => void
  onRefresh?: () => void
  testId?: string
}

// =============================================================================
// Helper Components
// =============================================================================

function StatusBadge({ status }: { status: PickListStatus }) {
  const variants: Record<PickListStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    pending: { variant: 'secondary', label: 'Pending' },
    assigned: { variant: 'default', label: 'Assigned' },
    in_progress: { variant: 'default', label: 'In Progress' },
    completed: { variant: 'outline', label: 'Completed' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
  }

  const { variant, label } = variants[status] || { variant: 'secondary', label: status }

  return (
    <Badge variant={variant} className={cn(
      status === 'in_progress' && 'bg-blue-600',
      status === 'completed' && 'bg-green-100 text-green-700 border-green-200'
    )}>
      {label}
    </Badge>
  )
}

function PriorityBadge({ priority }: { priority: PickListPriority }) {
  const variants: Record<PickListPriority, { className: string; label: string }> = {
    low: { className: 'bg-gray-100 text-gray-600', label: 'Low' },
    normal: { className: 'bg-blue-100 text-blue-700', label: 'Normal' },
    high: { className: 'bg-amber-100 text-amber-700', label: 'High' },
    urgent: { className: 'bg-red-100 text-red-700', label: 'Urgent' },
  }

  const { className, label } = variants[priority] || { className: '', label: priority }

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', className)}>
      {label}
    </span>
  )
}

function PickTypeIcon({ pickType }: { pickType: 'single_order' | 'wave' }) {
  if (pickType === 'wave') {
    return <Layers className="h-4 w-4 text-purple-600" aria-label="Wave Pick" />
  }
  return <Package className="h-4 w-4 text-blue-600" aria-label="Single Order Pick" />
}

// =============================================================================
// Component
// =============================================================================

export function PickListDataTable({
  pickLists,
  isLoading = false,
  pagination,
  onPageChange,
  onView,
  onAssign,
  onCancel,
  onRefresh,
  testId = 'pick-list-data-table',
}: PickListDataTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')

  // Filter pick lists
  const filteredPickLists = useMemo(() => {
    return pickLists.filter((pl) => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        const matchesSearch =
          pl.pick_list_number.toLowerCase().includes(term) ||
          (pl.assigned_to_name && pl.assigned_to_name.toLowerCase().includes(term))
        if (!matchesSearch) return false
      }

      // Status filter
      if (statusFilter !== 'all' && pl.status !== statusFilter) {
        return false
      }

      // Priority filter
      if (priorityFilter !== 'all' && pl.priority !== priorityFilter) {
        return false
      }

      return true
    })
  }, [pickLists, searchTerm, statusFilter, priorityFilter])

  // Calculate progress
  const getProgress = (pl: PickList): number => {
    if (!pl.total_quantity || pl.total_quantity === 0) return 0
    return Math.round(((pl.picked_quantity || 0) / pl.total_quantity) * 100)
  }

  const canCancel = (pl: PickList) => ['pending', 'assigned'].includes(pl.status)

  return (
    <div className="space-y-4" data-testid={testId}>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search pick lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>

        {onRefresh && (
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>Pick List #</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Lines</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                </TableRow>
              ))
            ) : filteredPickLists.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No pick lists found
                </TableCell>
              </TableRow>
            ) : (
              filteredPickLists.map((pl) => (
                <TableRow
                  key={pl.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => onView?.(pl)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <PickTypeIcon pickType={pl.pick_type} />
                  </TableCell>
                  <TableCell className="font-medium">{pl.pick_list_number}</TableCell>
                  <TableCell>
                    <StatusBadge status={pl.status} />
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={pl.priority} />
                  </TableCell>
                  <TableCell>
                    {pl.assigned_to_name || (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>{pl.line_count || 0}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={getProgress(pl)} className="w-16 h-2" />
                      <span className="text-xs text-gray-500">{getProgress(pl)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(pl.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView?.(pl)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {pl.status === 'pending' && (
                          <DropdownMenuItem onClick={() => onAssign?.(pl)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Assign Picker
                          </DropdownMenuItem>
                        )}
                        {canCancel(pl) && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => onCancel?.(pl)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-gray-600">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} pick lists
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PickListDataTable
