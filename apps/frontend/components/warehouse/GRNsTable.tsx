/**
 * GRNs Table Component
 * Epic 5 Batch 5A-3 - Story 5.11: GRN with LP Creation
 * AC-5.11.1: Display GRN list with filters, status badges, and item counts
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Search, Plus, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CreateGRNModal } from './CreateGRNModal'
import { format } from 'date-fns'

interface GRN {
  id: string
  grn_number: string
  status: string
  received_at: string | null
  asn: {
    id: string
    asn_number: string
  } | null
  purchase_orders: {
    id: string
    po_number: string
  } | null
  warehouses: {
    code: string
    name: string
  }
  grn_items: { count: number }[]
}

interface Warehouse {
  id: string
  code: string
  name: string
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  completed: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

const STATUS_LABELS = {
  draft: 'Draft',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function GRNsTable() {
  const [grns, setGRNs] = useState<GRN[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all')
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch('/api/settings/warehouses?is_active=true')
        if (response.ok) {
          const data = await response.json()
          setWarehouses(data.warehouses || [])
        }
      } catch (error) {
        console.error('Error fetching warehouses:', error)
      }
    }
    fetchWarehouses()
  }, [])

  // Fetch GRNs
  const fetchGRNs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (warehouseFilter !== 'all') params.append('warehouse_id', warehouseFilter)

      const response = await fetch(`/api/warehouse/grns?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch GRNs')
      }

      const data = await response.json()
      setGRNs(data.grns || [])
    } catch (error) {
      console.error('Error fetching GRNs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load GRNs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGRNs()
  }, [statusFilter, warehouseFilter])

  // Filter by search term
  const filteredGRNs = grns.filter((grn) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      grn.grn_number.toLowerCase().includes(searchLower) ||
      grn.asn?.asn_number?.toLowerCase().includes(searchLower) ||
      grn.purchase_orders?.po_number?.toLowerCase().includes(searchLower)
    )
  })

  const handleViewDetails = (id: string) => {
    router.push(`/warehouse/receiving/${id}`)
  }

  return (
    <div className="space-y-4">
      {/* Actions & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by GRN, ASN, or PO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by warehouse" />
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

        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create GRN
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>GRN Number</TableHead>
              <TableHead>ASN Number</TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead>Received Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading GRNs...
                </TableCell>
              </TableRow>
            ) : filteredGRNs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No GRNs found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredGRNs.map((grn) => {
                const itemsCount = grn.grn_items?.[0]?.count || 0

                return (
                  <TableRow key={grn.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => handleViewDetails(grn.id)}
                        className="hover:underline text-blue-600"
                      >
                        {grn.grn_number}
                      </button>
                    </TableCell>
                    <TableCell>
                      {grn.asn ? (
                        <button
                          onClick={() => router.push(`/warehouse/asns/${grn.asn?.id}`)}
                          className="hover:underline text-blue-600"
                        >
                          {grn.asn.asn_number}
                        </button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {grn.purchase_orders ? (
                        <button
                          onClick={() => router.push(`/planning/purchase-orders/${grn.purchase_orders?.id}`)}
                          className="hover:underline text-blue-600"
                        >
                          {grn.purchase_orders.po_number}
                        </button>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {grn.warehouses.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[grn.status as keyof typeof STATUS_COLORS]}
                      >
                        {STATUS_LABELS[grn.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{itemsCount}</TableCell>
                    <TableCell>
                      {grn.received_at
                        ? format(new Date(grn.received_at), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(grn.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create GRN Modal */}
      <CreateGRNModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false)
          fetchGRNs()
        }}
      />
    </div>
  )
}
