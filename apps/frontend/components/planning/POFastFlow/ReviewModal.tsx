/**
 * Review Modal Component (Fast Flow)
 * Story 3.1: Purchase Order Creation - Fast Flow
 * AC-1.1: Review modal for supplier assignment and multi-PO creation
 */

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Package, Loader2 } from 'lucide-react'
import type { POLineInput } from './ProductLineForm'

interface Supplier {
  id: string
  code: string
  name: string
  currency: string
  tax_code_id: string
}

interface TaxCode {
  id: string
  code: string
  rate: number
}

interface Warehouse {
  id: string
  code: string
  name: string
}

export interface POAssignmentLine extends POLineInput {
  lineIndex: number
  discount_percent: number
  tax_rate: number
  line_subtotal: number
  discount_amount: number
  line_total: number
  tax_amount: number
  line_total_with_tax: number
}

export interface POAssignmentBySupplier {
  supplier_id: string
  supplier_code: string
  supplier_name: string
  currency: string
  lines: POAssignmentLine[]
  po_number?: string
  action: 'create' | 'update'
  subtotal: number
  discount_total: number
  tax_total: number
  grand_total: number
}

interface ReviewModalProps {
  open: boolean
  onClose: () => void
  lines: POLineInput[]
  onBack: () => void
  onSuccess: () => void
  warehouseId?: string
}

