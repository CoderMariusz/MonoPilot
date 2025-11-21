/**
 * Warehouse Configuration Page
 * Story: 1.5 Warehouse Configuration
 * Task 5: Frontend Warehouses List Page (AC-004.3, AC-004.7)
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Warehouse as WarehouseIcon, Search, Edit, Archive, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { Warehouse } from '@/lib/validation/warehouse-schemas'
import { WarehouseFormModal } from '@/components/settings/WarehouseFormModal'

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const { toast } = useToast()

  // Fetch warehouses (AC-004.3)
  const fetchWarehouses = async () => {
    try {
      setLoading(true)

      // Build query parameters
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (activeFilter !== 'all') {
        params.append('is_active', activeFilter === 'active' ? 'true' : 'false')
      }

      const response = await fetch(`/api/settings/warehouses?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch warehouses')
      }

      const data = await response.json()
      setWarehouses(data.warehouses || [])
    } catch (error) {
      console.error('Error fetching warehouses:', error)
      toast({
        title: 'Error',
        description: 'Failed to load warehouses',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouses()
  }, [activeFilter])

  // Debounced search (AC-004.3)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWarehouses()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Archive/Activate handler (AC-004.4, AC-004.7)
  const handleToggleActive = async (warehouse: Warehouse) => {
    const action = warehouse.is_active ? 'Archive' : 'Activate'

    if (!confirm(`${action} ${warehouse.name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/settings/warehouses/${warehouse.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !warehouse.is_active }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || `Failed to ${action.toLowerCase()} warehouse`)
      }

      toast({
        title: 'Success',
        description: `Warehouse ${action.toLowerCase()}d successfully`,
      })

      fetchWarehouses() // Refresh list
    } catch (error) {
      console.error(`Error ${action.toLowerCase()}ing warehouse:`, error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${action.toLowerCase()} warehouse`,
        variant: 'destructive',
      })
    }
  }

  // Edit handler (AC-004.5)
  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setEditingWarehouse(null)
  }

  const handleSaveSuccess = () => {
    fetchWarehouses()
    handleCloseModal()
  }

  const getActiveStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? 'default' : 'secondary'}>
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Warehouse Configuration</CardTitle>
            <Button onClick={() => setShowCreateModal(true)}>
              <WarehouseIcon className="mr-2 h-4 w-4" />
              Add Warehouse
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters (AC-004.3) */}
          <div className="flex gap-4 mb-6">
            {/* Search by code or name */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by code or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Active filter */}
            <Select value={activeFilter} onValueChange={setActiveFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warehouses Table (AC-004.3) */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading warehouses...</div>
          ) : warehouses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No warehouses found. Create your first warehouse to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Receiving Location</TableHead>
                  <TableHead>Shipping Location</TableHead>
                  <TableHead>Transit Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id}>
                    <TableCell className="font-medium">{warehouse.code}</TableCell>
                    <TableCell>{warehouse.name}</TableCell>
                    <TableCell className="text-gray-600">
                      {warehouse.address || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {warehouse.default_receiving_location?.code || <span className="text-gray-400">Not set</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {warehouse.default_shipping_location?.code || <span className="text-gray-400">Not set</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {warehouse.transit_location?.code || <span className="text-gray-400">Not set</span>}
                    </TableCell>
                    <TableCell>{getActiveStatusBadge(warehouse.is_active)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(warehouse)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(warehouse)}
                        >
                          {warehouse.is_active ? (
                            <Archive className="h-4 w-4" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal (AC-004.1, AC-004.5) */}
      {(showCreateModal || editingWarehouse) && (
        <WarehouseFormModal
          warehouse={editingWarehouse}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      )}
    </div>
  )
}
