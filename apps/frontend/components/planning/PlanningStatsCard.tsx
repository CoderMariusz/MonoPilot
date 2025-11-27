'use client'

import Link from 'next/link'

interface PlanningStatsCardProps {
  title: string
  icon: string
  stats: Record<string, number>
  type?: 'po' | 'to' | 'wo'
}

const cardConfig = {
  po: {
    color: 'border-l-blue-500 bg-blue-50/50',
    href: '/planning/purchase-orders',
    fields: ['total', 'draft', 'pending_approval', 'confirmed'],
  },
  to: {
    color: 'border-l-orange-500 bg-orange-50/50',
    href: '/planning/transfer-orders',
    fields: ['total', 'in_transit', 'pending_receipt', 'completed'],
  },
  wo: {
    color: 'border-l-green-500 bg-green-50/50',
    href: '/planning/work-orders',
    fields: ['total', 'active', 'completed_today', 'released'],
  },
}

function formatLabel(key: string): string {
  const labelMap: Record<string, string> = {
    total: 'Total',
    draft: 'Draft',
    pending_approval: 'Pending',
    confirmed: 'Confirmed',
    in_transit: 'In Transit',
    pending_receipt: 'Pending',
    completed: 'Completed',
    active: 'Active',
    completed_today: 'Today',
    released: 'Released',
  }
  return labelMap[key] || key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

export function PlanningStatsCard({ title, icon, stats, type = 'po' }: PlanningStatsCardProps) {
  const config = cardConfig[type]

  return (
    <Link href={config.href}>
      <div
        className={`border-l-4 rounded-lg px-4 py-3 hover:shadow-md transition-shadow cursor-pointer ${config.color}`}
        style={{ maxHeight: '120px' }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-gray-700">{title}</span>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-2">
          {config.fields.map((field) => (
            <div key={field} className="text-center">
              <p className="text-base font-bold text-gray-900">{stats[field] ?? 0}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{formatLabel(field)}</p>
            </div>
          ))}
        </div>
      </div>
    </Link>
  )
}
