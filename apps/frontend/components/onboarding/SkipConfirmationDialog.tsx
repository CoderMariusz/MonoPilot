'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2 } from 'lucide-react'

/**
 * SkipConfirmationDialog Component
 * Story: 01.12 - Settings > Onboarding Wizard
 * Wireframe: SET-001
 *
 * Alternative alert-style confirmation for skipping onboarding.
 * Can be used as drop-in replacement for OnboardingWizardModal.
 */
interface SkipConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SkipConfirmationDialog({
  open,
  onOpenChange,
}: SkipConfirmationDialogProps) {
  const router = useRouter()
  const [isSkipping, setIsSkipping] = useState(false)

  const handleSkip = useCallback(async () => {
    setIsSkipping(true)
    try {
      const response = await fetch('/api/settings/wizard/skip', {
        method: 'POST',
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Skip Onboarding Wizard?</AlertDialogTitle>
          <AlertDialogDescription>
            We'll create a demo warehouse and default location so you can start
            exploring MonoPilot immediately. You can configure everything
            manually in Settings.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-3 justify-end">
          <AlertDialogCancel disabled={isSkipping}>
            Continue Setup
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSkip}
            disabled={isSkipping}
            className="gap-2"
          >
            {isSkipping ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Skip Wizard
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
