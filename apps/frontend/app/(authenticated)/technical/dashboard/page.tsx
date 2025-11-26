// Product Dashboard Page (Story 2.23) - Full Implementation
// Implements: AC-2.23.1 through AC-2.23.10
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import type {
  ProductDashboardResponse,
  ProductGroup,
  ProductSummary,
  RecentActivityResponse,
  RecentActivityItem,
  ProductCategory
} from '@/lib/types/dashboard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

// Icons
const icons = {
  package: '📦',
  rawMaterial: '🌾',
  wip: '⚙️',
  finishedGood: '✅',
  refresh: '🔄',
  search: '🔍',
  plus: '➕',
  upload: '📤',
  download: '📥',
  edit: '✏️',
  eye: '👁️',
  created: '➕',
  updated: '📝',
  version: '🔢',
  deleted: '🗑️',
  allergen: '⚠️'
}

export default function TechnicalDashboardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<ProductDashboardResponse | null>(null)
  const [activity, setActivity] = useState<RecentActivityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState<'all' | ProductCategory>(
    (searchParams.get('type_filter') as 'all' | ProductCategory) || 'all'
  )
  const [activityDays, setActivityDays] = useState(7)

  // Section refs for scroll-to-section
  const rmSectionRef = useRef<HTMLDivElement>(null)
  const wipSectionRef = useRef<HTMLDivElement>(null)
  const fgSectionRef = useRef<HTMLDivElement>(null)

  // Fetch dashboard data
  const fetchDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)

    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (typeFilter !== 'all') params.set('type_filter', typeFilter)

      const res = await fetch(`/api/technical/dashboard/products?${params}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to load dashboard:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search, typeFilter])

  // Fetch recent activity
  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch(`/api/technical/dashboard/recent-activity?days=${activityDays}&limit=10`)
      const result = await res.json()
      setActivity(result)
    } catch (error) {
      console.error('Failed to load activity:', error)
    }
  }, [activityDays])

  // Initial load
  useEffect(() => {
    fetchDashboard()
    fetchActivity()
  }, [fetchDashboard, fetchActivity])

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (typeFilter !== 'all') params.set('type_filter', typeFilter)
    const queryString = params.toString()
    const newUrl = queryString ? `?${queryString}` : '/technical/dashboard'
    router.replace(newUrl, { scroll: false })
  }, [search, typeFilter, router])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboard(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, typeFilter, fetchDashboard])

  // Handle refresh
  const handleRefresh = () => {
    fetchDashboard(false)
    fetchActivity()
  }

  // Scroll to section
  const scrollToSection = (category: ProductCategory) => {
    const refs: Record<ProductCategory, React.RefObject<HTMLDivElement | null>> = {
      RM: rmSectionRef,
      WIP: wipSectionRef,
      FG: fgSectionRef
    }
    refs[category]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

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
      {/* Header with View Toggle (AC-2.23.1) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Technical Dashboard</h1>
          <p className="text-gray-600">Product Catalog Overview</p>
        </div>

        <div className="flex items-center gap-2 mt-4 md:mt-0">
          {/* View Toggle Buttons */}
          <div className="flex rounded-lg border overflow-hidden">
            <Button variant="secondary" size="sm" className="rounded-none bg-blue-100">
              Dashboard
            </Button>
            <Link href="/technical/products">
              <Button variant="ghost" size="sm" className="rounded-none">
                List View
              </Button>
            </Link>
            <Link href="/technical/boms">
              <Button variant="ghost" size="sm" className="rounded-none">
                BOMs
              </Button>
            </Link>
            <Link href="/technical/products/allergens">
              <Button variant="ghost" size="sm" className="rounded-none">
                Allergen Matrix
              </Button>
            </Link>
          </div>

          {/* Refresh Button (AC-2.23.9) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : icons.refresh} Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions Panel (AC-2.23.7) */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href="/technical/products/new">
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            {icons.plus} Add Product
          </Button>
        </Link>
        <Button variant="outline" size="sm">
          {icons.upload} Import Products
        </Button>
        <Button variant="outline" size="sm">
          {icons.download} Export Catalog
        </Button>
        <Link href="/technical/products/allergens">
          <Button variant="outline" size="sm">
            {icons.allergen} Allergen Matrix
          </Button>
        </Link>
      </div>

      {/* Search and Filter (AC-2.23.8) */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icons.search}
          </span>
          <Input
            type="text"
            placeholder="Search products by code or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearch('')}
            >
              ✕
            </button>
          )}
        </div>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | ProductCategory)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="RM">Raw Materials Only</SelectItem>
            <SelectItem value="WIP">Work in Progress Only</SelectItem>
            <SelectItem value="FG">Finished Goods Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {(search || typeFilter !== 'all') && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-gray-500">Active filters:</span>
          {search && (
            <Badge variant="secondary" className="gap-1">
              Search: {search}
              <button onClick={() => setSearch('')} className="ml-1">✕</button>
            </Badge>
          )}
          {typeFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Type: {typeFilter}
              <button onClick={() => setTypeFilter('all')} className="ml-1">✕</button>
            </Badge>
          )}
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => { setSearch(''); setTypeFilter('all') }}
          >
            Clear all
          </button>
        </div>
      )}

      {/* Stats Bar (AC-2.23.2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Products"
          value={data.overall_stats.total_products}
          subtitle="Active Products"
          icon={icons.package}
          trend={data.overall_stats.trend_this_month}
          onClick={() => setTypeFilter('all')}
        />
        <StatCard
          title="Raw Materials"
          value={data.category_stats.find(s => s.category === 'RM')?.count || 0}
          subtitle={`${data.category_stats.find(s => s.category === 'RM')?.percentage || 0}% of catalog`}
          icon={icons.rawMaterial}
          accentColor="green"
          onClick={() => scrollToSection('RM')}
        />
        <StatCard
          title="Work in Progress"
          value={data.category_stats.find(s => s.category === 'WIP')?.count || 0}
          subtitle={`${data.category_stats.find(s => s.category === 'WIP')?.percentage || 0}% of catalog`}
          icon={icons.wip}
          accentColor="orange"
          onClick={() => scrollToSection('WIP')}
        />
        <StatCard
          title="Finished Goods"
          value={data.category_stats.find(s => s.category === 'FG')?.count || 0}
          subtitle={`${data.category_stats.find(s => s.category === 'FG')?.percentage || 0}% of catalog`}
          icon={icons.finishedGood}
          accentColor="blue"
          onClick={() => scrollToSection('FG')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Product Groups (3/4 width) */}
        <div className="lg:col-span-3 space-y-6">
          {/* Raw Materials Section (AC-2.23.3) */}
          {(typeFilter === 'all' || typeFilter === 'RM') && (
            <div ref={rmSectionRef}>
              <ProductGroupSection
                group={data.groups.find(g => g.category === 'RM')!}
                onViewAll={() => router.push('/technical/products?type=RM')}
              />
            </div>
          )}

          {/* Work in Progress Section (AC-2.23.4) */}
          {(typeFilter === 'all' || typeFilter === 'WIP') && (
            <div ref={wipSectionRef}>
              <ProductGroupSection
                group={data.groups.find(g => g.category === 'WIP')!}
                onViewAll={() => router.push('/technical/products?type=WIP')}
              />
            </div>
          )}

          {/* Finished Goods Section (AC-2.23.5) */}
          {(typeFilter === 'all' || typeFilter === 'FG') && (
            <div ref={fgSectionRef}>
              <ProductGroupSection
                group={data.groups.find(g => g.category === 'FG')!}
                onViewAll={() => router.push('/technical/products?type=FG')}
              />
            </div>
          )}
        </div>

        {/* Recent Activity Sidebar (AC-2.23.6) */}
        <div className="lg:col-span-1">
          <RecentActivityFeed
            activity={activity}
            days={activityDays}
            onDaysChange={setActivityDays}
          />
        </div>
      </div>
    </div>
  )
}

// Stat Card Component (AC-2.23.2)
function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor,
  onClick
}: {
  title: string
  value: number
  subtitle?: string
  icon: string
  trend?: number
  accentColor?: 'green' | 'orange' | 'blue'
  onClick?: () => void
}) {
  const accentClasses = {
    green: 'border-t-green-500',
    orange: 'border-t-orange-500',
    blue: 'border-t-blue-500'
  }

  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow border-t-4 ${accentColor ? accentClasses[accentColor] : 'border-t-gray-300'}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-3xl font-bold">{value}</span>
        </div>
        <div className="text-sm text-gray-600">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        {trend !== undefined && trend > 0 && (
          <div className="text-xs text-green-600 mt-1">+{trend} this month</div>
        )}
      </CardContent>
    </Card>
  )
}

// Product Group Section Component (AC-2.23.3-5)
function ProductGroupSection({
  group,
  onViewAll
}: {
  group: ProductGroup
  onViewAll: () => void
}) {
  if (!group) return null

  const accentColors: Record<ProductCategory, string> = {
    RM: 'border-l-green-500',
    WIP: 'border-l-orange-500',
    FG: 'border-l-blue-500'
  }

  const titleColors: Record<ProductCategory, string> = {
    RM: 'text-green-700',
    WIP: 'text-orange-700',
    FG: 'text-blue-700'
  }

  if (group.count === 0) {
    return (
      <Card className={`border-l-4 ${accentColors[group.category]}`}>
        <CardHeader>
          <CardTitle className={titleColors[group.category]}>{group.label}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p>No {group.label.toLowerCase()} defined yet.</p>
            <Link href="/technical/products/new">
              <Button size="sm" className="mt-4">
                {icons.plus} Add {group.category === 'RM' ? 'Raw Material' : group.category === 'WIP' ? 'WIP Product' : 'Finished Good'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-l-4 ${accentColors[group.category]}`}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className={titleColors[group.category]}>{group.label}</CardTitle>
          <Badge variant="secondary">({group.count})</Badge>
        </div>
        <Button variant="link" size="sm" onClick={onViewAll}>
          View All →
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {group.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Product Card Component
function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Link href={`/technical/products/${product.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div className="font-semibold text-sm">{product.code}</div>
          <div className="flex gap-1">
            <button className="text-gray-400 hover:text-gray-600 text-xs" title="View">
              {icons.eye}
            </button>
            <button className="text-gray-400 hover:text-gray-600 text-xs" title="Edit">
              {icons.edit}
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-600 truncate mb-2" title={product.name}>
          {product.name}
        </div>
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">v{product.version}</Badge>
            <Badge
              variant={product.status === 'active' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {product.status}
            </Badge>
          </div>
          {(product.allergen_count ?? 0) > 0 && (
            <span className="text-orange-600" title={`${product.allergen_count} allergens`}>
              {icons.allergen} {product.allergen_count}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Updated {formatDistanceToNow(new Date(product.updated_at), { addSuffix: true })}
        </div>
      </div>
    </Link>
  )
}

// Recent Activity Feed Component (AC-2.23.6)
function RecentActivityFeed({
  activity,
  days,
  onDaysChange
}: {
  activity: RecentActivityResponse | null
  days: number
  onDaysChange: (days: number) => void
}) {
  const changeIcons: Record<string, string> = {
    created: icons.created,
    updated: icons.updated,
    version_created: icons.version,
    deleted: icons.deleted
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <p className="text-sm text-gray-500">Last {days} days</p>
        </div>
        <Select value={days.toString()} onValueChange={(v) => onDaysChange(parseInt(v))}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {!activity || activity.activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No recent activity in the last {days} days.
          </div>
        ) : (
          <div className="space-y-3">
            {activity.activities.map((item) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t">
          <Link href="/technical/audit-log" className="text-sm text-blue-600 hover:underline">
            View All Activity →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Activity Item Component
function ActivityItem({ item }: { item: RecentActivityItem }) {
  const changeIcons: Record<string, string> = {
    created: icons.created,
    updated: icons.updated,
    version_created: icons.version,
    deleted: icons.deleted
  }

  return (
    <Link href={`/technical/products/${item.product_id}`}>
      <div className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
        <span className="text-lg">{changeIcons[item.change_type] || icons.updated}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{item.product_code}</div>
          <div className="text-xs text-gray-500 truncate">{item.product_name}</div>
          <div className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(item.changed_at), { addSuffix: true })}
          </div>
        </div>
      </div>
    </Link>
  )
}
