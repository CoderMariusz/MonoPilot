/**
 * Production Line Form Modal Component
 * Story: 1.8 Production Line Configuration
 * Task: BATCH 2 - Form Modal
 * AC-007.1: Create production line with warehouse and location
 * AC-007.6: Edit production line
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import type { ProductionLine } from '@/lib/validation/production-line-schemas'
import { createProductionLineSchema, updateProductionLineSchema } from '@/lib/validation/production-line-schemas'
import { ZodError } from 'zod'

interface ProductionLineFormModalProps {
  line?: ProductionLine | null // undefined = create, ProductionLine = edit
  onClose: () => void
  onSuccess: () => void
}

export function ProductionLineFormModal({ line, onClose, onSuccess }: ProductionLineFormModalProps) {
  const [formData, setFormData] = useState({
    code: line?.code || '',
    name: line?.name || '',
    warehouse_id: line?.warehouse_id || '',
    default_output_location_id: line?.default_output_location_id || '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // Warehouse and location data
  const [warehouses, setWarehouses] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [locations, setLocations] = useState<Array<{ id: string; code: string; name: string }>>([])
  const [loadingWarehouses, setLoadingWarehouses] = useState(true)
  const [loadingLocations, setLoadingLocations] = useState(false)

  const isEditMode = !!line

  // Fetch warehouses on mount
  useEffect(() => {
    fetchWarehouses()
  }, [])

  // Fetch locations when warehouse changes
  useEffect(() => {
    if (formData.warehouse_id) {
      fetchLocations(formData.warehouse_id)
    } else {
      setLocations([])
      setFormData(prev => ({ ...prev, default_output_location_id: '' }))
    }
  }, [formData.warehouse_id])

  const fetchWarehouses = async () => {
    try {
      setLoadingWarehouses(true)
      const response = await fetch('/api/settings/warehouses')
      if (!response.ok) throw new Error('Failed to fetch warehouses')
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
      setLoadingWarehouses(false)
    }
  }

  const fetchLocations = async (warehouseId: string) => {
    try {
      setLoadingLocations(true)
      const response = await fetch(`/api/settings/locations?warehouse_id=${warehouseId}`)
      if (!response.ok) throw new Error('Failed to fetch locations')
      const data = await response.json()
      setLocations(data.locations || [])
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load locations',
        variant: 'destructive',
      })
    } finally {
      setLoadingLocations(false)
    }
  }

  // Handle input change
  const handleChange = (field: string, value: string) => {
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
      const schema = isEditMode ? updateProductionLineSchema : createProductionLineSchema

      // Prepare data for validation
      const dataToValidate: any = {
        code: formData.code,
        name: formData.name,
        warehouse_id: formData.warehouse_id,
        default_output_location_id: formData.default_output_location_id || null,
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
      // Prepare payload (AC-007.1, AC-007.6)
      const payload: any = {
        code: formData.code.toUpperCase(), // AC-007.1: Uppercase
        name: formData.name,
        warehouse_id: formData.warehouse_id,
        default_output_location_id: formData.default_output_location_id || null,
      }

      // Call API
      const url = isEditMode
        ? `/api/settings/production-lines/${line.id}`
        : '/api/settings/production-lines'

      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          // AC-007.1: Duplicate code error
          toast({
            title: 'Duplicate Code',
            description: data.error || `Production line code "${formData.code}" already exists`,
            variant: 'destructive',
          })
          setErrors({ code: 'This code is already in use' })
          return
        }

        throw new Error(data.error || 'Failed to save production line')
      }

      toast({
        title: 'Success',
        description: `Production line "${formData.code}" ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error saving production line:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save production line',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Production Line' : 'Add Production Line'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the production line details below.'
              : 'Add a new production line to your organization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AC-007.1: Code field */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Line Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g., LINE-01, PACK-A"
              className={errors.code ? 'border-destructive' : ''}
              maxLength={50}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Uppercase letters, numbers, and hyphens only. Will be auto-converted to uppercase.
            </p>
          </div>

          {/* AC-007.1: Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Line Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Packing Line A, Assembly Line 1"
              className={errors.name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Maximum 100 characters
            </p>
          </div>

          {/* AC-007.1: Warehouse dropdown */}
          <div className="space-y-2">
            <Label htmlFor="warehouse_id">
              Warehouse <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.warehouse_id}
              onValueChange={(value) => handleChange('warehouse_id', value)}
              disabled={loadingWarehouses}
            >
              <SelectTrigger className={errors.warehouse_id ? 'border-destructive' : ''}>
                <SelectValue placeholder={loadingWarehouses ? 'Loading...' : 'Select warehouse'} />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.code} - {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouse_id && (
              <p className="text-sm text-destructive">{errors.warehouse_id}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Select the warehouse where this production line is located
            </p>
          </div>

          {/* AC-007.1: Default output location dropdown */}
          <div className="space-y-2">
            <Label htmlFor="default_output_location_id">
              Default Output Location (Optional)
            </Label>
            <Select
              value={formData.default_output_location_id}
              onValueChange={(value) => handleChange('default_output_location_id', value)}
              disabled={!formData.warehouse_id || loadingLocations}
            >
              <SelectTrigger className={errors.default_output_location_id ? 'border-destructive' : ''}>
                <SelectValue placeholder={
                  !formData.warehouse_id
                    ? 'Select warehouse first'
                    : loadingLocations
                    ? 'Loading locations...'
                    : 'Select default output location'
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.code} - {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.default_output_location_id && (
              <p className="text-sm text-destructive">{errors.default_output_location_id}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Where finished goods from this line are typically stored
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Line'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
