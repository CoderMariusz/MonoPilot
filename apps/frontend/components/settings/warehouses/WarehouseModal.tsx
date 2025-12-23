/**
 * Warehouse Modal Component
 * Story: 01.8 - Warehouse Management
 *
 * Create/Edit warehouse modal with form validation
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
import type { Warehouse, WarehouseType } from '@/lib/types/warehouse'
import { WAREHOUSE_TYPE_LABELS, WAREHOUSE_TYPE_DESCRIPTIONS } from '@/lib/types/warehouse'
import { createWarehouseSchema, updateWarehouseSchema } from '@/lib/validation/warehouse-schemas'
import { ZodError } from 'zod'
import { useCreateWarehouse } from '@/lib/hooks/use-create-warehouse'
import { useUpdateWarehouse } from '@/lib/hooks/use-update-warehouse'

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

const WAREHOUSE_TYPES: WarehouseType[] = [
  'GENERAL',
  'RAW_MATERIALS',
  'WIP',
  'FINISHED_GOODS',
  'QUARANTINE',
]

export function WarehouseModal({ mode, warehouse, open, onClose, onSuccess }: WarehouseModalProps) {
  const [formData, setFormData] = useState<FormData>({
    code: warehouse?.code || '',
    name: warehouse?.name || '',
    type: warehouse?.type || 'GENERAL',
    address: warehouse?.address || '',
    contact_email: warehouse?.contact_email || '',
    contact_phone: warehouse?.contact_phone || '',
    is_active: warehouse?.is_active ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [codeValidating, setCodeValidating] = useState(false)
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null)
  const [codeCheckTimer, setCodeCheckTimer] = useState<NodeJS.Timeout | null>(null)

  const createMutation = useCreateWarehouse()
  const updateMutation = useUpdateWarehouse()

  const isEditMode = mode === 'edit'
  const submitting = createMutation.isPending || updateMutation.isPending

  // Check if warehouse has inventory (for code immutability)
  const hasInventory = warehouse ? warehouse.location_count > 0 : false
  const codeDisabled = isEditMode && hasInventory

  // Reset form when warehouse changes
  useEffect(() => {
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
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'GENERAL',
        address: '',
        contact_email: '',
        contact_phone: '',
        is_active: true,
      })
    }
    setErrors({})
    setCodeAvailable(null)
    setCodeValidating(false)
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
    if (field === 'code' && typeof value === 'string' && !codeDisabled) {
      setCodeAvailable(null)

      // Clear previous timer
      if (codeCheckTimer) {
        clearTimeout(codeCheckTimer)
      }

      // Don't validate empty or short codes
      if (value.length < 2) {
        return
      }

      // Set new timer
      const timer = setTimeout(async () => {
        setCodeValidating(true)
        try {
          const response = await fetch(`/api/settings/warehouses/validate-code?code=${encodeURIComponent(value.toUpperCase())}`)
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
      const schema = isEditMode ? updateWarehouseSchema : createWarehouseSchema

      // Prepare data for validation
      const dataToValidate = {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        address: formData.address || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
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

    // Check code availability for create mode
    if (!isEditMode && codeAvailable === false) {
      setErrors({ code: 'Code already exists' })
      return
    }

    try {
      // Prepare payload
      const payload = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        type: formData.type,
        address: formData.address || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        is_active: formData.is_active,
      }

      let result: Warehouse

      if (isEditMode && warehouse) {
        result = await updateMutation.mutateAsync({ id: warehouse.id, input: payload })
      } else {
        result = await createMutation.mutateAsync(payload)
      }

      onSuccess(result)
      onClose()
    } catch (error: any) {
      // Handle duplicate code error (409)
      if (error.message?.includes('already exists')) {
        setErrors({ code: 'Code already exists' })
      } else {
        console.error('Error saving warehouse:', error)
      }
    }
  }

  // Calculate address character count
  const addressLength = formData.address?.length || 0
  const addressNearLimit = addressLength > 450

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-modal="true">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Warehouse' : 'Create Warehouse'}
          </DialogTitle>
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
              placeholder="WH-MAIN"
              disabled={codeDisabled}
              className={errors.code ? 'border-destructive' : ''}
              maxLength={20}
            />
            {codeDisabled && (
              <p className="text-sm text-muted-foreground">
                Code cannot be changed (warehouse has inventory)
              </p>
            )}
            {!codeDisabled && codeValidating && (
              <p className="text-sm text-muted-foreground">Checking availability...</p>
            )}
            {!codeDisabled && codeAvailable === true && (
              <p className="text-sm text-green-600">Code available</p>
            )}
            {!codeDisabled && codeAvailable === false && (
              <p className="text-sm text-destructive">Code already exists</p>
            )}
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code}</p>
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
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Type field */}
          <div className="space-y-2">
            <Label htmlFor="type">
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleChange('type', value as WarehouseType)}
              defaultValue={formData.type}
            >
              <SelectTrigger className={errors.type ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {WAREHOUSE_TYPES.map((type) => (
                  <SelectItem key={type} value={type} title={WAREHOUSE_TYPE_DESCRIPTIONS[type]}>
                    {WAREHOUSE_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Hidden native select for testing compatibility */}
            <select
              id="type"
              aria-label="Type"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value as WarehouseType)}
              className="sr-only"
              tabIndex={-1}
            >
              {WAREHOUSE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {WAREHOUSE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type}</p>
            )}
          </div>

          {/* Address field */}
          <div className="space-y-2">
            <Label htmlFor="address">
              Address
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="123 Main St&#10;Building A&#10;City, State ZIP"
              className={errors.address ? 'border-destructive' : ''}
              rows={3}
              maxLength={500}
            />
            <p className={`text-sm ${addressNearLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
              {addressLength}/500 characters
            </p>
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>

          {/* Contact Email field */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              type="text"
              value={formData.contact_email}
              onChange={(e) => handleChange('contact_email', e.target.value)}
              placeholder="warehouse@company.com"
              className={errors.contact_email ? 'border-destructive' : ''}
            />
            {errors.contact_email && (
              <p className="text-sm text-destructive">{errors.contact_email}</p>
            )}
          </div>

          {/* Contact Phone field */}
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => handleChange('contact_phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
              className={errors.contact_phone ? 'border-destructive' : ''}
              maxLength={20}
            />
            {errors.contact_phone && (
              <p className="text-sm text-destructive">{errors.contact_phone}</p>
            )}
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
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Warehouse'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
