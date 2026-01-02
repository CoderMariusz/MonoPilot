/**
 * Import Wizard Step 2: Preview
 * Story: 03.6 - PO Bulk Operations
 * Preview parsed data grouped by supplier per PLAN-007
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Edit, Package, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ImportGroup, ImportRowWithValidation } from '@/lib/types/po-bulk'

interface ImportWizardStepPreviewProps {
  fileName: string
  groups: ImportGroup[]
  totalRows: number
  onEditGroup?: (groupIndex: number) => void
  onChangeFile?: () => void
  className?: string
}

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface POGroupCardProps {
  group: ImportGroup
  index: number
  onEdit?: () => void
}

function POGroupCard({ group, index, onEdit }: POGroupCardProps) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-base">
                    PO Group {index + 1}: {group.supplier_name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {group.supplier_code}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-medium">
                    {formatCurrency(group.total, group.currency)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.lines.length} items
                  </p>
                </div>
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                    className="gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit Group
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Group Info */}
            <div className="flex flex-wrap gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Expected: {formatDate(group.expected_delivery)}
                </span>
              </div>
              {group.warehouse_name && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>{group.warehouse_name}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>{group.currency}</span>
              </div>
            </div>

            {/* Lines Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.lines.map((line, lineIndex) => (
                  <TableRow key={lineIndex}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{line.product_name || line.product_code}</p>
                        <p className="text-xs text-muted-foreground">{line.product_code}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {line.quantity} {line.uom || ''}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.resolved_price || line.unit_price || 0, group.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(line.line_total || 0, group.currency)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {line.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Subtotals */}
            <div className="mt-4 pt-4 border-t flex justify-end">
              <div className="text-right space-y-1">
                <div className="flex justify-between gap-8 text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>{formatCurrency(group.subtotal, group.currency)}</span>
                </div>
                <div className="flex justify-between gap-8 text-sm">
                  <span className="text-muted-foreground">Tax ({group.tax_rate}%):</span>
                  <span>{formatCurrency(group.tax_amount, group.currency)}</span>
                </div>
                <div className="flex justify-between gap-8 font-medium">
                  <span>Total:</span>
                  <span>{formatCurrency(group.total, group.currency)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

export function ImportWizardStepPreview({
  fileName,
  groups,
  totalRows,
  onEditGroup,
  onChangeFile,
  className,
}: ImportWizardStepPreviewProps) {
  const totalLines = groups.reduce((sum, g) => sum + g.lines.length, 0)
  const totalValue = groups.reduce((sum, g) => sum + g.total, 0)

  return (
    <div className={className}>
      {/* File Info Header */}
      <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">{fileName}</span>
          <Badge variant="secondary">{totalRows} rows parsed</Badge>
        </div>
        {onChangeFile && (
          <Button variant="ghost" size="sm" onClick={onChangeFile}>
            Change File
          </Button>
        )}
      </div>

      {/* Summary Banner */}
      <Card className="mb-6 bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">Grouping by Default Supplier:</h4>
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">POs to create: </span>
              <span className="font-medium">{groups.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total lines: </span>
              <span className="font-medium">{totalLines}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total value: </span>
              <span className="font-medium">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PO Groups */}
      <div className="space-y-4" role="list" aria-label="Purchase order groups">
        {groups.map((group, index) => (
          <POGroupCard
            key={`${group.supplier_id}-${index}`}
            group={group}
            index={index}
            onEdit={onEditGroup ? () => onEditGroup(index) : undefined}
          />
        ))}
      </div>

      {/* Summary Footer */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Summary: {groups.length} POs will be created | {totalLines} line items
          </div>
          <div className="font-medium">
            Total: ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportWizardStepPreview
