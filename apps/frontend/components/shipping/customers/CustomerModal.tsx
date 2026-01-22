/**
 * CustomerModal Component
 * Story: 07.1 - Customers CRUD
 *
 * Features:
 * - Create mode: all fields editable
 * - Edit mode: customer_code readonly
 * - Form validation with Zod
 * - Allergen multi-select with chips
 * - Tax ID encrypted hint
 * - Submit/Cancel actions
 * - Loading states
 * - Keyboard navigation
 *
 * Wireframe: SHIP-002
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { X, Check, ChevronsUpDown, AlertTriangle, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { z } from 'zod'

// Form schema
const customerFormSchema = z.object({
  customer_code: z
    .string()
    .min(3, 'Customer code is required')
    .max(20, 'Customer code must be at most 20 characters')
    .regex(
      /^[A-Za-z0-9_-]+$/,
      'Invalid character in code. Use letters, numbers, dashes, and underscores only.'
    ),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(255, 'Name must be at most 255 characters'),
  category: z.enum(['retail', 'wholesale', 'distributor'], {
    required_error: 'Category is required',
  }),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().max(50).optional(),
  tax_id: z.string().max(50).optional(),
  credit_limit: z
    .number()
    .min(0, 'Credit limit must be positive')
    .optional()
    .nullable(),
  payment_terms_days: z
    .number()
    .int()
    .min(1, 'Payment terms must be 1-365 days')
    .max(365, 'Payment terms must be 1-365 days')
    .optional()
    .nullable(),
  allergen_restrictions: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional(),
  is_active: z.boolean().optional(),
})

type CustomerFormValues = z.infer<typeof customerFormSchema>

export interface Allergen {
  id: string
  code: string
  name: string
}

export interface Customer {
  id: string
  customer_code: string
  name: string
  category: 'retail' | 'wholesale' | 'distributor'
  email: string | null
  phone: string | null
  tax_id: string | null
  credit_limit: number | null
  payment_terms_days: number
  allergen_restrictions: string[] | null
  is_active: boolean
  notes: string | null
  created_at: string
  created_by: string | null
}

interface CustomerModalProps {
  isOpen: boolean
  customer: Customer | null
  allergens: Allergen[]
  onSubmit: (data: CustomerFormValues) => Promise<void>
  onClose: () => void
}

export function CustomerModal({
  isOpen,
  customer,
  allergens,
  onSubmit,
  onClose,
}: CustomerModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [allergenPopoverOpen, setAllergenPopoverOpen] = useState(false)

  const isEditMode = customer !== null

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    mode: 'onChange', // Validate on change to show field-level errors immediately
    defaultValues: {
      customer_code: '',
      name: '',
      category: undefined,
      email: '',
      phone: '',
      tax_id: '',
      credit_limit: null,
      payment_terms_days: 30,
      allergen_restrictions: [],
      notes: '',
      is_active: true,
    },
  })

  // Reset form when customer changes
  useEffect(() => {
    if (customer) {
      form.reset({
        customer_code: customer.customer_code,
        name: customer.name,
        category: customer.category,
        email: customer.email ?? '',
        phone: customer.phone ?? '',
        tax_id: customer.tax_id ?? '',
        credit_limit: customer.credit_limit,
        payment_terms_days: customer.payment_terms_days,
        allergen_restrictions: customer.allergen_restrictions ?? [],
        notes: customer.notes ?? '',
        is_active: customer.is_active,
      })
    } else {
      form.reset({
        customer_code: '',
        name: '',
        category: undefined,
        email: '',
        phone: '',
        tax_id: '',
        credit_limit: null,
        payment_terms_days: 30,
        allergen_restrictions: [],
        notes: '',
        is_active: true,
      })
    }
  }, [customer, form])

  const handleSubmit = useCallback(
    async (data: CustomerFormValues) => {
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

  const selectedAllergens = form.watch('allergen_restrictions') ?? []

  const toggleAllergen = useCallback(
    (allergenId: string) => {
      const current = form.getValues('allergen_restrictions') ?? []
      const updated = current.includes(allergenId)
        ? current.filter((id) => id !== allergenId)
        : [...current, allergenId]
      form.setValue('allergen_restrictions', updated)
    },
    [form]
  )

  const removeAllergen = useCallback(
    (allergenId: string) => {
      const current = form.getValues('allergen_restrictions') ?? []
      form.setValue(
        'allergen_restrictions',
        current.filter((id) => id !== allergenId)
      )
    },
    [form]
  )

  const getAllergenName = (allergenId: string): string => {
    const allergen = allergens.find((a) => a.id === allergenId)
    return allergen?.name ?? allergenId
  }

  if (!isOpen) return null

  return (
    <>
      {/* Custom backdrop for testing - rendered outside Dialog for pointer-events */}
      <div
        data-testid="modal-backdrop"
        className="fixed inset-0 z-40 bg-black/50"
        onClick={handleClose}
        onKeyDown={handleKeyDown}
        role="presentation"
        style={{ pointerEvents: 'auto' }}
      />
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto z-50"
          onKeyDown={handleKeyDown}
        >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Customer' : 'Create Customer'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              {/* Customer Code */}
              <FormField
                control={form.control}
                name="customer_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Code *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., ACME001"
                        disabled={isEditMode}
                        aria-label="Customer Code"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., ACME Corporation"
                        aria-label="Name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Category - using native select for test compatibility */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        value={field.value ?? ''}
                        aria-label="Category"
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Select category</option>
                        <option value="retail">Retail</option>
                        <option value="wholesale">Wholesale</option>
                        <option value="distributor">Distributor</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="info@example.com"
                        aria-label="Email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="+1-555-0100"
                        aria-label="Phone"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tax ID */}
              <FormField
                control={form.control}
                name="tax_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tax ID
                      <Lock className="ml-1 h-3 w-3 inline text-muted-foreground" />
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="VAT123456"
                        aria-label="Tax ID"
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      <span className="text-amber-600">Encrypted</span> - stored
                      securely
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Credit Limit */}
              <FormField
                control={form.control}
                name="credit_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Limit</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        aria-label="Credit Limit"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Terms */}
              <FormField
                control={form.control}
                name="payment_terms_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="30"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        aria-label="Payment Terms"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Allergen Restrictions */}
            <FormField
              control={form.control}
              name="allergen_restrictions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allergen Restrictions</FormLabel>
                  <FormDescription className="text-xs">
                    Customer cannot receive products containing these allergens
                  </FormDescription>
                  <div className="space-y-2">
                    {/* Selected allergens as chips */}
                    {selectedAllergens.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedAllergens.map((allergenId) => (
                          <Badge
                            key={allergenId}
                            variant="secondary"
                            className="pr-1"
                            data-testid={`allergen-chip-${getAllergenName(allergenId).toLowerCase()}`}
                          >
                            {getAllergenName(allergenId)}
                            <button
                              type="button"
                              onClick={() => removeAllergen(allergenId)}
                              className="ml-1 hover:bg-muted rounded"
                              data-testid="remove-allergen"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Warning message */}
                    {selectedAllergens.length > 0 && (
                      <div className="flex items-center gap-2 text-amber-600 text-sm">
                        <AlertTriangle className="h-4 w-4" />
                        <span>
                          Customer has allergen restrictions - validate all
                          orders
                        </span>
                      </div>
                    )}

                    {/* Allergen selector */}
                    <Popover
                      open={allergenPopoverOpen}
                      onOpenChange={setAllergenPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-full justify-between"
                          data-testid="allergen-select"
                        >
                          Select allergens...
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search allergens..." />
                          <CommandList>
                            <CommandEmpty>No allergens found.</CommandEmpty>
                            <CommandGroup>
                              {allergens.map((allergen) => (
                                <CommandItem
                                  key={allergen.id}
                                  value={allergen.name}
                                  onSelect={() => toggleAllergen(allergen.id)}
                                  data-testid={`allergen-option-${allergen.name.toLowerCase()}`}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      selectedAllergens.includes(allergen.id)
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  {allergen.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="Additional notes about this customer..."
                      rows={3}
                      aria-label="Notes"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Metadata (edit mode only) */}
            {isEditMode && customer && (
              <div className="text-xs text-muted-foreground border-t pt-4">
                <p>
                  Created: {new Date(customer.created_at).toLocaleDateString()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isEditMode
                    ? 'Saving...'
                    : 'Creating...'
                  : isEditMode
                    ? 'Save'
                    : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  )
}
