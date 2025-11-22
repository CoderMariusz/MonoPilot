/**
 * Invitation Success Modal Component
 * Story: 1.3 User Invitations
 * BATCH 1: UI Components
 * AC-003.5: QR code generation after successful invitation
 * AC-1.2: Invitation modal triggered after user creation
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CheckCircle2, Copy, Mail } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import QRCode from 'qrcode'

interface InvitationSuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  email: string
  signupLink: string
  expiresAt: string
  onSendAnother?: () => void
}

export function InvitationSuccessModal({
  open,
  onOpenChange,
  email,
  signupLink,
  expiresAt,
  onSendAnother,
}: InvitationSuccessModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const { toast } = useToast()

  // Generate QR code (AC-003.5)
  useEffect(() => {
    if (open && signupLink) {
      QRCode.toDataURL(signupLink, {
        width: 300,
        margin: 2,
      })
        .then(setQrCodeUrl)
        .catch((error) => {
          console.error('Error generating QR code:', error)
        })
    }
  }, [open, signupLink])

  // Copy link to clipboard (AC-1.2)
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(signupLink)
      toast({
        title: 'Success',
        description: 'Signup link copied to clipboard',
      })
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  // Calculate days until expiry (AC-1.2)
  const getDaysUntilExpiry = () => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleSendAnother = () => {
    onOpenChange(false)
    if (onSendAnother) {
      onSendAnother()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
            <DialogTitle className="text-2xl">User invited successfully!</DialogTitle>
          </div>
          <DialogDescription>
            An invitation email has been sent to the user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Email confirmation (AC-1.2) */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                Email sent to:
              </p>
              <p className="text-blue-700 dark:text-blue-300 font-medium">
                {email}
              </p>
            </div>
          </div>

          {/* QR Code (AC-003.5) */}
          {qrCodeUrl && (
            <div className="flex flex-col items-center space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">
                QR Code for Mobile Scanning
              </p>
              <div className="bg-white p-4 rounded-lg border">
                <img
                  src={qrCodeUrl}
                  alt="Signup QR Code"
                  className="w-[250px] h-[250px]"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                The user can scan this QR code to quickly access the signup page
              </p>
            </div>
          )}

          {/* Copy link button (AC-1.2) */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="w-full"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Signup Link
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              You can also manually share the signup link with the user
            </p>
          </div>

          {/* Expiry notice (AC-1.2) */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-900 dark:text-amber-100">
              <strong>Expires in {getDaysUntilExpiry()} days</strong>
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              The invitation will expire on {new Date(expiresAt).toLocaleDateString()}. After that, you'll need to resend the invitation.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
          {onSendAnother && (
            <Button
              onClick={handleSendAnother}
              className="w-full sm:w-auto"
            >
              Send Another Invitation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
