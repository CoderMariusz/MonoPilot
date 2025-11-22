/**
 * Machine Form Modal Component
 * Story: 1.7 Machine Configuration
 * Task 6: Machine Form Modal (AC-006.1, AC-006.6)
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { Machine } from '@/lib/validation/machine-schemas'
import { createMachineSchema, updateMachineSchema } from '@/lib/validation/machine-schemas'
import { ZodError } from 'zod'

interface MachineFormModalProps {
  machine?: Machine | null // undefined = create, Machine = edit
  onClose: () => void
  onSuccess: () => void
}

export function MachineFormModal({ machine, onClose, onSuccess }: MachineFormModalProps) {
  const [formData, setFormData] = useState({
    code: machine?.code || '',
    name: machine?.name || '',
    status: machine?.status || 'active',
    capacity_per_hour: machine?.capacity_per_hour?.toString() || '',
    line_ids: machine?.assigned_lines?.map(l => l.id) || [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const isEditMode = !!machine

  // Handle input change
  const handleChange = (field: string, value: string | string[]) => {
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
      const schema = isEditMode ? updateMachineSchema : createMachineSchema

      // Prepare data for validation
      const dataToValidate: any = {
        code: formData.code,
        name: formData.name,
        status: formData.status,
      }

      // Add capacity if provided
      if (formData.capacity_per_hour) {
        const capacity = parseFloat(formData.capacity_per_hour)
        if (!isNaN(capacity)) {
          dataToValidate.capacity_per_hour = capacity
        }
      }

      // Add line_ids if any (placeholder for Story 1.8)
      if (formData.line_ids.length > 0) {
        dataToValidate.line_ids = formData.line_ids
      }

      schema.parse(dataToValidate)
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
        code: formData.code.toUpperCase(), // AC-006.1: Uppercase
        name: formData.name,
        status: formData.status,
      }

      // Add capacity if provided
      if (formData.capacity_per_hour) {
        const capacity = parseFloat(formData.capacity_per_hour)
        if (!isNaN(capacity)) {
          payload.capacity_per_hour = capacity
        }
      } else {
        payload.capacity_per_hour = null
      }

      // Add line_ids if any (AC-006.3)
      if (formData.line_ids.length > 0) {
        payload.line_ids = formData.line_ids
      } else {
        payload.line_ids = []
      }

      // Call API
      const url = isEditMode
        ? `/api/settings/machines/${machine.id}`
        : '/api/settings/machines'

      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()

        // AC-006.1: Handle duplicate code error
        if (response.status === 409) {
          setErrors({ code: error.error || 'Machine code already exists' })
          toast({
            title: 'Duplicate Code',
            description: error.error || 'Machine code already exists',
            variant: 'destructive',
          })
          return
        }

        // AC-006.2: Handle status change warnings
        if (error.warning) {
          toast({
            title: 'Warning',
            description: error.error || 'Status change may affect active work orders',
          })
        }

        throw new Error(error.error || `Failed to ${isEditMode ? 'update' : 'create'} machine`)
      }

      toast({
        title: 'Success',
        description: `Machine ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} machine:`, error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${isEditMode ? 'update' : 'create'} machine`,
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
            {isEditMode ? 'Edit Machine' : 'Create Machine'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Code Field (AC-006.1) */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Code <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g., MIX-01, PACK-02"
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && (
              <p className="text-sm text-red-500">{errors.code}</p>
            )}
            <p className="text-sm text-gray-500">
              Uppercase, numbers, and hyphens only
            </p>
          </div>

          {/* Name Field (AC-006.1) */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Mixer Machine 1"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Status Field (AC-006.2) */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="down">Down</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-red-500">{errors.status}</p>
            )}
            <p className="text-sm text-gray-500">
              Active: Available for production | Down: Unplanned downtime | Maintenance: Scheduled downtime
            </p>
          </div>

          {/* Capacity Field (AC-006.1) */}
          <div className="space-y-2">
            <Label htmlFor="capacity_per_hour">Capacity per Hour</Label>
            <Input
              id="capacity_per_hour"
              type="number"
              step="0.01"
              min="0"
              value={formData.capacity_per_hour}
              onChange={(e) => handleChange('capacity_per_hour', e.target.value)}
              placeholder="e.g., 1000.5"
              className={errors.capacity_per_hour ? 'border-red-500' : ''}
            />
            {errors.capacity_per_hour && (
              <p className="text-sm text-red-500">{errors.capacity_per_hour}</p>
            )}
            <p className="text-sm text-gray-500">
              Optional. Production capacity in units per hour.
            </p>
          </div>

          {/* Line Assignments Placeholder (AC-006.3, AC-006.6) */}
          <div className="space-y-2">
            <Label>Production Lines</Label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">
                Line assignments will be available after Story 1.8 (Production Line Configuration) is complete.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : isEditMode ? 'Update Machine' : 'Create Machine'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
