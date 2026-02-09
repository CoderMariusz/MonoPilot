/**
 * Quality Holds List Page
 * Story: 06.2 - Quality Holds CRUD
 * AC-2.27 to AC-2.30: Holds list with filters and aging indicators
 *
 * Route: /quality/holds
 *
 * Displays paginated list of quality holds with:
 * - Status, priority, and date range filters
 * - Search by hold number
 * - Aging indicators with color-coded warnings
 * - Navigation to hold detail page
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { useResponsiveView } from '@/hooks/use-responsive-view'
import {
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  Shield,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import {
  HoldStatusBadge,
  HoldPriorityBadge,
  HoldTypeBadge,
  AgingIndicatorCompact,
  HoldForm,
} from '@/components/quality/holds'
import type { HoldStatus, Priority, HoldType } from '@/lib/validation/quality-hold-validation'

interface HoldSummary {
  id: string
  hold_number: string
  status: HoldStatus
  priority: Priority
  hold_type: HoldType
  reason: string
  items_count: number
  held_by: { id: string; name: string }
  held_at: string
  aging_hours: number
  aging_status: 'normal' | 'warning' | 'critical'
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

interface Product {
  id: string
  code: string
  name: string
}

export default function QualityHoldsPage() {
  // Data state
  const [holds, setHolds] = useState<HoldSummary[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 20,
    total_pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [reasonFilter, setReasonFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')

  // Filter options state
  const [reasons, setReasons] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingFilters, setLoadingFilters] = useState(true)

  // Sort state
  const [sortBy, setSortBy] = useState<string>('held_at')
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC')

  // UI state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const router = useRouter()
  const { toast } = useToast()
  const { isMobile } = useResponsiveView()

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoadingFilters(true)

      // Fetch reasons
      const reasonsResponse = await fetch('/api/quality/holds/filters?type=reasons')
      if (reasonsResponse.ok) {
        const reasonsData = await reasonsResponse.json()
        setReasons(reasonsData.reasons || [])
      }

      // Fetch products
      const productsResponse = await fetch('/api/quality/holds/filters?type=products')
      if (productsResponse.ok) {
        const productsData = await productsResponse.json()
        setProducts(productsData.products || [])
      }
    } catch (err) {
      console.error('Error fetching filter options:', err)
    } finally {
      setLoadingFilters(false)
    }
  }, [])

  // Fetch holds
  const fetchHolds = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter && priorityFilter !== 'all') params.append('priority', priorityFilter)
      params.append('limit', pagination.limit.toString())
      params.append('offset', ((pagination.page - 1) * pagination.limit).toString())
      params.append('sort', `${sortBy} ${sortDirection}`)

      const response = await fetch(`/api/quality/holds?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch quality holds')
      }

      const data = await response.json()
      setHolds(data.holds || [])
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        total_pages: data.pagination?.total_pages || 0,
      }))
    } catch (err) {
      console.error('Error fetching holds:', err)
      setError(err instanceof Error ? err.message : 'Failed to load quality holds')
      toast({
        title: 'Error',
        description: 'Failed to load quality holds',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, priorityFilter, pagination.page, pagination.limit, sortBy, sortDirection])

  // Reset pagination to page 1 when filters change (but not when pagination.page changes)
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [search, statusFilter, priorityFilter])

  // Fetch on filter changes and pagination changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchHolds()
    }, search ? 300 : 0) // Debounce search

    return () => clearTimeout(timer)
  }, [search, statusFilter, priorityFilter, pagination.page, pagination.limit, sortBy, sortDirection, fetchHolds])

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Truncate reason text
  const truncateReason = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'ASC' ? 'DESC' : 'ASC')
    } else {
      // Set new sort column with DESC as default
      setSortBy(column)
      setSortDirection('DESC')
    }
    // Reset to page 1 when sort changes
    setPagination((p) => ({ ...p, page: 1 }))
  }

  // Render sort indicator for column header
  const renderSortIndicator = (column: string) => {
    if (sortBy !== column) return null
    return sortDirection === 'ASC' ? (
      <ChevronUp className="ml-2 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-2 h-4 w-4 inline" />
    )
  }

  // Handle create success
  const handleCreateSuccess = (holdId: string) => {
    setCreateModalOpen(false)
    router.push(`/quality/holds/${holdId}`)
  }

  // Navigate to detail
  const navigateToDetail = (id: string) => {
    router.push(`/quality/holds/${id}`)
  }

  // Loading state
  if (loading && holds.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  // Error state
  if (error && holds.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 py-12">
          <AlertCircle className="h-12 w-12 text-red-400" />
          <h2 className="mt-4 text-lg font-semibold text-red-800">Failed to Load Holds</h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => fetchHolds()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-yellow-600" />
          <h1 className="text-2xl font-bold">Quality Holds</h1>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Hold
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by hold number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
        {loading && <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />}
      </div>

      {/* Empty state */}
      {holds.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
          <Shield className="h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-lg font-semibold text-gray-700">No Quality Holds</h2>
          <p className="mt-2 text-sm text-gray-500">
            {search || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'No holds match your search criteria.'
              : 'Create your first quality hold to start tracking inventory issues.'}
          </p>
          {!search && statusFilter === 'all' && priorityFilter === 'all' && (
            <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Hold
            </Button>
          )}
        </div>
      )}

      {/* Mobile Card View */}
      {isMobile && holds.length > 0 && (
        <div className="space-y-3">
          {holds.map((hold) => {
            const isExpanded = expandedCard === hold.id
            return (
              <div
                key={hold.id}
                className="rounded-lg border bg-white overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedCard(isExpanded ? null : hold.id)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-mono font-medium truncate">{hold.hold_number}</span>
                    <HoldStatusBadge status={hold.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <AgingIndicatorCompact
                      agingHours={hold.aging_hours}
                      priority={hold.priority}
                    />
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-200 ${
                    isExpanded ? 'max-h-80' : 'max-h-0'
                  }`}
                >
                  <div className="px-4 pb-4 space-y-3 border-t">
                    <div className="pt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Priority:</span>
                        <div className="mt-1">
                          <HoldPriorityBadge priority={hold.priority} />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <div className="mt-1">
                          <HoldTypeBadge holdType={hold.hold_type} />
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Items:</span>
                        <p className="font-medium">{hold.items_count}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Held By:</span>
                        <p className="font-medium truncate">{hold.held_by.name}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">Reason:</span>
                        <p className="text-sm text-gray-700">{truncateReason(hold.reason, 100)}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigateToDetail(hold.id)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Desktop Table View */}
      {!isMobile && holds.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hold Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Held By</TableHead>
                <TableHead>Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holds.map((hold) => (
                <TableRow
                  key={hold.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => navigateToDetail(hold.id)}
                >
                  <TableCell className="font-mono font-medium">
                    <Link
                      href={`/quality/holds/${hold.id}`}
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {hold.hold_number}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <HoldStatusBadge status={hold.status} />
                  </TableCell>
                  <TableCell>
                    <HoldPriorityBadge priority={hold.priority} />
                  </TableCell>
                  <TableCell>
                    <HoldTypeBadge holdType={hold.hold_type} />
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <span className="truncate block" title={hold.reason}>
                      {truncateReason(hold.reason)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{hold.items_count}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{hold.held_by.name}</TableCell>
                  <TableCell>
                    <AgingIndicatorCompact
                      agingHours={hold.aging_hours}
                      priority={hold.priority}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
            holds
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.total_pages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Hold Modal */}
      <HoldForm
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
