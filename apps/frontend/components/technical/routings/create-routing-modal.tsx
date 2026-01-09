/**
 * Create Routing Modal
 * Story: 02.7 Routings CRUD
 * Wireframe: TEC-008 (Routing Modal)
 *
 * Creates routing with:
 * - code: unique identifier (uppercase alphanumeric + hyphens)
 * - name: descriptive name
 * - description: optional details
 * - is_active: active/inactive status
 * - is_reusable: can be shared across BOMs
 * - Cost fields: setup_cost, working_cost_per_unit, overhead_percent, currency (ADR-009)
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createRoutingSchemaV1 } from '@/lib/validation/routing-schemas'

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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Separator } from '@/components/ui/separator'

// Use z.input type for form (before zod transforms)
type FormInput = z.input<typeof createRoutingSchemaV1>

interface CreateRoutingModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

const CURRENCIES = [
  { value: 'PLN', label: 'PLN - Polish Zloty' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'GBP', label: 'GBP - British Pound' },
]

export function CreateRoutingModal({ open, onClose, onSuccess }: CreateRoutingModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormInput>({
    resolver: zodResolver(createRoutingSchemaV1),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      is_active: true,
      is_reusable: true,
      setup_cost: 0,
      working_cost_per_unit: 0,
      overhead_percent: 0,
      currency: 'PLN',
    },
  })

  const onSubmit = async (data: FormInput) => {
    try {
      setSubmitting(true)

      // Use V1 API endpoint
      const response = await fetch('/api/v1/technical/routings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()

        // Handle duplicate code
        if (error.error?.includes('Code') && error.error?.includes('already exists')) {
          form.setError('code', {
            message: error.error,
          })
          return
        }

        // Handle code validation errors
        if (error.error?.includes('Code must be at least')) {
          form.setError('code', { message: error.error })
          return
        }

        if (error.error?.includes('uppercase letters')) {
          form.setError('code', { message: error.error })
          return
        }

        // Handle name validation
        if (error.error?.includes('name is required')) {
          form.setError('name', { message: error.error })
          return
        }

        // Handle cost validation
        if (error.error?.includes('Overhead percentage')) {
          form.setError('overhead_percent', { message: error.error })
          return
        }

        if (error.error?.includes('Setup cost')) {
          form.setError('setup_cost', { message: error.error })
          return
        }

        throw new Error(error.error || 'Failed to create routing')
      }

      toast({
        title: 'Success',
        description: 'Routing created. Now add production operations.',
      })

      form.reset()
      onSuccess()
    } catch (error) {
      console.error('Error creating routing:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create routing',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Routing</DialogTitle>
          <DialogDescription>
            Define a new production routing template. Routings can be assigned to BOMs.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>

              {/* Code Field */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., RTG-BREAD-01"
                        className="uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>
                      Unique identifier. Uppercase letters, numbers, and hyphens only.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Standard Bread Production" />
                    </FormControl>
                    <FormDescription>
                      Descriptive name, 1-100 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description Field */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe this routing..."
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>Optional, max 500 characters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Status Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Status & Reusability</h3>

              {/* Active Switch */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Active routings can be assigned to BOMs
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Reusable Switch */}
              <FormField
                control={form.control}
                name="is_reusable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-md border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Reusable</FormLabel>
                      <FormDescription>
                        Can be shared across multiple BOMs
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Cost Configuration Section (ADR-009) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Cost Configuration</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Setup Cost */}
                <FormField
                  control={form.control}
                  name="setup_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setup Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Fixed cost per run</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Working Cost per Unit */}
                <FormField
                  control={form.control}
                  name="working_cost_per_unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Working Cost / Unit</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.0001"
                          min="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Variable cost per output unit</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Overhead Percent */}
                <FormField
                  control={form.control}
                  name="overhead_percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overhead %</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>Factory overhead percentage (0-100)</FormDescription>
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
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency.value} value={currency.value}>
                              {currency.label}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Routing'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
