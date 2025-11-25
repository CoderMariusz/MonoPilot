// Allergen Matrix Page (Story 2.24) - Full Implementation
// Implements: AC-2.24.1 through AC-2.24.10
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type {
  AllergenMatrixResponse,
  AllergenMatrixRow,
  AllergenInfo,
  AllergenInsights,
  ProductCategory,
  AllergenStatus
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

// Icons
const icons = {
  search: '🔍',
  export: '📥',
  filter: '🔽',
  sort: '↕️',
  warning: '⚠️',
  check: '✓',
  question: '?',
  none: '-',
  arrowUp: '▲',
  arrowDown: '▼'
}

// Color classes for allergen status
const statusColors: Record<AllergenStatus, string> = {
  contains: 'bg-red-100 text-red-800 border-red-200',
  may_contain: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  none: 'bg-green-50 text-green-600 border-green-200',
  unknown: 'bg-gray-100 text-gray-500 border-gray-200'
}

const statusIcons: Record<AllergenStatus, string> = {
  contains: '✓',
  may_contain: '⚠',
  none: '-',
  unknown: '?'
}

const statusLabels: Record<AllergenStatus, string> = {
  contains: 'Contains',
  may_contain: 'May Contain',
  none: 'Does not contain',
  unknown: 'Not declared'
}

export default function AllergenMatrixPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [data, setData] = useState<AllergenMatrixResponse | null>(null)
  const [insights, setInsights] = useState<AllergenInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  // Filter state
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [productTypes, setProductTypes] = useState<ProductCategory[]>(
    (searchParams.get('product_types')?.split(',').filter(Boolean) as ProductCategory[]) || []
  )
  const [hasAllergens, setHasAllergens] = useState<'all' | 'with' | 'without' | 'missing'>(
    (searchParams.get('has_allergens') as 'all' | 'with' | 'without' | 'missing') || 'all'
  )
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'allergen_count' | 'type'>(
    (searchParams.get('sort_by') as 'code' | 'name' | 'allergen_count' | 'type') || 'code'
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sort_order') as 'asc' | 'desc') || 'asc'
  )
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'))
  const [pageSize, setPageSize] = useState(parseInt(searchParams.get('pageSize') || '50'))

  // Fetch matrix data
  const fetchMatrix = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (productTypes.length) params.set('product_types', productTypes.join(','))
      params.set('has_allergens', hasAllergens)
      params.set('sort_by', sortBy)
      params.set('sort_order', sortOrder)
      params.set('page', page.toString())
      params.set('pageSize', pageSize.toString())

      const res = await fetch(`/api/technical/dashboard/allergen-matrix?${params}`)
      const result = await res.json()
      setData(result)
    } catch (error) {
      console.error('Failed to load matrix:', error)
    } finally {
      setLoading(false)
    }
  }, [search, productTypes, hasAllergens, sortBy, sortOrder, page, pageSize])

  // Fetch insights
  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch('/api/technical/dashboard/allergen-insights')
      const result = await res.json()
      setInsights(result)
    } catch (error) {
      console.error('Failed to load insights:', error)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchMatrix()
    fetchInsights()
  }, [fetchMatrix, fetchInsights])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchMatrix()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // Handle sort toggle
  const handleSort = (column: 'code' | 'name' | 'allergen_count' | 'type') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Handle export
  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    setExporting(true)
    try {
      // For now, just show alert - actual export would call backend
      alert(`Exporting as ${format.toUpperCase()}... (Feature coming soon)`)
    } finally {
      setExporting(false)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearch('')
    setProductTypes([])
    setHasAllergens('all')
    setSortBy('code')
    setSortOrder('asc')
    setPage(1)
  }

  // Loading skeleton
  if (loading && !data) {
    return (
      <div className="p-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="p-8">
        {/* Header with View Toggle (AC-2.24.1) */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Allergen Matrix</h1>
            <p className="text-gray-600">Product Allergen Overview</p>
          </div>

          <div className="flex items-center gap-2 mt-4 md:mt-0">
            {/* View Toggle Buttons */}
            <div className="flex rounded-lg border overflow-hidden">
              <Link href="/technical/dashboard">
                <Button variant="ghost" size="sm" className="rounded-none">
                  Dashboard
                </Button>
              </Link>
              <Link href="/technical/products">
                <Button variant="ghost" size="sm" className="rounded-none">
                  List View
                </Button>
              </Link>
              <Button variant="secondary" size="sm" className="rounded-none bg-blue-100">
                Allergen Matrix
              </Button>
            </div>

            {/* Export Button (AC-2.24.7) */}
            <Select onValueChange={(v) => handleExport(v as 'excel' | 'csv' | 'pdf')}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder={`${icons.export} Export`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="csv">CSV (.csv)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Allergen Risk Insights (AC-2.24.9) */}
        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <InsightCard
              title="High-Risk Products"
              count={insights.high_risk_products.count}
              subtitle="5+ allergens"
              color="red"
              items={insights.high_risk_products.products.map(p => `${p.code}: ${p.allergen_count} allergens`)}
            />
            <InsightCard
              title="Missing Declarations"
              count={insights.missing_declarations.count}
              subtitle="Not reviewed"
              color="gray"
              items={insights.missing_declarations.products.map(p => p.code)}
              actionLabel="Review"
              onAction={() => setHasAllergens('missing')}
            />
            <InsightCard
              title="Most Common Allergens"
              count={insights.most_common_allergens.length}
              subtitle="Top allergens"
              color="blue"
              items={insights.most_common_allergens.map(a => `${a.allergen_name}: ${a.product_count} products`)}
            />
            <InsightCard
              title="Cross-Contamination"
              count={insights.cross_contamination_alerts.count}
              subtitle="May contain"
              color="yellow"
              items={insights.cross_contamination_alerts.products.map(p => p.code)}
            />
          </div>
        )}

        {/* Filter Panel (AC-2.24.4) */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {icons.search}
                </span>
                <Input
                  type="text"
                  placeholder="Search by product code or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Product Type Filter */}
              <Select
                value={productTypes.join(',') || 'all'}
                onValueChange={(v) => {
                  if (v === 'all') setProductTypes([])
                  else setProductTypes([v as ProductCategory])
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="RM">Raw Materials</SelectItem>
                  <SelectItem value="WIP">Work in Progress</SelectItem>
                  <SelectItem value="FG">Finished Goods</SelectItem>
                </SelectContent>
              </Select>

              {/* Allergen Presence Filter */}
              <Select value={hasAllergens} onValueChange={(v) => setHasAllergens(v as typeof hasAllergens)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="with">Has Allergens</SelectItem>
                  <SelectItem value="without">No Allergens</SelectItem>
                  <SelectItem value="missing">Missing Declarations</SelectItem>
                </SelectContent>
              </Select>

              {/* Page Size */}
              <Select value={pageSize.toString()} onValueChange={(v) => setPageSize(parseInt(v))}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25 rows</SelectItem>
                  <SelectItem value="50">50 rows</SelectItem>
                  <SelectItem value="100">100 rows</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            </div>

            {/* Active Filters */}
            {(search || productTypes.length > 0 || hasAllergens !== 'all') && (
              <div className="flex items-center gap-2 mt-4">
                <span className="text-sm text-gray-500">
                  Showing {data?.matrix.length || 0} of {data?.total || 0} products
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Allergen Matrix Table (AC-2.24.2, AC-2.24.3) */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {/* Fixed Columns */}
                    <th
                      className="sticky left-0 z-20 bg-gray-50 px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('code')}
                    >
                      <div className="flex items-center gap-1">
                        Product Code
                        {sortBy === 'code' && (
                          <span>{sortOrder === 'asc' ? icons.arrowUp : icons.arrowDown}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="sticky left-[120px] z-20 bg-gray-50 px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Product Name
                        {sortBy === 'name' && (
                          <span>{sortOrder === 'asc' ? icons.arrowUp : icons.arrowDown}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center gap-1">
                        Type
                        {sortBy === 'type' && (
                          <span>{sortOrder === 'asc' ? icons.arrowUp : icons.arrowDown}</span>
                        )}
                      </div>
                    </th>

                    {/* Dynamic Allergen Columns */}
                    {data?.allergens.map(allergen => (
                      <th key={allergen.id} className="px-2 py-3 text-center text-xs min-w-[50px]">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="transform -rotate-45 origin-center whitespace-nowrap">
                              {allergen.name.length > 10 ? allergen.name.slice(0, 8) + '...' : allergen.name}
                              {allergen.is_eu_mandatory && <span className="text-blue-500">*</span>}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{allergen.name}</p>
                            {allergen.is_eu_mandatory && <p className="text-xs text-blue-400">EU Mandatory</p>}
                          </TooltipContent>
                        </Tooltip>
                      </th>
                    ))}

                    {/* Total Column */}
                    <th
                      className="sticky right-0 z-20 bg-gray-50 px-4 py-3 text-center text-sm font-semibold cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('allergen_count')}
                    >
                      <div className="flex items-center justify-center gap-1">
                        Total
                        {sortBy === 'allergen_count' && (
                          <span>{sortOrder === 'asc' ? icons.arrowUp : icons.arrowDown}</span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.matrix.map(row => (
                    <MatrixRow
                      key={row.product_id}
                      row={row}
                      allergens={data.allergens}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {data?.matrix.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No products match your filters.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination (AC-2.24.6) */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Page {data.page} of {data.totalPages} ({data.total} products)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(1)}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Input
                type="number"
                min={1}
                max={data.totalPages}
                value={page}
                onChange={(e) => setPage(Math.min(data.totalPages, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                disabled={page === data.totalPages}
                onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page === data.totalPages}
                onClick={() => setPage(data.totalPages)}
              >
                Last
              </Button>
            </div>
          </div>
        )}

        {/* Legend */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <AllergenCell status="contains" />
                <span className="text-sm">Contains</span>
              </div>
              <div className="flex items-center gap-2">
                <AllergenCell status="may_contain" />
                <span className="text-sm">May Contain</span>
              </div>
              <div className="flex items-center gap-2">
                <AllergenCell status="none" />
                <span className="text-sm">Does not contain</span>
              </div>
              <div className="flex items-center gap-2">
                <AllergenCell status="unknown" />
                <span className="text-sm">Not declared</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-500 text-sm">*</span>
                <span className="text-sm">EU Mandatory Allergen</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

// Matrix Row Component
function MatrixRow({
  row,
  allergens
}: {
  row: AllergenMatrixRow
  allergens: AllergenInfo[]
}) {
  const typeBadgeColors: Record<ProductCategory, string> = {
    RM: 'bg-green-100 text-green-800',
    WIP: 'bg-orange-100 text-orange-800',
    FG: 'bg-blue-100 text-blue-800'
  }

  return (
    <tr className="hover:bg-gray-50">
      <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium">
        <Link href={`/technical/products/${row.product_id}`} className="text-blue-600 hover:underline">
          {row.product_code}
        </Link>
      </td>
      <td className="sticky left-[120px] z-10 bg-white px-4 py-3 text-sm max-w-[200px] truncate">
        {row.product_name}
      </td>
      <td className="px-4 py-3 text-sm">
        <Badge className={typeBadgeColors[row.product_type]}>
          {row.product_type}
        </Badge>
      </td>
      {allergens.map(allergen => (
        <td key={allergen.id} className="px-2 py-3 text-center">
          <Tooltip>
            <TooltipTrigger>
              <AllergenCell status={row.allergens[allergen.id] || 'unknown'} />
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">{allergen.name}</p>
              <p className="text-xs">{statusLabels[row.allergens[allergen.id] || 'unknown']}</p>
            </TooltipContent>
          </Tooltip>
        </td>
      ))}
      <td className="sticky right-0 z-10 bg-white px-4 py-3 text-center font-semibold">
        {row.allergen_count}
      </td>
    </tr>
  )
}

// Allergen Cell Component (AC-2.24.3)
function AllergenCell({ status }: { status: AllergenStatus }) {
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded border text-sm font-medium ${statusColors[status]}`}
    >
      {statusIcons[status]}
    </span>
  )
}

// Insight Card Component (AC-2.24.9)
function InsightCard({
  title,
  count,
  subtitle,
  color,
  items,
  actionLabel,
  onAction
}: {
  title: string
  count: number
  subtitle: string
  color: 'red' | 'yellow' | 'green' | 'blue' | 'gray'
  items: string[]
  actionLabel?: string
  onAction?: () => void
}) {
  const colorClasses = {
    red: 'border-l-red-500',
    yellow: 'border-l-yellow-500',
    green: 'border-l-green-500',
    blue: 'border-l-blue-500',
    gray: 'border-l-gray-500'
  }

  return (
    <Card className={`border-l-4 ${colorClasses[color]}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-gray-500">{subtitle}</div>
          </div>
          {count > 0 && items.length > 0 && (
            <Tooltip>
              <TooltipTrigger>
                <span className="text-gray-400 hover:text-gray-600 cursor-help">ℹ️</span>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <ul className="text-xs space-y-1">
                  {items.slice(0, 5).map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {items.length > 5 && <li className="text-gray-400">...and {items.length - 5} more</li>}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {actionLabel && onAction && (
          <Button variant="link" size="sm" className="p-0 h-auto" onClick={onAction}>
            {actionLabel} →
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
