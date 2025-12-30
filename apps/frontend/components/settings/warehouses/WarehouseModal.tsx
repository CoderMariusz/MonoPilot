/**
 * WarehouseModal Component
 * Story: 01.8 - Warehouses CRUD
 *
 * Create/Edit warehouse modal form
 * Features:
 * - Real-time code validation (debounced)
 * - Type dropdown with tooltips
 * - Address textarea with char counter
 * - Contact email + phone fields
 * - Active checkbox
 */

'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WarehouseTypeSelect } from './WarehouseTypeSelect'
import { WarehouseAddressSection } from './WarehouseAddressSection'
import { WarehouseContactSection } from './WarehouseContactSection'
import type { Warehouse, WarehouseType, CreateWarehouseInput } from '@/lib/types/warehouse'
import { AlertTriangle } from 'lucide-react'

interface WarehouseModalProps {
  mode: 'create' | 'edit'
  warehouse: Warehouse | null
  open: boolean
  onClose: () => void
  onSuccess: (warehouse: Warehouse) => void
}

interface FormData {
  code: string
  name: string
  type: WarehouseType
  address: string
  contact_email: string
  contact_phone: string
  is_active: boolean
}

const initialFormData: FormData = {
  code: '',
  name: '',
  type: 'GENERAL',
  address: '',
  contact_email: '',
  contact_phone: '',
  is_active: true,
}

