/**
 * TraceResultsMatrix Component
 * Story 02.10b: Traceability Queries UI
 *
 * Matrix/table view of trace results with export functionality.
 * Supports all 4 UI states: loading, error, empty, success.
 * Features: sorting, CSV/PDF export, keyboard navigation.
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertCircle,
  RefreshCw,
  TableIcon,
  Download,
  FileSpreadsheet,
  FileText,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import type { TraceResult, TraceNode, LicensePlate } from '@/lib/types/traceability'

// ============================================================================
// TYPES
// ============================================================================

interface TraceResultsMatrixProps {
  /** Trace result data */
  data: TraceResult | null
  /** Loading state */
  loading?: boolean
  /** Error object if any */
  error?: Error | null
  /** Callback to retry failed request */
  onRetry?: () => void
  /** Callback when row is clicked */
  onRowClick?: (lpId: string) => void
  /** Direction of trace */
  direction?: 'forward' | 'backward'
  /** Additional className */
  className?: string
}

interface FlattenedNode {
  lp: LicensePlate
  product_code: string
  product_name: string
  depth: number
  relationship_type: string | null
  path: string[]
}

type SortField = 'depth' | 'lp_number' | 'product_code' | 'quantity' | 'status' | 'expiry_date'
type SortDirection = 'asc' | 'desc'

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Flatten trace tree into a list with path info for matrix display
 */
function flattenTraceTree(nodes: TraceNode[], maxDepth: number = 20): FlattenedNode[] {
  const result: FlattenedNode[] = []

  function traverse(nodeList: TraceNode[], currentDepth: number, path: string[]) {
    if (currentDepth > maxDepth) return

    for (const node of nodeList) {
      const currentPath = [...path, node.lp.lp_number || node.lp.id.slice(0, 8)]

      result.push({
        lp: node.lp,
        product_code: node.product_code || node.lp.product_id,
        product_name: node.product_name || 'Unknown Product',
        depth: node.depth ?? currentDepth,
        relationship_type: node.relationship_type,
        path: currentPath,
      })

      if (node.children?.length) {
        traverse(node.children, currentDepth + 1, currentPath)
      }
    }
  }

  traverse(nodes, 1, [])
  return result
}

/**
 * Get status badge variant
 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'available':
      return 'default'
    case 'consumed':
      return 'secondary'
    case 'shipped':
      return 'outline'
    case 'quarantine':
    case 'recalled':
      return 'destructive'
    default:
      return 'secondary'
  }
}

/**
 * Format date for display
 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Export data to CSV
 */
