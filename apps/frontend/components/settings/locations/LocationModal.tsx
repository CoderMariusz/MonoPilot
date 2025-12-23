/**
 * Location Modal Component
 * Story: 01.9 - Location Hierarchy Management
 *
 * Create/Edit location modal with form validation
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
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
import type { Location, LocationLevel, LocationType } from '@/lib/types/location'
import { LOCATION_TYPE_LABELS, LOCATION_LEVEL_LABELS } from '@/lib/types/location'
import { createLocationSchema, updateLocationSchema } from '@/lib/validation/location-schemas'
import { ZodError } from 'zod'
import { useCreateLocation } from '@/lib/hooks/use-create-location'
import { useUpdateLocation } from '@/lib/hooks/use-update-location'
import { useToast } from '@/hooks/use-toast'

interface LocationModalProps {
  mode: 'create' | 'edit'
  warehouseId: string
  location: Location | null
  parentLocation?: Location | null
  open: boolean
  onClose: () => void
  onSuccess: (location: Location) => void
}

interface FormData {
  code: string
  name: string
  description: string
  parent_id: string | null
  level: LocationLevel
  location_type: LocationType
  max_pallets: number | null
  max_weight_kg: number | null
  is_active: boolean
}

const LOCATION_LEVELS: LocationLevel[] = ['zone', 'aisle', 'rack', 'bin']
const LOCATION_TYPES: LocationType[] = ['bulk', 'pallet', 'shelf', 'floor', 'staging']

export function LocationModal({
  mode,
  warehouseId,
  location,
  parentLocation,
  open,
  onClose,
  onSuccess,
}: LocationModalProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    code: location?.code || '',
    name: location?.name || '',
    description: location?.description || '',
    parent_id: parentLocation?.id || location?.parent_id || null,
    level: location?.level || (parentLocation ? getNextLevel(parentLocation.level) : 'zone'),
    location_type: location?.location_type || 'pallet',
    max_pallets: location?.max_pallets || null,
    max_weight_kg: location?.max_weight_kg || null,
    is_active: location?.is_active ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMutation = useCreateLocation(warehouseId)
  const updateMutation = useUpdateLocation(warehouseId)

  const isEditMode = mode === 'edit'
  const submitting = createMutation.isPending || updateMutation.isPending

  // Get next level in hierarchy
  function getNextLevel(parentLevel: LocationLevel): LocationLevel {
    const levelMap: Record<LocationLevel, LocationLevel> = {
      zone: 'aisle',
      aisle: 'rack',
      rack: 'bin',
      bin: 'bin', // Bins can't have children
    }
    return levelMap[parentLevel]
  }

  // Reset form when location/parent changes
  useEffect(() => {
    if (location) {
      setFormData({
        code: location.code || '',
        name: location.name || '',
        description: location.description || '',
        parent_id: location.parent_id || null,
        level: location.level || 'zone',
        location_type: location.location_type || 'pallet',
        max_pallets: location.max_pallets || null,
        max_weight_kg: location.max_weight_kg || null,
        is_active: location.is_active ?? true,
      })
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        parent_id: parentLocation?.id || null,
        level: parentLocation ? getNextLevel(parentLocation.level) : 'zone',
        location_type: 'pallet',
        max_pallets: null,
        max_weight_kg: null,
        is_active: true,
      })
    }
    setErrors({})
  }, [location, parentLocation, open])

  // Handle input change
  const handleChange = (field: keyof FormData, value: string | boolean | number | null) => {
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

  // Auto-uppercase code on blur
  const handleCodeBlur = () => {
    if (formData.code) {
      setFormData((prev) => ({ ...prev, code: prev.code.toUpperCase() }))
    }
  }

  // Validate form
  const validateForm = () => {
    try {
      const schema = isEditMode ? updateLocationSchema : createLocationSchema

      // Prepare data for validation
      const dataToValidate = isEditMode
        ? {
            name: formData.name,
            description: formData.description || null,
            location_type: formData.location_type,
            max_pallets: formData.max_pallets,
            max_weight_kg: formData.max_weight_kg,
            is_active: formData.is_active,
          }
        : {
            code: formData.code,
            name: formData.name,
            description: formData.description || null,
            parent_id: formData.parent_id,
            level: formData.level,
            location_type: formData.location_type,
            max_pallets: formData.max_pallets,
            max_weight_kg: formData.max_weight_kg,
            is_active: formData.is_active,
          }

      schema.parse(dataToValidate)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as string
          if (!fieldErrors[field]) {
            fieldErrors[field] = err.message
          }
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
      return
    }

    try {
      let result: Location

      if (isEditMode && location) {
        // Update
        const payload = {
          name: formData.name,
          description: formData.description || null,
          location_type: formData.location_type,
          max_pallets: formData.max_pallets,
          max_weight_kg: formData.max_weight_kg,
          is_active: formData.is_active,
        }
        result = await updateMutation.mutateAsync({ id: location.id, input: payload })
        toast({
          title: 'Success',
          description: 'Location updated successfully',
        })
      } else {
        // Create
        const payload = {
          code: formData.code.toUpperCase(),
          name: formData.name,
          description: formData.description || undefined,
          parent_id: formData.parent_id || undefined,
          level: formData.level,
          location_type: formData.location_type,
          max_pallets: formData.max_pallets || undefined,
          max_weight_kg: formData.max_weight_kg || undefined,
          is_active: formData.is_active,
        }
        result = await createMutation.mutateAsync(payload)
        toast({
          title: 'Success',
          description: 'Location created successfully',
        })
      }

      onSuccess(result)
      onClose()
    } catch (error: any) {
      // Handle duplicate code error
      if (error.message?.includes('already exists')) {
        setErrors({ code: 'Location code already exists' })
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to save location',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-modal="true">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Location' : 'Create Location'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the location details below.'
              : 'Add a new location to the warehouse hierarchy.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code field (create only) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="code">
                Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="code"
                type="text"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                onBlur={handleCodeBlur}
                placeholder="ZONE-A"
                className={errors.code ? 'border-destructive' : ''}
                maxLength={30}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code}</p>
              )}
            </div>
          )}

          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Zone A - Main Storage"
              className={errors.name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Optional description..."
              className={errors.description ? 'border-destructive' : ''}
              rows={2}
              maxLength={500}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Level field (create only, read-only) */}
          {!isEditMode && (
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Input
                id="level"
                type="text"
                value={LOCATION_LEVEL_LABELS[formData.level]}
                disabled
                className="bg-muted"
              />
              <p className="text-sm text-muted-foreground">
                {parentLocation
                  ? `Auto-set based on parent (${parentLocation.code})`
                  : 'Top-level location'}
              </p>
            </div>
          )}

          {/* Location Type field */}
          <div className="space-y-2">
            <Label htmlFor="location_type">
              Location Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.location_type}
              onValueChange={(value) => handleChange('location_type', value as LocationType)}
              defaultValue={formData.location_type}
            >
              <SelectTrigger className={errors.location_type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {LOCATION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {LOCATION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.location_type && (
              <p className="text-sm text-destructive">{errors.location_type}</p>
            )}
          </div>

          {/* Capacity fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="max_pallets">Max Pallets</Label>
              <Input
                id="max_pallets"
                type="number"
                value={formData.max_pallets ?? ''}
                onChange={(e) => handleChange('max_pallets', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Unlimited"
                className={errors.max_pallets ? 'border-destructive' : ''}
                min={1}
              />
              {errors.max_pallets && (
                <p className="text-sm text-destructive">{errors.max_pallets}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_weight_kg">Max Weight (kg)</Label>
              <Input
                id="max_weight_kg"
                type="number"
                value={formData.max_weight_kg ?? ''}
                onChange={(e) => handleChange('max_weight_kg', e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="Unlimited"
                className={errors.max_weight_kg ? 'border-destructive' : ''}
                min={0.01}
                step={0.01}
              />
              {errors.max_weight_kg && (
                <p className="text-sm text-destructive">{errors.max_weight_kg}</p>
              )}
            </div>
          </div>

          {/* Active checkbox */}
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
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Location'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
