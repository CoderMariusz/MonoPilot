/**
 * AddAllergenModal Component (Story 02.3 - MVP)
 * Purpose: Modal dialog for adding manual allergen declarations to products
 *
 * Features (MVP):
 * - Allergen dropdown (fetches EU 14 allergens from API)
 * - Relation type selector (Contains / May Contain) - Radio buttons
 * - Reason field (required for May Contain, min 10 chars, max 500 chars)
 * - Form validation with Zod schema
 * - Loading, success, error states
 *
 * Excluded (Phase 1+):
 * - Risk assessment form
 * - Evidence file upload
 * - Custom allergen creation
 *
 * Props:
 * - isOpen: Dialog open state
 * - onClose: Callback when dialog closes
 * - productId: Product UUID
 * - onSuccess: Callback after successful allergen addition
 *
 * Usage:
 * <AddAllergenModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   productId={product.id}
 *   onSuccess={handleSuccess}
 * />
 */

'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getDefaultAllergenIcon } from '@/lib/utils/allergen-icons'
import { addProductAllergenSchema } from '@/lib/validation/product-allergen-schema'
import type { AddProductAllergenRequest } from '@/lib/types/product-allergen'
import type { Allergen } from '@/lib/types/allergen'

interface AddAllergenModalProps {
  isOpen: boolean
  onClose: () => void
  productId: string
  onSuccess?: () => void
}

export function AddAllergenModal({
  isOpen,
  onClose,
  productId,
  onSuccess,
}: AddAllergenModalProps) {
  const [allergens, setAllergens] = React.useState<Allergen[]>([])
  const [isLoadingAllergens, setIsLoadingAllergens] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form state
  const [selectedAllergenId, setSelectedAllergenId] = React.useState<string>('')
  const [relationType, setRelationType] = React.useState<'contains' | 'may_contain'>('contains')
  const [reason, setReason] = React.useState('')
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({})

  // Load allergens when modal opens
  React.useEffect(() => {
    if (isOpen) {
      loadAllergens()
    }
  }, [isOpen])

  // Reset form when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedAllergenId('')
      setRelationType('contains')
      setReason('')
      setValidationErrors({})
      setError(null)
    }
  }, [isOpen])

  async function loadAllergens() {
    setIsLoadingAllergens(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/allergens')
      if (!response.ok) {
        throw new Error('Failed to load allergens')
      }

      const data = await response.json()
      setAllergens(data.allergens || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allergens')
    } finally {
      setIsLoadingAllergens(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setValidationErrors({})
    setError(null)

    // Validate form data
    const formData: AddProductAllergenRequest = {
      allergen_id: selectedAllergenId,
      relation_type: relationType,
      reason: reason.trim() || undefined,
    }

    const validation = addProductAllergenSchema.safeParse(formData)

    if (!validation.success) {
      const errors: Record<string, string> = {}
      validation.error.errors.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path[0].toString()] = err.message
        }
      })
      setValidationErrors(errors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/v1/technical/products/${productId}/allergens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validation.data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add allergen')
      }

      // Success!
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add allergen')
    } finally {
      setIsSubmitting(false)
    }
  }

  const showReasonField = relationType === 'may_contain'

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Allergen Declaration</DialogTitle>
          <DialogDescription>
            Manually declare an allergen for this product. Allergens marked as "Contains" indicate
            direct presence, while "May Contain" indicates potential cross-contamination.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Allergen Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="allergen-select">
              Allergen <span className="text-red-500">*</span>
            </Label>
            {isLoadingAllergens ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading allergens...
              </div>
            ) : (
              <Select
                value={selectedAllergenId}
                onValueChange={setSelectedAllergenId}
                disabled={isSubmitting}
              >
                <SelectTrigger
                  id="allergen-select"
                  className={cn(validationErrors.allergen_id && 'border-red-500')}
                  aria-invalid={!!validationErrors.allergen_id}
                  aria-describedby={validationErrors.allergen_id ? 'allergen-error' : undefined}
                >
                  <SelectValue placeholder="Select allergen" />
                </SelectTrigger>
                <SelectContent>
                  {allergens.map((allergen) => (
                    <SelectItem key={allergen.id} value={allergen.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{getDefaultAllergenIcon(allergen.code)}</span>
                        <span>
                          {allergen.code} - {allergen.name_en}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {validationErrors.allergen_id && (
              <p id="allergen-error" className="text-sm text-red-500">
                {validationErrors.allergen_id}
              </p>
            )}
          </div>

          {/* Relation Type Radio Group */}
          <div className="space-y-2">
            <Label>
              Relation Type <span className="text-red-500">*</span>
            </Label>
            <RadioGroup
              value={relationType}
              onValueChange={(value) => setRelationType(value as 'contains' | 'may_contain')}
              disabled={isSubmitting}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contains" id="contains" />
                <Label htmlFor="contains" className="font-normal cursor-pointer">
                  Contains (Present in ingredients)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="may_contain" id="may_contain" />
                <Label htmlFor="may_contain" className="font-normal cursor-pointer">
                  May Contain (Cross-contamination risk)
                </Label>
              </div>
            </RadioGroup>
            {validationErrors.relation_type && (
              <p className="text-sm text-red-500">{validationErrors.relation_type}</p>
            )}
          </div>

          {/* Reason Field (shown only for May Contain) */}
          {showReasonField && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the cross-contamination source (min 10 chars)"
                className={cn(
                  'min-h-[80px]',
                  validationErrors.reason && 'border-red-500'
                )}
                disabled={isSubmitting}
                aria-invalid={!!validationErrors.reason}
                aria-describedby={validationErrors.reason ? 'reason-error' : undefined}
              />
              <p className="text-xs text-muted-foreground">
                Minimum 10 characters, maximum 500 characters
              </p>
              {validationErrors.reason && (
                <p id="reason-error" className="text-sm text-red-500">
                  {validationErrors.reason}
                </p>
              )}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Footer Buttons */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isLoadingAllergens}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Adding...' : 'Add Allergen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
