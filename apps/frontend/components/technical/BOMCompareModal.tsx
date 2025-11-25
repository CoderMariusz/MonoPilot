/**
 * BOM Compare Modal Component
 * Story: 2.11 BOM Compare
 * AC-2.11.1: Select two versions to compare
 * AC-2.11.2: Show added items
 * AC-2.11.3: Show removed items
 * AC-2.11.4: Show changed quantities
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { GitCompare, Plus, Minus, RefreshCw, ArrowRight } from 'lucide-react'

interface BOMVersion {
  id: string
  version: number
  status: string
  effective_from: string
  effective_to?: string
}

interface BOMItem {
  id: string
  product_id: string
  product?: {
    id: string
    code: string
    name: string
    type: string
    uom: string
  }
  quantity: number
  uom: string
  scrap_percent: number
  sequence: number
  is_by_product: boolean
  yield_percent?: number
  condition_flags?: string[]
}

interface BOMComparison {
  added: BOMItem[]
  removed: BOMItem[]
  changed: Array<{
    item_v1: BOMItem
    item_v2: BOMItem
    changes: string[]
  }>
  unchanged: BOMItem[]
}

interface BOMCompareModalProps {
  productId: string
  currentBomId: string
  onClose: () => void
}

export function BOMCompareModal({ productId, currentBomId, onClose }: BOMCompareModalProps) {
  const { toast } = useToast()

  const [versions, setVersions] = useState<BOMVersion[]>([])
  const [loadingVersions, setLoadingVersions] = useState(true)

  const [selectedV1, setSelectedV1] = useState<string>('')
  const [selectedV2, setSelectedV2] = useState<string>(currentBomId)

  const [comparison, setComparison] = useState<BOMComparison | null>(null)
  const [comparing, setComparing] = useState(false)

  const [v1Info, setV1Info] = useState<{ version: number; items_count: number } | null>(null)
  const [v2Info, setV2Info] = useState<{ version: number; items_count: number } | null>(null)

  // Fetch all versions for this product
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoadingVersions(true)
        const response = await fetch(`/api/technical/boms/timeline?product_id=${productId}`)

        if (response.ok) {
          const data = await response.json()
          const bomVersions = data.timeline?.boms || data.boms || []
          setVersions(bomVersions)

          // Pre-select versions if there are at least 2
          if (bomVersions.length >= 2) {
            const currentIndex = bomVersions.findIndex((b: BOMVersion) => b.id === currentBomId)
            if (currentIndex > 0) {
              setSelectedV1(bomVersions[currentIndex - 1].id)
            } else if (bomVersions.length > 1) {
              setSelectedV1(bomVersions[0].id !== currentBomId ? bomVersions[0].id : bomVersions[1].id)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching versions:', error)
        toast({
          title: 'Error',
          description: 'Failed to load BOM versions',
          variant: 'destructive',
        })
      } finally {
        setLoadingVersions(false)
      }
    }

    fetchVersions()
  }, [productId, currentBomId])

  // Compare two versions
  const handleCompare = async () => {
    if (!selectedV1 || !selectedV2) {
      toast({
        title: 'Select Versions',
        description: 'Please select two versions to compare',
        variant: 'destructive',
      })
      return
    }

    if (selectedV1 === selectedV2) {
      toast({
        title: 'Same Version',
        description: 'Please select two different versions to compare',
        variant: 'destructive',
      })
      return
    }

    setComparing(true)
    setComparison(null)

    try {
      const response = await fetch(`/api/technical/boms/compare?v1=${selectedV1}&v2=${selectedV2}`)

      if (!response.ok) {
        throw new Error('Failed to compare BOMs')
      }

      const data = await response.json()
      setComparison(data.comparison)
      setV1Info(data.v1)
      setV2Info(data.v2)
    } catch (error) {
      console.error('Error comparing BOMs:', error)
      toast({
        title: 'Error',
        description: 'Failed to compare BOM versions',
        variant: 'destructive',
      })
    } finally {
      setComparing(false)
    }
  }

  // Format version display
  const formatVersion = (bom: BOMVersion) => {
    return `v${bom.version} (${bom.status})`
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitCompare className="h-5 w-5" />
            Compare BOM Versions
          </DialogTitle>
          <DialogDescription>
            Select two versions to see what changed between them
          </DialogDescription>
        </DialogHeader>

        {/* Version Selection */}
        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Version 1 (Base)</label>
            <Select value={selectedV1} onValueChange={setSelectedV1} disabled={loadingVersions}>
              <SelectTrigger>
                <SelectValue placeholder="Select base version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((bom) => (
                  <SelectItem key={bom.id} value={bom.id} disabled={bom.id === selectedV2}>
                    {formatVersion(bom)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Version 2 (Compare)</label>
            <Select value={selectedV2} onValueChange={setSelectedV2} disabled={loadingVersions}>
              <SelectTrigger>
                <SelectValue placeholder="Select compare version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((bom) => (
                  <SelectItem key={bom.id} value={bom.id} disabled={bom.id === selectedV1}>
                    {formatVersion(bom)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleCompare} disabled={comparing || !selectedV1 || !selectedV2}>
          {comparing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <GitCompare className="mr-2 h-4 w-4" />
              Compare Versions
            </>
          )}
        </Button>

        {/* Comparison Results */}
        {comparison && v1Info && v2Info && (
          <div className="space-y-6 mt-4">
            {/* Summary */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-gray-500">Version {v1Info.version}</p>
                <p className="font-medium">{v1Info.items_count} items</p>
              </div>
              <ArrowRight className="h-6 w-6 text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-500">Version {v2Info.version}</p>
                <p className="font-medium">{v2Info.items_count} items</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{comparison.added.length}</p>
                <p className="text-sm text-green-700">Added</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{comparison.removed.length}</p>
                <p className="text-sm text-red-700">Removed</p>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{comparison.changed.length}</p>
                <p className="text-sm text-yellow-700">Changed</p>
              </div>
              <div className="text-center p-3 bg-gray-100 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{comparison.unchanged.length}</p>
                <p className="text-sm text-gray-700">Unchanged</p>
              </div>
            </div>

            {/* Added Items */}
            {comparison.added.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-medium text-green-700 mb-2">
                  <Plus className="h-4 w-4" />
                  Added Items
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparison.added.map((item) => (
                      <TableRow key={item.id} className="bg-green-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.product?.code || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{item.product?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.uom}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.is_by_product ? 'By-Product' : 'Input'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Removed Items */}
            {comparison.removed.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-medium text-red-700 mb-2">
                  <Minus className="h-4 w-4" />
                  Removed Items
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparison.removed.map((item) => (
                      <TableRow key={item.id} className="bg-red-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.product?.code || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{item.product?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.quantity} {item.uom}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {item.is_by_product ? 'By-Product' : 'Input'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Changed Items */}
            {comparison.changed.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 font-medium text-yellow-700 mb-2">
                  <RefreshCw className="h-4 w-4" />
                  Changed Items
                </h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparison.changed.map(({ item_v1, item_v2, changes }) => (
                      <TableRow key={item_v2.id} className="bg-yellow-50">
                        <TableCell>
                          <div>
                            <p className="font-medium">{item_v2.product?.code || 'Unknown'}</p>
                            <p className="text-sm text-gray-500">{item_v2.product?.name}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <ul className="text-sm space-y-1">
                            {changes.map((change, idx) => (
                              <li key={idx} className="text-yellow-800">
                                {change}
                              </li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* No Changes */}
            {comparison.added.length === 0 &&
              comparison.removed.length === 0 &&
              comparison.changed.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No differences found between these versions.
                </div>
              )}
          </div>
        )}

        {/* No versions available */}
        {!loadingVersions && versions.length < 2 && (
          <div className="text-center py-8 text-gray-500">
            At least two versions are needed to compare. This product only has{' '}
            {versions.length} version(s).
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
