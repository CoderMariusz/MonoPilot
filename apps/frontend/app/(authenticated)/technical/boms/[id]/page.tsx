/**
 * BOM Detail Page
 * Story: 2.6 BOM CRUD - AC-2.6.5: Detail View
 * Story: 2.7 BOM Items Management - AC-2.7.5: Items Management UI
 * Story: 2.14 BOM Advanced Features - Comparison, Explosion, Yield, Scale
 * Story: 2.14 Allergen Inheritance - AC-2.14.5: Allergen Display
 */

'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Copy,
  GitCompare,
  Clock,
  AlertTriangle,
  Package,
  Plus,
  RefreshCw,
  DollarSign,
  Scale,
  Layers,
  TrendingUp,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { BOMFormModal } from '@/components/technical/BOMFormModal'
import { BOMCloneModal } from '@/components/technical/BOMCloneModal'
import { BOMCompareModal } from '@/components/technical/BOMCompareModal'
import { BOMItemFormModal } from '@/components/technical/BOMItemFormModal'
import { CostSummary } from '@/components/technical/bom/cost'
// Story 02.14 - BOM Advanced Features
import { BOMComparisonModal } from '@/components/technical/bom/BOMComparisonModal'
import { BOMScaleModal } from '@/components/technical/bom/BOMScaleModal'
import { MultiLevelExplosion } from '@/components/technical/bom/MultiLevelExplosion'
import { YieldAnalysisPanel } from '@/components/technical/bom/YieldAnalysisPanel'
import type { BOMWithProduct, BOMItem, BOMAllergens } from '@/lib/validation/bom-schemas'

// Status config
const STATUS_COLORS: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  'Draft': { variant: 'secondary', className: 'bg-gray-400' },
  'Active': { variant: 'default', className: 'bg-green-500' },
  'Phased Out': { variant: 'secondary', className: 'bg-yellow-500 text-white' },
  'Inactive': { variant: 'outline', className: '' },
}