export function WarehouseModal({
  mode,
  warehouse,
  open,
  onClose,
  onSuccess,
}: WarehouseModalProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [codeValidating, setCodeValidating] = useState(false)
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [hasInventory, setHasInventory] = useState(false)
  const codeCheckTimerRef = useRef<NodeJS.Timeout | null>(null)

  const isEditMode = mode === 'edit'

  // Reset form when modal opens or warehouse changes
  useEffect(() => {
    if (open) {
      if (warehouse) {
        setFormData({
          code: warehouse.code || '',
          name: warehouse.name || '',
          type: warehouse.type || 'GENERAL',
          address: warehouse.address || '',
          contact_email: warehouse.contact_email || '',
          contact_phone: warehouse.contact_phone || '',
          is_active: warehouse.is_active ?? true,
        })
        // Check if warehouse has inventory (code immutability)
        setHasInventory(warehouse.location_count > 0)
      } else {
        setFormData(initialFormData)
        setHasInventory(false)
      }
      setErrors({})
      setCodeAvailable(null)
      setCodeValidating(false)
    }
  }, [warehouse, open])

  // Handle input change
  const handleChange = (field: keyof FormData, value: string | boolean) => {
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
      if (codeCheckTimerRef.current) {
        clearTimeout(codeCheckTimerRef.current)
      }

      // Don't validate empty or short codes
      if (value.length < 2) {
        return
      }

      // Set new timer
      codeCheckTimerRef.current = setTimeout(async () => {
        setCodeValidating(true)
        try {
          const params = new URLSearchParams({ code: value.toUpperCase() })
          if (isEditMode && warehouse) {
            params.append('excludeId', warehouse.id)
          }
          const response = await fetch(`/api/v1/settings/warehouses/validate-code?${params}`)
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
    }
  }

  // Auto-uppercase code on blur
  const handleCodeBlur = () => {
    if (formData.code) {
      setFormData((prev) => ({ ...prev, code: prev.code.toUpperCase() }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Code validation
    if (!formData.code.trim()) {
      newErrors.code = 'Code is required'
    } else if (formData.code.length < 2) {
      newErrors.code = 'Code must be at least 2 characters'
    } else if (formData.code.length > 20) {
      newErrors.code = 'Code must be at most 20 characters'
    } else if (!/^[A-Z0-9-]+$/i.test(formData.code)) {
      newErrors.code = 'Code must be uppercase alphanumeric with hyphens only'
    }

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters'
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be at most 100 characters'
    }

    // Address validation
    if (formData.address && formData.address.length > 500) {
      newErrors.address = 'Address must be at most 500 characters'
    }

    // Email validation
    if (formData.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
      newErrors.contact_email = 'Invalid email format'
    }

    // Phone validation
    if (formData.contact_phone && formData.contact_phone.length > 20) {
      newErrors.contact_phone = 'Phone must be at most 20 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
      const payload: CreateWarehouseInput = {
        code: formData.code.toUpperCase(),
        name: formData.name.trim(),
        type: formData.type,
        address: formData.address.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        is_active: formData.is_active,
      }

      let result: Warehouse

      if (isEditMode && warehouse) {
        // For edit, only include code if it's editable (no inventory)
        const editPayload = hasInventory ? { ...payload, code: undefined } : payload

        const response = await fetch(`/api/v1/settings/warehouses/${warehouse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editPayload),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to update warehouse')
        }

        result = await response.json()
      } else {
        const response = await fetch('/api/v1/settings/warehouses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to create warehouse')
        }

        result = await response.json()
      }

      onSuccess(result)
      onClose()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save warehouse'
      // Handle duplicate code error
      if (message.includes('already exists') || message.includes('unique')) {
        setErrors({ code: 'Code already exists' })
      } else {
        setErrors({ submit: message })
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (codeCheckTimerRef.current) {
        clearTimeout(codeCheckTimerRef.current)
      }
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-modal="true">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Warehouse' : 'Create Warehouse'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the warehouse details below.'
              : 'Add a new warehouse to your organization.'}
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
              placeholder="WH-001"
              className={errors.code ? 'border-destructive' : ''}
              maxLength={20}
              disabled={isEditMode && hasInventory}
              aria-describedby="code-status code-error"
              aria-invalid={!!errors.code}
            />
            {isEditMode && hasInventory && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                <span>Code cannot be changed for warehouses with locations</span>
              </div>
            )}
            {codeValidating && (
              <p id="code-status" className="text-sm text-muted-foreground">
                Checking availability...
              </p>
            )}
            {!codeValidating && codeAvailable === true && formData.code.length >= 2 && (
              <p id="code-status" className="text-sm text-green-600">
                Code available
              </p>
            )}
            {!codeValidating && codeAvailable === false && (
              <p id="code-status" className="text-sm text-destructive">
                Code already exists
              </p>
            )}
            {errors.code && (
              <p id="code-error" className="text-sm text-destructive" role="alert">
                {errors.code}
              </p>
            )}
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
              placeholder="Main Warehouse"
              className={errors.name ? 'border-destructive' : ''}
              maxLength={100}
              aria-describedby={errors.name ? 'name-error' : undefined}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive" role="alert">
                {errors.name}
              </p>
            )}
          </div>

          {/* Type field */}
          <div className="space-y-2">
            <Label>
              Type <span className="text-destructive">*</span>
            </Label>
            <WarehouseTypeSelect
              value={formData.type}
              onChange={(value) => handleChange('type', value)}
              error={!!errors.type}
            />
            {errors.type && (
              <p className="text-sm text-destructive" role="alert">
                {errors.type}
              </p>
            )}
          </div>

          {/* Address section */}
          <WarehouseAddressSection
            value={formData.address}
            onChange={(value) => handleChange('address', value)}
            error={errors.address}
          />

          {/* Contact section */}
          <WarehouseContactSection
            email={formData.contact_email}
            phone={formData.contact_phone}
            onEmailChange={(value) => handleChange('contact_email', value)}
            onPhoneChange={(value) => handleChange('contact_phone', value)}
            errors={{
              email: errors.contact_email,
              phone: errors.contact_phone,
            }}
          />

          {/* Active checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', !!checked)}
            />
            <Label htmlFor="is_active" className="font-normal cursor-pointer">
              Active
            </Label>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div className="rounded-md bg-destructive/10 p-3" role="alert">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? 'Saving...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Warehouse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
