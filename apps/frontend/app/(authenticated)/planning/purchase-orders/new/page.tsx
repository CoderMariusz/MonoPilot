/**
 * Create Purchase Order Page
 * Story 03.3: PO CRUD + Lines
 * Create new PO with form and lines per PLAN-005
 */

'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Loader2, Save, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { PlanningHeader } from '@/components/planning/PlanningHeader'
import {
  POLinesDataTable,
  POTotalsPanel,
  POLineModal,
} from '@/components/planning/purchase-orders'
import {
  useCreatePO,
  usePurchaseOrder,
  useSupplierDefaults,
} from '@/lib/hooks/use-purchase-orders'
import { useSuppliers } from '@/lib/hooks/use-suppliers'
import { useWarehouses } from '@/lib/hooks/use-warehouses'
import { useTaxCodes } from '@/lib/hooks/use-tax-codes'
import type {
  POLine,
  CreatePOInput,
  CreatePOLineInput,
  Currency,
  TaxCodeSummary,
} from '@/lib/types/purchase-order'
import { calculatePOTotals } from '@/lib/types/purchase-order'

// Form validation schema
const createPOSchema = z.object({
  supplier_id: z.string().uuid({ message: 'Please select a supplier' }),
  warehouse_id: z.string().uuid({ message: 'Please select a warehouse' }),
  order_date: z.string().min(1, { message: 'Order date is required' }),
  expected_delivery_date: z.string().min(1, { message: 'Expected delivery date is required' }),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']),
  tax_code_id: z.string().uuid({ message: 'Please select a tax code' }),
  payment_terms: z.string().optional().nullable(),
  shipping_cost: z.number().min(0),
  notes: z.string().max(1000).optional().nullable(),
})

type CreatePOFormData = z.infer<typeof createPOSchema>

// Temporary line type for local state
interface TempLine extends Omit<CreatePOLineInput, 'discount_percent'> {
  id: string
  line_number: number
  uom: string
  tax_rate: number
  line_total: number
  discount_percent: number
  product?: {
    id: string
    code: string
    name: string
    base_uom: string
    std_price: number
  }
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const duplicateId = searchParams.get('duplicate')
  const { toast } = useToast()

