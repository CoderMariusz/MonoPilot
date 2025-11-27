import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatItemProps {
  label: string
  value: number
  isBig?: boolean
}

function StatItem({ label, value, isBig = false }: StatItemProps) {
  return (
    <div className="flex flex-col space-y-1">
      {isBig ? (
        <>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold">{value}</p>
        </>
      )}
    </div>
  )
}

interface PlanningStatsCardProps {
  title: string
  icon: string
  stats: Record<string, number>
  type?: 'po' | 'to' | 'wo'
}

const accentColors: Record<string, string> = {
  po: 'border-l-blue-500',
  to: 'border-l-orange-500',
  wo: 'border-l-green-500'
}

export function PlanningStatsCard({ title, icon, stats, type = 'po' }: PlanningStatsCardProps) {
  // Define which fields are "big" numbers for each type
  const bigFields: Record<string, string[]> = {
    po: ['confirmed', 'close'],
    to: ['in_transit', 'pending_receipt'],
    wo: ['released', 'active']
  }

  const big = bigFields[type] || []

  return (
    <Card className={`border-l-4 ${accentColors[type] || accentColors.po}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span>{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Big Numbers (First row) */}
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(stats)
              .filter(([key]) => big.includes(key))
              .map(([key, value]) => (
                <StatItem
                  key={key}
                  label={key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  value={value}
                  isBig={true}
                />
              ))}
          </div>

          {/* Small Numbers (Second row) */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(stats)
                .filter(([key]) => !big.includes(key))
                .map(([key, value]) => (
                  <StatItem
                    key={key}
                    label={key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    value={value}
                    isBig={false}
                  />
                ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
