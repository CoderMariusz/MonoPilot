/**
 * Warehouse Form Modal Component
 * Story: 1.5 Warehouse Configuration
 * Task 6: Warehouse Form Modal (AC-004.1, AC-004.5)
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import type { Warehouse } from '@/packages/shared/types'
import { createWarehouseSchema, updateWarehouseSchema } from '@/packages/shared/schemas'
import { ZodError } from 'zod'

interface WarehouseFormModalProps {
  warehouse?: Warehouse | null // undefined = create, Warehouse = edit
  onClose: () => void
  onSuccess: () => void
}

export function WarehouseFormModal({ warehouse, onClose, onSuccess }: WarehouseFormModalProps) {
  const [formData, setFormData] = useState({
    code: warehouse?.code || '',
    name: warehouse?.name || '',
    address: warehouse?.address || '',
    is_active: warehouse?.is_active ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const isEditMode = !!warehouse

  // Handle input change
  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validate form
  const validateForm = () => {
    try {
      const schema = isEditMode ? updateWarehouseSchema : createWarehouseSchema
      schema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as string
          fieldErrors[field] = err.message
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before submitting',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      // Prepare payload
      const payload: any = {
        code: formData.code.toUpperCase(), // AC-004.1: Uppercase
        name: formData.name,
        address: formData.address || undefined,
        is_active: formData.is_active,
      }

      // Call API
      const url = isEditMode
        ? `/api/settings/warehouses/${warehouse.id}`
        : '/api/settings/warehouses'

      const method = isEditMode ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()

        // AC-004.1: Handle duplicate code error
        if (response.status === 409) {
          setErrors({ code: error.error || 'Warehouse code already exists' })
          return
        }

        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} warehouse`)
      }

      toast({
        title: 'Success',
        description: `Warehouse ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} warehouse:`, error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} warehouse`,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Edit Warehouse' : 'Create Warehouse'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Code Field (AC-004.1) */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g., WH-01"
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code}</p>
            )}
            <p className="text-sm text-gray-500">
              Uppercase, numbers, and hyphens only
            </p>
          </div>

          {/* Name Field (AC-004.1) */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Main Warehouse"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Address Field (AC-004.1) */}
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Optional physical address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          {/* Active Status (AC-004.1, AC-004.5) */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked === true)}
            />
            <Label htmlFor="is_active" className="cursor-pointer">
              Active
            </Label>
          </div>

          {/* Note about default locations (AC-004.2) */}
          {!isEditMode && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
              <strong>Note:</strong> Default locations (receiving, shipping, transit) can be set after creating locations for this warehouse.
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
          </Button>
        </div>
      </div>
    </div>
  )
}
