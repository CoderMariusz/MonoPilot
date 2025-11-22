'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { validateInvitationToken } from '@/lib/services/invitation-service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

/**
 * Signup Page with Invitation Token
 * Story: 1.3 User Invitations
 * Task 6: Signup Page (AC-002.8)
 *
 * Allows users to complete signup via invitation link
 */

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tokenValid, setTokenValid] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Get token and email from URL
  const token = searchParams?.get('token') || ''
  const emailParam = searchParams?.get('email') || ''

  useEffect(() => {
    async function validateToken() {
      if (!token || !emailParam) {
        setError('Invalid invitation link. Missing token or email.')
        setLoading(false)
        return
      }

      try {
        // Validate token on client side (server will validate again)
        validateInvitationToken(token)
        setEmail(emailParam)
        setTokenValid(true)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'This invitation has expired. Please request a new one.'
        )
      } finally {
        setLoading(false)
      }
    }

    validateToken()
  }, [token, emailParam])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setSubmitting(false)
      return
    }

    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      setSubmitting(false)
      return
    }

    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      setSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setSubmitting(false)
      return
    }

    try {
      const supabase = createClient()

      // Sign up user with Supabase Auth
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            invitation_token: token,
          },
        },
      })

      if (signupError) {
        throw signupError
      }

      if (!data.user) {
        throw new Error('Failed to create user')
      }

      // AC-002.8: On successful signup, redirect to dashboard with welcome message
      // The acceptInvitation logic should be triggered by a webhook or database trigger
      // For now, we'll redirect and let the backend handle the rest
      router.push('/dashboard?welcome=true')
    } catch (err) {
      console.error('Signup error:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to complete signup'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Invalid Invitation
            </h1>
            <p className="text-red-600 mb-6">{error}</p>
            <p className="text-gray-600 text-sm">
              Please contact your administrator to request a new invitation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MonoPilot</h1>
          <p className="text-gray-600 mt-2">Complete your signup</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? 'Creating account...' : 'Complete Signup'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
