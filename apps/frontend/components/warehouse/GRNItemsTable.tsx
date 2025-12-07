/**
 * GRN Items Table Component
 * Epic 5 Batch 5A-3 - Story 5.11: GRN with LP Creation
 * AC-5.11.4: Display GRN items with receive action
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ReceiveItemModal } from './ReceiveItemModal'

interface GRNItem {
  id: string
  expected_qty: number
  received_qty: number
  uom: string
  products: {
    id: string
    code: string
    name: string
  }
  asn_items: {
    supplier_batch_number: string | null
    manufacture_date: string | null
    expiry_date: string | null
  } | null
  license_plates: {
    id: string
    lp_number: string
    current_qty: number
    status: string
  } | null
}

interface GRNItemsTableProps {
  grnId: string
  onItemReceived?: () => void
}

export function GRNItemsTable({ grnId, onItemReceived }: GRNItemsTableProps) {
  const [items, setItems] = useState<GRNItem[]>([])
  const [loading, setLoading] = useState(true)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<GRNItem | null>(null)
  const { toast } = useToast()

  const fetchItems = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/warehouse/grns/${grnId}`)

      if (!response.ok) {
        throw new Error('Failed to fetch GRN items')
      }

      const data = await response.json()
      setItems(data.grn.grn_items || [])
    } catch (error) {
      console.error('Error fetching GRN items:', error)
      toast({
        title: 'Error',
        description: 'Failed to load GRN items',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [grnId])

  const handleReceiveClick = (item: GRNItem) => {
    setSelectedItem(item)
    setReceiveModalOpen(true)
  }

  const handleReceiveSuccess = () => {
    setReceiveModalOpen(false)
    setSelectedItem(null)
    fetchItems()
    if (onItemReceived) {
      onItemReceived()
    }
  }

  const getStatus = (item: GRNItem) => {
    if (item.received_qty === 0) return 'pending'
    if (item.received_qty < item.expected_qty) return 'partial'
    return 'complete'
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800 border-gray-300',
      partial: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      complete: 'bg-green-100 text-green-800 border-green-300',
    }

    const labels = {
      pending: 'Pending',
      partial: 'Partial',
      complete: 'Complete',
    }

    return (
      <Badge variant="outline" className={colors[status as keyof typeof colors]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading items...
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No items found in this GRN
      </div>
    )
  }

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Expected Qty</TableHead>
              <TableHead className="text-right">Received Qty</TableHead>
              <TableHead>UoM</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>LP Number</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const status = getStatus(item)
              const progress = item.expected_qty > 0
                ? (item.received_qty / item.expected_qty) * 100
                : 0

              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{item.products.name}</div>
                      <div className="text-muted-foreground">{item.products.code}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.expected_qty.toFixed(3)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.received_qty.toFixed(3)}
                  </TableCell>
                  <TableCell>{item.uom}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="w-24" />
                      <span className="text-xs text-muted-foreground w-12">
                        {progress.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.license_plates ? (
                      <button
                        onClick={() => {
                          // TODO: Navigate to LP detail page when available
                          toast({
                            title: 'License Plate',
                            description: `LP: ${item.license_plates?.lp_number}`,
                          })
                        }}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {item.license_plates.lp_number}
                      </button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(status)}</TableCell>
                  <TableCell className="text-right">
                    {status !== 'complete' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReceiveClick(item)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Receive
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Receive Item Modal */}
      {selectedItem && (
        <ReceiveItemModal
          open={receiveModalOpen}
          onClose={() => {
            setReceiveModalOpen(false)
            setSelectedItem(null)
          }}
          onSuccess={handleReceiveSuccess}
          grnId={grnId}
          grnItemId={selectedItem.id}
          productCode={selectedItem.products.code}
          productName={selectedItem.products.name}
          expectedQty={selectedItem.expected_qty}
          uom={selectedItem.uom}
          asnItemData={selectedItem.asn_items}
        />
      )}
    </>
  )
}
