import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { Sidebar } from '@/components/navigation/Sidebar'
import { OnboardingGuard } from '@/components/settings/onboarding'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()

  // Use getUser() instead of getSession() for security
  // This verifies the token with Supabase Auth server
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  console.log('[Layout] Auth check:', {
    hasUser: !!user,
    userId: user?.id,
    authError: authError?.message
  })

  if (authError || !user) {
    console.log('[Layout] No auth user, redirecting to /login')
    redirect('/login')
  }

  // Get current user to check org_id
  const { data: currentUser, error: userError } = await supabase
    .from('users')
    .select('org_id, role_id, first_name, last_name, email')
    .eq('id', user.id)
    .single()

  console.log('[Layout] User profile check:', {
    hasProfile: !!currentUser,
    userId: user.id,
    error: userError?.message,
    errorCode: userError?.code,
    errorDetails: userError?.details
  })

  // If user record not found, sign out and redirect
  // This handles cases where session exists but user was deleted or RLS blocks access
  if (!currentUser || userError) {
    console.log('[Layout] User profile not found or error, signing out')
    await supabase.auth.signOut()
    redirect('/login')
  }

  console.log('[Layout] User authenticated successfully:', {
    userId: user.id,
    orgId: currentUser.org_id
  })

  // Get organization to check enabled modules
  const { data: organization } = await supabase
    .from('organizations')
    .select('modules_enabled')
    .eq('id', currentUser.org_id)
    .single()

  const enabledModules = organization?.modules_enabled || []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with User Menu */}
      <header className="border-b bg-white z-10">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-primary">MonoPilot</h1>
          </div>
          <UserMenu
            user={{
              email: user.email || '',
              name: user.user_metadata?.first_name
                ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
                : undefined,
            }}
          />
        </div>
      </header>

      {/* Body: Sidebar + Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar enabledModules={enabledModules} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <OnboardingGuard>
            {children}
          </OnboardingGuard>
        </main>
      </div>
    </div>
  )
}
