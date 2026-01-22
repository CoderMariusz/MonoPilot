/**
 * RMAModal Component
 * Story: 07.16 - RMA Core CRUD + Approval Workflow
 *
 * Features:
 * - Create mode: all fields editable
 * - Edit mode: customer readonly
 * - Form validation with Zod
 * - RMA lines management (add/edit/delete)
 * - Disposition auto-suggestion based on reason
 * - Submit/Cancel actions
 * - Loading states
 * - Keyboard navigation
 * - Unsaved changes warning
 *
 * Wireframe: RMA-002
 */

'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Pencil, Loader2 } from 'lucide-react'
import { z } from 'zod'
import {
  rmaFormSchema,
  rmaLineSchema,
  rmaReasonCodeEnum,
  rmaDispositionEnum,
  RMA_REASON_LABELS,
  RMA_DISPOSITION_LABELS,
  REASON_TO_DISPOSITION,
  type RMAReasonCode,
  type RMADisposition,
  type RMALineInput,
} from '@/lib/validation/rma-schemas'

// Types
export interface Customer {
  id: string
  name: string
}

export interface Product {
  id: string
  code: string
  name: string
}

export interface SalesOrder {
  id: string
  order_number: string
  customer_id: string
}

export interface RMAFormData {
  customer_id: string
  sales_order_id?: string | null
  reason_code: RMAReasonCode
  disposition?: RMADisposition | null
  notes?: string | null
  lines: RMALineInput[]
}

interface RMAModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: RMAFormData) => Promise<void>
  mode: 'create' | 'edit'
  initialData?: Partial<RMAFormData>
  customers: Customer[]
  products: Product[]
  salesOrders?: SalesOrder[]
  testId?: string
}

