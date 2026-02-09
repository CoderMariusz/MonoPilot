/**
 * NCR List Page
 * Story 06.9: Basic NCR Creation
 * Displays list of Non-Conformance Reports with filters and creation
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, RefreshCw } from 'lucide-react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface NCRReport {
  id: string
  ncr_number: string
  title: string
  description?: string
  status: 'draft' | 'open' | 'closed'
  severity: 'minor' | 'major' | 'critical'
  category?: string
  detection_point?: string
  detected_date: string
  detected_by?: { id: string; name: string }
  assigned_to?: { id: string; name: string }
  created_at: string
}

interface Pagination {
  total: number
  page: number
  limit: number
  total_pages: number
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-green-100 text-green-800',
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-yellow-100 text-yellow-800',
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
}

export default function NCRListPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Data state
  const [ncrs, setNCRs] = useState<NCRReport[]>([])
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
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Load NCRs
  useEffect(() => {
    const fetchNCRs = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams()
        params.append('page', pagination.page.toString())
        params.append('limit', pagination.limit.toString())

        if (search) {
          params.append('search', search)
        }
        if (statusFilter !== 'all') {
          params.append('status', statusFilter)
        }
        if (severityFilter !== 'all') {
          params.append('severity', severityFilter)
        }

        const response = await fetch(`/api/quality/ncrs?${params.toString()}`)

        if (!response.ok) {
          throw new Error('Failed to fetch NCR reports')
        }

        const data = await response.json()
        setNCRs(data.ncrs || data.data || [])
        setPagination(data.pagination || { total: 0, page: 1, limit: 20, total_pages: 0 })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load NCR reports'
        setError(message)
        console.error('Error fetching NCRs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchNCRs()
  }, [pagination.page, pagination.limit, search, statusFilter, severityFilter])

  const handleSearch = (value: string) => {
    setSearch(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleSeverityFilterChange = (value: string) => {
    setSeverityFilter(value)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())

      const response = await fetch(`/api/quality/ncrs?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setNCRs(data.ncrs || data.data || [])
        toast({
          title: 'Refreshed',
          description: 'NCR list updated',
        })
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to refresh NCR list',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClick = () => {
    router.push('/quality/ncr/new')
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Non-Conformance Reports (NCR)</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage quality non-conformances
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={handleCreateClick}>
              <Plus className="mr-2 h-4 w-4" />
              Create NCR
            </Button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor="search-ncr" className="text-sm font-medium mb-2 block">
              Search NCR
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="search-ncr"
                placeholder="Search by NCR number or title..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="w-full md:w-48">
            <label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
              Status
            </label>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-48">
            <label htmlFor="severity-filter" className="text-sm font-medium mb-2 block">
              Severity
            </label>
            <Select value={severityFilter} onValueChange={handleSeverityFilterChange}>
              <SelectTrigger id="severity-filter">
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">ID</TableHead>
                <TableHead className="font-semibold">Title</TableHead>
                <TableHead className="font-semibold">Detection Point</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Severity</TableHead>
                <TableHead className="font-semibold">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading state
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : ncrs.length === 0 ? (
                // Empty state
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-4xl">📋</div>
                      <p className="text-muted-foreground">
                        {search || statusFilter !== 'all' || severityFilter !== 'all'
                          ? 'No NCR reports match your filters'
                          : 'No NCR reports yet'}
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleCreateClick}
                        className="mt-4"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create First NCR
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                // Data rows
                ncrs.map((ncr) => (
                  <TableRow
                    key={ncr.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => router.push(`/quality/ncr/${ncr.id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link href={`/quality/ncr/${ncr.id}`} className="text-blue-600 hover:underline">
                        {ncr.ncr_number}
                      </Link>
                    </TableCell>
                    <TableCell>{ncr.title}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground capitalize">
                        {ncr.detection_point?.replace('_', ' ') || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[ncr.status] || 'bg-gray-100'}>
                        {ncr.status.charAt(0).toUpperCase() + ncr.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={SEVERITY_COLORS[ncr.severity] || 'bg-gray-100'}>
                        {ncr.severity.charAt(0).toUpperCase() + ncr.severity.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(ncr.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!loading && pagination.total_pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} NCR reports
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.total_pages}
                onClick={() =>
                  setPagination(prev => ({
                    ...prev,
                    page: Math.min(pagination.total_pages, prev.page + 1),
                  }))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
