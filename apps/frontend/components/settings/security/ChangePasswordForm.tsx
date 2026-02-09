/**
 * Change Password Form Component
 * Story: 01.15 - Session & Password Management
 *
 * Form for users to change their password with real-time validation
 *
 * States:
 * - Default: Form ready for input
 * - Validating: Real-time password validation
 * - Submitting: Loading state during API call
 * - Error: Display validation or server errors
 * - Success: Password changed (redirects to login)
 */

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Lock, AlertTriangle, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { PasswordRequirements } from './PasswordRequirements'
import {
  meetsMinLength,
  hasUppercase,
  hasLowercase,
  hasNumber,
  hasSpecialChar,
} from '@/lib/utils/password-helpers'

interface ChangePasswordFormProps {
  onSuccess?: () => void
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const isPasswordValid = useCallback((password: string): boolean => {
    return (
      meetsMinLength(password, 8) &&
      hasUppercase(password) &&
      hasLowercase(password) &&
      hasNumber(password) &&
      hasSpecialChar(password)
    )
  }, [])

  const canSubmit =
    currentPassword.length > 0 &&
    isPasswordValid(newPassword) &&
    confirmPassword === newPassword &&
    newPassword !== currentPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (!currentPassword) {
      setError('Current password is required')
      return
    }

    if (!isPasswordValid(newPassword)) {
      setError('New password does not meet all requirements')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/v1/settings/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to change password')
        return
      }

      toast({
        title: 'Password Changed',
        description: 'Your password has been changed successfully. Please log in again.',
      })

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess()
      }

      // Redirect to login after password change (sessions are terminated)
      setTimeout(() => {
        router.push('/auth/login')
      }, 1500)
    } catch (err) {
      console.error('Error changing password:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit && !loading) {
      handleSubmit(e)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="space-y-6 max-w-md"
      aria-label="Change password form"
    >
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Password */}
      <div className="space-y-2">
        <Label htmlFor="current-password">Current Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="current-password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="pl-10 pr-10"
            placeholder="Enter current password"
            required
            autoComplete="current-password"
            disabled={loading}
            aria-describedby="current-password-description"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground hover:bg-gray-100 p-1 rounded opacity-100 visible"
            aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
            tabIndex={0}
            title={showCurrentPassword ? 'Hide password' : 'Show password'}
          >
            {showCurrentPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p id="current-password-description" className="text-xs text-muted-foreground">
          Enter your existing password to verify your identity
        </p>
      </div>

      {/* New Password */}
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="pl-10 pr-10"
            placeholder="Enter new password"
            required
            autoComplete="new-password"
            disabled={loading}
            aria-describedby="new-password-requirements"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground hover:bg-gray-100 p-1 rounded opacity-100 visible"
            aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
            tabIndex={0}
            title={showNewPassword ? 'Hide password' : 'Show password'}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Password Requirements */}
        <div id="new-password-requirements">
          <PasswordRequirements password={newPassword} showStrength={true} />
        </div>

        {/* Same as current password warning */}
        {newPassword && currentPassword && newPassword === currentPassword && (
          <p className="text-sm text-yellow-600 flex items-center gap-1">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            New password must be different from current password
          </p>
        )}
      </div>

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            id="confirm-password"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10 pr-10"
            placeholder="Confirm new password"
            required
            autoComplete="new-password"
            disabled={loading}
            aria-describedby="confirm-password-description"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground hover:bg-gray-100 p-1 rounded opacity-100 visible"
            aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            tabIndex={0}
            title={showConfirmPassword ? 'Hide password' : 'Show password'}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p
          id="confirm-password-description"
          className={`text-sm ${
            confirmPassword && confirmPassword !== newPassword
              ? 'text-red-600'
              : 'text-muted-foreground'
          }`}
        >
          {confirmPassword && confirmPassword !== newPassword
            ? 'Passwords do not match'
            : 'Re-enter your new password'}
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Changing Password...
            </>
          ) : (
            'Change Password'
          )}
        </Button>
      </div>

      {/* Security Notice */}
      <p className="text-xs text-muted-foreground">
        After changing your password, you will be logged out of all devices and need to log in again.
      </p>
    </form>
  )
}