  // Local state for lines
  const [lines, setLines] = useState<TempLine[]>([])
  const [lineModal, setLineModal] = useState<{
    isOpen: boolean
    mode: 'add' | 'edit'
    line: TempLine | null
  }>({
    isOpen: false,
    mode: 'add',
    line: null,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch reference data - only active suppliers and warehouses
  const { data: suppliersData, isLoading: suppliersLoading } = useSuppliers({ status: 'active' })
  const { data: warehousesData, isLoading: warehousesLoading } = useWarehouses({ status: 'active' })
  const { data: taxCodesData, isLoading: taxCodesLoading } = useTaxCodes()
  const { data: duplicatePO, isLoading: duplicateLoading } = usePurchaseOrder(duplicateId)

  const suppliers = suppliersData?.data || []
  const warehouses = warehousesData?.data || []
  const taxCodes = taxCodesData?.data || []

  // Form setup
  const form = useForm<CreatePOFormData>({
    resolver: zodResolver(createPOSchema),
    defaultValues: {
      supplier_id: '',
      warehouse_id: '',
      order_date: new Date().toISOString().split('T')[0],
      expected_delivery_date: '',
      currency: 'PLN',
      tax_code_id: '',
      payment_terms: '',
      shipping_cost: 0,
      notes: '',
    },
  })

  const selectedSupplierId = form.watch('supplier_id')
  const selectedTaxCodeId = form.watch('tax_code_id')
  const shippingCost = form.watch('shipping_cost') || 0

  // Fetch supplier defaults when supplier changes
  const { data: supplierDefaults } = useSupplierDefaults(selectedSupplierId || null)

  // Create mutation
  const createPO = useCreatePO()

  // Apply supplier defaults when selected
  useEffect(() => {
    if (supplierDefaults && !duplicateId) {
      form.setValue('currency', supplierDefaults.currency)
      form.setValue('tax_code_id', supplierDefaults.tax_code_id)
      form.setValue('payment_terms', supplierDefaults.payment_terms)

      // Calculate expected delivery date based on lead time
      if (supplierDefaults.lead_time_days) {
        const orderDate = new Date(form.getValues('order_date'))
        const expectedDate = new Date(orderDate)
        expectedDate.setDate(expectedDate.getDate() + supplierDefaults.lead_time_days)
        form.setValue('expected_delivery_date', expectedDate.toISOString().split('T')[0])
      }
    }
  }, [supplierDefaults, form, duplicateId])

  // Load duplicate PO data
  useEffect(() => {
    if (duplicatePO) {
      form.reset({
        supplier_id: duplicatePO.supplier_id,
        warehouse_id: duplicatePO.warehouse_id,
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: duplicatePO.expected_delivery_date,
        currency: duplicatePO.currency,
        tax_code_id: duplicatePO.tax_code_id,
        payment_terms: duplicatePO.payment_terms || '',
        shipping_cost: duplicatePO.shipping_cost || 0,
        notes: duplicatePO.notes || '',
      })

      // Copy lines
      const copiedLines: TempLine[] = duplicatePO.lines.map((line, index) => ({
        id: `temp-${Date.now()}-${index}`,
        line_number: index + 1,
        product_id: line.product_id,
        quantity: line.quantity,
        unit_price: line.unit_price,
        uom: line.uom,
        tax_code_id: line.tax_code_id,
        tax_rate: line.tax_rate,
        discount_percent: line.discount_percent || 0,
        line_total: line.line_total,
        notes: line.notes,
        product: line.product,
      }))
      setLines(copiedLines)
    }
  }, [duplicatePO, form])

  // Calculate totals
  const totals = useMemo(() => {
    const linesForCalc = lines.map((l) => ({
      quantity: l.quantity,
      unit_price: l.unit_price,
      discount_percent: l.discount_percent || 0,
      tax_rate: l.tax_rate,
    }))
    return calculatePOTotals(linesForCalc, shippingCost)
  }, [lines, shippingCost])

  // Line handlers
  const handleAddLine = useCallback(() => {
    setLineModal({ isOpen: true, mode: 'add', line: null })
  }, [])

  const handleEditLine = useCallback(
    (lineId: string) => {
      const line = lines.find((l) => l.id === lineId)
      if (line) {
        setLineModal({ isOpen: true, mode: 'edit', line })
      }
    },
    [lines]
  )

  const handleDeleteLine = useCallback((lineId: string) => {
    setLines((prev) => {
      const filtered = prev.filter((l) => l.id !== lineId)
      // Re-sequence line numbers
      return filtered.map((l, idx) => ({ ...l, line_number: idx + 1 }))
    })
  }, [])

  const handleLineSubmit = useCallback(
    async (data: CreatePOLineInput) => {
      const selectedTaxCode = taxCodes.find((t) => t.id === data.tax_code_id)
      const taxRate = selectedTaxCode?.rate || 0
      const lineTotal =
        data.quantity * data.unit_price * (1 - (data.discount_percent || 0) / 100)

      if (lineModal.mode === 'add') {
        // Fetch product info (for display)
        let productInfo = undefined
        try {
          const response = await fetch(`/api/technical/products/${data.product_id}`)
          if (response.ok) {
            const result = await response.json()
            productInfo = result.data || result.product || result
          }
        } catch {
          // Ignore - we'll just show without product details
        }

        const newLine: TempLine = {
          id: `temp-${Date.now()}`,
          line_number: lines.length + 1,
          product_id: data.product_id,
          quantity: data.quantity,
          unit_price: data.unit_price,
          uom: productInfo?.base_uom || 'ea',
          tax_code_id: data.tax_code_id,
          tax_rate: taxRate,
          discount_percent: data.discount_percent || 0,
          line_total: lineTotal,
          notes: data.notes,
          product: productInfo
            ? {
                id: productInfo.id,
                code: productInfo.code,
                name: productInfo.name,
                base_uom: productInfo.base_uom,
                std_price: productInfo.std_price,
              }
            : undefined,
        }
        setLines((prev) => [...prev, newLine])
      } else if (lineModal.line) {
        setLines((prev) =>
          prev.map((l) =>
            l.id === lineModal.line!.id
              ? {
                  ...l,
                  quantity: data.quantity,
                  unit_price: data.unit_price,
                  tax_code_id: data.tax_code_id,
                  tax_rate: taxRate,
                  discount_percent: data.discount_percent || 0,
                  line_total: lineTotal,
                  notes: data.notes,
                }
              : l
          )
        )
      }
    },
    [lineModal, lines.length, taxCodes]
  )

  // Save as draft
  const handleSaveDraft = useCallback(async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the form errors before saving',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    try {
      const formData = form.getValues()
      const input: CreatePOInput = {
        ...formData,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_code_id: l.tax_code_id,
          discount_percent: l.discount_percent,
          notes: l.notes,
        })),
      }