export function ReviewModal({
  open,
  onClose,
  lines,
  onBack,
  onSuccess,
  warehouseId
}: ReviewModalProps) {
  const [assignments, setAssignments] = useState<POAssignmentBySupplier[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>(warehouseId || '')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // Fetch suppliers, tax codes, and warehouses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        const [suppliersRes, taxCodesRes, warehousesRes] = await Promise.all([
          fetch('/api/planning/suppliers?is_active=true'),
          fetch('/api/settings/tax-codes'),
          fetch('/api/v1/settings/warehouses?status=active&limit=100'),
        ])

        if (!suppliersRes.ok || !taxCodesRes.ok || !warehousesRes.ok) {
          throw new Error('Failed to fetch reference data')
        }

        const [suppliersData, taxCodesData, warehousesData] = await Promise.all([
          suppliersRes.json(),
          taxCodesRes.json(),
          warehousesRes.json(),
        ])

        setSuppliers(suppliersData.suppliers || [])
        setTaxCodes(taxCodesData.taxCodes || [])
        setWarehouses(warehousesData.data || [])

        // Set default warehouse if not already set
        if (!selectedWarehouse && warehousesData.data?.length > 0) {
          setSelectedWarehouse(warehousesData.data[0].id)
        }
      } catch (error) {
        console.error('Error fetching reference data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load reference data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (open) {
      fetchData()
    }
  }, [open])

  // Build assignments when lines or suppliers change
  const buildAssignments = useCallback(() => {
    if (suppliers.length === 0 || lines.length === 0) {
      setAssignments([])
      return
    }

    // Group lines by supplier
    const supplierMap = new Map<string, POAssignmentLine[]>()
    const noSupplierLines: POAssignmentLine[] = []

    lines.forEach((line, index) => {
      // Get tax rate for the supplier
      const supplier = suppliers.find(s => s.id === line.supplier_id)
      const taxCode = taxCodes.find(t => t.id === supplier?.tax_code_id)
      const taxRate = taxCode?.rate ?? 0

      // Calculate line totals
      const unitPrice = line.unit_price ?? 0
      const quantity = line.quantity
      const discountPercent = 0 // Default, can be edited

      const lineSubtotal = quantity * unitPrice
      const discountAmount = lineSubtotal * (discountPercent / 100)
      const lineTotal = lineSubtotal - discountAmount
      const taxAmount = lineTotal * (taxRate / 100)
      const lineTotalWithTax = lineTotal + taxAmount

      const assignmentLine: POAssignmentLine = {
        ...line,
        lineIndex: index,
        discount_percent: discountPercent,
        tax_rate: taxRate,
        line_subtotal: lineSubtotal,
        discount_amount: discountAmount,
        line_total: lineTotal,
        tax_amount: taxAmount,
        line_total_with_tax: lineTotalWithTax,
      }

      if (line.supplier_id) {
        const existing = supplierMap.get(line.supplier_id) || []
        existing.push(assignmentLine)
        supplierMap.set(line.supplier_id, existing)
      } else {
        noSupplierLines.push(assignmentLine)
      }
    })

    // Build assignment objects
    const newAssignments: POAssignmentBySupplier[] = []

    supplierMap.forEach((supplierLines, supplierId) => {
      const supplier = suppliers.find(s => s.id === supplierId)
      if (!supplier) return

      const subtotal = supplierLines.reduce((sum, l) => sum + l.line_subtotal, 0)
      const discountTotal = supplierLines.reduce((sum, l) => sum + l.discount_amount, 0)
      const taxTotal = supplierLines.reduce((sum, l) => sum + l.tax_amount, 0)
      const grandTotal = supplierLines.reduce((sum, l) => sum + l.line_total_with_tax, 0)

      newAssignments.push({
        supplier_id: supplier.id,
        supplier_code: supplier.code,
        supplier_name: supplier.name,
        currency: supplier.currency,
        lines: supplierLines,
        action: 'create',
        subtotal,
        discount_total: discountTotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
      })
    })

    // Handle lines without supplier (assign to first supplier or show error)
    if (noSupplierLines.length > 0) {
      // Create a special "unassigned" group
      newAssignments.push({
        supplier_id: '',
        supplier_code: 'UNASSIGNED',
        supplier_name: 'Products without supplier',
        currency: 'PLN',
        lines: noSupplierLines,
        action: 'create',
        subtotal: noSupplierLines.reduce((sum, l) => sum + l.line_subtotal, 0),
        discount_total: noSupplierLines.reduce((sum, l) => sum + l.discount_amount, 0),
        tax_total: noSupplierLines.reduce((sum, l) => sum + l.tax_amount, 0),
        grand_total: noSupplierLines.reduce((sum, l) => sum + l.line_total_with_tax, 0),
      })
    }

    setAssignments(newAssignments)
  }, [lines, suppliers, taxCodes])

  useEffect(() => {
    if (!loading) {
      buildAssignments()
    }
  }, [loading, buildAssignments])

  // Handle supplier change for a line
  const handleSupplierChange = (lineIndex: number, newSupplierId: string) => {
    // Find the line and update its supplier
    const updatedAssignments = [...assignments]
    let lineToMove: POAssignmentLine | null = null
    let sourceAssignmentIndex = -1

    // Find and remove line from current assignment
    for (let i = 0; i < updatedAssignments.length; i++) {
      const lineIdx = updatedAssignments[i].lines.findIndex(l => l.lineIndex === lineIndex)
      if (lineIdx !== -1) {
        lineToMove = { ...updatedAssignments[i].lines[lineIdx] }
        updatedAssignments[i].lines.splice(lineIdx, 1)
        sourceAssignmentIndex = i
        break
      }
    }

    if (!lineToMove) return

    // Update line's supplier info
    const newSupplier = suppliers.find(s => s.id === newSupplierId)
    if (newSupplier) {
      const taxCode = taxCodes.find(t => t.id === newSupplier.tax_code_id)
      const taxRate = taxCode?.rate ?? 0

      // Recalculate with new tax rate
      const lineTotal = lineToMove.line_subtotal - lineToMove.discount_amount
      const taxAmount = lineTotal * (taxRate / 100)

      lineToMove = {
        ...lineToMove,
        supplier_id: newSupplier.id,
        supplier_code: newSupplier.code,
        supplier_name: newSupplier.name,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        line_total_with_tax: lineTotal + taxAmount,
      }
    }

    // Find or create target assignment
    let targetAssignment = updatedAssignments.find(a => a.supplier_id === newSupplierId)

    if (!targetAssignment) {
      // Create new assignment for this supplier
      const supplier = suppliers.find(s => s.id === newSupplierId)!
      targetAssignment = {
        supplier_id: supplier.id,
        supplier_code: supplier.code,
        supplier_name: supplier.name,
        currency: supplier.currency,
        lines: [],
        action: 'create',
        subtotal: 0,
        discount_total: 0,
        tax_total: 0,
        grand_total: 0,
      }
      updatedAssignments.push(targetAssignment)
    }

    // Add line to target assignment
    targetAssignment.lines.push(lineToMove)

    // Recalculate target totals
    targetAssignment.subtotal = targetAssignment.lines.reduce((sum, l) => sum + l.line_subtotal, 0)
    targetAssignment.discount_total = targetAssignment.lines.reduce((sum, l) => sum + l.discount_amount, 0)
    targetAssignment.tax_total = targetAssignment.lines.reduce((sum, l) => sum + l.tax_amount, 0)
    targetAssignment.grand_total = targetAssignment.lines.reduce((sum, l) => sum + l.line_total_with_tax, 0)

    // Remove empty assignments and recalculate source totals
    const filteredAssignments = updatedAssignments.filter(a => {
      if (a.lines.length === 0) return false
      // Recalculate totals
      a.subtotal = a.lines.reduce((sum, l) => sum + l.line_subtotal, 0)
      a.discount_total = a.lines.reduce((sum, l) => sum + l.discount_amount, 0)
      a.tax_total = a.lines.reduce((sum, l) => sum + l.tax_amount, 0)
      a.grand_total = a.lines.reduce((sum, l) => sum + l.line_total_with_tax, 0)
      return true
    })

    setAssignments(filteredAssignments)
  }

  // Handle discount change for a line
  const handleDiscountChange = (assignmentIndex: number, lineIdx: number, discountPercent: number) => {
    const updatedAssignments = [...assignments]
    const line = updatedAssignments[assignmentIndex].lines[lineIdx]

    const discountAmount = line.line_subtotal * (discountPercent / 100)
    const lineTotal = line.line_subtotal - discountAmount
    const taxAmount = lineTotal * (line.tax_rate / 100)

    line.discount_percent = discountPercent
    line.discount_amount = discountAmount
    line.line_total = lineTotal
    line.tax_amount = taxAmount
    line.line_total_with_tax = lineTotal + taxAmount

    // Recalculate assignment totals
    const assignment = updatedAssignments[assignmentIndex]
    assignment.subtotal = assignment.lines.reduce((sum, l) => sum + l.line_subtotal, 0)
    assignment.discount_total = assignment.lines.reduce((sum, l) => sum + l.discount_amount, 0)
    assignment.tax_total = assignment.lines.reduce((sum, l) => sum + l.tax_amount, 0)
    assignment.grand_total = assignment.lines.reduce((sum, l) => sum + l.line_total_with_tax, 0)

    setAssignments(updatedAssignments)
  }

  // Handle unit price change for a line
  const handlePriceChange = (assignmentIndex: number, lineIdx: number, unitPrice: number) => {
    const updatedAssignments = [...assignments]
    const line = updatedAssignments[assignmentIndex].lines[lineIdx]

    const lineSubtotal = line.quantity * unitPrice
    const discountAmount = lineSubtotal * (line.discount_percent / 100)
    const lineTotal = lineSubtotal - discountAmount
    const taxAmount = lineTotal * (line.tax_rate / 100)

    line.unit_price = unitPrice
    line.line_subtotal = lineSubtotal
    line.discount_amount = discountAmount
    line.line_total = lineTotal
    line.tax_amount = taxAmount
    line.line_total_with_tax = lineTotal + taxAmount

    // Recalculate assignment totals
    const assignment = updatedAssignments[assignmentIndex]
    assignment.subtotal = assignment.lines.reduce((sum, l) => sum + l.line_subtotal, 0)
    assignment.discount_total = assignment.lines.reduce((sum, l) => sum + l.discount_amount, 0)
    assignment.tax_total = assignment.lines.reduce((sum, l) => sum + l.tax_amount, 0)
    assignment.grand_total = assignment.lines.reduce((sum, l) => sum + l.line_total_with_tax, 0)

    setAssignments(updatedAssignments)
  }

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    const validAssignments = assignments.filter(a => a.supplier_id !== '')
    return {
      poCount: validAssignments.length,
      productCount: lines.length,
      totalQuantity: lines.reduce((sum, l) => sum + l.quantity, 0),
      grandTotal: validAssignments.reduce((sum, a) => sum + a.grand_total, 0),
    }
  }, [assignments, lines])

  // Check if can submit
  const canSubmit = useMemo(() => {
    if (!selectedWarehouse) return false
    if (assignments.length === 0) return false
    if (assignments.some(a => a.supplier_id === '')) return false
    return true
  }, [assignments, selectedWarehouse])

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'PLN') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Handle submit - create all POs
  const handleSubmit = async () => {
    if (!canSubmit) return

    setSubmitting(true)

    try {
      const results: { success: boolean; po_number?: string; error?: string }[] = []

      // Create POs sequentially to avoid race conditions with PO number generation
      for (const assignment of assignments) {
        if (assignment.supplier_id === '') continue

        try {
          // Create PO header
          const poResponse = await fetch('/api/planning/purchase-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              supplier_id: assignment.supplier_id,
              warehouse_id: selectedWarehouse,
              expected_delivery_date: expectedDeliveryDate,
            }),
          })

          if (!poResponse.ok) {
            const error = await poResponse.json()
            throw new Error(error.error || 'Failed to create PO')
          }

          const poData = await poResponse.json()
          const poId = poData.purchase_order.id

          // Add PO lines
          for (const line of assignment.lines) {
            const lineResponse = await fetch(`/api/planning/purchase-orders/${poId}/lines`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                product_id: line.product_id,
                quantity: line.quantity,
                unit_price: line.unit_price || 0,
                discount_percent: line.discount_percent,
              }),
            })

            if (!lineResponse.ok) {
              console.error('Failed to add line to PO:', await lineResponse.json())
              // Continue with other lines
            }
          }

          results.push({
            success: true,
            po_number: poData.purchase_order.po_number,
          })
        } catch (err) {
          console.error('Error creating PO:', err)
          results.push({
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      }

      // Show results
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length

      if (successCount > 0) {
        const poNumbers = results.filter(r => r.success).map(r => r.po_number).join(', ')
        toast({
          title: 'Success',
          description: `Created ${successCount} PO(s): ${poNumbers}`,
        })
      }

      if (failCount > 0) {
        toast({
          title: 'Warning',
          description: `Failed to create ${failCount} PO(s)`,
          variant: 'destructive',
        })
      }

      if (successCount > 0) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error creating POs:', error)
      toast({
        title: 'Error',
        description: 'Failed to create purchase orders',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Review & Create Purchase Orders
          </DialogTitle>
          <DialogDescription>
            Review product assignments by supplier and create purchase orders
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="warehouse">Warehouse *</Label>
                <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.code} - {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Expected Delivery Date *</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Supplier Assignments */}
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No lines to review
              </div>
            ) : (
              <Accordion type="multiple" defaultValue={assignments.map((_, i) => `item-${i}`)} className="space-y-4">
                {assignments.map((assignment, assignmentIndex) => (
                  <AccordionItem
                    key={assignment.supplier_id || 'unassigned'}
                    value={`item-${assignmentIndex}`}
                    className="border rounded-lg"
                  >
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          {assignment.supplier_id === '' ? (
                            <Badge variant="destructive">Unassigned</Badge>
                          ) : (
                            <Badge variant="outline">{assignment.supplier_code}</Badge>
                          )}
                          <span className="font-semibold">{assignment.supplier_name}</span>
                          <Badge variant="secondary">
                            {assignment.lines.length} item{assignment.lines.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">
                            {formatCurrency(assignment.grand_total, assignment.currency)}
                          </span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead className="text-right">Unit Price</TableHead>
                            <TableHead className="text-right">Disc %</TableHead>
                            <TableHead className="text-right">Tax %</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-48">Supplier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {assignment.lines.map((line, lineIdx) => (
                            <TableRow key={line.lineIndex}>
                              <TableCell>
                                <div className="font-mono text-sm">{line.product_code}</div>
                                <div className="text-sm text-gray-500">{line.product_name}</div>
                              </TableCell>
                              <TableCell className="text-right">
                                {line.quantity.toLocaleString()} {line.uom}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={line.unit_price || 0}
                                  onChange={(e) => handlePriceChange(assignmentIndex, lineIdx, parseFloat(e.target.value) || 0)}
                                  className="w-24 text-right"
                                  min="0"
                                  step="0.01"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  value={line.discount_percent}
                                  onChange={(e) => handleDiscountChange(assignmentIndex, lineIdx, parseFloat(e.target.value) || 0)}
                                  className="w-16 text-right"
                                  min="0"
                                  max="100"
                                />
                              </TableCell>
                              <TableCell className="text-right text-gray-500">
                                {line.tax_rate}%
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(line.line_total_with_tax, assignment.currency)}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={line.supplier_id || ''}
                                  onValueChange={(value) => handleSupplierChange(line.lineIndex, value)}
                                >
                                  <SelectTrigger className="w-44">
                                    <SelectValue placeholder="Select supplier" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {suppliers.map((s) => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.code}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Subtotals */}
                          <TableRow className="bg-gray-50 font-semibold">
                            <TableCell colSpan={5} className="text-right">
                              Subtotal:
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(assignment.subtotal, assignment.currency)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={5} className="text-right">
                              Discount:
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              -{formatCurrency(assignment.discount_total, assignment.currency)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={5} className="text-right">
                              Tax:
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(assignment.tax_total, assignment.currency)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                          <TableRow className="bg-gray-100 font-bold">
                            <TableCell colSpan={5} className="text-right">
                              Grand Total:
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(assignment.grand_total, assignment.currency)}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}

            {/* Unassigned Warning */}
            {assignments.some(a => a.supplier_id === '') && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800">
                <strong>Warning:</strong> Some products do not have a supplier assigned.
                Please assign a supplier to all products before creating POs.
              </div>
            )}

            {/* Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>POs to create:</span>
                <span className="font-semibold">{grandTotals.poCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total products:</span>
                <span className="font-semibold">{grandTotals.productCount} items ({grandTotals.totalQuantity.toLocaleString()} units)</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total value:</span>
                <span>{formatCurrency(grandTotals.grandTotal, 'PLN')}</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onBack} disabled={submitting}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create ${grandTotals.poCount} PO${grandTotals.poCount !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
