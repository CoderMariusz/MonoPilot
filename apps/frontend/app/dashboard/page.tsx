import { createServerSupabase } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/auth/UserMenu'
import { ModuleCard, type ModuleCardProps } from '@/components/dashboard/ModuleCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { QuickActions } from '@/components/dashboard/QuickActions'

export default async function DashboardPage() {
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

  // Get organization to check setup status
  const { data: organization } = await supabase
    .from('organizations')
    .select('setup_completed')
    .eq('id', currentUser.org_id)
    .single()

  const showWelcomeBanner = !organization?.setup_completed

  const user = session.user

  // Define module cards (hardcoded for MVP, will be dynamic in future)
  const modules: ModuleCardProps[] = [
    {
      name: 'Settings',
      icon: '⚙️',
      color: 'gray',
      stats: [
        { label: 'Total Users', value: 0 },
        { label: 'Active Users', value: 0 },
        { label: 'Pending Invitations', value: 0 },
      ],
      primaryAction: { label: 'Manage Users', href: '/settings/users' },
      detailsHref: '/settings',
    },
    {
      name: 'Technical',
      icon: '🔧',
      color: 'blue',
      stats: [
        { label: 'Total Products', value: 0 },
        { label: 'Total BOMs', value: 0 },
        { label: 'Total Routings', value: 0 },
      ],
      primaryAction: { label: 'Add Product', href: '/technical/products/new' },
      detailsHref: '/technical',
    },
    {
      name: 'Planning',
      icon: '📋',
      color: 'indigo',
      stats: [
        { label: 'Active Work Orders', value: 0 },
        { label: 'Pending POs', value: 0 },
        { label: 'Pending TOs', value: 0 },
      ],
      primaryAction: { label: 'Create PO', href: '/planning/purchase-orders/new' },
      detailsHref: '/planning',
    },
    {
      name: 'Production',
      icon: '🏭',
      color: 'green',
      stats: [
        { label: 'Active WOs', value: 0 },
        { label: 'Paused WOs', value: 0 },
        { label: 'Completed Today', value: 0 },
      ],
      primaryAction: { label: 'Create WO', href: '/production/work-orders/new' },
      detailsHref: '/production',
    },
    {
      name: 'Warehouse',
      icon: '📦',
      color: 'orange',
      stats: [
        { label: 'Total License Plates', value: 0 },
        { label: 'Pending Receipts', value: 0 },
        { label: 'Low Stock Alerts', value: 0 },
      ],
      primaryAction: { label: 'Receive', href: '/warehouse/receive' },
      detailsHref: '/warehouse',
    },
    {
      name: 'Quality',
      icon: '✅',
      color: 'red',
      stats: [
        { label: 'Pending QA Holds', value: 0 },
        { label: 'Open NCRs', value: 0 },
        { label: 'Pending Inspections', value: 0 },
      ],
      primaryAction: { label: 'Create NCR', href: '/quality/ncr/new' },
      detailsHref: '/quality',
    },
    {
      name: 'Shipping',
      icon: '🚚',
      color: 'purple',
      stats: [
        { label: 'Open Sales Orders', value: 0 },
        { label: 'Pending Shipments', value: 0 },
        { label: 'Shipped Today', value: 0 },
      ],
      primaryAction: { label: 'Create SO', href: '/shipping/sales-orders/new' },
      detailsHref: '/shipping',
    },
    {
      name: 'NPD',
      icon: '💡',
      color: 'pink',
      stats: [
        { label: 'Active Projects', value: 0 },
        { label: 'Pending Approvals', value: 0 },
        { label: 'Completed This Month', value: 0 },
      ],
      primaryAction: { label: 'New Project', href: '/npd/projects/new' },
      detailsHref: '/npd',
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with User Menu */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
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

      {/* Main Content */}
      <main className="container mx-auto p-4">
        <div className="space-y-6">
          {/* Welcome Banner (conditionally rendered) */}
          {showWelcomeBanner && <WelcomeBanner show={true} />}

          {/* Page Title */}
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">
              Welcome back, {user.user_metadata?.first_name || 'User'}!
            </p>
          </div>

          {/* Quick Actions */}
          <QuickActions />

          {/* Main Layout: Module Cards + Activity Feed */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Module Cards Grid */}
            <div className="flex-1">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {modules.map((module) => (
                  <ModuleCard key={module.name} {...module} />
                ))}
              </div>
            </div>

            {/* Activity Feed (Right Sidebar on Desktop) */}
            <aside className="lg:w-80">
              <ActivityFeed limit={10} />
            </aside>
          </div>
        </div>
      </main>
    </div>
  )
}
