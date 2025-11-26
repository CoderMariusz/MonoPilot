import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatItemProps {
  label: string
  value: number
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex flex-col space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

interface PlanningStatsCardProps {
  title: string
  icon: string
  stats: Record<string, number>
}

export function PlanningStatsCard({ title, icon, stats }: PlanningStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <StatItem
              key={key}
              label={key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              value={value}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
