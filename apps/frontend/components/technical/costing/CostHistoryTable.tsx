'use client'

/**
 * CostHistoryTable Component (Story 02.15)
 * Paginated table of all cost records
 */

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CostTrendIndicator } from './CostTrendIndicator'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
} from 'lucide-react'
import type { CostHistoryItem, PaginationData } from '@/lib/types/cost-history'

export interface CostHistoryTableProps {
  /** Cost history data */
  data: CostHistoryItem[]
  /** Pagination info */
  pagination: PaginationData
  /** Handler for page change */
  onPageChange: (page: number) => void
  /** Handler for row click */
  onRowClick: (item: CostHistoryItem) => void
  /** Handler for sort change */
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  /** Handler for limit change */
  onLimitChange?: (limit: number) => void
}

export function CostHistoryTable({
  data,
  pagination,
  onPageChange,
  onRowClick,
  onSort,
  onLimitChange,
}: CostHistoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleSort = (column: string) => {
    const newDirection =
      sortColumn === column && sortDirection === 'desc' ? 'asc' : 'desc'
    setSortColumn(column)
    setSortDirection(newDirection)
    onSort?.(column, newDirection)
  }

  // Calculate change from previous record
  const calculateChange = (index: number): number | null => {
    if (index >= data.length - 1) return null
    const current = data[index].total_cost
    const previous = data[index + 1].total_cost
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // Filter data based on search term
  const filteredData = searchTerm
    ? data.filter(
        (item) =>
          item.cost_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          formatDate(item.effective_from)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      )
    : data

  const costTypeColors: Record<string, string> = {
    standard: 'bg-blue-100 text-blue-800',
    actual: 'bg-green-100 text-green-800',
    planned: 'bg-orange-100 text-orange-800',
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Cost History Table</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and filter controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by date or type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              aria-label="Search cost history"
            />
          </div>
          <Select
            value={String(pagination.limit)}
            onValueChange={(value) => onLimitChange?.(Number(value))}
          >
            <SelectTrigger className="w-[120px]" aria-label="Records per page">
              <SelectValue placeholder="Per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('effective_from')}
                >
                  <div className="flex items-center gap-1">
                    Date
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Material</TableHead>
                <TableHead className="text-right">Labor</TableHead>
                <TableHead className="text-right">Overhead</TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('total_cost')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Total
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No cost history records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => {
                  const change = calculateChange(index)
                  return (
                    <TableRow
                      key={item.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => onRowClick(item)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(item)
                        }
                      }}
                      role="button"
                      aria-label={`View cost details for ${formatDate(item.effective_from)}`}
                    >
                      <TableCell className="font-medium">
                        {formatDate(item.effective_from)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={costTypeColors[item.cost_type] || ''}
                        >
                          {item.cost_type.charAt(0).toUpperCase() +
                            item.cost_type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.material_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.labor_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.overhead_cost)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.total_cost)}
                      </TableCell>
                      <TableCell className="text-right">
                        {change !== null ? (
                          <CostTrendIndicator value={change} showValue size="sm" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} records
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={pagination.page === 1}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                const startPage = Math.max(
                  1,
                  Math.min(
                    pagination.page - 2,
                    pagination.total_pages - 4
                  )
                )
                const pageNum = startPage + i
                if (pageNum > pagination.total_pages) return null
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === pagination.page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onPageChange(pageNum)}
                    aria-label={`Page ${pageNum}`}
                    aria-current={pageNum === pagination.page ? 'page' : undefined}
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.total_pages}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.total_pages)}
              disabled={pagination.page === pagination.total_pages}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
