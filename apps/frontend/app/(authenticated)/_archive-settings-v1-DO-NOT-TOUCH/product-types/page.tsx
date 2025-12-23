/**
 * Product Types Management Page
 * Story: 2.5 Product Types Configuration
 * AC-2.5.5: Custom types UI
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Plus, Edit, Trash2, Tag } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ProductType {
  id: string
  code: string
  name: string
  is_default: boolean
  is_active: boolean
  is_editable: boolean
}

export default function ProductTypesPage() {
  const [types, setTypes] = useState<ProductType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingType, setEditingType] = useState<ProductType | null>(null)
  const [deletingType, setDeletingType] = useState<ProductType | null>(null)

  // Form state
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const { toast } = useToast()

  // Fetch product types
  const fetchTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/technical/product-types?active=false')

      if (!response.ok) {
        throw new Error('Failed to fetch product types')
      }

      const data = await response.json()
      setTypes(data.types || [])
    } catch (error) {
      console.error('Error fetching product types:', error)
      toast({
        title: 'Error',
        description: 'Failed to load product types',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTypes()
  }, [])

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formCode) {
      errors.code = 'Code is required'
    } else if (formCode.length < 2) {
      errors.code = 'Code must be at least 2 characters'
    } else if (formCode.length > 10) {
      errors.code = 'Code must be less than 10 characters'
    } else if (!/^[A-Z]+$/.test(formCode)) {
      errors.code = 'Code must be uppercase letters only'
    } else if (['RM', 'WIP', 'FG', 'PKG', 'BP'].includes(formCode)) {
      errors.code = 'This code is reserved for default types'
    }

    if (!formName) {
      errors.name = 'Name is required'
    } else if (formName.length > 100) {
      errors.name = 'Name must be less than 100 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle create
  const handleCreate = async () => {
    if (!validateForm()) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/technical/product-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: formCode, name: formName }),
      })

      if (!response.ok) {
        const error = await response.json()
        if (error.code === 'TYPE_CODE_EXISTS') {
          setFormErrors({ code: 'This code already exists' })
          return
        }
        throw new Error(error.error || 'Failed to create product type')
      }

      toast({
        title: 'Success',
        description: 'Product type created successfully',
      })

      setShowCreateModal(false)
      setFormCode('')
      setFormName('')
      fetchTypes()
    } catch (error) {
      console.error('Error creating product type:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create product type',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = async () => {
    if (!editingType || !formName) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/technical/product-types/${editingType.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product type')
      }

      toast({
        title: 'Success',
        description: 'Product type updated successfully',
      })

      setEditingType(null)
      setFormName('')
      fetchTypes()
    } catch (error) {
      console.error('Error updating product type:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update product type',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle toggle active
  const handleToggleActive = async (type: ProductType) => {
    if (type.is_default) return

    try {
      const response = await fetch(`/api/technical/product-types/${type.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !type.is_active }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update product type')
      }

      toast({
        title: 'Success',
        description: `Product type ${type.is_active ? 'deactivated' : 'activated'}`,
      })

      fetchTypes()
    } catch (error) {
      console.error('Error toggling product type:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update product type',
        variant: 'destructive',
      })
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingType) return

    try {
      const response = await fetch(`/api/technical/product-types/${deletingType.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete product type')
      }

      const data = await response.json()

      toast({
        title: 'Success',
        description: data.deactivated
          ? 'Product type deactivated (products exist using this type)'
          : 'Product type deleted successfully',
      })

      setDeletingType(null)
      fetchTypes()
    } catch (error) {
      console.error('Error deleting product type:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete product type',
        variant: 'destructive',
      })
    }
  }

  // Open edit modal
  const openEditModal = (type: ProductType) => {
    setEditingType(type)
    setFormName(type.name)
    setFormErrors({})
  }

  // Open create modal
  const openCreateModal = () => {
    setShowCreateModal(true)
    setFormCode('')
    setFormName('')
    setFormErrors({})
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Product Types
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Manage default and custom product types for your organization
              </p>
            </div>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Add Custom Type
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading product types...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-mono font-medium">{type.code}</TableCell>
                    <TableCell>{type.name}</TableCell>
                    <TableCell>
                      {type.is_default ? (
                        <Badge variant="secondary">Default</Badge>
                      ) : (
                        <Badge variant="outline">Custom</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {type.is_default ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={type.is_active}
                            onCheckedChange={() => handleToggleActive(type)}
                          />
                          <span className="text-sm text-gray-500">
                            {type.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {type.is_editable && (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(type)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingType(type)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Product Type</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                placeholder="e.g., SEMI, INT"
                className={formErrors.code ? 'border-red-500' : ''}
              />
              {formErrors.code && <p className="text-sm text-red-500">{formErrors.code}</p>}
              <p className="text-xs text-gray-500">Uppercase letters only, 2-10 characters</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Semi-Finished, Intermediate"
                className={formErrors.name ? 'border-red-500' : ''}
              />
              {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Type'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editingType} onOpenChange={(open) => !open && setEditingType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product Type: {editingType?.code}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Code</Label>
              <Input value={editingType?.code || ''} disabled className="bg-gray-100" />
              <p className="text-xs text-gray-500">Code cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingType(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={submitting || !formName}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingType} onOpenChange={(open) => !open && setDeletingType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product Type?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <span className="font-semibold">{deletingType?.code}</span> ({deletingType?.name})?
              <br /><br />
              If products are using this type, it will be deactivated instead of deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
