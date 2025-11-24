// Product Dashboard Page (Story 2.23)
'use client'

import { useEffect, useState } from 'react'
import type { ProductDashboardResponse } from '@/lib/types/dashboard'

export default function TechnicalDashboardPage() {
  const [data, setData] = useState<ProductDashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/technical/dashboard/products')
      .then(res => res.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8">Loading dashboard...</div>

  if (!data) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          Failed to load dashboard data. Please try again.
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Technical Dashboard</h1>
        <p className="text-gray-600">Product Catalog Overview</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Products"
          value={data?.overall_stats?.total_products || 0}
          icon="📦"
        />
        <StatCard
          title="Active Products"
          value={data?.overall_stats?.active_products || 0}
          icon="✅"
        />
        <StatCard
          title="Recent Updates"
          value={data?.overall_stats?.recent_updates || 0}
          subtitle="Last 7 days"
          icon="📝"
        />
      </div>

      {/* Product Groups */}
      <div className="space-y-6">
        {data?.groups?.map(group => (
          <ProductGroupSection key={group.category} group={group} />
        ))}
      </div>
    </div>
  )
}

function StatCard({ title, value, subtitle, icon }: any) {
  return (
    <div className="bg-white border rounded-lg p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <div className="text-sm text-gray-600">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
    </div>
  )
}

function ProductGroupSection({ group }: any) {
  const accentColors = {
    RM: 'border-green-500',
    WIP: 'border-orange-500',
    FG: 'border-blue-500'
  }

  return (
    <div className={`border-l-4 ${accentColors[group.category]} bg-white rounded-lg p-6`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">{group.label}</h2>
        <span className="text-gray-500">({group.count} products)</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {group.products.map((product: any) => (
          <div key={product.id} className="border rounded p-4 hover:shadow-md transition-shadow">
            <div className="font-semibold">{product.code}</div>
            <div className="text-sm text-gray-600 truncate">{product.name}</div>
            <div className="text-xs text-gray-500 mt-2">
              v{product.version} • {product.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
