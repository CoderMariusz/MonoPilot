/**
 * BOM Clone Modal Component
 * Story: 2.10 BOM Clone
 * AC-2.10.1: Clone with new effective dates
 * AC-2.10.2: Copy all items
 * AC-2.10.3: Set status to Draft
 * AC-2.10.4: Auto-increment version
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
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { Copy, Calendar } from 'lucide-react'

interface BOMCloneModalProps {
  bomId: string
  version: number
  onClose: () => void
  onSuccess: () => void
}

export function BOMCloneModal({ bomId, version, onClose, onSuccess }: BOMCloneModalProps) {
  const router = useRouter()
  const { toast } = useToast()

  // Default to today and one year from now
  const today = new Date().toISOString().split('T')[0]

  const [formData, setFormData] = useState({
    effective_from: today,
    effective_to: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Handle input change
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
    const newErrors: Record<string, string> = {}

    if (!formData.effective_from) {
      newErrors.effective_from = 'Effective from date is required'
    }

    if (formData.effective_to && formData.effective_from) {
      const fromDate = new Date(formData.effective_from)
      const toDate = new Date(formData.effective_to)
      if (toDate <= fromDate) {
        newErrors.effective_to = 'End date must be after start date'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        effective_from: new Date(formData.effective_from).toISOString(),
      }

      if (formData.effective_to) {
        payload.effective_to = new Date(formData.effective_to).toISOString()
      }

      const response = await fetch(`/api/technical/boms/${bomId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()

        if (error.error === 'BOM_DATE_OVERLAP') {
          toast({
            title: 'Date Overlap',
            description: error.message || 'Date range overlaps with existing BOM version',
            variant: 'destructive',
          })
          return
        }

        throw new Error(error.error || 'Failed to clone BOM')
      }

      const data = await response.json()

      toast({
        title: 'BOM Cloned',
        description: data.message || `New version created with ${data.cloned_items_count} items`,
      })

      onSuccess()

      // Navigate to the new BOM
      if (data.bom?.id) {
        router.push(`/technical/boms/${data.bom.id}`)
      }
    } catch (error) {
      console.error('Error cloning BOM:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clone BOM',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Clone BOM v{version}
          </DialogTitle>
          <DialogDescription>
            Create a new version of this BOM with all items copied. The new version will be set to
            Draft status.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="effective_from" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Effective From <span className="text-red-500">*</span>
            </Label>
            <Input
              id="effective_from"
              type="date"
              value={formData.effective_from}
              onChange={(e) => handleChange('effective_from', e.target.value)}
              className={errors.effective_from ? 'border-red-500' : ''}
            />
            {errors.effective_from && (
              <p className="text-sm text-red-500">{errors.effective_from}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="effective_to" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Effective To
            </Label>
            <Input
              id="effective_to"
              type="date"
              value={formData.effective_to}
              onChange={(e) => handleChange('effective_to', e.target.value)}
              className={errors.effective_to ? 'border-red-500' : ''}
            />
            {errors.effective_to && (
              <p className="text-sm text-red-500">{errors.effective_to}</p>
            )}
            <p className="text-xs text-gray-500">
              Leave blank for no end date (indefinite)
            </p>
          </div>

          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
            <p className="font-medium">What will be cloned:</p>
            <ul className="list-disc list-inside mt-1 text-blue-600">
              <li>All BOM items with quantities</li>
              <li>Condition flags and by-products</li>
              <li>Output quantity and settings</li>
            </ul>
            <p className="mt-2 text-blue-600">
              Version will be auto-incremented (v{version} → v{(version + 0.1).toFixed(1)})
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Cloning...' : 'Clone BOM'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
