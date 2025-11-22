'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export interface ModuleCardProps {
  moduleKey: string // Module key for filtering (e.g., 'settings', 'technical', 'planning')
  name: string
  icon: string
  stats: { label: string; value: number }[]
  primaryAction: { label: string; href: string }
  detailsHref: string
  color: string
}

const colorClasses: Record<string, string> = {
  gray: 'bg-gray-100 text-gray-600',
  blue: 'bg-blue-100 text-blue-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  pink: 'bg-pink-100 text-pink-600',
}

export function ModuleCard({
  name,
  icon,
  stats,
  primaryAction,
  detailsHref,
  color,
}: ModuleCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl ${colorClasses[color] || colorClasses.gray}`}
          >
            {icon}
          </div>
          <CardTitle className="text-xl">{name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="space-y-2">
          {stats.map((stat, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="font-medium">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button asChild className="w-full" size="sm">
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
          <Link
            href={detailsHref}
            className="flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            View Details
            <span className="text-xs">→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
