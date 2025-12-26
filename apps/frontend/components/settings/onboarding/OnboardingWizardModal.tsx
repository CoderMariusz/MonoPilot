/**
 * OnboardingWizardModal Component
 * Story: 01.3 - Onboarding Wizard Launcher (TD-102)
 *
 * Modal wrapper that displays the welcome message and options
 * for starting or skipping the onboarding wizard.
 *
 * Features:
 * - Welcome message with feature list
 * - "Start Setup" button navigates to wizard
 * - "Skip for now" button calls skip API
 * - Dismissible via X button, ESC key, backdrop click
 * - Keyboard navigation support
 * - ARIA labels for accessibility
 *
 * @see SET-001 wireframe specification
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface OnboardingWizardModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal is closed (X, ESC, backdrop) */
  onClose: () => void
  /** Callback when user clicks "Skip for now" */
  onSkip: () => Promise<void>
}

/**
 * OnboardingWizardModal
 *
 * Displays welcome modal for first-time admin users with options
 * to start the setup wizard or skip for later.
 *
 * @param open - Controls modal visibility
 * @param onClose - Called when modal is dismissed
 * @param onSkip - Called when user chooses to skip onboarding
 *
 * @example
 * <OnboardingWizardModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSkip={async () => { await skipOnboarding() }}
 * />
 */
export function OnboardingWizardModal({
  open,
  onClose,
  onSkip
}: OnboardingWizardModalProps) {
  const router = useRouter()
  const [isSkipping, setIsSkipping] = useState(false)

  const handleStartWizard = () => {
    router.push('/settings/wizard')
    onClose()
  }

  const handleSkipForNow = async () => {
    if (isSkipping) return

    setIsSkipping(true)
    try {
      await onSkip()
      onClose()
    } catch (error) {
      console.error('Error skipping onboarding:', error)
    } finally {
      setIsSkipping(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isSkipping) {
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="onboarding-modal-description"
      >
        <DialogHeader>
          <DialogTitle>Welcome to MonoPilot!</DialogTitle>
          <DialogDescription id="onboarding-modal-description">
            Let&apos;s set up your organization in just a few steps.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-4">
            The setup wizard will guide you through:
          </p>
          <ul
            className="list-disc list-inside text-sm space-y-2 text-muted-foreground"
            aria-label="Setup wizard steps"
          >
            <li>Organization profile</li>
            <li>Warehouse configuration</li>
            <li>Production settings</li>
            <li>Team setup</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            This takes about 5 minutes. You can also skip and configure later.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleSkipForNow}
            disabled={isSkipping}
            aria-label="Skip onboarding for now"
          >
            {isSkipping && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Skip for now
          </Button>
          <Button
            onClick={handleStartWizard}
            disabled={isSkipping}
            aria-label="Start organization setup wizard"
          >
            Start Setup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
