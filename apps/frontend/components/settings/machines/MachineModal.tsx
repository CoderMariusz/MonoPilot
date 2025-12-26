/**
 * Machine Modal Component
 * Story: 01.10 - Machines CRUD
 *
 * Create/Edit machine modal with form validation
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { MachineLocationSelect } from './MachineLocationSelect'
import type { Machine, MachineType, MachineStatus } from '@/lib/types/machine'
import { MACHINE_TYPE_LABELS, MACHINE_STATUS_LABELS } from '@/lib/types/machine'
import { machineCreateSchema, machineUpdateSchema } from '@/lib/validation/machine-schemas'
import { ZodError } from 'zod'

interface MachineModalProps {
  mode: 'create' | 'edit'
  machine: Machine | null
  open: boolean
  onClose: () => void
  onSuccess: (machine: Machine) => void
}

interface FormData {
  code: string
  name: string
  description: string
  type: MachineType
  status: MachineStatus
  units_per_hour: string
  setup_time_minutes: string
  max_batch_size: string
  location_id: string | null
}

const MACHINE_TYPES: MachineType[] = [
  'MIXER',
  'OVEN',
  'FILLER',
  'PACKAGING',
  'CONVEYOR',
  'BLENDER',
  'CUTTER',
  'LABELER',
  'OTHER',
]

const MACHINE_STATUSES: MachineStatus[] = [
  'ACTIVE',
  'MAINTENANCE',
  'OFFLINE',
  'DECOMMISSIONED',
]

export function MachineModal({ mode, machine, open, onClose, onSuccess }: MachineModalProps) {
  const [formData, setFormData] = useState<FormData>({
    code: machine?.code || '',
    name: machine?.name || '',
    description: machine?.description || '',
    type: machine?.type || 'OTHER',
    status: machine?.status || 'ACTIVE',
    units_per_hour: machine?.units_per_hour?.toString() || '',
    setup_time_minutes: machine?.setup_time_minutes?.toString() || '',
    max_batch_size: machine?.max_batch_size?.toString() || '',
    location_id: machine?.location_id || null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [codeValidating, setCodeValidating] = useState(false)
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null)
  const [codeCheckTimer, setCodeCheckTimer] = useState<NodeJS.Timeout | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isEditMode = mode === 'edit'

  // Reset form when machine changes
  useEffect(() => {
    if (machine) {
      setFormData({
        code: machine.code || '',
        name: machine.name || '',
        description: machine.description || '',
        type: machine.type || 'OTHER',
        status: machine.status || 'ACTIVE',
        units_per_hour: machine.units_per_hour?.toString() || '',
        setup_time_minutes: machine.setup_time_minutes?.toString() || '',
        max_batch_size: machine.max_batch_size?.toString() || '',
        location_id: machine.location_id || null,
      })
    } else {
      setFormData({
        code: '',
        name: '',
        description: '',
        type: 'OTHER',
        status: 'ACTIVE',
        units_per_hour: '',
        setup_time_minutes: '',
        max_batch_size: '',
        location_id: null,
      })
    }
    setErrors({})
    setCodeAvailable(null)
    setCodeValidating(false)
  }, [machine, open])

  // Handle input change
  const handleChange = (field: keyof FormData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }

    // Real-time code validation (debounced 300ms)
    if (field === 'code' && typeof value === 'string') {
      setCodeAvailable(null)

      // Clear previous timer
      if (codeCheckTimer) {
        clearTimeout(codeCheckTimer)
      }

      // Don't validate empty or short codes
      if (value.length < 1) {
        return
      }

      // Set new timer
      const timer = setTimeout(async () => {
        setCodeValidating(true)
        try {
          const response = await fetch(
            `/api/v1/settings/machines/validate-code?code=${encodeURIComponent(value.toUpperCase())}`
          )
          const data = await response.json()

          if (response.ok) {
            setCodeAvailable(data.available)
          }
        } catch (error) {
          console.error('Code validation error:', error)
        } finally {
          setCodeValidating(false)
        }
      }, 300)

      setCodeCheckTimer(timer)
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
      const schema = isEditMode ? machineUpdateSchema : machineCreateSchema

      // Prepare data for validation
      const dataToValidate = {
        code: formData.code,
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        status: formData.status,
        units_per_hour: formData.units_per_hour ? parseInt(formData.units_per_hour, 10) : null,
        setup_time_minutes: formData.setup_time_minutes
          ? parseInt(formData.setup_time_minutes, 10)
          : null,
        max_batch_size: formData.max_batch_size ? parseInt(formData.max_batch_size, 10) : null,
        location_id: formData.location_id || null,
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

    // Check code availability for create mode
    if (!isEditMode && codeAvailable === false) {
      setErrors({ code: 'Code already exists' })
      return
    }

    setSubmitting(true)

    try {
      // Prepare payload
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        status: formData.status,
        units_per_hour: formData.units_per_hour ? parseInt(formData.units_per_hour, 10) : null,
        setup_time_minutes: formData.setup_time_minutes
          ? parseInt(formData.setup_time_minutes, 10)
          : null,
        max_batch_size: formData.max_batch_size ? parseInt(formData.max_batch_size, 10) : null,
        location_id: formData.location_id || null,
      }

      let result: Machine

      if (isEditMode && machine) {
        const response = await fetch(`/api/v1/settings/machines/${machine.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update machine')
        }

        // API returns machine directly, not wrapped
        result = await response.json()
      } else {
        const response = await fetch('/api/v1/settings/machines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create machine')
        }

        // API returns machine directly, not wrapped
        result = await response.json()
      }

      onSuccess(result)
      onClose()
    } catch (error: any) {
      // Handle duplicate code error
      if (error.message?.includes('already exists') || error.message?.includes('unique')) {
        setErrors({ code: 'Code already exists' })
      } else {
        console.error('Error saving machine:', error)
        setErrors({ submit: error.message || 'Failed to save machine' })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Calculate description character count
  const descriptionLength = formData.description?.length || 0
  const descriptionNearLimit = descriptionLength > 450

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]" aria-modal="true">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Machine' : 'Create Machine'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the machine details below.'
              : 'Add a new machine to your organization.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code field */}
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
              placeholder="MIX-001"
              className={errors.code ? 'border-destructive' : ''}
              maxLength={50}
            />
            {codeValidating && (
              <p className="text-sm text-muted-foreground">Checking availability...</p>
            )}
            {!codeValidating && codeAvailable === true && (
              <p className="text-sm text-green-600">Code available</p>
            )}
            {!codeValidating && codeAvailable === false && (
              <p className="text-sm text-destructive">Code already exists</p>
            )}
            {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
          </div>

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
              placeholder="Industrial Mixer"
              className={errors.name ? 'border-destructive' : ''}
              maxLength={100}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Type field */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange('type', value as MachineType)}
            >
              <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {MACHINE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {MACHINE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Hidden native select for testing compatibility */}
            <select
              id="type"
              aria-label="Type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as MachineType)}
              className="sr-only"
              tabIndex={-1}
            >
              {MACHINE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MACHINE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
          </div>

          {/* Status field */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value as MachineStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {MACHINE_STATUSES.map((status) => (
                  <SelectItem key={status} value={status}>
                    {MACHINE_STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Capacity fields */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="units_per_hour">Units/Hour</Label>
              <Input
                id="units_per_hour"
                type="number"
                value={formData.units_per_hour}
                onChange={(e) => handleChange('units_per_hour', e.target.value)}
                placeholder="500"
                min="0"
                className={errors.units_per_hour ? 'border-destructive' : ''}
              />
              {errors.units_per_hour && (
                <p className="text-sm text-destructive">{errors.units_per_hour}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup_time_minutes">Setup Time (min)</Label>
              <Input
                id="setup_time_minutes"
                type="number"
                value={formData.setup_time_minutes}
                onChange={(e) => handleChange('setup_time_minutes', e.target.value)}
                placeholder="30"
                min="0"
                className={errors.setup_time_minutes ? 'border-destructive' : ''}
              />
              {errors.setup_time_minutes && (
                <p className="text-sm text-destructive">{errors.setup_time_minutes}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_batch_size">Max Batch Size</Label>
              <Input
                id="max_batch_size"
                type="number"
                value={formData.max_batch_size}
                onChange={(e) => handleChange('max_batch_size', e.target.value)}
                placeholder="1000"
                min="0"
                className={errors.max_batch_size ? 'border-destructive' : ''}
              />
              {errors.max_batch_size && (
                <p className="text-sm text-destructive">{errors.max_batch_size}</p>
              )}
            </div>
          </div>

          {/* Location field */}
          <div className="space-y-2">
            <Label htmlFor="location_id">Location</Label>
            <MachineLocationSelect
              value={formData.location_id}
              onChange={(value) => handleChange('location_id', value)}
            />
            {errors.location_id && (
              <p className="text-sm text-destructive">{errors.location_id}</p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Additional details about the machine..."
              className={errors.description ? 'border-destructive' : ''}
              rows={3}
              maxLength={500}
            />
            <p
              className={`text-sm ${descriptionNearLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {descriptionLength}/500 characters
            </p>
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Machine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
