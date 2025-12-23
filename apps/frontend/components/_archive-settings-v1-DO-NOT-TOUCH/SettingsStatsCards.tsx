'use client'

/**
 * Settings Stats Cards Component
 * Story: 1.17 Settings Stats Cards
 * AC-1.17.1: Compact stats cards with 4 metrics each
 * AC-1.17.2: Max 120px height, clickable links
 * AC-1.17.4: Responsive grid layout
 */

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, MapPin, Settings, Cpu } from 'lucide-react'

interface SettingsStats {
  users: {
    total: number
    active: number
    pending: number
    lastActivity: string
  }
  locations: {
    warehouses: number
    locations: number
    machines: number
    lines: number
  }
  configuration: {
    allergens: number
    taxCodes: number
    productTypes: number
    activeModules: string
  }
  system: {
    wizardProgress: string
    lastUpdated: string
    organizationName: string
    subscription: string
  }
}

interface StatCardProps {
  title: string
  icon: React.ReactNode
  stats: { label: string; value: string | number }[]
  href: string
  color: string
}

function StatCard({ title, icon, stats, href, color }: StatCardProps) {
  return (
    <Link href={href} className="block">
      <Card className="h-[120px] hover:shadow-lg transition-all cursor-pointer border-l-4" style={{ borderLeftColor: color }}>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {stats.map((stat, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground truncate">{stat.label}</span>
                <span className="text-sm font-medium">{stat.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="h-[120px]">
      <CardHeader className="pb-2 pt-3 px-4">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-6" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function SettingsStatsCards() {
  const [stats, setStats] = useState<SettingsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/stats')

      if (!response.ok) {
        throw new Error('Failed to fetch stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading stats')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Unable to load statistics. <button onClick={fetchStats} className="text-primary hover:underline">Retry</button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Card 1: Users */}
      <StatCard
        title="Users"
        icon={<Users className="h-4 w-4 text-blue-600" />}
        color="#2563eb"
        href="/settings/users"
        stats={[
          { label: 'Total', value: stats.users.total },
          { label: 'Active', value: stats.users.active },
          { label: 'Pending', value: stats.users.pending },
          { label: 'Last', value: stats.users.lastActivity }
        ]}
      />

      {/* Card 2: Locations */}
      <StatCard
        title="Locations"
        icon={<MapPin className="h-4 w-4 text-orange-600" />}
        color="#ea580c"
        href="/settings/warehouses"
        stats={[
          { label: 'WH', value: stats.locations.warehouses },
          { label: 'Loc', value: stats.locations.locations },
          { label: 'Mach', value: stats.locations.machines },
          { label: 'Lines', value: stats.locations.lines }
        ]}
      />

      {/* Card 3: Configuration */}
      <StatCard
        title="Configuration"
        icon={<Settings className="h-4 w-4 text-purple-600" />}
        color="#9333ea"
        href="/settings/allergens"
        stats={[
          { label: 'Allerg', value: stats.configuration.allergens },
          { label: 'Tax', value: stats.configuration.taxCodes },
          { label: 'Types', value: stats.configuration.productTypes },
          { label: 'Mods', value: stats.configuration.activeModules }
        ]}
      />

      {/* Card 4: System */}
      <StatCard
        title="System"
        icon={<Cpu className="h-4 w-4 text-green-600" />}
        color="#16a34a"
        href="/settings/wizard"
        stats={[
          { label: 'Wizard', value: stats.system.wizardProgress },
          { label: 'Updated', value: stats.system.lastUpdated },
          { label: 'Org', value: stats.system.organizationName.substring(0, 8) },
          { label: 'Plan', value: stats.system.subscription }
        ]}
      />
    </div>
  )
}
