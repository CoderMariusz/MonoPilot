/**
 * Allergen Form Modal Component
 * Story: 1.9 Allergen Management
 * Task 7: Allergen Form Modal (AC-008.3, AC-008.4)
 */

'use client'

import { useState } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import type { Allergen } from '@/lib/validation/allergen-schemas'
import { createAllergenSchema, updateAllergenSchema } from '@/lib/validation/allergen-schemas'
import { ZodError } from 'zod'

interface AllergenFormModalProps {
  allergen?: Allergen | null // undefined = create, Allergen = edit
  onClose: () => void
  onSuccess: () => void
}

export function AllergenFormModal({ allergen, onClose, onSuccess }: AllergenFormModalProps) {
  const [formData, setFormData] = useState({
    code: allergen?.code || '',
    name: allergen?.name || '',
    is_major: allergen?.is_major || false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const isEditMode = !!allergen
  const isPreloadedAllergen = allergen ? allergen.is_custom === false : false

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
      const schema = isEditMode ? updateAllergenSchema : createAllergenSchema

      // Prepare data for validation
      const dataToValidate: any = {
        code: formData.code,
        name: formData.name,
        is_major: formData.is_major,
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
        code: formData.code.toUpperCase(), // AC-008.3: Uppercase
        name: formData.name,
        is_major: formData.is_major,
      }

      // Call API
      const url = isEditMode
        ? `/api/settings/allergens/${allergen.id}`
        : '/api/settings/allergens'

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
          // AC-008.3: Duplicate code error
          toast({
            title: 'Duplicate Code',
            description: data.error || `Allergen code "${formData.code}" already exists`,
            variant: 'destructive',
          })
          setErrors({ code: 'This code is already in use' })
          return
        }

        if (response.status === 403) {
          // AC-008.2: Cannot edit certain fields of preloaded allergens
          toast({
            title: 'Permission Denied',
            description: data.error || 'You cannot modify this allergen',
            variant: 'destructive',
          })
          return
        }

        throw new Error(data.error || 'Failed to save allergen')
      }

      toast({
        title: 'Success',
        description: `Allergen "${formData.name}" ${isEditMode ? 'updated' : 'created'} successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error saving allergen:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save allergen',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Allergen' : 'Add Custom Allergen'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the allergen details below.'
              : 'Add a custom allergen to your organization\'s allergen library.'}
            {isPreloadedAllergen && (
              <span className="block mt-2 text-blue-600 dark:text-blue-400 font-semibold">
                Note: This is a preloaded EU major allergen. You can edit the name but not the code.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AC-008.3: Code field */}
          <div className="space-y-2">
            <Label htmlFor="code">
              Allergen Code <span className="text-destructive">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="e.g., CUSTOM-01, ADDITIVE-X"
              disabled={isPreloadedAllergen} // Cannot change code of preloaded allergens
              className={errors.code ? 'border-destructive' : ''}
            />
            {errors.code && (
              <p className="text-sm text-destructive">{errors.code}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Uppercase letters, numbers, and hyphens only. Will be auto-converted to uppercase.
            </p>
          </div>

          {/* AC-008.3: Name field */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Allergen Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Sesame Oil, Custom Spice Mix"
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

          {/* AC-008.3: is_major toggle */}
          <div className="flex items-center justify-between space-y-2">
            <div className="space-y-0.5">
              <Label htmlFor="is_major">Major Allergen</Label>
              <p className="text-xs text-muted-foreground">
                Mark as a major allergen requiring special declaration
              </p>
            </div>
            <Switch
              id="is_major"
              checked={formData.is_major}
              onCheckedChange={(checked: boolean) => handleChange('is_major', checked)}
            />
          </div>

          {/* EU Allergens Info */}
          {!isEditMode && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> 14 EU major allergens (Milk, Eggs, Fish, etc.) are already preloaded and cannot be deleted.
                Custom allergens can be deleted if not used in products.
              </p>
            </div>
          )}

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
              {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Allergen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