export default function BOMDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()

  const [bom, setBOM] = useState<BOMWithProduct | null>(null)
  const [items, setItems] = useState<BOMItem[]>([])
  const [allergens, setAllergens] = useState<BOMAllergens>({ contains: [], may_contain: [] })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('items')

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [showCompareModal, setShowCompareModal] = useState(false)
  const [showAdvancedCompareModal, setShowAdvancedCompareModal] = useState(false)
  const [showScaleModal, setShowScaleModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editingItem, setEditingItem] = useState<BOMItem | null>(null)
  const [deletingItem, setDeletingItem] = useState<BOMItem | null>(null)

  const { toast } = useToast()

  // Fetch BOM details
  const fetchBOM = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/technical/boms/${id}?include_items=true`)

      if (!response.ok) {
        if (response.status === 404) {
          toast({ title: 'Not Found', description: 'BOM not found', variant: 'destructive' })
          router.push('/technical/boms')
          return
        }
        throw new Error('Failed to fetch BOM')
      }

      const data = await response.json()
      setBOM(data.bom || data)
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load BOM details', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  // Fetch items
  const fetchItems = async () => {
    try {
      const response = await fetch(`/api/technical/boms/${id}/items`)
      if (response.ok) {
        const result = await response.json()
        // API returns { data: items[] }
        setItems(result.data || [])
      }
    } catch (error) {
      // Silent fail - items section will show empty state
    }
  }

  // Fetch allergens
  const fetchAllergens = async () => {
    try {
      const response = await fetch(`/api/technical/boms/${id}/allergens`)
      if (response.ok) {
        const data = await response.json()
        setAllergens(data.allergens || { contains: [], may_contain: [] })
      }
    } catch (error) {
      // Silent fail - allergens section will show empty state
    }
  }

  useEffect(() => {
    fetchBOM()
    fetchItems()
    fetchAllergens()
  }, [id])

  // Delete BOM
  const handleDeleteBOM = async () => {
    try {
      const response = await fetch(`/api/technical/boms/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete BOM')

      toast({ title: 'Success', description: 'BOM deleted successfully' })
      router.push('/technical/boms')
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete BOM', variant: 'destructive' })
    }
  }

  // Delete item
  const handleDeleteItem = async () => {
    if (!deletingItem) return

    try {
      const response = await fetch(`/api/technical/boms/${id}/items/${deletingItem.id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete item')

      toast({ title: 'Success', description: 'Item removed from BOM' })
      setDeletingItem(null)
      fetchItems()
      fetchAllergens()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' })
    }
  }

  const handleEditSuccess = () => {
    setShowEditModal(false)
    fetchBOM()
  }

  const handleCloneSuccess = () => {
    setShowCloneModal(false)
    toast({ title: 'Success', description: 'BOM cloned successfully' })
  }

  const handleItemSuccess = () => {
    setShowItemModal(false)
    setEditingItem(null)
    fetchItems()
    fetchAllergens()
  }

  // Helpers
  const formatDate = (date?: string | Date | null) => {
    if (!date) return 'No end date'
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_COLORS[status] || STATUS_COLORS['Draft']
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 text-gray-500">Loading BOM details...</div>
      </div>
    )
  }

  if (!bom) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12 text-gray-500">BOM not found</div>
      </div>
    )
  }

  // Separate inputs from by-products
  const inputItems = items.filter((i) => !i.is_output)
  const byProductItems = items.filter((i) => i.is_output)

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/technical/boms')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to BOMs
        </Button>
      </div>

      {/* Header Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {bom.product.code} - v{bom.version}
                </h1>
                {getStatusBadge(bom.status)}
              </div>
              <p className="text-lg text-gray-700">{bom.product.name}</p>
              <div className="flex gap-6 text-sm text-gray-500">
                <span>
                  <strong>Effective:</strong> {formatDate(bom.effective_from)} → {formatDate(bom.effective_to)}
                </span>
                <span>
                  <strong>Output:</strong> {bom.output_qty} {bom.output_uom}
                </span>
              </div>
              {bom.notes && <p className="text-sm text-gray-500 mt-2">{bom.notes}</p>}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setShowScaleModal(true)}>
                <Scale className="mr-2 h-4 w-4" />
                Scale
              </Button>
              <Button variant="outline" onClick={() => setShowCloneModal(true)}>
                <Copy className="mr-2 h-4 w-4" />
                Clone
              </Button>
              <Button variant="outline" onClick={() => setShowAdvancedCompareModal(true)}>
                <GitCompare className="mr-2 h-4 w-4" />
                Compare
              </Button>
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
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="items">
            <Package className="mr-2 h-4 w-4" />
            Items ({items.length})
          </TabsTrigger>
          <TabsTrigger value="explosion">
            <Layers className="mr-2 h-4 w-4" />
            Explosion
          </TabsTrigger>
          <TabsTrigger value="costing">
            <DollarSign className="mr-2 h-4 w-4" />
            Costing
          </TabsTrigger>
          <TabsTrigger value="yield">
            <TrendingUp className="mr-2 h-4 w-4" />
            Yield
          </TabsTrigger>
          <TabsTrigger value="allergens">
            <AlertTriangle className="mr-2 h-4 w-4" />
            Allergens
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="mr-2 h-4 w-4" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>BOM Items</CardTitle>
                <Button onClick={() => setShowItemModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Input Items */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase">Input Materials</h4>
                {inputItems.length === 0 ? (
                  <p className="text-gray-500 py-4">No input items added yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Component</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Scrap %</TableHead>
                        <TableHead>Op. Seq</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inputItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-gray-500">{item.sequence}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.component?.code || '-'}</p>
                              <p className="text-sm text-gray-500">{item.component?.name || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.quantity} {item.uom}
                          </TableCell>
                          <TableCell>{item.scrap_percent}%</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.operation_seq}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingItem(item)
                                  setShowItemModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingItem(item)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* By-Products */}
              {byProductItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 mb-3 uppercase">By-Products (Outputs)</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>By-Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Op. Seq</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {byProductItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-gray-500">{item.sequence}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.component?.code || '-'}</p>
                              <p className="text-sm text-gray-500">{item.component?.name || '-'}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.quantity} {item.uom}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.operation_seq}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingItem(item)
                                  setShowItemModal(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingItem(item)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Explosion Tab (Story 02.14) */}
        <TabsContent value="explosion">
          <MultiLevelExplosion bomId={id} />
        </TabsContent>

        {/* Costing Tab (Story 02.9) */}
        <TabsContent value="costing">
          <CostSummary bomId={id} />
        </TabsContent>

        {/* Yield Tab (Story 02.14) */}
        <TabsContent value="yield">
          <YieldAnalysisPanel bomId={id} />
        </TabsContent>

        {/* Allergens Tab (Story 2.14) */}
        <TabsContent value="allergens">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Inherited Allergens
                </CardTitle>
                <Button variant="outline" size="sm" onClick={fetchAllergens}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Recalculate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {allergens.contains.length === 0 && allergens.may_contain.length === 0 ? (
                <p className="text-gray-500">No allergens detected from component products.</p>
              ) : (
                <div className="space-y-4">
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
                </div>
              )}
              <p className="text-xs text-gray-400 mt-4">
                Allergens are inherited from input items. By-products are excluded from this calculation.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab (Story 2.9) */}
        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Version Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <BOMTimelineView productId={bom.product_id} currentBomId={id} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showEditModal && (
        <BOMFormModal bom={bom} onClose={() => setShowEditModal(false)} onSuccess={handleEditSuccess} />
      )}

      {showCloneModal && (
        <BOMCloneModal bomId={id} version={bom.version} onClose={() => setShowCloneModal(false)} onSuccess={handleCloneSuccess} />
      )}

      {showCompareModal && (
        <BOMCompareModal productId={bom.product_id} currentBomId={id} onClose={() => setShowCompareModal(false)} />
      )}

      {showAdvancedCompareModal && (
        <BOMComparisonModal
          bomId1={id}
          bomId2=""
          productId={bom.product_id}
          isOpen={showAdvancedCompareModal}
          onClose={() => setShowAdvancedCompareModal(false)}
        />
      )}

      {showScaleModal && (
        <BOMScaleModal
          bomId={id}
          currentBatchSize={bom.output_qty}
          currentUom={bom.output_uom}
          isOpen={showScaleModal}
          onClose={() => setShowScaleModal(false)}
          onApply={(result) => {
            setShowScaleModal(false)
            if (result.applied) {
              fetchBOM()
              fetchItems()
            }
          }}
        />
      )}

      {showItemModal && (
        <BOMItemFormModal
          bomId={id}
          item={editingItem}
          onClose={() => {
            setShowItemModal(false)
            setEditingItem(null)
          }}
          onSuccess={handleItemSuccess}
        />
      )}

      {/* Delete BOM Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete BOM?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete BOM v{bom.version} for {bom.product.code}?
              This will also delete all {items.length} items. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBOM} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Item Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deletingItem?.component?.code || 'this item'} from this BOM?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-500 hover:bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Timeline View Component (Story 2.9)
function BOMTimelineView({ productId, currentBomId }: { productId: string; currentBomId: string }) {
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/technical/boms/timeline?product_id=${productId}`)
        if (response.ok) {
          const data = await response.json()
          setTimeline(data.boms || [])
        }
      } catch (error) {
        // Silent fail - timeline will show empty state
      } finally {
        setLoading(false)
      }
    }
    fetchTimeline()
  }, [productId])

  if (loading) return <p className="text-gray-500">Loading timeline...</p>
  if (timeline.length === 0) return <p className="text-gray-500">No version history.</p>

  const getBarColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      draft: 'bg-gray-400',
      phased_out: 'bg-yellow-500',
      inactive: 'bg-red-400',
    }
    return colors[status] || 'bg-gray-400'
  }

  return (
    <div className="space-y-3">
      {timeline.map((bom) => (
        <div
          key={bom.id}
          className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
            bom.id === currentBomId ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={() => bom.id !== currentBomId && router.push(`/technical/boms/${bom.id}`)}
        >
          <div className={`w-3 h-3 rounded-full ${getBarColor(bom.status)}`} />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-medium">v{bom.version}</span>
              <Badge variant="outline" className="text-xs">
                {bom.status}
              </Badge>
              {bom.id === currentBomId && (
                <Badge className="text-xs bg-blue-500">Current</Badge>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {new Date(bom.effective_from).toLocaleDateString()} →{' '}
              {bom.effective_to ? new Date(bom.effective_to).toLocaleDateString() : 'No end'}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
