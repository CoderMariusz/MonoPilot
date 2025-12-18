'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

/**
 * OnboardingWizardModal Component
 * Story: 01.12 - Settings > Onboarding Wizard
 * Wireframe: SET-001
 *
 * Skip confirmation dialog shown when user clicks "Skip Onboarding".
 * Allows user to confirm skip and create demo warehouse + location.
 */
interface OnboardingWizardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function OnboardingWizardModal({
  open,
  onOpenChange,
}: OnboardingWizardModalProps) {
  const router = useRouter()
  const [isSkipping, setIsSkipping] = useState(false)

  const handleSkipWizard = useCallback(async () => {
    setIsSkipping(true)
    try {
      const response = await fetch('/api/v1/settings/onboarding/skip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (response.ok) {
        const data = await response.json()
        onOpenChange(false)
        router.push(data.redirect || '/dashboard')
      }
    } catch (error) {
      console.error('Failed to skip wizard:', error)
    } finally {
      setIsSkipping(false)
    }
  }, [router, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Skip Onboarding Wizard?</DialogTitle>
          <DialogDescription>
            We'll create a demo warehouse and default location so you can start
            exploring MonoPilot immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            You can configure everything manually in Settings.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSkipping}
          >
            Continue Setup
          </Button>
          <Button
            onClick={handleSkipWizard}
            disabled={isSkipping}
            className="gap-2"
          >
            {isSkipping ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Skip Wizard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
