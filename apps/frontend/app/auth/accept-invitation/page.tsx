/**
 * Accept Invitation Page
 * Story: 01.16 - User Invitations (Email)
 * Route: /auth/accept-invitation?token=xxx
 * Description: Public page for users to accept invitation and create account
 * Permission: PUBLIC (no auth required)
 */

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { passwordSchema } from '@/lib/validation/password'

interface InvitationDetails {
  email: string
  role_name: string
  org_name: string
  expires_at: string
  is_expired: boolean
}

interface PasswordRequirement {
  id: string
  label: string
  met: boolean
}

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [token, setToken] = useState<string>('')
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password validation
  const [passwordRequirements, setPasswordRequirements] = useState<PasswordRequirement[]>([
    { id: 'length', label: 'At least 8 characters', met: false },
    { id: 'uppercase', label: 'At least one uppercase letter', met: false },
    { id: 'lowercase', label: 'At least one lowercase letter', met: false },
    { id: 'number', label: 'At least one number', met: false },
    { id: 'special', label: 'At least one special character', met: false },
  ])
  const [passwordsMatch, setPasswordsMatch] = useState(false)

  // Validate password requirements
  useEffect(() => {
    setPasswordRequirements([
      { id: 'length', label: 'At least 8 characters', met: password.length >= 8 },
      { id: 'uppercase', label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
      { id: 'lowercase', label: 'At least one lowercase letter', met: /[a-z]/.test(password) },
      { id: 'number', label: 'At least one number', met: /[0-9]/.test(password) },
      {
        id: 'special',
        label: 'At least one special character',
        met: /[^A-Za-z0-9]/.test(password),
      },
    ])
  }, [password])

  // Check if passwords match
  useEffect(() => {
    setPasswordsMatch(password === confirmPassword && password.length > 0)
  }, [password, confirmPassword])

  // Fetch invitation details on mount
  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (!tokenParam) {
      setError('No invitation token provided')
      setLoading(false)
      return
    }

    setToken(tokenParam)
    fetchInvitationDetails(tokenParam)
  }, [searchParams])

  const fetchInvitationDetails = async (invitationToken: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/auth/invitation/${invitationToken}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load invitation')
      }

      const data: InvitationDetails = await response.json()
      setInvitation(data)

      // Check if expired
      if (data.is_expired) {
        setError('This invitation has expired. Please request a new invitation from your administrator.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all password requirements met
    const allRequirementsMet = passwordRequirements.every((req) => req.met)
    if (!allRequirementsMet) {
      toast({
        title: 'Invalid password',
        description: 'Please meet all password requirements',
        variant: 'destructive',
      })
      return
    }

    if (!passwordsMatch) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both password fields match',
        variant: 'destructive',
      })
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const response = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to accept invitation')
      }

      const data = await response.json()

      toast({
        title: 'Account created successfully!',
        description: `Welcome to ${data.org_name}`,
      })

      // Redirect to login page (access_token can be used for auto-login if desired)
      setTimeout(() => {
        router.push('/login?message=account_created')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation')
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to accept invitation',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-gray-600">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state (invalid/expired invitation)
  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Invalid Invitation</CardTitle>
                <CardDescription className="mt-1">Unable to process your invitation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>

            <div className="pt-4">
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state - show form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">Accept Invitation</CardTitle>
              <CardDescription className="mt-1">
                Create your account to join {invitation?.org_name}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Organization Info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div>
                <p className="text-sm text-gray-600">Organization</p>
                <p className="font-semibold text-gray-900">{invitation?.org_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Your Role</p>
                <p className="font-semibold text-gray-900">{invitation?.role_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email Address</p>
                <p className="font-semibold text-gray-900">{invitation?.email}</p>
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Password Requirements:</p>
              <ul className="space-y-1">
                {passwordRequirements.map((req) => (
                  <li key={req.id} className="flex items-center gap-2 text-sm">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center ${
                        req.met ? 'bg-green-100' : 'bg-gray-200'
                      }`}
                    >
                      {req.met && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                    </div>
                    <span className={req.met ? 'text-green-700' : 'text-gray-600'}>{req.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <div
                    className={`h-4 w-4 rounded-full flex items-center justify-center ${
                      passwordsMatch ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    {passwordsMatch && <CheckCircle2 className="h-3 w-3 text-green-600" />}
                    {!passwordsMatch && <AlertCircle className="h-3 w-3 text-red-600" />}
                  </div>
                  <span className={passwordsMatch ? 'text-green-700' : 'text-red-600'}>
                    {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                  </span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Expiry Notice */}
            {invitation && !invitation.is_expired && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  This invitation expires on{' '}
                  <strong>
                    {new Date(invitation.expires_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={
                submitting ||
                !passwordRequirements.every((req) => req.met) ||
                !passwordsMatch ||
                (invitation?.is_expired ?? false)
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Login Link */}
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="text-blue-600 hover:text-blue-800 hover:underline">
                Sign in
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Main component with Suspense boundary
export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  )
}
