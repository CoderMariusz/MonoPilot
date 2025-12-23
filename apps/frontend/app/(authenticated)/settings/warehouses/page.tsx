/**
 * Warehouses List Page
 * Story: 01.8 - Warehouse Management CRUD
 * Route: /settings/warehouses
 *
 * Displays warehouse list with DataTable
 * Permission: admin, warehouse_manager
 */

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { WarehousesDataTable } from '@/components/settings/warehouses/WarehousesDataTable'
import { DisableConfirmDialog } from '@/components/settings/warehouses/DisableConfirmDialog'
import { WarehouseModal } from '@/components/settings/warehouses/WarehouseModal'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import type { Warehouse, WarehouseListParams } from '@/lib/types/warehouse'
import { useToast } from '@/hooks/use-toast'

export default function WarehousesPage() {
  const { toast } = useToast()
  const [params, setParams] = useState<WarehouseListParams>({
    page: 1,
    limit: 20,
  })
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null)
  const [showDisableDialog, setShowDisableDialog] = useState(false)
  const [showWarehouseModal, setShowWarehouseModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)

  // Fetch warehouses data
  const { data, isLoading, error } = useWarehouses(params)

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }))
  }, [])

  // Handle filter
  const handleFilter = useCallback((filters: Partial<WarehouseListParams>) => {
    setParams((prev) => ({ ...prev, ...filters, page: 1 }))
  }, [])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }, [])

  // Handle edit
  const handleEdit = useCallback((warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
  }, [])

  // Handle set default
  const handleSetDefault = useCallback(async (warehouse: Warehouse) => {
    try {
      const response = await fetch(`/api/v1/settings/warehouses/${warehouse.id}/set-default`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error('Failed to set default warehouse')
      }

      toast({
        title: 'Success',
        description: `${warehouse.code} set as default warehouse`,
      })

      // Refresh data
      window.location.reload()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to set default warehouse',
        variant: 'destructive',
      })
    }
  }, [toast])

  // Handle disable
  const handleDisable = useCallback((warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse)
    setShowDisableDialog(true)
  }, [])

  // Confirm disable
  const handleConfirmDisable = useCallback(async () => {
    if (!selectedWarehouse) return

    try {
      const response = await fetch(`/api/v1/settings/warehouses/${selectedWarehouse.id}/disable`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to disable warehouse')
      }

      toast({
        title: 'Success',
        description: `Warehouse ${selectedWarehouse.code} disabled`,
      })

      // Refresh data
      window.location.reload()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to disable warehouse',
        variant: 'destructive',
      })
    } finally {
      setShowDisableDialog(false)
      setSelectedWarehouse(null)
    }
  }, [selectedWarehouse, toast])

  // Handle enable
  const handleEnable = useCallback(async (warehouse: Warehouse) => {
    try {
      const response = await fetch(`/api/v1/settings/warehouses/${warehouse.id}/enable`, {
        method: 'PATCH',
      })

      if (!response.ok) {
        throw new Error('Failed to enable warehouse')
      }

      toast({
        title: 'Success',
        description: `Warehouse ${warehouse.code} enabled`,
      })

      // Refresh data
      window.location.reload()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to enable warehouse',
        variant: 'destructive',
      })
    }
  }, [toast])

  // Handle modal success (create or update)
  const handleModalSuccess = useCallback((warehouse: Warehouse) => {
    toast({
      title: 'Success',
      description: editingWarehouse
        ? `Warehouse ${warehouse.code} updated successfully`
        : `Warehouse ${warehouse.code} created successfully`,
    })

    // Refresh data
    window.location.reload()
  }, [editingWarehouse, toast])

  // Handle create new warehouse
  const handleCreateWarehouse = useCallback(() => {
    setShowWarehouseModal(true)
    setEditingWarehouse(null)
  }, [])

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Warehouses</h1>
        <Button onClick={handleCreateWarehouse}>+ Add Warehouse</Button>
      </div>

      <WarehousesDataTable
        warehouses={data?.data || []}
        total={data?.total || 0}
        page={params.page || 1}
        limit={params.limit || 20}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onEdit={handleEdit}
        onSetDefault={handleSetDefault}
        onDisable={handleDisable}
        onEnable={handleEnable}
        isLoading={isLoading}
        error={error?.message}
      />

      <DisableConfirmDialog
        warehouse={selectedWarehouse}
        open={showDisableDialog}
        onConfirm={handleConfirmDisable}
        onCancel={() => {
          setShowDisableDialog(false)
          setSelectedWarehouse(null)
        }}
      />

      <WarehouseModal
        mode={editingWarehouse ? 'edit' : 'create'}
        warehouse={editingWarehouse}
        open={showWarehouseModal || !!editingWarehouse}
        onClose={() => {
          setShowWarehouseModal(false)
          setEditingWarehouse(null)
        }}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}
