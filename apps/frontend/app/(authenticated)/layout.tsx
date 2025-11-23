import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { Sidebar } from '@/components/navigation/Sidebar'

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabase()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Get current user to check org_id
  const { data: currentUser } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', session.user.id)
    .single()

  if (!currentUser) {
    redirect('/login')
  }

  // Get organization to check enabled modules
  const { data: organization } = await supabase
    .from('organizations')
    .select('enabled_modules')
    .eq('id', currentUser.org_id)
    .single()

  const enabledModules = organization?.enabled_modules || []
  const user = session.user

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
          {children}
        </main>
      </div>
    </div>
  )
}
