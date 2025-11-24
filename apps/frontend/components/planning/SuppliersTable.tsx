/**
 * Suppliers Table Component
 * Story 3.17: Supplier Management
 * AC-3.17.1: Display suppliers with filters, search, and actions
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SupplierFormModal } from './SupplierFormModal'

interface TaxCode {
  code: string
  description: string
  rate: number
}

interface Supplier {
  id: string
  code: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  currency: string
  tax_code_id: string
  payment_terms: string
  lead_time_days: number
  moq: number | null
  is_active: boolean
  tax_codes?: TaxCode
  created_at: string
}

export function SuppliersTable() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const { toast } = useToast()

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (statusFilter === 'active') params.append('is_active', 'true')
      if (statusFilter === 'inactive') params.append('is_active', 'false')

      const response = await fetch(`/api/planning/suppliers?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch suppliers')
      }

      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load suppliers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [search, statusFilter])

  // Handle delete
  const handleDelete = async () => {
    if (!selectedSupplier) return

    try {
      const response = await fetch(`/api/planning/suppliers/${selectedSupplier.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete supplier')
      }

      toast({
        title: 'Success',
        description: 'Supplier deleted successfully',
      })

      await fetchSuppliers()
    } catch (error) {
      console.error('Error deleting supplier:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete supplier',
        variant: 'destructive',
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedSupplier(null)
    }
  }

  // Open delete dialog
  const openDeleteDialog = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedSupplier(supplier)
    setDeleteDialogOpen(true)
  }

  // Open edit modal
  const openEditModal = (supplier: Supplier, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSupplier(supplier)
    setFormModalOpen(true)
  }

  // Handle form success
  const handleFormSuccess = async () => {
    setFormModalOpen(false)
    setEditingSupplier(null)
    await fetchSuppliers()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <Button
          onClick={() => {
            setEditingSupplier(null)
            setFormModalOpen(true)
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Payment Terms</TableHead>
              <TableHead>Lead Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No suppliers found
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow
                  key={supplier.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => openEditModal(supplier, { stopPropagation: () => {} } as any)}
                >
                  <TableCell className="font-medium">{supplier.code}</TableCell>
                  <TableCell>
                    {supplier.name}
                    {supplier.city && (
                      <div className="text-sm text-gray-500">{supplier.city}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    {supplier.contact_person || '-'}
                    {supplier.email && (
                      <div className="text-sm text-gray-500">{supplier.email}</div>
                    )}
                  </TableCell>
                  <TableCell>{supplier.currency}</TableCell>
                  <TableCell>{supplier.payment_terms}</TableCell>
                  <TableCell>{supplier.lead_time_days} days</TableCell>
                  <TableCell>
                    <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openEditModal(supplier, e)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => openDeleteDialog(supplier, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Modal */}
      {formModalOpen && (
        <SupplierFormModal
          open={formModalOpen}
          onClose={() => {
            setFormModalOpen(false)
            setEditingSupplier(null)
          }}
          onSuccess={handleFormSuccess}
          supplier={editingSupplier}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete supplier {selectedSupplier?.code} (
              {selectedSupplier?.name})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedSupplier(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
