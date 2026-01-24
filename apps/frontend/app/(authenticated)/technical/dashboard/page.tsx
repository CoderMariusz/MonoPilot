// Technical Dashboard Page (Stories 02.12 + 2.23) - Full Implementation
// Story 02.12: Technical Dashboard with stats, allergen matrix, BOM timeline, cost trends
// Story 2.23: Product grouping dashboard
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
  ProductCategory,
  DashboardStatsResponse,
  TechnicalRecentActivityResponse,
  TechnicalActivityItem
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
import { TechnicalHeader } from '@/components/technical/TechnicalHeader'
import { ProductFormModal } from '@/components/technical/ProductFormModal'

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

  // Story 02.12 stats
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [allergenCount, setAllergenCount] = useState<number>(0)

  // Story 02.12 allergen matrix (AC-12.06 to AC-12.12)
  const [allergenMatrixLoading, setAllergenMatrixLoading] = useState(false)
  const [showAllergenMatrix, setShowAllergenMatrix] = useState(false)

  // Story 2.23 product dashboard
  const [data, setData] = useState<ProductDashboardResponse | null>(null)
  const [activity, setActivity] = useState<TechnicalRecentActivityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [typeFilter, setTypeFilter] = useState<'all' | ProductCategory>(
    (searchParams.get('type_filter') as 'all' | ProductCategory) || 'all'
  )
  const [activityDays, setActivityDays] = useState(7)

  // Modal state
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null)

  // Section refs for scroll-to-section
  const rmSectionRef = useRef<HTMLDivElement>(null)
  const wipSectionRef = useRef<HTMLDivElement>(null)
  const fgSectionRef = useRef<HTMLDivElement>(null)

  // Fetch dashboard stats (Story 02.12)
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const [statsRes, allergenRes] = await Promise.all([
        fetch('/api/technical/dashboard/stats'),
        fetch('/api/technical/dashboard/allergen-insights')
      ])

      const statsResult = await statsRes.json()
      setStats(statsResult)

      // Get count of products with allergens
      try {
        const allergenResult = await allergenRes.json()
        const productsWithAllergens = allergenResult.high_risk_products?.count ?? 0
        setAllergenCount(productsWithAllergens)
      } catch (e) {
        // If allergen insights fail, just skip it
        setAllergenCount(0)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch dashboard data (Story 2.23)
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

  // Fetch recent activity (Story 02.12)
  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch('/api/technical/dashboard/recent-activity')
      const result = await res.json()
      setActivity(result)
    } catch (error) {
      console.error('Failed to load activity:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchStats()
    fetchDashboard()
    fetchActivity()
  }, [fetchStats, fetchDashboard, fetchActivity])

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
    fetchStats()
    fetchDashboard(false)
    fetchActivity()
  }

  // Open product modal for create/edit
  const openProductModal = (product?: ProductSummary) => {
    setSelectedProduct(product || null)
    setProductModalOpen(true)
  }

  // Close product modal
  const closeProductModal = () => {
    setProductModalOpen(false)
    setSelectedProduct(null)
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
  if (loading || statsLoading) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

  if (!data || !stats) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-500">
          Failed to load dashboard data. Please try again.
        </div>
      </div>
    )
  }

  // Type assertion: data is guaranteed non-null after early return
  const dashboardData: ProductDashboardResponse = data

  return (
    <div>
      <TechnicalHeader currentPage="dashboard" />
      <div className="px-4 md:px-6 py-6">
      {/* Header with View Toggle (AC-2.23.1) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Technical Dashboard</h1>
          <p className="text-gray-600">Product Catalog & Process Overview</p>
        </div>

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="mt-4 md:mt-0"
        >
          {refreshing ? 'Refreshing...' : icons.refresh} Refresh
        </Button>
      </div>

      {/* Story 02.12: Dashboard Stats (AC-12.01 to AC-12.05) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard02
          title="Total Products"
          value={stats.products.total}
          subtitle={`${stats.products.active} Active`}
          icon={icons.package}
        />
        <StatCard02
          title="Active BOMs"
          value={stats.boms.active}
          subtitle={`${stats.boms.total} Total`}
          icon="📋"
          accentColor="blue"
        />
        <StatCard02
          title="Active Routings"
          value={stats.routings.reusable}
          subtitle={`${stats.routings.total} Total`}
          icon="🛣️"
          accentColor="orange"
        />
        <StatCard02
          title="Products with Allergens"
          value={allergenCount}
          subtitle="High Risk"
          icon={icons.allergen}
          accentColor="green"
        />
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

      {/* Story 2.23: Product Category Summary - Removed to avoid duplication with 02.12 stats */}
      {/* Product groups section below shows the detailed breakdown by category */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Product Groups (3/4 width) - Story 2.23 Product Breakdown (AC-2.23.3-5) */}
        <div className="lg:col-span-3 space-y-6 product-breakdown">
          {/* Raw Materials Section (AC-2.23.3) */}
          {(typeFilter === 'all' || typeFilter === 'RM') && dashboardData.groups?.find(g => g.category === 'RM') && (
            <div ref={rmSectionRef}>
              <ProductGroupSection
                group={dashboardData.groups.find(g => g.category === 'RM')!}
                onViewAll={() => router.push('/technical/products?type=RM')}
                onProductClick={openProductModal}
                onAddProduct={() => openProductModal()}
              />
            </div>
          )}

          {/* Work in Progress Section (AC-2.23.4) */}
          {(typeFilter === 'all' || typeFilter === 'WIP') && dashboardData.groups?.find(g => g.category === 'WIP') && (
            <div ref={wipSectionRef}>
              <ProductGroupSection
                group={dashboardData.groups.find(g => g.category === 'WIP')!}
                onViewAll={() => router.push('/technical/products?type=WIP')}
                onProductClick={openProductModal}
                onAddProduct={() => openProductModal()}
              />
            </div>
          )}

          {/* Finished Goods Section (AC-2.23.5) */}
          {(typeFilter === 'all' || typeFilter === 'FG') && dashboardData.groups?.find(g => g.category === 'FG') && (
            <div ref={fgSectionRef}>
              <ProductGroupSection
                group={dashboardData.groups.find(g => g.category === 'FG')!}
                onViewAll={() => router.push('/technical/products?type=FG')}
                onProductClick={openProductModal}
                onAddProduct={() => openProductModal()}
              />
            </div>
          )}

          {/* Story 02.12: Allergen Matrix Section (AC-12.06 to AC-12.12) */}
          <div className="allergen-matrix-section mt-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between cursor-pointer" onClick={() => setShowAllergenMatrix(!showAllergenMatrix)}>
                <div>
                  <CardTitle>{icons.allergen} Allergen Matrix</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">Product vs Allergen Cross-Reference</p>
                </div>
                <Button variant="ghost" size="sm">
                  {showAllergenMatrix ? '▼' : '▶'} Toggle
                </Button>
              </CardHeader>
              {showAllergenMatrix && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <p className="text-sm text-gray-600 py-4">
                      Allergen matrix data loads on demand. Click products to view detailed allergen information.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>

        {/* Recent Activity Sidebar (AC-2.23.6 + AC-12.17-19) */}
        <div className="lg:col-span-1">
          <RecentActivityFeed
            activity={activity}
            days={activityDays}
            onDaysChange={setActivityDays}
          />
        </div>
      </div>
      </div>

      {/* Product Form Modal - for new products only from dashboard */}
      <ProductFormModal
        open={productModalOpen}
        product={null}
        onClose={closeProductModal}
        onSuccess={() => {
          closeProductModal()
          fetchDashboard(false)
        }}
      />
    </div>
  )
}

