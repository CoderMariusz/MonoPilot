/**
 * PO List for Receiving Component
 * Story 5.32: Receive from PO (Desktop)
 *
 * Lists Purchase Orders ready for receiving with expandable line items
 */

'use client'

import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, ChevronUp, Package } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ReceiveFromPOModal } from './ReceiveFromPOModal'
import type { SourceDocument, SourceDocumentLine } from '@/lib/types/receiving'

export function POListForReceiving() {
  const [documents, setDocuments] = useState<SourceDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedPO, setExpandedPO] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [selectedLine, setSelectedLine] = useState<{
    po: SourceDocument
    line: SourceDocumentLine
  } | null>(null)

  const { toast } = useToast()

  // Fetch POs for receiving
  const fetchPOs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)

      const response = await fetch(`/api/warehouse/source-documents/po?${params.toString()}`)

      if (!response.ok) {
        throw new Error('Failed to fetch purchase orders')
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (error) {
      console.error('Error fetching POs:', error)
      toast({
        title: 'Error',
        description: 'Failed to load purchase orders',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPOs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  // Toggle PO expansion
  const toggleExpand = (poId: string) => {
    setExpandedPO(expandedPO === poId ? null : poId)
  }

  // Open receive modal for a line
  const openReceiveModal = (po: SourceDocument, line: SourceDocumentLine) => {
    setSelectedLine({ po, line })
    setReceiveModalOpen(true)
  }

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'partiallyreceived':
      case 'partially_received':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex justify-between items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="partiallyreceived">Partially Received</SelectItem>
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground">
          {documents.length} PO{documents.length !== 1 ? 's' : ''} ready for receiving
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Expected Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Package className="h-12 w-12" />
                    <p>No purchase orders ready for receiving</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              documents.map((po) => {
                const isExpanded = expandedPO === po.id
                const totalItems = po.lines.length
                const totalOrdered = po.lines.reduce((sum, l) => sum + l.expected_qty, 0)
                const totalReceived = po.lines.reduce((sum, l) => sum + l.received_qty, 0)
                const totalRemaining = po.lines.reduce((sum, l) => sum + l.remaining_qty, 0)

                return (
                  <>
                    {/* PO Row */}
                    <TableRow
                      key={po.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleExpand(po.id)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{po.doc_number}</TableCell>
                      <TableCell>{po.supplier_name || 'N/A'}</TableCell>
                      <TableCell>{po.warehouse_name}</TableCell>
                      <TableCell>{formatDate(po.expected_date)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(po.status)}>{po.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-sm">
                          <div>{totalItems} item{totalItems !== 1 ? 's' : ''}</div>
                          <div className="text-muted-foreground text-xs">
                            {totalReceived}/{totalOrdered} received
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Lines */}
                    {isExpanded && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-gray-50 p-0">
                          <div className="p-4">
                            <h4 className="font-semibold mb-3">Line Items</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Product</TableHead>
                                  <TableHead className="text-right">Ordered</TableHead>
                                  <TableHead className="text-right">Received</TableHead>
                                  <TableHead className="text-right">Remaining</TableHead>
                                  <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {po.lines.map((line) => (
                                  <TableRow key={line.id}>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{line.product_name}</div>
                                        <div className="text-sm text-muted-foreground">
                                          {line.product_code}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {line.expected_qty} {line.uom}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {line.received_qty} {line.uom}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <span className="font-medium">
                                        {line.remaining_qty} {line.uom}
                                      </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {line.remaining_qty > 0 ? (
                                        <Button
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            openReceiveModal(po, line)
                                          }}
                                        >
                                          Receive
                                        </Button>
                                      ) : (
                                        <span className="text-sm text-muted-foreground">
                                          Fully received
                                        </span>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Receive Modal */}
      {receiveModalOpen && selectedLine && (
        <ReceiveFromPOModal
          open={receiveModalOpen}
          onClose={() => {
            setReceiveModalOpen(false)
            setSelectedLine(null)
          }}
          onSuccess={() => {
            setReceiveModalOpen(false)
            setSelectedLine(null)
            fetchPOs()
          }}
          po={selectedLine.po}
          line={selectedLine.line}
        />
      )}
    </div>
  )
}