function exportToCSV(data: FlattenedNode[], direction: string): void {
  const headers = [
    'Depth',
    'LP Number',
    'Product Code',
    'Product Name',
    'Quantity',
    'UOM',
    'Status',
    'Batch Number',
    'Expiry Date',
    'Manufacturing Date',
    'Path',
  ]

  const rows = data.map((node) => [
    node.depth.toString(),
    node.lp.lp_number || node.lp.id,
    node.product_code,
    node.product_name,
    node.lp.quantity?.toString() || '0',
    node.lp.uom || 'EA',
    node.lp.status,
    node.lp.batch_number || '',
    node.lp.expiry_date || '',
    node.lp.manufacturing_date || '',
    node.path.join(' > '),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `trace-${direction}-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Export data to PDF (simplified - generates HTML that can be printed)
 */
function exportToPDF(data: FlattenedNode[], direction: string, rootLp: string): void {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Please allow popups for PDF export')
    return
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Trace Results - ${direction}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #666; padding-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #fafafa; }
        .header-info { margin-bottom: 20px; color: #666; }
        .status { padding: 2px 8px; border-radius: 4px; font-size: 12px; }
        .status-available { background: #dcfce7; color: #166534; }
        .status-consumed { background: #dbeafe; color: #1e40af; }
        .status-shipped { background: #f3f4f6; color: #374151; }
        .status-quarantine { background: #fef3c7; color: #92400e; }
        .status-recalled { background: #fee2e2; color: #991b1b; }
        @media print {
          body { padding: 0; }
          h1 { font-size: 18px; }
          table { font-size: 10px; }
        }
      </style>
    </head>
    <body>
      <h1>Trace Results Report - ${direction === 'forward' ? 'Forward' : 'Backward'}</h1>
      <div class="header-info">
        <p><strong>Root LP:</strong> ${rootLp}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>Total Items:</strong> ${data.length}</p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Depth</th>
            <th>LP Number</th>
            <th>Product Code</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Status</th>
            <th>Expiry Date</th>
          </tr>
        </thead>
        <tbody>
          ${data
            .map(
              (node) => `
            <tr>
              <td>${node.depth}</td>
              <td>${node.lp.lp_number || node.lp.id.slice(0, 8)}</td>
              <td>${node.product_code}</td>
              <td>${node.product_name}</td>
              <td>${(node.lp.quantity || 0).toFixed(2)} ${node.lp.uom || 'EA'}</td>
              <td><span class="status status-${node.lp.status}">${node.lp.status}</span></td>
              <td>${formatDate(node.lp.expiry_date)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <script>window.print(); window.close();</script>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

// ============================================================================
// LOADING STATE
// ============================================================================

function TraceResultsMatrixLoading({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg" role="status" aria-label="Loading trace matrix">
          <div className="h-12 bg-muted/50" />
          <div className="p-4 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// ERROR STATE
// ============================================================================

interface TraceResultsMatrixErrorProps {
  error: Error
  onRetry?: () => void
  className?: string
}

function TraceResultsMatrixError({ error, onRetry, className }: TraceResultsMatrixErrorProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Trace Matrix
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center p-8 border rounded-lg bg-destructive/5"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle className="h-12 w-12 text-destructive mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Failed to Load Trace Data
          </h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          {onRetry && (
            <Button onClick={onRetry} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Retry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface TraceResultsMatrixEmptyProps {
  direction: 'forward' | 'backward'
  className?: string
}

function TraceResultsMatrixEmpty({ direction, className }: TraceResultsMatrixEmptyProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          Trace Matrix
        </CardTitle>
        <CardDescription>
          {direction === 'forward' ? 'Forward trace data' : 'Backward trace data'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/50"
          role="status"
          aria-live="polite"
        >
          <TableIcon className="h-12 w-12 text-muted-foreground mb-4" aria-hidden="true" />
          <h3 className="text-lg font-semibold mb-2">No Data to Display</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {direction === 'forward'
              ? 'No downstream products found for this license plate.'
              : 'No upstream sources found for this license plate.'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Run a trace search to populate the matrix.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function TraceResultsMatrix({
  data,
  loading = false,
  error = null,
  onRetry,
  onRowClick,
  direction = 'forward',
  className,
}: TraceResultsMatrixProps) {
  const [sortField, setSortField] = useState<SortField>('depth')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [focusedRowIndex, setFocusedRowIndex] = useState<number>(-1)

  // Flatten the tree for table display
  const flattenedResults = useMemo(() => {
    if (!data?.trace_tree) return []
    return flattenTraceTree(data.trace_tree)
  }, [data?.trace_tree])

  // Sort the results
  const sortedResults = useMemo(() => {
    return [...flattenedResults].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'depth':
          comparison = a.depth - b.depth
          break
        case 'lp_number':
          comparison = (a.lp.lp_number || '').localeCompare(b.lp.lp_number || '')
          break
        case 'product_code':
          comparison = a.product_code.localeCompare(b.product_code)
          break
        case 'quantity':
          comparison = (a.lp.quantity || 0) - (b.lp.quantity || 0)
          break
        case 'status':
          comparison = a.lp.status.localeCompare(b.lp.status)
          break
        case 'expiry_date': {
          const dateA = a.lp.expiry_date ? new Date(a.lp.expiry_date).getTime() : 0
          const dateB = b.lp.expiry_date ? new Date(b.lp.expiry_date).getTime() : 0
          comparison = dateA - dateB
          break
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [flattenedResults, sortField, sortDirection])

  // Handle sort toggle
  const handleSort = useCallback((field: SortField) => {
    setSortField((prev) => {
      if (prev === field) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortDirection('asc')
      return field
    })
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number, lpId: string) => {
      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault()
          onRowClick?.(lpId)
          break
        case 'ArrowDown':
          event.preventDefault()
          if (index < sortedResults.length - 1) {
            setFocusedRowIndex(index + 1)
          }
          break
        case 'ArrowUp':
          event.preventDefault()
          if (index > 0) {
            setFocusedRowIndex(index - 1)
          }
          break
      }
    },
    [sortedResults.length, onRowClick]
  )

  // Handle export
  const handleExportCSV = useCallback(() => {
    exportToCSV(flattenedResults, direction)
  }, [flattenedResults, direction])

  const handleExportPDF = useCallback(() => {
    exportToPDF(
      flattenedResults,
      direction,
      data?.root_lp?.lp_number || data?.root_lp?.id || 'Unknown'
    )
  }, [flattenedResults, direction, data?.root_lp])

  // Sort icon component
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 text-muted-foreground" />
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3 ml-1" />
    ) : (
      <ChevronDown className="h-3 w-3 ml-1" />
    )
  }

  // Loading state
  if (loading) {
    return <TraceResultsMatrixLoading className={className} />
  }

  // Error state
  if (error) {
    return <TraceResultsMatrixError error={error} onRetry={onRetry} className={className} />
  }

  // Empty state
  if (!data || sortedResults.length === 0) {
    return <TraceResultsMatrixEmpty direction={direction} className={className} />
  }

  // Success state
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TableIcon className="h-5 w-5 text-blue-600" aria-hidden="true" />
              Trace Matrix
            </CardTitle>
            <CardDescription>
              {sortedResults.length} {sortedResults.length === 1 ? 'record' : 'records'} |{' '}
              {direction === 'forward' ? 'Forward' : 'Backward'} trace from{' '}
              {data.root_lp?.lp_number || 'root LP'}
            </CardDescription>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" aria-hidden="true" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4" aria-hidden="true" />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="w-16 cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('depth')}
                  >
                    <div className="flex items-center">
                      Depth
                      <SortIcon field="depth" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('lp_number')}
                  >
                    <div className="flex items-center">
                      LP Number
                      <SortIcon field="lp_number" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('product_code')}
                  >
                    <div className="flex items-center">
                      Product
                      <SortIcon field="product_code" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('quantity')}
                  >
                    <div className="flex items-center justify-end">
                      Quantity
                      <SortIcon field="quantity" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort('expiry_date')}
                  >
                    <div className="flex items-center">
                      Expiry
                      <SortIcon field="expiry_date" />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResults.map((node, index) => (
                  <TableRow
                    key={`${node.lp.id}-${index}`}
                    className="cursor-pointer hover:bg-muted/50 focus-within:bg-muted/50"
                    tabIndex={0}
                    role="button"
                    aria-label={`View details for ${node.lp.lp_number || node.lp.id}`}
                    onClick={() => onRowClick?.(node.lp.id)}
                    onKeyDown={(e) => handleKeyDown(e, index, node.lp.id)}
                    data-focused={focusedRowIndex === index}
                  >
                    <TableCell>
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium"
                        aria-label={`Depth level ${node.depth}`}
                      >
                        {node.depth}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium font-mono">
                      {node.lp.lp_number || node.lp.id.slice(0, 8)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{node.product_code}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {node.product_name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="tabular-nums">
                        {(node.lp.quantity || 0).toFixed(2)}
                      </span>
                      <span className="text-muted-foreground ml-1">{node.lp.uom || 'EA'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(node.lp.status)}>{node.lp.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {node.lp.batch_number || '-'}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(node.lp.expiry_date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <p>Click column headers to sort. Click a row to view LP details.</p>
          <p>Use arrow keys to navigate, Enter to select.</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default TraceResultsMatrix
