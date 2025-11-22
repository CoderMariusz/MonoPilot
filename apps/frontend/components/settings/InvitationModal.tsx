/**
 * Invitation Modal Component
 * Story: 1.14 (Batch 2) - AC-1.2: Invitation Modal
 *
 * Features:
 * - Success message with email confirmation
 * - QR code for mobile scanning
 * - Copy signup link to clipboard
 * - Expiry notice (7 days)
 * - Close and "Send another invitation" actions
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { CheckCircle2, Copy, Mail, ExternalLink } from 'lucide-react'
import QRCode from 'qrcode'

interface InvitationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invitationData: {
    email: string
    token: string
    expiresAt: string
  } | null
  onSendAnother?: () => void
}

export function InvitationModal({
  open,
  onOpenChange,
  invitationData,
  onSendAnother,
}: InvitationModalProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  // Generate signup link
  const signupLink = invitationData
    ? `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/signup?token=${invitationData.token}`
    : ''

  // Generate QR code
  useEffect(() => {
    if (!invitationData || !canvasRef.current) return

    const generateQRCode = async () => {
      try {
        const url = await QRCode.toDataURL(signupLink, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
        setQrCodeUrl(url)
      } catch (error) {
        console.error('Error generating QR code:', error)
      }
    }

    generateQRCode()
  }, [invitationData, signupLink])

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(signupLink)
      setCopied(true)
      toast({
        title: 'Link copied!',
        description: 'The signup link has been copied to your clipboard',
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy link to clipboard',
        variant: 'destructive',
      })
    }
  }

  // Calculate days until expiry
  const getDaysUntilExpiry = () => {
    if (!invitationData) return 7

    const expiryDate = new Date(invitationData.expiresAt)
    const now = new Date()
    const diffTime = expiryDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  }

  const handleSendAnother = () => {
    onOpenChange(false)
    onSendAnother?.()
  }

  if (!invitationData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">User Invited Successfully!</DialogTitle>
              <DialogDescription className="mt-1">
                An invitation email has been sent to:
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Email Display */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Mail className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">{invitationData.email}</span>
          </div>

          {/* QR Code Section */}
          <div className="space-y-3">
            <div className="text-center">
              <h4 className="font-medium text-sm text-gray-700 mb-3">
                Scan QR Code to Sign Up
              </h4>
              {qrCodeUrl ? (
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img
                    src={qrCodeUrl}
                    alt="Signup QR Code"
                    className="w-48 h-48"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto bg-gray-100 animate-pulse rounded-lg" />
              )}
            </div>
          </div>

          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Or copy the signup link:
            </label>
            <div className="flex gap-2">
              <div className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                <p className="text-xs text-gray-600 truncate">{signupLink}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="gap-2"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Expiry Notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <span className="font-medium">⏰ Expires in {getDaysUntilExpiry()} days</span>
              <br />
              <span className="text-xs">
                The user must sign up before{' '}
                {new Date(invitationData.expiresAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>

          {/* Open Link (optional - for testing) */}
          <div className="pt-2">
            <a
              href={signupLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Open signup page in new tab
            </a>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 sm:flex-initial"
          >
            Close
          </Button>
          {onSendAnother && (
            <Button
              onClick={handleSendAnother}
              className="flex-1 sm:flex-initial gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Send Another Invitation
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Missing import
import { UserPlus } from 'lucide-react'
