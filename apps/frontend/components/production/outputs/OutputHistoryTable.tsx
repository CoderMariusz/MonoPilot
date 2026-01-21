'use client'

/**
 * OutputHistoryTable Component (Story 04.7a)
 *
 * Table displaying output history with:
 * - Columns: LP Number, Qty, Batch, QA Status, Location, Expiry, Created At, Actions
 * - Filtering by QA Status and Location
 * - Sorting by columns
 * - Register Output and Export CSV buttons
 * - Summary section showing totals
 * - Empty state handling
 */

import { useState, useMemo } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Download,
  Eye,
  Printer,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
export interface OutputLP {
  id: string
  lp_id: string
  lp_number: string
  quantity: number
  uom: string
  batch_number: string
  qa_status: 'approved' | 'pending' | 'rejected' | null
  location_id: string | null
  location_name: string | null
  expiry_date: string | null
  created_at: string
  created_by_name?: string
  notes?: string
}

export interface OutputSummary {
  total_outputs: number
  total_qty: number
  approved_count: number
  approved_qty: number
  pending_count: number
  pending_qty: number
  rejected_count: number
  rejected_qty: number
}

export interface OutputHistoryTableProps {
  /** List of output records */
  outputs: OutputLP[]
  /** Summary statistics */
  summary: OutputSummary
  /** Callback to open register output modal */
  onRegisterOutput: () => void
  /** Callback to export outputs as CSV */
  onExportCSV: () => void
  /** Callback to view LP details */
  onViewLP: (lpId: string) => void
  /** Callback to print LP label */
  onPrintLabel: (lpId: string) => void
  /** Unit of measure for display */
  uom?: string
}

type SortColumn = 'lp_number' | 'quantity' | 'batch_number' | 'qa_status' | 'location_name' | 'expiry_date' | 'created_at'
type SortDirection = 'asc' | 'desc'

/**
 * QA Status badge component
 */
function QAStatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground">-</span>

  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    approved: { variant: 'default', label: 'Approved' },
    pending: { variant: 'secondary', label: 'Pending' },
    rejected: { variant: 'destructive', label: 'Rejected' },
  }

  const config = variants[status] || { variant: 'outline' as const, label: status }

  return (
    <Badge variant={config.variant} className="capitalize">
      {config.label}
    </Badge>
  )
}