export function RMAModal({
  open,
  onClose,
  onSubmit,
  mode,
  initialData,
  customers,
  products,
  salesOrders = [],
  testId = 'rma-modal',
}: RMAModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null)
  const [showLineForm, setShowLineForm] = useState(false)

  const isEditMode = mode === 'edit'

  const form = useForm<RMAFormData>({
    resolver: zodResolver(rmaFormSchema),
    mode: 'onChange',
    defaultValues: {
      customer_id: '',
      sales_order_id: null,
      reason_code: undefined as unknown as RMAReasonCode,
      disposition: null,
      notes: '',
      lines: [],
    },
  })

  const { isDirty } = form.formState
  const lines = form.watch('lines') || []
  const selectedCustomerId = form.watch('customer_id')
  const selectedReasonCode = form.watch('reason_code')

  // Filter sales orders by selected customer
  const filteredSalesOrders = useMemo(() => {
    if (!selectedCustomerId) return []
    return salesOrders.filter((so) => so.customer_id === selectedCustomerId)
  }, [selectedCustomerId, salesOrders])

  // Auto-suggest disposition when reason code changes
  useEffect(() => {
    if (selectedReasonCode && !form.getValues('disposition')) {
      const suggestedDisposition = REASON_TO_DISPOSITION[selectedReasonCode]
      if (suggestedDisposition) {
        form.setValue('disposition', suggestedDisposition)
      }
    }
  }, [selectedReasonCode, form])

  // Clear sales order when customer changes
  useEffect(() => {
    const currentSO = form.getValues('sales_order_id')
    if (currentSO && selectedCustomerId) {
      const soExists = salesOrders.some(
        (so) => so.id === currentSO && so.customer_id === selectedCustomerId
      )
      if (!soExists) {
        form.setValue('sales_order_id', null)
      }
    }
  }, [selectedCustomerId, salesOrders, form])

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        form.reset({
          customer_id: initialData.customer_id || '',
          sales_order_id: initialData.sales_order_id || null,
          reason_code: initialData.reason_code as RMAReasonCode,
          disposition: initialData.disposition || null,
          notes: initialData.notes || '',
          lines: initialData.lines || [],
        })
      } else {
        form.reset({
          customer_id: '',
          sales_order_id: null,
          reason_code: undefined as unknown as RMAReasonCode,
          disposition: null,
          notes: '',
          lines: [],
        })
      }
    }
  }, [open, initialData, form])

  const handleSubmit = useCallback(
    async (data: RMAFormData) => {
      setIsSubmitting(true)
      try {
        await onSubmit(data)
        onClose()
      } catch (error) {
        console.error('Form submission error:', error)
      } finally {
        setIsSubmitting(false)
      }
    },
    [onSubmit, onClose]
  )

  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  const handleConfirmDiscard = useCallback(() => {
    setShowDiscardDialog(false)
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    },
    [handleClose]
  )

  // Line management
  const [lineForm, setLineForm] = useState<RMALineInput>({
    product_id: '',
    quantity_expected: 0,
    lot_number: '',
    reason_notes: '',
    disposition: null,
  })

  const resetLineForm = useCallback(() => {
    setLineForm({
      product_id: '',
      quantity_expected: 0,
      lot_number: '',
      reason_notes: '',
      disposition: null,
    })
    setEditingLineIndex(null)
    setShowLineForm(false)
  }, [])

  const handleAddLine = useCallback(() => {
    setShowLineForm(true)
    setEditingLineIndex(null)
    setLineForm({
      product_id: '',
      quantity_expected: 0,
      lot_number: '',
      reason_notes: '',
      disposition: null,
    })
  }, [])

  const handleEditLine = useCallback(
    (index: number) => {
      const line = lines[index]
      setLineForm({
        product_id: line.product_id,
        quantity_expected: line.quantity_expected,
        lot_number: line.lot_number || '',
        reason_notes: line.reason_notes || '',
        disposition: line.disposition || null,
      })
      setEditingLineIndex(index)
      setShowLineForm(true)
    },
    [lines]
  )

  const handleSaveLine = useCallback(() => {
    // Validate line
    const result = rmaLineSchema.safeParse(lineForm)
    if (!result.success) {
      return // Let the form handle validation errors
    }

    const newLines = [...lines]
    if (editingLineIndex !== null) {
      newLines[editingLineIndex] = result.data
    } else {
      newLines.push(result.data)
    }
    form.setValue('lines', newLines, { shouldDirty: true })
    resetLineForm()
  }, [lineForm, lines, editingLineIndex, form, resetLineForm])

  const handleDeleteLine = useCallback(
    (index: number) => {
      const newLines = lines.filter((_, i) => i !== index)
      form.setValue('lines', newLines, { shouldDirty: true })
    },
    [lines, form]
  )

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product?.name || productId
  }

  if (!open) return null

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          onKeyDown={handleKeyDown}
          data-testid={testId}
        >
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit RMA' : 'Create RMA'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-4">
                {/* Customer */}
                <FormField
                  control={form.control}
                  name="customer_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          disabled={isEditMode}
                          aria-label="Customer"
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select customer</option>
                          {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                              {customer.name}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sales Order (optional) */}
                <FormField
                  control={form.control}
                  name="sales_order_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales Order</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                          aria-label="Sales Order"
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">None</option>
                          {filteredSalesOrders.map((so) => (
                            <option key={so.id} value={so.id}>
                              {so.order_number}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Optional link to original sales order
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Reason Code */}
                <FormField
                  control={form.control}
                  name="reason_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason Code *</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          value={field.value || ''}
                          aria-label="Reason Code"
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select reason</option>
                          {rmaReasonCodeEnum.options.map((reason) => (
                            <option key={reason} value={reason}>
                              {RMA_REASON_LABELS[reason]}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Disposition */}
                <FormField
                  control={form.control}
                  name="disposition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Disposition</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          value={field.value || ''}
                          onChange={(e) =>
                            field.onChange(e.target.value || null)
                          }
                          aria-label="Disposition"
                          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Select disposition</option>
                          {rmaDispositionEnum.options.map((disp) => (
                            <option key={disp} value={disp}>
                              {RMA_DISPOSITION_LABELS[disp]}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Auto-suggested based on reason code
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Additional notes about this RMA..."
                        rows={3}
                        maxLength={2000}
                        aria-label="Notes"
                      />
                    </FormControl>
                    <FormDescription className="text-xs text-right">
                      {(field.value || '').length}/2000
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* RMA Lines Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Line Items *</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLine}
                    data-testid="add-line-btn"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line
                  </Button>
                </div>

                {/* Line Form */}
                {showLineForm && (
                  <div className="border rounded-md p-4 space-y-4 bg-muted/50">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Product *</label>
                        <select
                          value={lineForm.product_id}
                          onChange={(e) =>
                            setLineForm((prev) => ({
                              ...prev,
                              product_id: e.target.value,
                            }))
                          }
                          className="flex h-10 w-full mt-1 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          data-testid="line-product"
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.code} - {product.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Quantity Expected *
                        </label>
                        <Input
                          type="number"
                          min="0.0001"
                          step="0.0001"
                          value={lineForm.quantity_expected || ''}
                          onChange={(e) =>
                            setLineForm((prev) => ({
                              ...prev,
                              quantity_expected: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="mt-1"
                          data-testid="line-quantity"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Lot Number</label>
                        <Input
                          value={lineForm.lot_number || ''}
                          onChange={(e) =>
                            setLineForm((prev) => ({
                              ...prev,
                              lot_number: e.target.value,
                            }))
                          }
                          placeholder="Optional"
                          className="mt-1"
                          maxLength={100}
                          data-testid="line-lot"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Line Disposition
                        </label>
                        <select
                          value={lineForm.disposition || ''}
                          onChange={(e) =>
                            setLineForm((prev) => ({
                              ...prev,
                              disposition: (e.target.value as RMADisposition) || null,
                            }))
                          }
                          className="flex h-10 w-full mt-1 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          data-testid="line-disposition"
                        >
                          <option value="">Use RMA disposition</option>
                          {rmaDispositionEnum.options.map((disp) => (
                            <option key={disp} value={disp}>
                              {RMA_DISPOSITION_LABELS[disp]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Reason Notes</label>
                      <Textarea
                        value={lineForm.reason_notes || ''}
                        onChange={(e) =>
                          setLineForm((prev) => ({
                            ...prev,
                            reason_notes: e.target.value,
                          }))
                        }
                        placeholder="Specific reason for this item..."
                        rows={2}
                        maxLength={500}
                        className="mt-1"
                        data-testid="line-notes"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={resetLineForm}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleSaveLine}
                        disabled={
                          !lineForm.product_id || lineForm.quantity_expected <= 0
                        }
                        data-testid="save-line-btn"
                      >
                        {editingLineIndex !== null ? 'Update' : 'Add'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Lines Table */}
                {lines.length > 0 ? (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty Expected</TableHead>
                          <TableHead>Lot #</TableHead>
                          <TableHead>Notes</TableHead>
                          <TableHead className="w-20">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lines.map((line, index) => (
                          <TableRow key={index} data-testid="rma-line-row">
                            <TableCell>{getProductName(line.product_id)}</TableCell>
                            <TableCell>{line.quantity_expected}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {line.lot_number || '-'}
                            </TableCell>
                            <TableCell className="text-muted-foreground max-w-[200px] truncate">
                              {line.reason_notes || '-'}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditLine(index)}
                                  data-testid={`edit-line-${index}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteLine(index)}
                                  data-testid={`delete-line-${index}`}
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
                ) : (
                  <div className="border rounded-md p-8 text-center text-muted-foreground">
                    No line items added. Click &quot;Add Line&quot; to add products.
                  </div>
                )}

                {form.formState.errors.lines && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.lines.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditMode ? 'Saving...' : 'Creating...'}
                    </>
                  ) : isEditMode ? (
                    'Save Changes'
                  ) : (
                    'Create'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Discard Changes Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDiscard}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
