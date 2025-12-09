/**
 * TO List For Receiving - Story 5.33
 * List of Transfer Orders ready to be received
 */

'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronRight, Package } from 'lucide-react'
import type { SourceDocument, SourceDocumentLine } from '@/lib/types/receiving'

interface TOListForReceivingProps {
  documents: SourceDocument[]
  onReceive: (to: SourceDocument) => void
}

export function TOListForReceiving({ documents, onReceive }: TOListForReceivingProps) {
  const [expandedTOs, setExpandedTOs] = useState<Set<string>>(new Set())

  const toggleExpand = (toId: string) => {
    const newExpanded = new Set(expandedTOs)
    if (newExpanded.has(toId)) {
      newExpanded.delete(toId)
    } else {
      newExpanded.add(toId)
    }
    setExpandedTOs(newExpanded)
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-lg font-medium">No Transfer Orders ready for receiving</p>
        <p className="text-sm">Transfer Orders in &quot;Shipped&quot; status will appear here</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead>TO Number</TableHead>
            <TableHead>From Location</TableHead>
            <TableHead>To Location</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((to) => {
            const isExpanded = expandedTOs.has(to.id)
            const totalItems = to.lines.length
            const totalQty = to.lines.reduce((sum, line) => sum + line.expected_qty, 0)

            return (
              <>
                <TableRow key={to.id}>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(to.id)}
                      className="h-6 w-6 p-0"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{to.doc_number}</TableCell>
                  <TableCell>
                    {to.from_warehouse_name}
                  </TableCell>
                  <TableCell>
                    {to.warehouse_name}
                  </TableCell>
                  <TableCell>
                    {totalItems} {totalItems === 1 ? 'item' : 'items'} ({totalQty} total)
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{to.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" onClick={() => onReceive(to)}>
                      Receive
                    </Button>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={7} className="bg-muted/50 p-0">
                      <div className="p-4">
                        <h4 className="font-medium mb-3">Line Items:</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product Code</TableHead>
                              <TableHead>Product Name</TableHead>
                              <TableHead className="text-right">Quantity</TableHead>
                              <TableHead>UOM</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {to.lines.map((line: SourceDocumentLine) => (
                              <TableRow key={line.id}>
                                <TableCell>{line.product_code}</TableCell>
                                <TableCell>{line.product_name}</TableCell>
                                <TableCell className="text-right">{line.expected_qty}</TableCell>
                                <TableCell>{line.uom}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {line.received_qty > 0 ? 'Partially Received' : 'Pending'}
                                  </Badge>
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
          })}
        </TableBody>
      </Table>
    </div>
  )
}
