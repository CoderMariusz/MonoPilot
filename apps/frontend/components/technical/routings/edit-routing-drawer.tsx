/**
 * Edit Routing Drawer
 * Story: 2.15 Routing CRUD
 * AC-015.6: Edit routing drawer (code immutable)
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateRoutingSchema, type UpdateRoutingInput } from '@/lib/validation/routing-schemas'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface EditRoutingDrawerProps {
  routing: Routing
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EditRoutingDrawer({ routing, open, onClose, onSuccess }: EditRoutingDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<UpdateRoutingInput>({
    resolver: zodResolver(updateRoutingSchema),
    defaultValues: {
      name: routing.name,
      description: routing.description || '',
      status: routing.status,
      is_reusable: routing.is_reusable,
    },
  })

  // Update form when routing changes
  useEffect(() => {
    form.reset({
      name: routing.name,
      description: routing.description || '',
      status: routing.status,
      is_reusable: routing.is_reusable,
    })
  }, [routing, form])

  const onSubmit = async (data: UpdateRoutingInput) => {
    try {
      setSubmitting(true)

      const response = await fetch(`/api/technical/routings/${routing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
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
          <SheetTitle>Edit Routing</SheetTitle>
          <SheetDescription>
            Update routing details. Code cannot be changed after creation.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            {/* Code Field (Disabled - AC-015.6) */}
            <FormItem>
              <FormLabel>Code</FormLabel>
              <FormControl>
                <Input value={routing.code} disabled className="font-mono bg-muted" />
              </FormControl>
              <FormDescription>Code cannot be changed after creation</FormDescription>
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
                  <FormDescription>1-100 characters</FormDescription>
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
                  <FormDescription>Optional, max 1000 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Field */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reusable Checkbox */}
            <FormField
              control={form.control}
              name="is_reusable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      This routing can be assigned to multiple products
                    </FormLabel>
                    <FormDescription>
                      If unchecked, routing can only be assigned to one product
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

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