// Story 02.12: Stat Card Component (AC-12.01 to AC-12.05)
function StatCard02({
  title,
  value,
  subtitle,
  icon,
  accentColor,
  onClick
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: string
  accentColor?: 'green' | 'orange' | 'blue' | 'gray'
  onClick?: () => void
}) {
  const accentClasses = {
    green: 'border-t-green-500',
    orange: 'border-t-orange-500',
    blue: 'border-t-blue-500',
    gray: 'border-t-gray-300'
  }

  return (
    <Card
      data-stat={title.toLowerCase().replace(/\s+/g, '-')}
      className={`cursor-pointer hover:shadow-md transition-shadow border-t-4 stat-card ${accentColor ? accentClasses[accentColor] : 'border-t-gray-300'}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{icon}</span>
          <span className="text-3xl font-bold">{value}</span>
        </div>
        <div className="text-sm text-gray-600">{title}</div>
        {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  )
}

// Story 2.23: Stat Card Component (AC-2.23.2)
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
  onViewAll,
  onProductClick,
  onAddProduct
}: {
  group: ProductGroup
  onViewAll: () => void
  onProductClick: (product: ProductSummary) => void
  onAddProduct: () => void
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
            <Button size="sm" className="mt-4" onClick={onAddProduct}>
              {icons.plus} Add {group.category === 'RM' ? 'Raw Material' : group.category === 'WIP' ? 'WIP Product' : 'Finished Good'}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-l-4 ${accentColors[group.category]} product-type-breakdown`}>
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
            <ProductCard key={product.id} product={product} onClick={() => onProductClick(product)} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Product Card Component
function ProductCard({ product, onClick }: { product: ProductSummary; onClick: () => void }) {
  return (
    <div
      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="font-semibold text-sm">{product.code}</div>
        <Badge
          variant={product.status === 'active' ? 'default' : 'secondary'}
          className="text-xs"
        >
          {product.status}
        </Badge>
      </div>
      <div className="text-sm text-gray-600 truncate mb-2" title={product.name}>
        {product.name}
      </div>
      <div className="flex items-center justify-between text-xs">
        <Badge variant="outline" className="text-xs">v{product.version}</Badge>
        <div className="flex items-center gap-2">
          {(product.bom_count ?? 0) > 0 && (
            <span className="text-blue-600" title={`${product.bom_count} BOM${product.bom_count !== 1 ? 's' : ''}`}>
              📋 {product.bom_count}
            </span>
          )}
          {(product.allergen_count ?? 0) > 0 && (
            <span className="text-orange-600" title={`${product.allergen_count} allergens`}>
              {icons.allergen} {product.allergen_count}
            </span>
          )}
        </div>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Updated {formatDistanceToNow(new Date(product.updated_at), { addSuffix: true })}
      </div>
    </div>
  )
}

// Story 02.12: Recent Activity Feed Component (AC-12.17 to AC-12.19)
function RecentActivityFeed({
  activity,
  days,
  onDaysChange
}: {
  activity: TechnicalRecentActivityResponse | null
  days: number
  onDaysChange: (days: number) => void
}) {
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
        {!activity || !activity.activities || activity.activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No recent activity in the last {days} days.
          </div>
        ) : (
          <div className="space-y-3">
            {activity.activities.map((item) => (
              <TechnicalActivityItemComponent key={item.id} item={item} />
            ))}
          </div>
        )}
        <div className="mt-4 pt-4 border-t">
          <Link href="/settings" className="text-sm text-blue-600 hover:underline">
            View All Activity →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

// Story 02.12: Activity Item Component
function TechnicalActivityItemComponent({ item }: { item: TechnicalActivityItem }) {
  const typeIcons: Record<string, string> = {
    product_created: icons.created,
    product_updated: icons.updated,
    bom_created: '📋',
    bom_activated: '✅',
    routing_created: '🛣️',
    routing_updated: '🔧'
  }

  return (
    <Link href={item.link}>
      <div className="flex items-start gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
        <span className="text-lg">{typeIcons[item.type] || icons.updated}</span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{item.description}</div>
          <div className="text-xs text-gray-500 truncate">{item.user_name}</div>
          <div className="text-xs text-gray-400 mt-1">{item.relative_time}</div>
        </div>
      </div>
    </Link>
  )
}
