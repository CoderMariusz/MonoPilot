/**
 * Inventory (License Plates) Page
 * Stories 5.1-5.4: LP Core UI
 * Main inventory management page with LP table
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { LPsTable } from '@/components/warehouse/LPsTable'
import { CreateLPModal } from '@/components/warehouse/CreateLPModal'
import { useToast } from '@/hooks/use-toast'
import {
  Plus,
  Search,
  Filter,
  Package,
  RefreshCw,
} from 'lucide-react'

interface Warehouse {
  id: string
  code: string
  name: string
}

interface Product {
  id: string
  code: string
  name: string
}

export default function InventoryPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [warehouseFilter, setWarehouseFilter] = useState<string>('all')
  const [productFilter, setProductFilter] = useState<string>('all')
  const [expiryRangeFilter, setExpiryRangeFilter] = useState<string>('all')

  // State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const response = await fetch('/api/settings/warehouses?limit=100')
        if (response.ok) {
          const data = await response.json()
          setWarehouses(data.warehouses || [])
        }
      } catch (error) {
        // Silent fail for filter data
      }
    }
    fetchWarehouses()
  }, [])

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/technical/products?limit=100')
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (error) {
        // Silent fail for filter data
      }
    }
    fetchProducts()
  }, [])

  const handleLPClick = (lpId: string) => {
    router.push(`/warehouse/inventory/${lpId}`)
  }

  const handleCreateSuccess = () => {
    setShowCreateModal(false)
    setRefreshKey(prev => prev + 1)
    toast({
      title: 'Success',
      description: 'License plate created successfully',
    })
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Inventory
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage license plates, track batches, and monitor expiry dates
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create LP
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search LP number or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
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

        <Select value={productFilter} onValueChange={setProductFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Product" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Products</SelectItem>
            {products.slice(0, 50).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.code} - {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={expiryRangeFilter} onValueChange={setExpiryRangeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Expiry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="7">Expiring in 7 days</SelectItem>
            <SelectItem value="14">Expiring in 14 days</SelectItem>
            <SelectItem value="30">Expiring in 30 days</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* LP Table */}
      <LPsTable
        search={search}
        statusFilter={statusFilter}
        warehouseFilter={warehouseFilter}
        productFilter={productFilter}
        expiryRangeFilter={expiryRangeFilter}
        onLPClick={handleLPClick}
        refreshKey={refreshKey}
      />

      {/* Create Modal */}
      <CreateLPModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}