      const result = await createPO.mutateAsync(input)
      toast({
        title: 'Success',
        description: 'Purchase order saved as draft',
      })
      router.push(`/planning/purchase-orders/${result.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }, [form, lines, createPO, toast, router])

  // Save and submit
  const handleSaveAndSubmit = useCallback(async () => {
    const isValid = await form.trigger()
    if (!isValid) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the form errors before submitting',
        variant: 'destructive',
      })
      return
    }

    if (lines.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Add at least one line item before submitting',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const formData = form.getValues()
      const input: CreatePOInput = {
        ...formData,
        lines: lines.map((l) => ({
          product_id: l.product_id,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_code_id: l.tax_code_id,
          discount_percent: l.discount_percent,
          notes: l.notes,
        })),
      }

      const result = await createPO.mutateAsync(input)

      // Now submit it
      await fetch(`/api/planning/purchase-orders/${result.id}/submit`, {
        method: 'POST',
      })

      toast({
        title: 'Success',
        description: 'Purchase order created and submitted',
      })
      router.push(`/planning/purchase-orders/${result.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [form, lines, createPO, toast, router])

  const isLoading = suppliersLoading || warehousesLoading || taxCodesLoading
  const existingProductIds = lines.map((l) => l.product_id)

  // Convert TempLine to POLine format for the table
  const linesForTable = lines.map(
    (l) =>
      ({
        id: l.id,
        purchase_order_id: '',
        line_number: l.line_number,
        product_id: l.product_id,
        quantity: l.quantity,
        received_qty: 0,
        remaining_qty: l.quantity,
        uom: l.uom,
        unit_price: l.unit_price,
        discount_percent: l.discount_percent,
        discount_amount: 0,
        tax_code_id: l.tax_code_id,
        tax_rate: l.tax_rate,
        tax_amount: 0,
        line_total: l.line_total,
        notes: l.notes,
        status: 'pending' as const,
        created_at: '',
        updated_at: '',
        product: l.product,
      }) as POLine
  )

  return (
    <div>
      <PlanningHeader currentPage="po" />

      <div className="px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/planning/purchase-orders')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {duplicateId ? 'Duplicate Purchase Order' : 'Create Purchase Order'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Fill in the details and add line items
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save as Draft
            </Button>
            <Button
              onClick={handleSaveAndSubmit}
              disabled={isSaving || isSubmitting || lines.length === 0}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Submit
            </Button>
          </div>
        </div>

        {/* Loading state */}
        {(isLoading || duplicateLoading) && (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Form */}
        {!isLoading && !duplicateLoading && (
          <Form {...form}>
            <form className="space-y-6">
              {/* Header Section */}
              <div className="border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Order Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Supplier */}
                  <FormField
                    control={form.control}
                    name="supplier_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {supplierDefaults?.lead_time_days && (
                          <p className="text-xs text-muted-foreground">
                            Lead Time: {supplierDefaults.lead_time_days} days
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Order Date */}
                  <FormField
                    control={form.control}
                    name="order_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Expected Delivery */}
                  <FormField
                    control={form.control}
                    name="expected_delivery_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expected Delivery *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Warehouse */}
                  <FormField
                    control={form.control}
                    name="warehouse_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warehouse *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select warehouse" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {warehouses.map((w) => (
                              <SelectItem key={w.id} value={w.id}>
                                {w.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Payment Terms */}
                  <FormField
                    control={form.control}
                    name="payment_terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Net 30"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Currency */}
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PLN">PLN</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tax Code */}
                  <FormField
                    control={form.control}
                    name="tax_code_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax Code *</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select tax code" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {taxCodes.map((t) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.name} ({t.rate}%)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Shipping Cost */}
                  <FormField
                    control={form.control}
                    name="shipping_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shipping Cost</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Notes */}
                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes for this order..."
                            className="resize-none"
                            {...field}
                            value={field.value || ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Lines Section */}
              <div className="space-y-4">
                <POLinesDataTable
                  lines={linesForTable}
                  currency={form.watch('currency')}
                  isEditable={true}
                  onAddLine={handleAddLine}
                  onEditLine={handleEditLine}
                  onDeleteLine={handleDeleteLine}
                />

                {/* Totals */}
                <POTotalsPanel
                  subtotal={totals.subtotal}
                  taxAmount={totals.tax_amount}
                  taxBreakdown={totals.tax_breakdown}
                  discountTotal={totals.discount_total}
                  shippingCost={totals.shipping_cost}
                  total={totals.total}
                  currency={form.watch('currency')}
                />
              </div>
            </form>
          </Form>
        )}
      </div>

      {/* Line Modal */}
      <POLineModal
        isOpen={lineModal.isOpen}
        mode={lineModal.mode}
        initialData={lineModal.line as POLine | null}
        supplierId={form.watch('supplier_id') || ''}
        taxCodeId={selectedTaxCodeId || ''}
        currency={form.watch('currency')}
        taxCodes={taxCodes.map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          rate: t.rate,
        }))}
        existingProductIds={existingProductIds}
        onSubmit={handleLineSubmit}
        onClose={() => setLineModal({ isOpen: false, mode: 'add', line: null })}
      />
    </div>
  )
}
