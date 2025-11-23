import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrganizationForm } from '@/components/settings/OrganizationForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function OrganizationSettingsPage() {
  const supabase = await createServerSupabase()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center px-4">
          <h1 className="text-2xl font-bold text-primary">MonoPilot</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Organization Settings</h2>
            <p className="text-muted-foreground">
              Configure your organization&apos;s basic information and preferences
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Organization Configuration</CardTitle>
              <CardDescription>
                Update your company details, business settings, and regional preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrganizationForm />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
