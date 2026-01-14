/**
 * Product Detail Page
 * Story: 2.1 Product CRUD - AC-2.1.5: Detail View
 * Story: 2.3 Product Version History - AC-2.3.3, AC-2.3.4: History UI
 * Story: 2.4 Product Allergen Assignment - AC-2.4.4: Allergen Badges
 */

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Edit,
  Trash2,
  History,
  Package,
  AlertTriangle,
  Clock,
  User,
  GitCompare,
  BookOpen,
  Plus,
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { ProductFormModal } from '@/components/technical/ProductFormModal'
import { ProductDeleteDialog } from '@/components/technical/ProductDeleteDialog'

interface ProductType {
  id: string
  code: string
  name: string
}

interface Product {
  id: string
  code: string
  name: string
  product_type_id: string
  product_type?: ProductType
  description?: string
  base_uom: string
  version: number
  status: 'active' | 'inactive' | 'discontinued'
  shelf_life_days?: number
  min_stock?: number
  max_stock?: number
  cost_per_unit?: number
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

interface Allergen {
  id: string
  code: string
  name: string
}

interface ProductAllergens {
  contains: Allergen[]
  may_contain: Allergen[]
}

interface VersionHistoryEntry {
  id: string
  version: number
  changed_fields: Record<string, { old: unknown; new: unknown }>
  change_summary?: string
  changed_at: string
  changed_by: {
    id: string
    first_name?: string
    last_name?: string
    email?: string
  } | null
}

interface BOM {
  id: string
  version: string
  status: 'Draft' | 'Active' | 'Phased Out' | 'Inactive'
  effective_from: string
  effective_to: string | null
  output_qty: number
  output_uom: string
  notes?: string
  created_at: string
  updated_at: string
}

// Product type config
const PRODUCT_TYPES: Record<string, { label: string; color: string }> = {
  RM: { label: 'Raw Material', color: 'bg-blue-500' },
  WIP: { label: 'Work In Progress', color: 'bg-orange-500' },
  FG: { label: 'Finished Good', color: 'bg-green-500' },
  PKG: { label: 'Packaging', color: 'bg-purple-500' },
  BP: { label: 'By-Product', color: 'bg-gray-500' },
  CUSTOM: { label: 'Custom', color: 'bg-cyan-500' },
}

const STATUS_COLORS: Record<string, { variant: 'default' | 'secondary' | 'destructive'; className: string }> = {
  active: { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
  inactive: { variant: 'secondary', className: '' },
  discontinued: { variant: 'destructive', className: '' },
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') || 'details'

  const [product, setProduct] = useState<Product | null>(null)
  const [allergens, setAllergens] = useState<ProductAllergens>({ contains: [], may_contain: [] })
  const [history, setHistory] = useState<VersionHistoryEntry[]>([])
  const [boms, setBOMs] = useState<BOM[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState(initialTab)

  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Compare versions state
  const [compareMode, setCompareMode] = useState(false)
  const [selectedVersions, setSelectedVersions] = useState<number[]>([])
  const [compareResult, setCompareResult] = useState<Record<string, { old: unknown; new: unknown }> | null>(null)

  const { toast } = useToast()

  // Fetch product details
  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/technical/products/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Not Found',
            description: 'Product not found',
            variant: 'destructive',
          })
          router.push('/technical/products')
          return
        }
        throw new Error('Failed to fetch product')
      }

      const data = await response.json()
      setProduct(data)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast({
        title: 'Error',
        description: 'Failed to load product details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch allergens
  const fetchAllergens = async () => {
    try {
      const response = await fetch(`/api/technical/products/${id}/allergens`)
      if (response.ok) {
        const data = await response.json()
        setAllergens(data.allergens || { contains: [], may_contain: [] })
      }
    } catch (error) {
      console.error('Error fetching allergens:', error)
    }
  }

  // Fetch version history
  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/technical/products/${id}/history`)
      if (response.ok) {
        const data = await response.json()
        setHistory(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  // Fetch BOMs for this product
  const fetchBOMs = async () => {
    try {
      const response = await fetch(`/api/technical/boms?product_id=${id}`)
      if (response.ok) {
        const data = await response.json()
        setBOMs(data.boms || [])
      }
    } catch (error) {
      console.error('Error fetching BOMs:', error)
    }
  }

  useEffect(() => {
    fetchProduct()
    fetchAllergens()
    fetchHistory()
    fetchBOMs()
  }, [id])

  // Compare versions
  const handleCompareVersions = async () => {
    if (selectedVersions.length !== 2) {
      toast({
        title: 'Select Two Versions',
        description: 'Please select exactly two versions to compare',
        variant: 'destructive',
      })
      return
    }

    try {
      const [v1, v2] = selectedVersions.sort((a, b) => a - b)
      const response = await fetch(`/api/technical/products/${id}/history/compare?v1=${v1}&v2=${v2}`)

      if (response.ok) {
        const data = await response.json()
        setCompareResult(data.diff || {})
      }
    } catch (error) {
      console.error('Error comparing versions:', error)
      toast({
        title: 'Error',
        description: 'Failed to compare versions',
        variant: 'destructive',
      })
    }
  }

  const toggleVersionSelection = (version: number) => {
    setSelectedVersions((prev) => {
      if (prev.includes(version)) {
        return prev.filter((v) => v !== version)
      }
      if (prev.length >= 2) {
        return [prev[1], version]
      }
      return [...prev, version]
    })
    setCompareResult(null)
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    fetchProduct()
    fetchAllergens()
    fetchHistory()
    fetchBOMs()
  }

  const handleDeleteSuccess = () => {
    router.push('/technical/products')
  }

  // Render helpers
  const getTypeBadge = (typeCode?: string) => {
    const code = typeCode || 'CUSTOM'
    const config = PRODUCT_TYPES[code] || PRODUCT_TYPES.CUSTOM
    return (
      <Badge className={`${config.color} text-white`}>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS.active
    return (
      <Badge variant={config.variant} className={config.className}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString()
  }

  const formatFieldName = (field: string) => {
    return field.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 text-gray-500">Loading product details...</div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 text-gray-500">Product not found</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Breadcrumb & Back */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/technical/products')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Products
        </Button>
      </div>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold font-mono">{product.code}</h1>
                {getTypeBadge(product.product_type?.code)}
                {getStatusBadge(product.status)}
                <Badge variant="outline">v{product.version.toFixed(1)}</Badge>
              </div>
              <p className="text-lg text-gray-700">{product.name}</p>
              {product.description && (
                <p className="text-gray-500">{product.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowEditModal(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                className="text-red-500 hover:text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="details">
            <Package className="mr-2 h-4 w-4" />
            Details
          </TabsTrigger>
          <TabsTrigger value="boms">
            <BookOpen className="mr-2 h-4 w-4" />
            BOMs ({boms.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="mr-2 h-4 w-4" />
            Version History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* BOMs Tab */}
        <TabsContent value="boms">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Bills of Materials</CardTitle>
                <Button onClick={() => router.push(`/technical/boms?create=true&product_id=${id}`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create BOM
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {boms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No BOMs created for this product yet.</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push(`/technical/boms?create=true&product_id=${id}`)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First BOM
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Effective From</TableHead>
                      <TableHead>Effective To</TableHead>
                      <TableHead>Output</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {boms.map((bom) => (
                      <TableRow key={bom.id} className="cursor-pointer hover:bg-gray-50">
                        <TableCell className="font-medium font-mono">v{bom.version}</TableCell>
                        <TableCell>
                          <Badge variant={
                            bom.status === 'Active' ? 'default' :
                            bom.status === 'Draft' ? 'secondary' :
                            'destructive'
                          }>
                            {bom.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(bom.effective_from).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {bom.effective_to ? new Date(bom.effective_to).toLocaleDateString() : '∞'}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {bom.output_qty} {bom.output_uom}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/technical/boms/${bom.id}`)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Type</p>
                    <p className="font-medium">{product.product_type?.name || PRODUCT_TYPES[product.product_type?.code || '']?.label || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Unit of Measure</p>
                    <p className="font-medium">{product.base_uom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cost per Unit</p>
                    <p className="font-medium">{product.cost_per_unit ? `$${product.cost_per_unit.toFixed(2)}` : '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Shelf Life</p>
                    <p className="font-medium">
                      {product.shelf_life_days ? `${product.shelf_life_days} days` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Inventory Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Min Stock</p>
                    <p className="font-medium">
                      {product.min_stock ? `${product.min_stock} ${product.base_uom}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Max Stock</p>
                    <p className="font-medium">
                      {product.max_stock ? `${product.max_stock} ${product.base_uom}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cost per Unit</p>
                    <p className="font-medium">
                      {product.cost_per_unit ? `$${product.cost_per_unit.toFixed(2)}` : '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allergens (Story 2.4) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Allergens
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allergens.contains.length === 0 && allergens.may_contain.length === 0 ? (
                  <p className="text-gray-500">No allergens assigned</p>
                ) : (
                  <>
                    {allergens.contains.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-red-600 mb-2">Contains:</p>
                        <div className="flex flex-wrap gap-2">
                          {allergens.contains.map((a) => (
                            <Badge key={a.id} variant="destructive">
                              {a.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {allergens.may_contain.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-orange-600 mb-2">May Contain:</p>
                        <div className="flex flex-wrap gap-2">
                          {allergens.may_contain.map((a) => (
                            <Badge key={a.id} className="bg-orange-500">
                              {a.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Created</p>
                    <p className="font-medium">{formatDate(product.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(product.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab (Story 2.3) */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Version History</CardTitle>
                <div className="flex gap-2">
                  {compareMode ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCompareMode(false)
                          setSelectedVersions([])
                          setCompareResult(null)
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleCompareVersions}
                        disabled={selectedVersions.length !== 2}
                      >
                        <GitCompare className="mr-2 h-4 w-4" />
                        Compare ({selectedVersions.length}/2)
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCompareMode(true)}
                      disabled={history.length < 2}
                    >
                      <GitCompare className="mr-2 h-4 w-4" />
                      Compare Versions
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Compare Result */}
              {compareResult && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-3">
                    Comparing v{Math.min(...selectedVersions).toFixed(1)} → v{Math.max(...selectedVersions).toFixed(1)}
                  </h4>
                  {Object.keys(compareResult).length === 0 ? (
                    <p className="text-gray-500">No differences found</p>
                  ) : (
                    <div className="space-y-2">
                      {Object.entries(compareResult).map(([field, change]) => (
                        <div key={field} className="flex items-center gap-4 text-sm">
                          <span className="font-medium w-32">{formatFieldName(field)}:</span>
                          <span className="text-red-600 line-through">
                            {String(change.old ?? '-')}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="text-green-600">{String(change.new ?? '-')}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* History Timeline */}
              {history.length === 0 ? (
                <p className="text-gray-500 py-4">No version history yet. Changes will appear here after the first edit.</p>
              ) : (
                <div className="space-y-4">
                  {/* Current version */}
                  <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={selectedVersions.includes(product.version)}
                        onChange={() => toggleVersionSelection(product.version)}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500">Current</Badge>
                        <span className="font-medium">v{product.version.toFixed(1)}</span>
                        <span className="text-gray-500 text-sm">{formatDate(product.updated_at)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Current version</p>
                    </div>
                  </div>

                  {/* History entries */}
                  {history.map((entry) => (
                    <div key={entry.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      {compareMode && (
                        <input
                          type="checkbox"
                          checked={selectedVersions.includes(entry.version)}
                          onChange={() => toggleVersionSelection(entry.version)}
                          className="mt-1"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">v{entry.version.toFixed(1)}</span>
                          <span className="text-gray-500 text-sm">{formatDate(entry.changed_at)}</span>
                          <span className="text-gray-400">•</span>
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entry.changed_by?.first_name && entry.changed_by?.last_name
                              ? `${entry.changed_by.first_name} ${entry.changed_by.last_name}`
                              : entry.changed_by?.email || 'Unknown'}
                          </span>
                        </div>

                        {/* Changed fields */}
                        <div className="mt-2 space-y-1">
                          {Object.entries(entry.changed_fields).map(([field, change]) => (
                            <div key={field} className="text-sm">
                              <span className="text-gray-500">{formatFieldName(field)}:</span>{' '}
                              <span className="text-red-500 line-through">{String(change.old ?? '-')}</span>
                              {' → '}
                              <span className="text-green-600">{String(change.new ?? '-')}</span>
                            </div>
                          ))}
                        </div>

                        {entry.change_summary && (
                          <p className="text-sm text-gray-500 mt-2">{entry.change_summary}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <ProductFormModal
        product={product}
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <ProductDeleteDialog
          product={product}
          onClose={() => setShowDeleteDialog(false)}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  )
}
