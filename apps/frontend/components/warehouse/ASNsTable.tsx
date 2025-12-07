/**
 * ASNs Table Component
 * Epic 5 Batch 5A-3 - Story 5.8: ASN Creation
 * AC-5.8.1: Display ASN list with filters, status badges, and item counts
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
import { Search, Plus, Eye, Pencil } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { CreateASNModal } from './CreateASNModal'
import { format } from 'date-fns'

interface ASN {
  id: string
  asn_number: string
  status: string
  expected_arrival_date: string
  purchase_orders: {
    po_number: string
  }
  suppliers: {
    code: string
    name: string
  }
  warehouses: {
    code: string
    name: string
  }
  asn_items: { count: number }[]
}

interface Warehouse {
  id: string
  code: string
  name: string
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 border-gray-300',
  submitted: 'bg-blue-100 text-blue-800 border-blue-300',
  receiving: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  received: 'bg-green-100 text-green-800 border-green-300',
  cancelled: 'bg-red-100 text-red-800 border-red-300',
}

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  receiving: 'Receiving',
  received: 'Received',
  cancelled: 'Cancelled',
}

export function ASNsTable() {
  const [asns, setAsns] = useState<ASN[]>([])
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

  // Fetch ASNs
  const fetchASNs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (warehouseFilter !== 'all') params.append('warehouse_id', warehouseFilter)

      const response = await fetch(`/api/warehouse/asns?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch ASNs')
      }

      const data = await response.json()
      setAsns(data.asns || [])
    } catch (error) {
      console.error('Error fetching ASNs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load ASNs',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchASNs()
  }, [statusFilter, warehouseFilter])

  // Filter by search term
  const filteredASNs = asns.filter((asn) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      asn.asn_number.toLowerCase().includes(searchLower) ||
      asn.purchase_orders.po_number.toLowerCase().includes(searchLower) ||
      asn.suppliers.name.toLowerCase().includes(searchLower)
    )
  })

  const handleViewDetails = (id: string) => {
    router.push(`/warehouse/asns/${id}`)
  }

  const handleEditASN = (asn: ASN) => {
    if (asn.status !== 'draft') {
      toast({
        title: 'Cannot edit',
        description: 'Only draft ASNs can be edited',
        variant: 'destructive',
      })
      return
    }
    router.push(`/warehouse/asns/${asn.id}`)
  }

  return (
    <div className="space-y-4">
      {/* Actions & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ASN, PO, or Supplier..."
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
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="receiving">Receiving</SelectItem>
            <SelectItem value="received">Received</SelectItem>
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
          Create ASN
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ASN Number</TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Expected Arrival</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading ASNs...
                </TableCell>
              </TableRow>
            ) : filteredASNs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No ASNs found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredASNs.map((asn) => {
                const itemsCount = asn.asn_items?.[0]?.count || 0

                return (
                  <TableRow key={asn.id}>
                    <TableCell className="font-medium">
                      <button
                        onClick={() => handleViewDetails(asn.id)}
                        className="hover:underline text-blue-600"
                      >
                        {asn.asn_number}
                      </button>
                    </TableCell>
                    <TableCell>{asn.purchase_orders.po_number}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{asn.suppliers.name}</div>
                        <div className="text-muted-foreground">{asn.suppliers.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {asn.expected_arrival_date
                        ? format(new Date(asn.expected_arrival_date), 'MMM dd, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {asn.warehouses.code}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[asn.status as keyof typeof STATUS_COLORS]}
                      >
                        {STATUS_LABELS[asn.status as keyof typeof STATUS_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{itemsCount}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(asn.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {asn.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditASN(asn)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create ASN Modal */}
      <CreateASNModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false)
          fetchASNs()
        }}
      />
    </div>
  )
}
