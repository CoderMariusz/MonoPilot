/**
 * Edit Routing Drawer
 * Story: 02.7 Routings CRUD
 * Wireframe: TEC-008 (Routing Modal)
 *
 * Updates routing with:
 * - code: displayed but READ-ONLY (immutable after creation, FR-2.54)
 * - name: descriptive name
 * - description: optional details
 * - is_active: active/inactive status
 * - is_reusable: can be shared across BOMs
 * - Cost fields: setup_cost, working_cost_per_unit, overhead_percent, currency (ADR-009)
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateRoutingSchemaV1, type UpdateRoutingInputV1 } from '@/lib/validation/routing-schemas'
import type { Routing } from '@/lib/services/routing-service'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'

interface EditRoutingDrawerProps {
  routing: Routing
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

export function EditRoutingDrawer({ routing, open, onClose, onSuccess }: EditRoutingDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  // Ensure currency is a valid option
  const getCurrency = (c: string | undefined): 'PLN' | 'EUR' | 'USD' | 'GBP' => {
    if (c === 'PLN' || c === 'EUR' || c === 'USD' || c === 'GBP') return c
    return 'PLN'
  }

  const form = useForm<UpdateRoutingInputV1>({
    resolver: zodResolver(updateRoutingSchemaV1),
    defaultValues: {
      name: routing.name,
      description: routing.description || '',
      is_active: routing.is_active,
      is_reusable: routing.is_reusable ?? true,
      setup_cost: routing.setup_cost ?? 0,
      working_cost_per_unit: routing.working_cost_per_unit ?? 0,
      overhead_percent: routing.overhead_percent ?? 0,
      currency: getCurrency(routing.currency),
    },
  })

  // Update form when routing changes
  useEffect(() => {
    form.reset({
      name: routing.name,
      description: routing.description || '',
      is_active: routing.is_active,
      is_reusable: routing.is_reusable ?? true,
      setup_cost: routing.setup_cost ?? 0,
      working_cost_per_unit: routing.working_cost_per_unit ?? 0,
      overhead_percent: routing.overhead_percent ?? 0,
      currency: getCurrency(routing.currency),
    })
  }, [routing, form])

  const onSubmit = async (data: UpdateRoutingInputV1) => {
    try {
      setSubmitting(true)

      // Use V1 API endpoint
      const response = await fetch(`/api/v1/technical/routings/${routing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()

        // Handle duplicate name
        if (error.error?.includes('name already exists')) {
          form.setError('name', {
            message: error.error || 'Routing name already exists',
          })
          return
        }

        // Handle code change attempt (code is immutable)
        if (error.error?.includes('Code cannot be changed')) {
          toast({
            title: 'Error',
            description: error.error,
            variant: 'destructive',
          })
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

        throw new Error(error.error || 'Failed to update routing')
      }

      toast({
        title: 'Success',
        description: 'Routing updated successfully',
      })

      onSuccess()
    } catch (error) {
      console.error('Error updating routing:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update routing',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <SheetTitle>Edit Routing - {routing.code || 'N/A'}</SheetTitle>
            {routing.version && (
              <Badge variant="outline">Version: v{routing.version}</Badge>
            )}
          </div>
          <SheetDescription>
            Update routing details. Code cannot be changed after creation.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Basic Information</h3>

              {/* Code Field - Read Only */}
              <FormItem>
                <FormLabel>Code</FormLabel>
                <Input
                  value={routing.code || 'N/A'}
                  disabled
                  className="bg-muted"
                />
                <FormDescription>
                  Code cannot be changed after creation
                </FormDescription>
              </FormItem>

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
                    <FormDescription>1-100 characters, must be unique</FormDescription>
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
                        value={field.value ?? ''}
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
                          value={field.value ?? 0}
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
                          value={field.value ?? 0}
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
                          value={field.value ?? 0}
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
                      <Select onValueChange={field.onChange} value={field.value ?? 'PLN'}>
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

            <SheetFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  )
}
