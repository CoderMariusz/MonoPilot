/**
 * Settings Dashboard Landing Page
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 * Story: 1.15 Settings Dashboard Landing Page (legacy)
 *
 * Provides visual overview of all available settings sections,
 * allowing users to discover and navigate to configuration areas.
 */

'use client'

import { useEffect, useState } from 'react'
import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface DashboardStats {
  users?: { total: number; pending_invitations?: number }
  infrastructure?: { warehouses: number; machines: number; production_lines: number }
  master_data?: { allergens: number; tax_codes: number }
  integrations?: { api_keys: number; webhooks: number }
  system?: { enabled_modules: number; audit_log_entries: number }
  security?: { last_login: string | null; session_status: string }
}

interface AuditLog {
  id: string
  user_name: string
  action: string
  created_at: string
}

interface OrgContextType {
  organization: {
    id: string
    name: string
    logo_url?: string
    city?: string
    country?: string
    timezone?: string
    contact_email?: string
    contact_phone?: string
    onboarding_step?: number
    onboarding_completed_at?: string | null
  }
  role_code: string
  permissions?: Record<string, string>
}

const QUICK_ACCESS_CARDS = [
  {
    id: 'users',
    title: 'Users & Roles',
    icon: '👥',
    description: 'Manage team members and permissions',
    href: '/settings/users',
    statKey: 'users',
    visibleRoles: ['admin', 'super_admin'],
  },
  {
    id: 'infrastructure',
    title: 'Infrastructure',
    icon: '🏭',
    description: 'Warehouses, machines and production lines',
    href: '/settings/warehouses',
    statKey: 'infrastructure',
    visibleRoles: ['admin', 'super_admin', 'warehouse_manager', 'production_manager'],
  },
  {
    id: 'master-data',
    title: 'Master Data',
    icon: '⚠️',
    description: 'Allergens, tax codes and configurations',
    href: '/settings/allergens',
    statKey: 'master_data',
    visibleRoles: ['admin', 'super_admin', 'quality_manager'],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: '🔗',
    description: 'API keys, webhooks and external apps',
    href: '/settings/api-keys',
    statKey: 'integrations',
    visibleRoles: ['admin', 'super_admin'],
  },
  {
    id: 'system',
    title: 'System',
    icon: '🧩',
    description: 'Modules, audit logs and system settings',
    href: '/settings/modules',
    statKey: 'system',
    visibleRoles: ['admin', 'super_admin'],
  },
  {
    id: 'security',
    title: 'Security',
    icon: '🔒',
    description: 'Access control and security policies',
    href: '/settings/security',
    statKey: 'security',
    visibleRoles: ['admin', 'super_admin'],
  },
]

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export default function SettingsPage() {
  const { data: context, isLoading: contextLoading, error: contextError } = useOrgContext()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [statsLoading, setStatsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const org = context as unknown as OrgContextType | undefined
  const role = org?.role_code || 'viewer'

  // Determine if we show setup wizard (onboarding_step < 6)
  const showSetupWizard = org?.organization?.onboarding_step == null || org.organization.onboarding_step < 6

  // Load dashboard stats and audit logs
  useEffect(() => {
    if (!org) return

    const loadData = async () => {
      setStatsLoading(true)
      setError(null)
      try {
        const statsRes = await fetch('/api/v1/settings/dashboard/stats', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (!statsRes.ok) {
          throw new Error(`Failed to fetch stats: ${statsRes.status}`)
        }

        const statsData = await statsRes.json()
        setStats(statsData)

        // Load audit logs
        const logsRes = await fetch('/api/v1/settings/audit-logs?limit=5', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        if (logsRes.ok) {
          const logsData = await logsRes.json()
          setAuditLogs(logsData.logs || [])
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'ORG_CONTEXT_FETCH_FAILED'
        setError(message)
      } finally {
        setStatsLoading(false)
      }
    }

    loadData()
  }, [org])

  // Filter visible cards based on role
  const visibleCards = QUICK_ACCESS_CARDS.filter((card) =>
    card.visibleRoles.includes(role)
  )

  // If user has no visible cards, return null
  if (!showSetupWizard && visibleCards.length === 0) {
    return null
  }

  // Handle loading state
  if (contextLoading || statsLoading) {
    return (
      <SettingsLayout>
        <div className="space-y-4">
          <Skeleton className="h-32" data-testid="skeleton" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" data-testid="skeleton" />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </SettingsLayout>
    )
  }

  // Handle error state
  if (error && !statsLoading) {
    return (
      <SettingsLayout>
        <Card className="p-8 text-center">
          <h2 className="text-lg font-semibold mb-2">Failed to Load Settings Dashboard</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()}>Retry</Button>
            <Button variant="outline" onClick={() => (window.location.href = '/support')}>
              Contact Support
            </Button>
          </div>
        </Card>
      </SettingsLayout>
    )
  }

  // Handle empty state (new organization)
  if (showSetupWizard) {
    return (
      <SettingsLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-5xl mb-4">⚙️</div>
          <h2 className="text-2xl font-bold mb-2">Welcome to MonoPilot!</h2>
          <p className="text-muted-foreground mb-6 text-center max-w-md">
            Let&apos;s get your organization set up in 15 minutes. Complete the setup wizard to configure essential settings.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => (window.location.href = '/settings/wizard')}>
              Start Setup Wizard
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Proceed to dashboard view
                window.location.reload()
              }}
            >
              Skip and Configure Manually
            </Button>
          </div>
        </div>
      </SettingsLayout>
    )
  }

  // Success state
  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Organization Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Organization Summary</h2>
          <div className="flex gap-4">
            {org?.organization?.logo_url && (
              <img
                src={org.organization.logo_url}
                alt="Organization logo"
                className="w-20 h-20 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{org?.organization?.name}</h3>
              <p className="text-sm text-muted-foreground">
                {org?.organization?.city}, {org?.organization?.country} • {org?.organization?.timezone}
              </p>
              <p className="text-sm text-muted-foreground">
                {org?.organization?.contact_email} • {org?.organization?.contact_phone}
              </p>
            </div>
            {role === 'admin' || role === 'super_admin' ? (
              <Link
                href="/settings/organization"
                className="text-primary hover:underline text-sm self-start"
              >
                Edit Organization Profile →
              </Link>
            ) : null}
          </div>
        </Card>

        {/* Quick Access Cards */}
        {visibleCards.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Quick Access</h2>
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              data-testid="quick-access-cards"
            >
              {visibleCards.map((card) => {
                const cardStats = stats?.[card.statKey as keyof DashboardStats] as Record<string, any>

                return (
                  <article key={card.id} className="border rounded-lg p-5 hover:bg-accent transition">
                    <div className="text-3xl mb-2">{card.icon}</div>
                    <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{card.description}</p>

                    {cardStats && (
                      <div className="mb-4 text-sm space-y-1">
                        {Object.entries(cardStats).map(([key, value]) => {
                          // Format the label with better naming
                          const label = key
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ')
                          return (
                            <div key={key}>
                              {label}: {value}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <Link
                      href={card.href}
                      className="text-primary hover:underline text-sm font-medium"
                      aria-label={`Manage ${card.title.toLowerCase()}`}
                    >
                      Manage {card.title} →
                    </Link>
                  </article>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {(role === 'admin' || role === 'super_admin') && (
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
            {auditLogs.length > 0 ? (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start justify-between text-sm">
                    <span>
                      <strong>{log.user_name}</strong> {log.action}
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap ml-2">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                ))}
                <Link
                  href="/settings/audit-logs"
                  className="text-primary hover:underline text-sm font-medium block mt-4"
                >
                  View All Audit Logs →
                </Link>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </Card>
        )}
      </div>
    </SettingsLayout>
  )
}
