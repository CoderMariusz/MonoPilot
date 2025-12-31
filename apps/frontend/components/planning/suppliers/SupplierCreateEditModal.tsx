/**
 * Supplier Create/Edit Modal Component
 * Story: 03.1 - Suppliers CRUD + Master Data
 *
 * Modal for create/edit supplier form with auto-code generation
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Loader2, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  useCreateSupplier,
  useUpdateSupplier,
  useNextSupplierCode,
} from '@/lib/hooks/use-suppliers'
import type { Supplier, CreateSupplierDto, UpdateSupplierDto } from '@/lib/types/supplier'

// Zod Schema
const supplierFormSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase letters, numbers, and hyphens only'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  contact_name: z.string().max(100).optional(),
  contact_email: z.string().email('Invalid email format').optional().or(z.literal('')),
  contact_phone: z.string().max(50).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z
    .string()
    .length(2, 'Country must be 2-letter ISO code')
    .optional()
    .or(z.literal('')),
  currency: z.enum(['PLN', 'EUR', 'USD', 'GBP']),
  tax_code_id: z.string().uuid('Please select a tax code'),
  payment_terms: z
    .string()
    .min(1, 'Payment terms are required')
    .max(100, 'Payment terms must be at most 100 characters'),
  notes: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
})

type SupplierFormData = z.infer<typeof supplierFormSchema>

interface TaxCode {
  id: string
  code: string
  description: string
  rate: number
}

interface SupplierCreateEditModalProps {
  open: boolean
  onClose: () => void
  supplier?: Supplier | null
  onSuccess: (supplier: Supplier) => void
}

const COMMON_COUNTRIES = [
  { code: 'PL', name: 'Poland' },
  { code: 'DE', name: 'Germany' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'AT', name: 'Austria' },
]

export function SupplierCreateEditModal({
  open,
  onClose,
  supplier,
  onSuccess,
}: SupplierCreateEditModalProps) {
  const [manualCode, setManualCode] = useState(false)
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([])
  const [loadingTaxCodes, setLoadingTaxCodes] = useState(true)
  const [codeValidating, setCodeValidating] = useState(false)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [createdSupplier, setCreatedSupplier] = useState<Supplier | null>(null)
  const [formErrors, setFormErrors] = useState<string[]>([])

  const { toast } = useToast()
  const isEditMode = !!supplier
  const hasOpenPOs = supplier?.has_open_pos || (supplier?.purchase_orders_count ?? 0) > 0
  const codeLocked = isEditMode && hasOpenPOs

  const { data: nextCode } = useNextSupplierCode()
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema) as any,
    defaultValues: {
      code: supplier?.code || '',
      name: supplier?.name || '',
      contact_name: supplier?.contact_name || '',
      contact_email: supplier?.contact_email || '',
      contact_phone: supplier?.contact_phone || '',
      address: supplier?.address || '',
      city: supplier?.city || '',
      postal_code: supplier?.postal_code || '',
      country: supplier?.country || '',
      currency: supplier?.currency || 'PLN',
      tax_code_id: supplier?.tax_code_id || '',
      payment_terms: supplier?.payment_terms || '',
      notes: supplier?.notes || '',
      is_active: supplier?.is_active ?? true,
    },
  })

  // Fetch tax codes
  useEffect(() => {
    const fetchTaxCodes = async () => {
      try {
        setLoadingTaxCodes(true)
        const response = await fetch('/api/settings/tax-codes')
        if (response.ok) {
          const data = await response.json()
          setTaxCodes(data.taxCodes || data.tax_codes || [])
        }
      } catch (error) {
        console.error('Error fetching tax codes:', error)
      } finally {
        setLoadingTaxCodes(false)
      }
    }

    if (open) {
      fetchTaxCodes()
    }
  }, [open])

  // Set auto-generated code
  useEffect(() => {
    if (!isEditMode && nextCode && !manualCode) {
      form.setValue('code', nextCode)
    }
  }, [nextCode, isEditMode, manualCode, form])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setShowSuccess(false)
      setCreatedSupplier(null)
      setFormErrors([])
      setCodeError(null)
      setManualCode(isEditMode)

      form.reset({
        code: supplier?.code || nextCode || '',
        name: supplier?.name || '',
        contact_name: supplier?.contact_name || '',
        contact_email: supplier?.contact_email || '',
        contact_phone: supplier?.contact_phone || '',
        address: supplier?.address || '',
        city: supplier?.city || '',
        postal_code: supplier?.postal_code || '',
        country: supplier?.country || '',
        currency: supplier?.currency || 'PLN',
        tax_code_id: supplier?.tax_code_id || '',
        payment_terms: supplier?.payment_terms || '',
        notes: supplier?.notes || '',
        is_active: supplier?.is_active ?? true,
      })
    }
  }, [open, supplier, nextCode, isEditMode, form])

  // Validate code uniqueness (debounced)
  const validateCode = useCallback(
    async (code: string) => {
      if (!code || code.length < 2) return

      setCodeValidating(true)
      setCodeError(null)

      try {
        const params = new URLSearchParams({ code })
        if (supplier?.id) params.append('exclude_id', supplier.id)

        const response = await fetch(`/api/planning/suppliers/validate-code?${params}`)
        if (response.ok) {
          const data = await response.json()
          if (data.exists || data.valid === false) {
            setCodeError('Code already exists in system')
          }
        } else {
          // Fallback check
          const listResponse = await fetch('/api/planning/suppliers')
          if (listResponse.ok) {
            const listData = await listResponse.json()
            const exists = (listData.suppliers || []).some(
              (s: Supplier) => s.code === code && s.id !== supplier?.id
            )
            if (exists) {
              setCodeError('Code already exists in system')
            }
          }
        }
      } catch (error) {
        console.error('Code validation error:', error)
      } finally {
        setCodeValidating(false)
      }
    },
    [supplier?.id]
  )

  // Handle code blur
  const handleCodeBlur = useCallback(() => {
    const code = form.getValues('code')
    validateCode(code)
  }, [form, validateCode])

  // Handle form submit
  const onSubmit: SubmitHandler<SupplierFormData> = async (data) => {
    setFormErrors([])

    // Check code error
    if (codeError) {
      setFormErrors(['Please fix the supplier code error'])
      return
    }

    try {
      let result: Supplier

      if (isEditMode && supplier) {
        const updateData: UpdateSupplierDto = {
          name: data.name,
          contact_name: data.contact_name || undefined,
          contact_email: data.contact_email || undefined,
          contact_phone: data.contact_phone || undefined,
          address: data.address || undefined,
          city: data.city || undefined,
          postal_code: data.postal_code || undefined,
          country: data.country || undefined,
          currency: data.currency,
          tax_code_id: data.tax_code_id,
          payment_terms: data.payment_terms,
          notes: data.notes || undefined,
          is_active: data.is_active,
        }

        // Include code only if not locked
        if (!codeLocked) {
          updateData.code = data.code
        }

        result = await updateMutation.mutateAsync({ id: supplier.id, data: updateData })
      } else {
        const createData: CreateSupplierDto = {
          code: data.code,
          name: data.name,
          contact_name: data.contact_name || undefined,
          contact_email: data.contact_email || undefined,
          contact_phone: data.contact_phone || undefined,
          address: data.address || undefined,
          city: data.city || undefined,
          postal_code: data.postal_code || undefined,
          country: data.country || undefined,
          currency: data.currency,
          tax_code_id: data.tax_code_id,
          payment_terms: data.payment_terms,
          notes: data.notes || undefined,
          is_active: data.is_active,
        }

        result = await createMutation.mutateAsync(createData)
      }

      // Show success state
      setCreatedSupplier(result)
      setShowSuccess(true)

      // Auto-close after 2 seconds
      setTimeout(() => {
        toast({
          title: 'Success',
          description: `Supplier ${result.code} ${isEditMode ? 'updated' : 'created'} successfully`,
        })
        onSuccess(result)
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Error submitting supplier:', error)
      setFormErrors([error instanceof Error ? error.message : 'Failed to save supplier'])
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  // Success state
  if (showSuccess && createdSupplier) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent data-testid="modal-create-supplier">
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold">
              Supplier {isEditMode ? 'updated' : 'created'} successfully!
            </h3>
            <p className="text-muted-foreground mt-2">
              Code: {createdSupplier.code}
              <br />
              Name: {createdSupplier.name}
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              (Modal will close in 2 seconds...)
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        data-testid={isEditMode ? 'modal-edit-supplier' : 'modal-create-supplier'}
      >
        <DialogHeader>
          <DialogTitle>{isEditMode ? `Edit Supplier: ${supplier?.name}` : 'Create Supplier'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Update supplier details' : 'Create a new supplier'}
          </DialogDescription>
        </DialogHeader>

        {/* Error Banner */}
        {formErrors.length > 0 && (
          <Alert variant="destructive" data-testid="alert-validation-errors">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the following errors:
              <ul className="list-disc list-inside mt-1">
                {formErrors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Basic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Code Field */}
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Supplier Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-supplier-code"
                            disabled={codeLocked || (!manualCode && !isEditMode)}
                            placeholder={nextCode || 'SUP-001'}
                            onBlur={() => {
                              field.onBlur()
                              handleCodeBlur()
                            }}
                            className={codeError ? 'border-red-500' : ''}
                          />
                        </FormControl>
                        {codeLocked && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Lock
                                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                                  data-testid="icon-code-locked"
                                />
                              </TooltipTrigger>
                              <TooltipContent data-testid="tooltip-code-locked">
                                Cannot change code - supplier has purchase orders
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {codeValidating && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                        )}
                      </div>
                      {codeError && (
                        <p className="text-sm text-red-500" data-testid="error-code-exists">
                          {codeError}
                        </p>
                      )}
                      <FormMessage />
                      {!isEditMode && (
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox
                            id="manual-code"
                            checked={manualCode}
                            onCheckedChange={(checked) => setManualCode(checked as boolean)}
                            data-testid="checkbox-manual-code"
                          />
                          <label htmlFor="manual-code" className="text-sm text-muted-foreground">
                            Enter manually
                          </label>
                        </div>
                      )}
                    </FormItem>
                  )}
                />

                {/* Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Supplier Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-supplier-name"
                          placeholder="Supplier Name"
                        />
                      </FormControl>
                      <FormMessage data-testid="error-supplier-name" />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Contact Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contact_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="John Smith" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contact@supplier.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="+48 123 456 789" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Address Information</h3>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Street address..." rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Warsaw" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal Code</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="00-001" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMMON_COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name} ({country.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Business Terms */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Business Terms</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Currency <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-supplier-currency">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="PLN">PLN - Polish Zloty</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tax_code_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tax Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loadingTaxCodes}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-supplier-tax-code">
                            <SelectValue
                              placeholder={loadingTaxCodes ? 'Loading...' : 'Select tax code'}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {taxCodes.map((tc) => (
                            <SelectItem key={tc.id} value={tc.id}>
                              {tc.code} - {tc.description} ({tc.rate}%)
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
                  name="payment_terms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Payment Terms <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-payment-terms"
                          placeholder='e.g., "Net 30", "2/10 Net 30"'
                        />
                      </FormControl>
                      <FormDescription>Required. e.g., Net 30, 2/10 Net 30, COD</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Additional notes..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Active Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="is_active"
                    />
                  </FormControl>
                  <FormLabel htmlFor="is_active" className="cursor-pointer !mt-0">
                    Active
                  </FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                data-testid={isEditMode ? 'button-submit-edit' : 'button-submit-create'}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEditMode ? (
                  'Save Changes'
                ) : (
                  'Create Supplier'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
