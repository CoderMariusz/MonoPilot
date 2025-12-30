/**
 * Tax Codes List Page
 * Story: 01.13 - Tax Codes CRUD
 * Route: /settings/tax-codes
 *
 * Displays tax codes list with DataTable
 * Permission: ADMIN, SUPER_ADMIN
 */

'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  TaxCodesDataTable,
  TaxCodeModal,
  SetDefaultDialog,
  DeleteTaxCodeDialog,
} from '@/components/settings/tax-codes'
import {
  useTaxCodes,
  useCreateTaxCode,
  useUpdateTaxCode,
  useDeleteTaxCode,
  useSetDefaultTaxCode,
} from '@/lib/hooks/use-tax-codes'
import type { TaxCode, TaxCodeListParams, CreateTaxCodeInput, TaxCodeStatus } from '@/lib/types/tax-code'
import { useToast } from '@/hooks/use-toast'
import { Plus } from 'lucide-react'

export default function TaxCodesPage() {
  const { toast } = useToast()

  // State
  const [params, setParams] = useState<TaxCodeListParams>({
    page: 1,
    limit: 20,
  })
  const [selectedTaxCode, setSelectedTaxCode] = useState<TaxCode | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [showModal, setShowModal] = useState(false)
  const [showSetDefaultDialog, setShowSetDefaultDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Fetch tax codes data
  const { data, isLoading, error, refetch } = useTaxCodes(params)

  // Mutations
  const createMutation = useCreateTaxCode()
  const updateMutation = useUpdateTaxCode()
  const deleteMutation = useDeleteTaxCode()
  const setDefaultMutation = useSetDefaultTaxCode()

  // Handle search
  const handleSearch = useCallback((search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }))
  }, [])

  // Handle country filter
  const handleCountryFilter = useCallback((country_code: string) => {
    setParams((prev) => ({ ...prev, country_code, page: 1 }))
  }, [])

  // Handle status filter
  const handleStatusFilter = useCallback((status: TaxCodeStatus | 'all') => {
    setParams((prev) => ({ ...prev, status, page: 1 }))
  }, [])

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setParams((prev) => ({ ...prev, page }))
  }, [])

  // Handle create
  const handleCreate = useCallback(() => {
    setSelectedTaxCode(null)
    setModalMode('create')
    setShowModal(true)
  }, [])

  // Handle edit
  const handleEdit = useCallback((taxCode: TaxCode) => {
    setSelectedTaxCode(taxCode)
    setModalMode('edit')
    setShowModal(true)
  }, [])

  // Handle set default
  const handleSetDefault = useCallback((taxCode: TaxCode) => {
    setSelectedTaxCode(taxCode)
    setShowSetDefaultDialog(true)
  }, [])

  // Handle delete
  const handleDelete = useCallback((taxCode: TaxCode) => {
    setSelectedTaxCode(taxCode)
    setShowDeleteDialog(true)
  }, [])

  // Confirm set default
  const handleConfirmSetDefault = useCallback(async () => {
    if (!selectedTaxCode) return

    try {
      await setDefaultMutation.mutateAsync(selectedTaxCode.id)

      toast({
        title: 'Success',
        description: `${selectedTaxCode.code} set as default tax code`,
      })

      setShowSetDefaultDialog(false)
      setSelectedTaxCode(null)
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to set default tax code',
        variant: 'destructive',
      })
    }
  }, [selectedTaxCode, setDefaultMutation, toast, refetch])

  // Confirm delete
  const handleConfirmDelete = useCallback(async () => {
    if (!selectedTaxCode) return

    try {
      await deleteMutation.mutateAsync(selectedTaxCode.id)

      toast({
        title: 'Success',
        description: 'Tax code deleted successfully',
      })

      setShowDeleteDialog(false)
      setSelectedTaxCode(null)
      refetch()
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete tax code',
        variant: 'destructive',
      })
    }
  }, [selectedTaxCode, deleteMutation, toast, refetch])

  // Handle modal submit
  const handleModalSubmit = useCallback(
    async (data: CreateTaxCodeInput) => {
      try {
        if (modalMode === 'create') {
          await createMutation.mutateAsync(data)

          toast({
            title: 'Success',
            description: `Tax code ${data.code} created successfully`,
          })
        } else if (selectedTaxCode) {
          await updateMutation.mutateAsync({
            id: selectedTaxCode.id,
            data,
          })

          toast({
            title: 'Success',
            description: `Tax code ${data.code} updated successfully`,
          })
        }

        setShowModal(false)
        setSelectedTaxCode(null)
        refetch()
      } catch (err) {
        toast({
          title: 'Error',
          description: err instanceof Error ? err.message : 'Failed to save tax code',
          variant: 'destructive',
        })
      }
    },
    [modalMode, selectedTaxCode, createMutation, updateMutation, toast, refetch]
  )

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tax Codes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage tax codes with validity periods and default settings
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Tax Code
        </Button>
      </div>

      {/* Data Table */}
      <TaxCodesDataTable
        taxCodes={data?.data || []}
        total={data?.total || 0}
        page={params.page || 1}
        limit={params.limit || 20}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onCountryFilter={handleCountryFilter}
        onStatusFilter={handleStatusFilter}
        onEdit={handleEdit}
        onSetDefault={handleSetDefault}
        onDelete={handleDelete}
        isLoading={isLoading}
        error={error?.message}
        readOnly={false}
      />

      {/* Create/Edit Modal */}
      <TaxCodeModal
        mode={modalMode}
        taxCode={selectedTaxCode ?? undefined}
        open={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedTaxCode(null)
        }}
        onSubmit={handleModalSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Set Default Dialog */}
      <SetDefaultDialog
        open={showSetDefaultDialog}
        taxCode={selectedTaxCode}
        onConfirm={handleConfirmSetDefault}
        onCancel={() => {
          setShowSetDefaultDialog(false)
          setSelectedTaxCode(null)
        }}
      />

      {/* Delete Dialog */}
      <DeleteTaxCodeDialog
        open={showDeleteDialog}
        taxCode={selectedTaxCode}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setShowDeleteDialog(false)
          setSelectedTaxCode(null)
        }}
      />
    </div>
  )
}
