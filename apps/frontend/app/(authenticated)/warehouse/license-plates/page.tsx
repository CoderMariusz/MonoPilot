/**
 * License Plates Page
 * Story 5.1-5.4: LP Core Management
 * AC-5.1.1: Display license plates with filters
 * AC-5.1.2: Create new license plate
 * AC-5.2: Status management
 * AC-5.3: Batch & expiry tracking
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { LPStatusBadge } from '@/components/warehouse/LPStatusBadge'
import { LPFormModal } from '@/components/warehouse/LPFormModal'
import { LPDetailPanel } from '@/components/warehouse/LPDetailPanel'
import { LPMergeModal } from '@/components/warehouse/LPMergeModal'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  Plus,
  Search,
  Filter,
  Package,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Merge,
} from 'lucide-react'

interface LicensePlate {
  id: string
  lp_number: string
  product_id: string
  product?: {
    id: string
    code: string
    name: string
    uom: string
  }
  warehouse_id: string
  warehouse?: {
    id: string
    code: string
    name: string
  }
  location_id: string
  location?: {
    id: string
    code: string
  }
  quantity: number
  current_qty: number
  status: 'available' | 'reserved' | 'consumed' | 'shipped' | 'quarantine' | 'recalled' | 'merged'
  qa_status: 'pending' | 'passed' | 'failed' | 'on_hold' | null
  batch_number?: string
  supplier_batch_number?: string
  manufacturing_date?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

interface Warehouse {
  id: string
  code: string
  name: string
}

export default function LicensePlatesPage() {
  const [lps, setLps] = useState<LicensePlate[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [qaStatusFilter, setQaStatusFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all')
  const [expiryFilter, setExpiryFilter] = useState<string>('all')

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMergeModal, setShowMergeModal] = useState(false)
  const [selectedLP, setSelectedLP] = useState<LicensePlate | null>(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)

  const { toast } = useToast()

  // Fetch LPs
  const fetchLPs = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (qaStatusFilter && qaStatusFilter !== 'all') params.append('qa_status', qaStatusFilter)
      if (warehouseFilter && warehouseFilter !== 'all') params.append('warehouse_id', warehouseFilter)

      // Expiry filters
      const today = new Date().toISOString().split('T')[0]
      if (expiryFilter === 'expired') {
        params.append('expiry_before', today)
      } else if (expiryFilter === 'expiring_soon') {
        const thirtyDaysLater = new Date()
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30)
        params.append('expiry_before', thirtyDaysLater.toISOString().split('T')[0])
        params.append('expiry_after', today)
      }

      params.append('limit', pageSize.toString())
      params.append('offset', ((page - 1) * pageSize).toString())

      const response = await fetch(`/api/warehouse/license-plates?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch license plates')

      const data = await response.json()
      setLps(data.data || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load license plates',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, qaStatusFilter, warehouseFilter, expiryFilter, page, pageSize, toast])

  // Fetch warehouses for filter
  const fetchWarehouses = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/warehouses?limit=100')
      if (!response.ok) return
      const data = await response.json()
      setWarehouses(data.warehouses || [])
    } catch {
      // Ignore error for filter data
    }
  }, [])

  useEffect(() => {
    fetchWarehouses()
  }, [fetchWarehouses])

  useEffect(() => {
    fetchLPs()
  }, [fetchLPs])

  const handleLPClick = (lp: LicensePlate) => {
    setSelectedLP(lp)
    setShowDetailPanel(true)
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    fetchLPs()
  }

  const handleDetailClose = () => {
    setShowDetailPanel(false)
    setSelectedLP(null)
  }

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false
    const date = new Date(expiryDate)
    const today = new Date()
    const daysUntilExpiry = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0
  }

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false
    return new Date(expiryDate) < new Date()
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            License Plates
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage inventory license plates, batch tracking, and expiry dates
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMergeModal(true)}>
            <Merge className="h-4 w-4 mr-2" />
            Merge LPs
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create LP
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search LP number or batch..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="reserved">Reserved</SelectItem>
            <SelectItem value="quarantine">Quarantine</SelectItem>
            <SelectItem value="consumed">Consumed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
          </SelectContent>
        </Select>

        <Select value={qaStatusFilter} onValueChange={(v) => { setQaStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="QA Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All QA</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>

        <Select value={warehouseFilter} onValueChange={(v) => { setWarehouseFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            {warehouses.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.code} - {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={expiryFilter} onValueChange={(v) => { setExpiryFilter(v); setPage(1) }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expiry</SelectItem>
            <SelectItem value="expiring_soon">Expiring Soon (30d)</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={fetchLPs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total LPs</p>
          <p className="text-2xl font-bold">{total}</p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-green-600">
            {lps.filter((l) => l.status === 'available').length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">In Quarantine</p>
          <p className="text-2xl font-bold text-yellow-600">
            {lps.filter((l) => l.status === 'quarantine').length}
          </p>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" /> Expiring Soon
          </p>
          <p className="text-2xl font-bold text-orange-600">
            {lps.filter((l) => isExpiringSoon(l.expiry_date)).length}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>LP Number</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Batch</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QA</TableHead>
              <TableHead>Expiry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : lps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No license plates found
                </TableCell>
              </TableRow>
            ) : (
              lps.map((lp) => (
                <TableRow
                  key={lp.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleLPClick(lp)}
                >
                  <TableCell className="font-mono font-medium">{lp.lp_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lp.product?.code}</p>
                      <p className="text-xs text-muted-foreground">{lp.product?.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>{lp.batch_number || '-'}</TableCell>
                  <TableCell className="text-right">
                    {lp.current_qty} {lp.product?.uom}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p>{lp.warehouse?.code}</p>
                      <p className="text-xs text-muted-foreground">{lp.location?.code}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <LPStatusBadge status={lp.status} />
                  </TableCell>
                  <TableCell>
                    {lp.qa_status && (
                      <Badge
                        variant={
                          lp.qa_status === 'passed'
                            ? 'default'
                            : lp.qa_status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {lp.qa_status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {lp.expiry_date ? (
                      <span
                        className={
                          isExpired(lp.expiry_date)
                            ? 'text-red-600 font-medium'
                            : isExpiringSoon(lp.expiry_date)
                            ? 'text-yellow-600'
                            : ''
                        }
                      >
                        {format(new Date(lp.expiry_date), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <LPFormModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <LPMergeModal
        open={showMergeModal}
        onClose={() => setShowMergeModal(false)}
        onSuccess={(newLP) => {
          setShowMergeModal(false)
          fetchLPs()
          toast({
            title: 'Success',
            description: `Merged into ${newLP}`,
          })
        }}
      />

      <LPDetailPanel
        open={showDetailPanel}
        lp={selectedLP}
        onClose={handleDetailClose}
        onRefresh={fetchLPs}
      />
    </div>
  )
}
