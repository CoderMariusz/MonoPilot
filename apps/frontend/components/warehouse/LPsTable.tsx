/**
 * License Plates Table Component
 * Stories 5.1-5.4: LP Core UI
 * Reusable table for LP lists with sorting and actions
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LPStatusBadge } from './LPStatusBadge'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Edit,
  Printer,
  AlertTriangle,
} from 'lucide-react'

interface LPsTableProps {
  search?: string
  statusFilter?: string
  warehouseFilter?: string
  productFilter?: string
  expiryRangeFilter?: string
  onLPClick: (lpId: string) => void
  refreshKey?: number
}

interface LicensePlate {
  id: string
  lp_number: string
  batch_number?: string
  product_id: string
  product?: {
    id: string
    code: string
    name: string
    uom: string
  }
  warehouse_id?: string
  warehouse?: {
    id: string
    code: string
    name: string
  }
  location_id?: string
  location?: {
    id: string
    code: string
  }
  quantity: number
  current_qty: number
  status: 'available' | 'reserved' | 'consumed' | 'shipped' | 'quarantine' | 'recalled' | 'merged' | 'split'
  qa_status: 'pending' | 'passed' | 'failed' | 'on_hold' | null
  expiry_date?: string
  created_at: string
}

export function LPsTable({
  search = '',
  statusFilter = 'all',
  warehouseFilter = 'all',
  productFilter = 'all',
  expiryRangeFilter = 'all',
  onLPClick,
  refreshKey = 0,
}: LPsTableProps) {
  const { toast } = useToast()

  const [lps, setLps] = useState<LicensePlate[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchLPs = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (warehouseFilter && warehouseFilter !== 'all') params.append('warehouse_id', warehouseFilter)
      if (productFilter && productFilter !== 'all') params.append('product_id', productFilter)

      // Expiry filters
      const today = new Date().toISOString().split('T')[0]
      if (expiryRangeFilter && expiryRangeFilter !== 'all') {
        if (expiryRangeFilter === 'expired') {
          params.append('expiry_before', today)
        } else {
          const days = parseInt(expiryRangeFilter)
          const futureDate = new Date()
          futureDate.setDate(futureDate.getDate() + days)
          params.append('expiry_before', futureDate.toISOString().split('T')[0])
          params.append('expiry_after', today)
        }
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
  }, [search, statusFilter, warehouseFilter, productFilter, expiryRangeFilter, page, toast])

  useEffect(() => {
    fetchLPs()
  }, [fetchLPs, refreshKey])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, warehouseFilter, productFilter, expiryRangeFilter])

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

  const handlePrintLabel = async (lpId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const response = await fetch(`/api/warehouse/license-plates/${lpId}/print`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Print failed')
      toast({
        title: 'Success',
        description: 'Label sent to printer',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to print label',
        variant: 'destructive',
      })
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
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
              <TableHead>UoM</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>QA Status</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : lps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  No license plates found
                </TableCell>
              </TableRow>
            ) : (
              lps.map((lp) => (
                <TableRow
                  key={lp.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onLPClick(lp.id)}
                >
                  <TableCell className="font-mono font-medium">{lp.lp_number}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{lp.product?.code}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {lp.product?.name}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{lp.batch_number || '-'}</TableCell>
                  <TableCell className="text-right font-medium">{lp.current_qty}</TableCell>
                  <TableCell>{lp.product?.uom}</TableCell>
                  <TableCell>
                    <div>
                      <p>{lp.warehouse?.code}</p>
                      <p className="text-xs text-muted-foreground">{lp.location?.code || '-'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <LPStatusBadge status={lp.status} />
                  </TableCell>
                  <TableCell>
                    {lp.qa_status ? (
                      <Badge
                        variant={
                          lp.qa_status === 'passed'
                            ? 'default'
                            : lp.qa_status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                        }
                        className={lp.qa_status === 'passed' ? 'bg-green-500' : ''}
                      >
                        {lp.qa_status}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {lp.expiry_date ? (
                      <div className="flex items-center gap-2">
                        {(isExpired(lp.expiry_date) || isExpiringSoon(lp.expiry_date)) && (
                          <AlertTriangle
                            className={`h-4 w-4 ${isExpired(lp.expiry_date) ? 'text-red-600' : 'text-yellow-600'}`}
                          />
                        )}
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
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onLPClick(lp.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePrintLabel(lp.id, e as any)}>
                          <Printer className="h-4 w-4 mr-2" />
                          Print Label
                        </DropdownMenuItem>
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
            <div className="flex items-center gap-2 px-2">
              <span className="text-sm">
                Page {page} of {totalPages}
              </span>
            </div>
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
    </div>
  )
}
