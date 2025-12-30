/**
 * Warehouses Page
 * Story: 01.8 - Warehouses CRUD
 *
 * Features:
 * - Warehouse list with search and filters
 * - Create/Edit modal
 * - Set default confirmation
 * - Disable/Enable with confirmation
 * - Permission-based UI
 * - 4 UI states: Loading, Empty, Error, Success
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import {
  useSetDefaultWarehouse,
  useDisableWarehouse,
  useEnableWarehouse,
} from '@/lib/hooks/use-warehouse-mutations'
import {
  WarehousesDataTable,
  WarehouseModal,
  SetDefaultConfirmDialog,
  DisableConfirmDialog,
} from '@/components/settings/warehouses'
import type { Warehouse, WarehouseListParams } from '@/lib/types/warehouse'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { useQueryClient } from '@tanstack/react-query'

export default function WarehousesPage() {
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  // State
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Partial<WarehouseListParams>>({})
  const [page, setPage] = useState(1)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)

  // Confirm dialog state
  const [setDefaultWarehouse, setSetDefaultWarehouse] = useState<Warehouse | null>(null)
  const [disableWarehouse, setDisableWarehouseState] = useState<Warehouse | null>(null)

  // Fetch org context for permission check
  const { data: orgContext } = useOrgContext()

  // Fetch warehouses
  const { data, isLoading, error } = useWarehouses({
    search,
    ...filters,
    page,
    limit: 20,
  })

  // Mutations
  const setDefaultMutation = useSetDefaultWarehouse()
  const disableMutation = useDisableWarehouse()
  const enableMutation = useEnableWarehouse()

  // Permission check - ADMIN, WH_MANAGER can manage warehouses
  const canManageWarehouses = ['owner', 'admin', 'warehouse_manager'].includes(
    orgContext?.role_code?.toLowerCase() || ''
  )

  // Handle search
  const handleSearch = useCallback((searchValue: string) => {
    setSearch(searchValue)
    setPage(1) // Reset to first page
  }, [])

  // Handle filters
  const handleFilter = useCallback((newFilters: Partial<WarehouseListParams>) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page
  }, [])

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  // Handle create
  const handleCreate = () => {
    setEditingWarehouse(null)
    setShowModal(true)
  }

  // Handle edit
  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setShowModal(true)
  }

  // Handle set default click
  const handleSetDefaultClick = (warehouse: Warehouse) => {
    setSetDefaultWarehouse(warehouse)
  }

  // Handle set default confirm
  const handleSetDefaultConfirm = async () => {
    if (!setDefaultWarehouse) return

    try {
      await setDefaultMutation.mutateAsync(setDefaultWarehouse.id)
      toast({
        title: 'Success',
        description: `${setDefaultWarehouse.code} is now the default warehouse`,
      })
      setSetDefaultWarehouse(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to set default warehouse'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // Handle disable click
  const handleDisableClick = (warehouse: Warehouse) => {
    setDisableWarehouseState(warehouse)
  }

  // Handle disable confirm
  const handleDisableConfirm = async () => {
    if (!disableWarehouse) return

    try {
      await disableMutation.mutateAsync(disableWarehouse.id)
      toast({
        title: 'Success',
        description: `${disableWarehouse.code} has been disabled`,
      })
      setDisableWarehouseState(null)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to disable warehouse'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // Handle enable
  const handleEnable = async (warehouse: Warehouse) => {
    try {
      await enableMutation.mutateAsync(warehouse.id)
      toast({
        title: 'Success',
        description: `${warehouse.code} has been enabled`,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to enable warehouse'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    }
  }

  // Handle manage locations (navigate to locations page)
  const handleManageLocations = (warehouse: Warehouse) => {
    router.push(`/settings/warehouses/${warehouse.id}/locations`)
  }

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingWarehouse(null)
  }

  // Handle save success
  const handleSaveSuccess = async () => {
    toast({
      title: 'Success',
      description: editingWarehouse
        ? 'Warehouse updated successfully'
        : 'Warehouse created successfully',
    })
    handleCloseModal()
    // Refresh list using query invalidation
    await queryClient.invalidateQueries({ queryKey: ['warehouses'] })
  }

  return (
    <div>
      <SettingsHeader currentPage="warehouses" />
      <div className="px-4 md:px-6 py-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Warehouses</CardTitle>
              {canManageWarehouses && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Warehouse
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <WarehousesDataTable
              warehouses={data?.data || []}
              total={data?.pagination?.total || 0}
              page={page}
              limit={20}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onFilter={handleFilter}
              onEdit={handleEdit}
              onSetDefault={handleSetDefaultClick}
              onDisable={handleDisableClick}
              onEnable={handleEnable}
              onManageLocations={handleManageLocations}
              isLoading={isLoading}
              error={error?.message}
              readOnly={!canManageWarehouses}
            />
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        <WarehouseModal
          mode={editingWarehouse ? 'edit' : 'create'}
          warehouse={editingWarehouse}
          open={showModal}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />

        {/* Set Default Confirmation */}
        <SetDefaultConfirmDialog
          warehouse={setDefaultWarehouse}
          open={!!setDefaultWarehouse}
          onConfirm={handleSetDefaultConfirm}
          onCancel={() => setSetDefaultWarehouse(null)}
          isLoading={setDefaultMutation.isPending}
        />

        {/* Disable Confirmation */}
        <DisableConfirmDialog
          warehouse={disableWarehouse}
          open={!!disableWarehouse}
          onConfirm={handleDisableConfirm}
          onCancel={() => setDisableWarehouseState(null)}
          isLoading={disableMutation.isPending}
        />
      </div>
    </div>
  )
}
