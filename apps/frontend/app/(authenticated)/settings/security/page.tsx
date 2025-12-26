/**
 * Security Settings Page
 * Story: 01.15 - Session & Password Management
 *
 * Page for managing account security including:
 * - Active sessions management
 * - Password change functionality
 * - Security tips and best practices
 *
 * States:
 * - Loading: Skeleton while checking auth
 * - Error: Auth error redirects to login
 * - Success: Full security settings UI
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Lock, Monitor, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SettingsHeader } from '@/components/settings/SettingsHeader'
import { ActiveSessionsList } from '@/components/settings/security/ActiveSessionsList'
import { ChangePasswordForm } from '@/components/settings/security/ChangePasswordForm'
import { createClient } from '@/lib/supabase/client'

export default function SecurityPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
          router.push('/auth/login')
          return
        }

        setLoading(false)
      } catch (err) {
        console.error('Auth check error:', err)
        setError('Failed to verify authentication')
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Loading State
  if (loading) {
    return (
      <div>
        <SettingsHeader currentPage="security" />
        <div className="px-4 md:px-6 py-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-px w-full" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div>
        <SettingsHeader currentPage="security" />
        <div className="px-4 md:px-6 py-6">
          <Alert variant="destructive" role="alert">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  // Success State
  return (
    <div>
      <SettingsHeader currentPage="security" />

      <div className="px-4 md:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-2xl md:text-3xl font-bold">Security Settings</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Manage your account security, active sessions, and password settings
          </p>
        </div>

        <Separator />

        {/* Active Sessions Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Active Sessions</CardTitle>
            </div>
            <CardDescription>
              View and manage devices where you are currently logged in.
              Terminate sessions you do not recognize.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ActiveSessionsList />
          </CardContent>
        </Card>

        {/* Password Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Change Password</CardTitle>
            </div>
            <CardDescription>
              Update your password to keep your account secure.
              You will be logged out from all devices after changing your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>

        {/* Security Tips Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <CardTitle>Security Tips</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul
              className="list-disc list-inside space-y-2 text-sm text-muted-foreground"
              role="list"
              aria-label="Security tips"
            >
              <li>Use a strong, unique password with at least 8 characters</li>
              <li>Include uppercase letters, lowercase letters, numbers, and special characters</li>
              <li>Never share your password with anyone</li>
              <li>Terminate sessions from devices you do not recognize immediately</li>
              <li>Change your password regularly (recommended every 90 days)</li>
              <li>Do not use the same password across multiple websites</li>
              <li>Log out when using shared or public computers</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
