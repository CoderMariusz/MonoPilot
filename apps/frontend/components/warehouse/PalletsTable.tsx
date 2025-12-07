/**
 * Pallets Table Component
 * Stories 5.19-5.22: Pallets UI
 * Reusable table for pallets list with status and LP count
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
import { Button } from '@/components/ui/button'
import { PalletStatusBadge } from './PalletStatusBadge'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { ChevronLeft, ChevronRight, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PalletsTableProps {
  statusFilter?: string
  warehouseFilter?: string
  refreshKey?: number
}

interface Pallet {
  id: string
  pallet_number: string
  status: 'open' | 'closed' | 'shipped' | 'received'
  warehouse?: {
    id: string
    code: string
    name: string
  }
  location?: {
    id: string
    code: string
    name: string
  }
  pallet_lps: any[]
  created_at: string
}

export function PalletsTable({
  statusFilter = 'all',
  warehouseFilter = 'all',
  refreshKey = 0,
}: PalletsTableProps) {
  const { toast } = useToast()
  const router = useRouter()

  const [pallets, setPallets] = useState<Pallet[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchPallets = useCallback(async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (warehouseFilter && warehouseFilter !== 'all')
        params.append('warehouse_id', warehouseFilter)

      params.append('limit', pageSize.toString())
      params.append('offset', ((page - 1) * pageSize).toString())

      const response = await fetch(`/api/warehouse/pallets?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch pallets')

      const data = await response.json()
      setPallets(data.data || [])
      setTotal(data.total || 0)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load pallets',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, warehouseFilter, page, toast])

  useEffect(() => {
    fetchPallets()
  }, [fetchPallets, refreshKey])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, warehouseFilter])

  const totalPages = Math.ceil(total / pageSize)

  const getLPCount = (pallet: Pallet) => {
    return pallet.pallet_lps?.length || 0
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pallet Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">LP Count</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : pallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No pallets found
                </TableCell>
              </TableRow>
            ) : (
              pallets.map((pallet) => (
                <TableRow
                  key={pallet.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/warehouse/pallets/${pallet.id}`)}
                >
                  <TableCell className="font-mono font-medium">{pallet.pallet_number}</TableCell>
                  <TableCell>
                    <PalletStatusBadge status={pallet.status} />
                  </TableCell>
                  <TableCell>
                    {pallet.warehouse ? (
                      <div>
                        <p className="font-medium">{pallet.warehouse.code}</p>
                        <p className="text-xs text-muted-foreground">{pallet.warehouse.name}</p>
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {pallet.location ? (
                      <span className="text-sm">{pallet.location.code}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">{getLPCount(pallet)}</TableCell>
                  <TableCell>{format(new Date(pallet.created_at), 'MMM d, yyyy')}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/warehouse/pallets/${pallet.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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
