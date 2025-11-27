'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatItem {
  label: string
  value: number
  color?: 'default' | 'blue' | 'yellow' | 'green' | 'red' | 'orange'
}

interface PlanningStatsCardProps {
  icon: string
  title: string
  stats: StatItem[]
  accentColor?: 'blue' | 'indigo' | 'green' | 'orange'
}

const colorClasses = {
  default: 'text-foreground',
  blue: 'text-blue-600',
  yellow: 'text-yellow-600',
  green: 'text-green-600',
  red: 'text-red-600',
  orange: 'text-orange-600',
}

const accentClasses = {
  blue: 'bg-blue-100 text-blue-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  green: 'bg-green-100 text-green-600',
  orange: 'bg-orange-100 text-orange-600',
}

export function PlanningStatsCard({
  icon,
  title,
  stats,
  accentColor = 'blue',
}: PlanningStatsCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl ${accentClasses[accentColor]}`}
          >
            {icon}
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col p-3 rounded-lg bg-muted/50"
            >
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span
                className={`text-2xl font-bold ${colorClasses[stat.color || 'default']}`}
              >
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
