// Reusable Coming Soon Modal
// Used for features planned for post-MVP (P2+)

'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertCircle, Sparkles } from 'lucide-react'

interface ComingSoonModalProps {
  /**
   * Feature name (e.g., "Bulk PO Import")
   */
  featureName: string

  /**
   * Optional detailed description of the feature
   */
  description?: string

  /**
   * Planned release (e.g., "Q2 2025", "Phase 2")
   */
  plannedRelease?: string

  /**
   * Button text (default: feature name)
   */
  triggerLabel?: string

  /**
   * Button variant
   */
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive'

  /**
   * Button size
   */
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon'

  /**
   * Custom trigger element (if you want full control)
   */
  customTrigger?: React.ReactNode

  /**
   * Callback when modal is opened (for analytics)
   */
  onOpen?: () => void
}

export function ComingSoonModal({
  featureName,
  description,
  plannedRelease = 'Phase 2',
  triggerLabel,
  triggerVariant = 'outline',
  triggerSize = 'default',
  customTrigger,
  onOpen,
}: ComingSoonModalProps) {
  const [open, setOpen] = useState(false)

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && onOpen) {
      onOpen()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {customTrigger || (
          <Button variant={triggerVariant} size={triggerSize}>
            <Sparkles className="mr-2 h-4 w-4" />
            {triggerLabel || featureName}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-xl">Coming Soon</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-left">
            <span className="font-semibold text-foreground">{featureName}</span> is planned for{' '}
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {plannedRelease}
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        {description && (
          <div className="rounded-lg bg-muted p-4">
            <div className="flex gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            className="w-full sm:w-auto"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Convenience component for common use case (just a button with modal)
export function ComingSoonButton(props: ComingSoonModalProps) {
  return <ComingSoonModal {...props} />
}