/**
 * Format date for display
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function OutputHistoryTable({
  outputs,
  summary,
  onRegisterOutput,
  onExportCSV,
  onViewLP,
  onPrintLabel,
  uom = 'kg',
}: OutputHistoryTableProps) {
  // Filter state
  const [qaFilter, setQaFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')

  // Sort state
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Get unique locations for filter
  const uniqueLocations = useMemo(() => {
    const locations = new Map<string, string>()
    outputs.forEach((o) => {
      if (o.location_id && o.location_name) {
        locations.set(o.location_id, o.location_name)
      }
    })
    return Array.from(locations.entries()).map(([id, name]) => ({ id, name }))
  }, [outputs])

  // Filter and sort outputs
  const filteredOutputs = useMemo(() => {
    let result = [...outputs]

    // Apply QA filter
    if (qaFilter !== 'all') {
      result = result.filter((o) => o.qa_status === qaFilter)
    }

    // Apply location filter
    if (locationFilter !== 'all') {
      result = result.filter((o) => o.location_id === locationFilter)
    }

    // Apply sort
    result.sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case 'lp_number':
          comparison = (a.lp_number || '').localeCompare(b.lp_number || '')
          break
        case 'quantity':
          comparison = a.quantity - b.quantity
          break
        case 'batch_number':
          comparison = (a.batch_number || '').localeCompare(b.batch_number || '')
          break
        case 'qa_status':
          comparison = (a.qa_status || '').localeCompare(b.qa_status || '')
          break
        case 'location_name':
          comparison = (a.location_name || '').localeCompare(b.location_name || '')
          break
        case 'expiry_date':
          comparison = new Date(a.expiry_date || 0).getTime() - new Date(b.expiry_date || 0).getTime()
          break
        case 'created_at':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [outputs, qaFilter, locationFilter, sortColumn, sortDirection])

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Handle column header keyboard navigation
  const handleHeaderKeyDown = (e: React.KeyboardEvent, column: SortColumn) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleSort(column)
    }
  }

  // Sort icon component
  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    )
  }

  // Empty state
  if (outputs.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <Package className="h-12 w-12 text-muted-foreground/50" />
          <div>
            <h3 className="text-lg font-semibold">No outputs registered</h3>
            <p className="text-sm text-muted-foreground">
              Start by registering your first production output
            </p>
          </div>
          <Button onClick={onRegisterOutput}>
            <Plus className="h-4 w-4 mr-2" />
            Register First Output
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with filters and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* QA Status Filter */}
          <div className="flex items-center gap-2">
            <Label htmlFor="qa-filter" className="text-sm text-muted-foreground">
              QA Status:
            </Label>
            <Select value={qaFilter} onValueChange={setQaFilter}>
              <SelectTrigger id="qa-filter" className="w-32">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-2">
            <Label htmlFor="location-filter" className="text-sm text-muted-foreground">
              Location:
            </Label>
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger id="location-filter" className="w-40">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {uniqueLocations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <Button onClick={onRegisterOutput}>
            <Plus className="h-4 w-4 mr-2" />
            Register Output
          </Button>
          <Button variant="outline" onClick={onExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('lp_number')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'lp_number')}
                tabIndex={0}
                role="button"
                aria-label="LP Number, sortable column"
              >
                <div className="flex items-center">
                  LP Number
                  <SortIcon column="lp_number" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('quantity')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'quantity')}
                tabIndex={0}
                role="button"
                aria-label="Quantity, sortable column"
              >
                <div className="flex items-center">
                  Qty
                  <SortIcon column="quantity" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('batch_number')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'batch_number')}
                tabIndex={0}
                role="button"
                aria-label="Batch Number, sortable column"
              >
                <div className="flex items-center">
                  Batch
                  <SortIcon column="batch_number" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('qa_status')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'qa_status')}
                tabIndex={0}
                role="button"
                aria-label="QA Status, sortable column"
              >
                <div className="flex items-center">
                  QA Status
                  <SortIcon column="qa_status" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('location_name')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'location_name')}
                tabIndex={0}
                role="button"
                aria-label="Location, sortable column"
              >
                <div className="flex items-center">
                  Location
                  <SortIcon column="location_name" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('expiry_date')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'expiry_date')}
                tabIndex={0}
                role="button"
                aria-label="Expiry Date, sortable column"
              >
                <div className="flex items-center">
                  Expiry
                  <SortIcon column="expiry_date" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleSort('created_at')}
                onKeyDown={(e) => handleHeaderKeyDown(e, 'created_at')}
                tabIndex={0}
                role="button"
                aria-label="Created At, sortable column"
              >
                <div className="flex items-center">
                  Created
                  <SortIcon column="created_at" />
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOutputs.map((output) => (
              <TableRow key={output.id}>
                <TableCell className="font-mono">{output.lp_number}</TableCell>
                <TableCell className="font-mono">
                  {formatNumber(output.quantity)} {output.uom || uom}
                </TableCell>
                <TableCell className="font-mono">{output.batch_number}</TableCell>
                <TableCell>
                  <QAStatusBadge status={output.qa_status} />
                </TableCell>
                <TableCell>{output.location_name || '-'}</TableCell>
                <TableCell className="font-mono">{formatDate(output.expiry_date)}</TableCell>
                <TableCell>
                  <div className="text-xs">
                    <div>{formatRelativeTime(output.created_at)}</div>
                    {output.created_by_name && (
                      <div className="text-muted-foreground">by: {output.created_by_name}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewLP(output.lp_id)}
                      title="View LP"
                      aria-label={`View license plate ${output.lp_number}`}
                    >
                      <Eye className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPrintLabel(output.lp_id)}
                      title="Print Label"
                      aria-label={`Print label for ${output.lp_number}`}
                    >
                      <Printer className="h-4 w-4" />
                      <span className="sr-only">Label</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary section */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <h4 className="text-sm font-medium mb-2">Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Outputs:</span>{' '}
            <span className="font-medium">{summary.total_outputs}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Total Qty:</span>{' '}
            <span className="font-mono font-medium">
              {formatNumber(summary.total_qty)} {uom}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Approved:</span>{' '}
            <span className="font-medium text-green-600">
              {summary.approved_count} ({formatNumber(summary.approved_qty)} {uom})
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Pending:</span>{' '}
            <span className="font-medium text-yellow-600">
              {summary.pending_count} ({formatNumber(summary.pending_qty)} {uom})
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Rejected:</span>{' '}
            <span className="font-medium text-red-600">
              {summary.rejected_count} ({formatNumber(summary.rejected_qty)} {uom})
            </span>
          </div>
        </div>
      </div>

      {/* Pagination info */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredOutputs.length} of {outputs.length} outputs
      </div>
    </div>
  )
}

export default OutputHistoryTable
