/**
 * Machines Page
 * Story: 01.10 - Machines CRUD
 *
 * Features:
 * - Machine list with search and filters
 * - Create/Edit modal
 * - Delete with confirmation
 * - Permission-based UI
 * - 4 UI states: Loading, Empty, Error, Success
 */

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'
import { useMachines } from '@/lib/hooks/use-machines'
import { MachinesDataTable, MachineModal } from '@/components/settings/machines'
import type { Machine, MachineListParams } from '@/lib/types/machine'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { useQueryClient } from '@tanstack/react-query'

export default function MachinesPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Partial<MachineListParams>>({})
  const [page, setPage] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null)

  // Fetch org context for permission check
  const { data: orgContext } = useOrgContext()

  // Fetch machines
  const { data, isLoading, error } = useMachines({
    search,
    ...filters,
    page,
    limit: 25,
  })

  // Permission check - PROD_MANAGER+ can manage machines
  const canManageMachines = ['owner', 'admin', 'production_manager'].includes(
    orgContext?.role_code || ''
  )

  // Handle search
  const handleSearch = useCallback((searchValue: string) => {
    setSearch(searchValue)
    setPage(1) // Reset to first page
  }, [])

  // Handle filters
  const handleFilter = useCallback((newFilters: Partial<MachineListParams>) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page
  }, [])

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  // Handle create
  const handleCreate = () => {
    setEditingMachine(null)
    setShowModal(true)
  }

  // Handle edit
  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine)
    setShowModal(true)
  }

  // Handle delete
  const handleDelete = async (machine: Machine) => {
    if (!confirm(`Delete machine "${machine.code}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/v1/settings/machines/${machine.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete machine')
      }

      toast({
        title: 'Success',
        description: 'Machine deleted successfully',
      })

      // Refresh list using query invalidation
      await queryClient.invalidateQueries({ queryKey: ['machines'] })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete machine',
        variant: 'destructive',
      })
    }
  }

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMachine(null)
  }

  // Handle save success
  const handleSaveSuccess = async () => {
    toast({
      title: 'Success',
      description: editingMachine ? 'Machine updated successfully' : 'Machine created successfully',
    })
    handleCloseModal()
    // Refresh list using query invalidation
    await queryClient.invalidateQueries({ queryKey: ['machines'] })
  }

  return (
    <div>
      <SettingsHeader currentPage="machines" />
      <div className="px-4 md:px-6 py-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Machines</CardTitle>
              {canManageMachines && (
                <Button onClick={handleCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Machine
                </Button>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <MachinesDataTable
              machines={data?.data || []}
              total={data?.total || 0}
              page={page}
              limit={25}
              onPageChange={handlePageChange}
              onSearch={handleSearch}
              onFilter={handleFilter}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={isLoading}
              error={error?.message}
              readOnly={!canManageMachines}
            />
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        <MachineModal
          mode={editingMachine ? 'edit' : 'create'}
          machine={editingMachine}
          open={showModal}
          onClose={handleCloseModal}
          onSuccess={handleSaveSuccess}
        />
      </div>
    </div>
  )
}
