/**
 * Organization Settings Page
 * Story: 1.1 Organization Configuration
 * Story: 1.16 Settings Header Layout
 */

import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OrganizationForm } from '@/components/settings/OrganizationForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SettingsHeader } from '@/components/settings/SettingsHeader'

export default async function OrganizationSettingsPage() {
  const supabase = await createServerSupabase()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  return (
    <div>
      <SettingsHeader currentPage="organization" />

      <div className="px-4 md:px-6 py-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Organization Settings</h1>
            <p className="text-muted-foreground text-sm">
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
      </div>
    </div>
  )
}
