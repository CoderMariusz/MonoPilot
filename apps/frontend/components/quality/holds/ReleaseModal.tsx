/**
 * Release Modal Component
 * Story: 06.2 - Quality Holds CRUD
 * AC-2.12 to AC-2.17: Release hold workflow with disposition
 *
 * Modal for releasing a quality hold with disposition decision
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  CheckCircle,
  RefreshCw,
  Trash2,
  RotateCcw,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { DISPOSITIONS, type Disposition } from '@/lib/validation/quality-hold-validation'

interface ReleaseModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  holdId: string
  holdNumber: string
  itemsCount: number
  hasLPs?: boolean
}

const DISPOSITION_CONFIG: Record<
  Disposition,
  {
    label: string
    description: string
    icon: React.ElementType
    lpAction: string
    warning?: string
  }
> = {
  release: {
    label: 'Release',
    description: 'Items passed inspection and can be released for use',
    icon: CheckCircle,
    lpAction: 'LP status will be set to "passed"',
  },
  rework: {
    label: 'Rework',
    description: 'Items need to be reprocessed before they can be used',
    icon: RefreshCw,
    lpAction: 'LP status will be set to "pending" for re-inspection',
  },
  scrap: {
    label: 'Scrap',
    description: 'Items cannot be salvaged and must be destroyed',
    icon: Trash2,
    lpAction: 'LP status will be set to "scrap" and quantity set to 0',
    warning: 'This will permanently remove inventory from the system.',
  },
  return: {
    label: 'Return to Supplier',
    description: 'Items will be returned to the supplier',
    icon: RotateCcw,
    lpAction: 'LP status will be set to "rejected"',
  },
}

export function ReleaseModal({
  open,
  onClose,
  onSuccess,
  holdId,
  holdNumber,
  itemsCount,
  hasLPs = true,
}: ReleaseModalProps) {
  const [disposition, setDisposition] = useState<Disposition | null>(null)
  const [releaseNotes, setReleaseNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const { toast } = useToast()

  // Reset form when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setDisposition(null)
      setReleaseNotes('')
      setErrors({})
      onClose()
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!disposition) {
      newErrors.disposition = 'Disposition decision is required'
    }

    if (!releaseNotes.trim()) {
      newErrors.releaseNotes = 'Release notes are required'
    } else if (releaseNotes.trim().length < 10) {
      newErrors.releaseNotes = 'Release notes must be at least 10 characters'
    } else if (releaseNotes.length > 1000) {
      newErrors.releaseNotes = 'Release notes must not exceed 1000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle confirmation (for scrap disposition)
  const handleConfirmRelease = () => {
    if (!validateForm()) return

    // If scrap disposition, show confirmation dialog
    if (disposition === 'scrap') {
      setConfirmDialogOpen(true)
      return
    }

    // Otherwise proceed directly
    handleRelease()
  }

  // Handle release
  const handleRelease = async () => {
    if (!disposition) return

    setSubmitting(true)
    setConfirmDialogOpen(false)

    try {
      const response = await fetch(`/api/quality/holds/${holdId}/release`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disposition,
          release_notes: releaseNotes.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to release hold')
      }

      toast({
        title: 'Success',
        description: `Hold ${holdNumber} released successfully`,
      })

      onSuccess()
    } catch (error) {
      console.error('Error releasing hold:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to release hold',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedConfig = disposition ? DISPOSITION_CONFIG[disposition] : null

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Release Hold {holdNumber}</DialogTitle>
            <DialogDescription>
              Select a disposition decision and provide release notes. This will update the status
              of {itemsCount} item{itemsCount !== 1 ? 's' : ''} on this hold.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Disposition Selection */}
            <div className="space-y-3">
              <Label>
                Disposition <span className="text-red-500">*</span>
              </Label>
              <RadioGroup
                value={disposition || ''}
                onValueChange={(v) => {
                  setDisposition(v as Disposition)
                  if (errors.disposition) {
                    setErrors((prev) => {
                      const { disposition: _, ...rest } = prev
                      return rest
                    })
                  }
                }}
                className="space-y-2"
              >
                {DISPOSITIONS.map((d) => {
                  const config = DISPOSITION_CONFIG[d]
                  const Icon = config.icon
                  return (
                    <div
                      key={d}
                      className={`flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        disposition === d
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        setDisposition(d)
                        if (errors.disposition) {
                          setErrors((prev) => {
                            const { disposition: _, ...rest } = prev
                            return rest
                          })
                        }
                      }}
                    >
                      <RadioGroupItem value={d} id={d} className="mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <Label htmlFor={d} className="font-medium cursor-pointer">
                            {config.label}
                          </Label>
                        </div>
                        <p className="text-sm text-gray-500">{config.description}</p>
                        {hasLPs && (
                          <p className="text-xs text-blue-600">{config.lpAction}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </RadioGroup>
              {errors.disposition && (
                <p className="text-sm text-red-500">{errors.disposition}</p>
              )}
            </div>

            {/* Warning for scrap */}
            {disposition === 'scrap' && (
              <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium">Warning: Destructive Action</p>
                  <p>{DISPOSITION_CONFIG.scrap.warning}</p>
                </div>
              </div>
            )}

            {/* Release Notes */}
            <div className="space-y-2">
              <Label htmlFor="release_notes">
                Release Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="release_notes"
                value={releaseNotes}
                onChange={(e) => {
                  setReleaseNotes(e.target.value)
                  if (errors.releaseNotes) {
                    setErrors((prev) => {
                      const { releaseNotes: _, ...rest } = prev
                      return rest
                    })
                  }
                }}
                placeholder="Describe the outcome of the investigation and reason for this disposition decision (min 10 characters)"
                rows={4}
                maxLength={1000}
                className={errors.releaseNotes ? 'border-red-500' : ''}
              />
              {errors.releaseNotes && (
                <p className="text-sm text-red-500">{errors.releaseNotes}</p>
              )}
              <p className="text-xs text-gray-500">{releaseNotes.length}/1000 characters</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmRelease}
              disabled={submitting || !disposition}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Releasing...
                </>
              ) : (
                'Confirm Release'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scrap Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Scrap Disposition</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to scrap all items on hold {holdNumber}. This will set their quantity
              to 0 and mark them as scrapped. This action cannot be undone.
              <br />
              <br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRelease}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Yes, Scrap Items'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
