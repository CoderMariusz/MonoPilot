/**
 * SO Modal Component (Create/Edit Sales Order Wizard)
 * Story 07.2: Sales Orders Core
 *
 * Multi-step wizard for creating/editing sales orders:
 * - Step 1: Customer selection
 * - Step 2: Address selection
 * - Step 3: Line management
 * - Step 4: Review and submit
 * - Form validation
 * - Unsaved changes warning
 */

'use client'

import { useState, useCallback, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { SalesOrderService } from '@/lib/services/sales-order-service'

// =============================================================================
// Types
// =============================================================================

export interface Customer {
  id: string
  name: string
  addresses: Address[]
}

export interface Address {
  id: string
  label: string
  address_line1: string
  city: string
}

export interface Product {
  id: string
  code: string
  name: string
  std_price: number
  available_qty: number
}

interface SalesOrderLine {
  id?: string
  product_id: string
  product_name?: string
  product_code?: string
  quantity_ordered: number
  unit_price: number
  notes?: string
  available_qty?: number
}

interface SalesOrderFormData {
  customer_id: string
  shipping_address_id: string
  order_date: string
  required_delivery_date: string
  customer_po?: string
  notes?: string
  lines: SalesOrderLine[]
}

interface SOModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: SalesOrderFormData) => Promise<void>
  mode: 'create' | 'edit'
  initialData?: Partial<SalesOrderFormData>
  customers: Customer[]
  products: Product[]
  isLoading?: boolean
  testId?: string
}

// =============================================================================
// Validation Schema
// =============================================================================

const lineSchema = z.object({
  id: z.string().optional(),
  product_id: z.string().min(1, 'Product is required'),
  product_name: z.string().optional(),
  product_code: z.string().optional(),
  quantity_ordered: z.number().positive('Quantity must be greater than zero'),
  unit_price: z.number().nonnegative('Price must be non-negative'),
  notes: z.string().optional(),
  available_qty: z.number().optional(),
})

const formSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  shipping_address_id: z.string().min(1, 'Address is required'),
  order_date: z.string().min(1, 'Order date is required'),
  required_delivery_date: z.string().min(1, 'Delivery date is required'),
  customer_po: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(lineSchema).min(1, 'At least one line is required'),
}).refine((data) => {
  const orderDate = new Date(data.order_date)
  const deliveryDate = new Date(data.required_delivery_date)
  return deliveryDate >= orderDate
}, {
  message: 'Delivery date must be on or after order date',
  path: ['required_delivery_date'],
})

// =============================================================================
// Component
// =============================================================================

