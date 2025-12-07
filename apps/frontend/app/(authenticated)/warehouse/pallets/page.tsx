/**
 * Pallets List Page
 * Epic 5 Batch 05B-2: Pallets (Stories 5.19-5.22)
 * AC-5.19: Display pallets with filters
 * AC-5.19: Create new pallet
 * AC-5.20: Manage pallet LPs
 * AC-5.21: Move pallets
 * AC-5.22: Pallet status management
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CreatePalletModal } from '@/components/warehouse/CreatePalletModal'
import { PalletsTable } from '@/components/warehouse/PalletsTable'
import { useToast } from '@/hooks/use-toast'
import { Plus, Filter, Package, RefreshCw } from 'lucide-react'

interface Warehouse {
  id: string
  code: string
  name: string
}

export default function PalletsPage() {
  const { toast } = useToast()

  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

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

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    setRefreshKey((k) => k + 1)
  }

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Pallets
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage pallets for grouping and moving license plates
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Pallet
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="received">Received</SelectItem>
          </SelectContent>
        </Select>

        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
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

        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Pallets Table */}
      <PalletsTable
        statusFilter={statusFilter}
        warehouseFilter={warehouseFilter}
        refreshKey={refreshKey}
      />

      {/* Modals */}
      <CreatePalletModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