export function SOModal({
  open,
  onClose,
  onSubmit,
  mode,
  initialData,
  customers,
  products,
  isLoading = false,
  testId = 'so-modal',
}: SOModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDiscardDialog, setShowDiscardDialog] = useState(false)
  const [showAddLineForm, setShowAddLineForm] = useState(false)

  // Initialize form
  const form = useForm<SalesOrderFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customer_id: initialData?.customer_id || '',
      shipping_address_id: initialData?.shipping_address_id || '',
      order_date: initialData?.order_date || new Date().toISOString().split('T')[0],
      required_delivery_date: initialData?.required_delivery_date || '',
      customer_po: initialData?.customer_po || '',
      notes: initialData?.notes || '',
      lines: initialData?.lines || [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lines',
  })

  const watchCustomerId = form.watch('customer_id')
  const selectedCustomer = customers.find((c) => c.id === watchCustomerId)
  const isDirty = form.formState.isDirty

  // Reset form when modal opens with new data
  useEffect(() => {
    if (open) {
      setCurrentStep(1)
      form.reset({
        customer_id: initialData?.customer_id || '',
        shipping_address_id: initialData?.shipping_address_id || '',
        order_date: initialData?.order_date || new Date().toISOString().split('T')[0],
        required_delivery_date: initialData?.required_delivery_date || '',
        customer_po: initialData?.customer_po || '',
        notes: initialData?.notes || '',
        lines: initialData?.lines || [],
      })
    }
  }, [open, initialData, form])

  // Handle close with unsaved changes check
  const handleClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardDialog(true)
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        handleClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, handleClose])

  // Navigate steps
  const goToStep = (step: number) => {
    if (step < currentStep || validateCurrentStep()) {
      setCurrentStep(step)
    }
  }

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!form.getValues('customer_id')
      case 2:
        return !!form.getValues('shipping_address_id')
      case 3:
        return form.getValues('lines').length > 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Add line
  const [newLine, setNewLine] = useState<Partial<SalesOrderLine>>({
    product_id: '',
    quantity_ordered: 1,
    unit_price: 0,
  })

  const handleAddLine = () => {
    if (!newLine.product_id || !newLine.quantity_ordered) return

    const product = products.find((p) => p.id === newLine.product_id)
    if (!product) return

    append({
      product_id: newLine.product_id,
      product_name: product.name,
      product_code: product.code,
      quantity_ordered: newLine.quantity_ordered,
      unit_price: newLine.unit_price || product.std_price,
      available_qty: product.available_qty,
      notes: newLine.notes,
    })

    setNewLine({
      product_id: '',
      quantity_ordered: 1,
      unit_price: 0,
    })
    setShowAddLineForm(false)
  }

  // Submit form
  const handleSubmit = async (data: SalesOrderFormData) => {
    try {
      setIsSubmitting(true)
      await onSubmit(data)
      onClose()
    } catch (error) {
      console.error('Failed to submit order:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate totals
  const orderTotal = fields.reduce((sum, line) => {
    return sum + SalesOrderService.calculateLineTotal(line.quantity_ordered, line.unit_price)
  }, 0)

  // Step titles
  const steps = [
    { number: 1, title: 'Customer' },
    { number: 2, title: 'Address' },
    { number: 3, title: 'Lines' },
    { number: 4, title: 'Review' },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
          aria-modal="true"
          data-testid={testId}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Create Sales Order' : 'Edit Sales Order'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Create a new sales order by following the steps below.'
                : 'Edit the sales order details.'}
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicators */}
          <div className="flex items-center justify-between px-4 py-2 border-b">
            {steps.map((step) => (
              <button
                key={step.number}
                type="button"
                onClick={() => goToStep(step.number)}
                disabled={step.number > currentStep && !validateCurrentStep()}
                className={cn(
                  'flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors',
                  currentStep === step.number
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : step.number < currentStep
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                )}
              >
                <span
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs',
                    currentStep === step.number
                      ? 'bg-blue-600 text-white'
                      : step.number < currentStep
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                  )}
                >
                  {step.number < currentStep ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    step.number
                  )}
                </span>
                {step.title}
              </button>
            ))}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 p-4">
              {/* Step 1: Customer Selection */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Select Customer</h3>

                  <FormField
                    control={form.control}
                    name="customer_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger aria-label="Customer">
                              <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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

                  <FormField
                    control={form.control}
                    name="required_delivery_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Required Delivery Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer_po"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer PO (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., PO-12345" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Address Selection */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Select Shipping Address</h3>

                  {selectedCustomer?.addresses.length === 0 ? (
                    <p className="text-gray-500">
                      No addresses found for this customer.
                    </p>
                  ) : (
                    <FormField
                      control={form.control}
                      name="shipping_address_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shipping Address *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger aria-label="Address">
                                <SelectValue placeholder="Select an address" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedCustomer?.addresses.map((addr) => (
                                <SelectItem key={addr.id} value={addr.id}>
                                  <div>
                                    <span className="font-medium">{addr.label}</span>
                                    <span className="text-gray-500 ml-2">
                                      - {addr.address_line1}, {addr.city}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Step 3: Line Management */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Order Lines</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddLineForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Line
                    </Button>
                  </div>

                  {/* Add Line Form */}
                  {showAddLineForm && (
                    <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Product *</Label>
                          <Select
                            value={newLine.product_id}
                            onValueChange={(value) => {
                              const product = products.find((p) => p.id === value)
                              setNewLine({
                                ...newLine,
                                product_id: value,
                                unit_price: product?.std_price || 0,
                              })
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.code} - {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Quantity *</Label>
                          <Input
                            type="number"
                            min={1}
                            value={newLine.quantity_ordered}
                            onChange={(e) =>
                              setNewLine({
                                ...newLine,
                                quantity_ordered: parseInt(e.target.value) || 1,
                              })
                            }
                          />
                          {newLine.product_id && (
                            <p className="text-xs text-gray-500 mt-1">
                              Available:{' '}
                              {products.find((p) => p.id === newLine.product_id)?.available_qty || 0}
                              {newLine.quantity_ordered >
                                (products.find((p) => p.id === newLine.product_id)?.available_qty || 0) && (
                                <span className="text-amber-600 ml-2">
                                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                                  Insufficient inventory
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Unit Price *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={newLine.unit_price}
                            onChange={(e) =>
                              setNewLine({
                                ...newLine,
                                unit_price: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Line Total</Label>
                          <p className="text-lg font-medium py-2">
                            {SalesOrderService.formatCurrency(
                              (newLine.quantity_ordered || 0) * (newLine.unit_price || 0)
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleAddLine}
                          disabled={!newLine.product_id || !newLine.quantity_ordered}
                        >
                          Save Line
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddLineForm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Lines List */}
                  {fields.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      No lines added yet. Click "Add Line" to add products.
                    </p>
                  ) : (
                    <div className="border rounded-lg divide-y">
                      {fields.map((line, index) => (
                        <div
                          key={line.id}
                          className="p-3 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{line.product_name}</p>
                            <p className="text-sm text-gray-500">
                              {line.product_code} - {line.quantity_ordered} x{' '}
                              {SalesOrderService.formatCurrency(line.unit_price)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-medium">
                              {SalesOrderService.formatCurrency(
                                SalesOrderService.calculateLineTotal(
                                  line.quantity_ordered,
                                  line.unit_price
                                )
                              )}
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-red-600"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {form.formState.errors.lines && (
                    <p className="text-sm text-red-600" role="alert">
                      {form.formState.errors.lines.message}
                    </p>
                  )}
                </div>
              )}

              {/* Step 4: Review */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Review Order</h3>

                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Customer</p>
                        <p className="font-medium">
                          {selectedCustomer?.name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Shipping Address</p>
                        <p className="font-medium">
                          {selectedCustomer?.addresses.find(
                            (a) => a.id === form.getValues('shipping_address_id')
                          )?.label || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Order Date</p>
                        <p className="font-medium">
                          {SalesOrderService.formatDate(form.getValues('order_date'))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Required Delivery</p>
                        <p className="font-medium">
                          {SalesOrderService.formatDate(
                            form.getValues('required_delivery_date')
                          )}
                        </p>
                      </div>
                      {form.getValues('customer_po') && (
                        <div>
                          <p className="text-sm text-gray-500">Customer PO</p>
                          <p className="font-medium">{form.getValues('customer_po')}</p>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm text-gray-500 mb-2">
                        Order Lines ({fields.length})
                      </p>
                      <div className="space-y-2">
                        {fields.map((line) => (
                          <div
                            key={line.id}
                            className="flex justify-between text-sm"
                          >
                            <span>
                              {line.product_name} x {line.quantity_ordered}
                            </span>
                            <span className="font-medium">
                              {SalesOrderService.formatCurrency(
                                SalesOrderService.calculateLineTotal(
                                  line.quantity_ordered,
                                  line.unit_price
                                )
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-4 flex justify-end">
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Order Total</p>
                        <p className="text-2xl font-bold">
                          {SalesOrderService.formatCurrency(orderTotal)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Any additional notes..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Footer Buttons */}
              <DialogFooter className="flex justify-between pt-4 border-t">
                <div>
                  {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={handleBack}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  {currentStep < 4 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      disabled={!validateCurrentStep()}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : mode === 'create' ? (
                        'Save as Draft'
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
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
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowDiscardDialog(false)
                onClose()
              }}
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default SOModal
