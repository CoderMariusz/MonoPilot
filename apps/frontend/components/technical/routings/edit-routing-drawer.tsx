/**
 * Edit Routing Drawer
 * Story: 2.24 Routing Restructure
 * AC-2.24.5: Update routing (name can be changed)
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
import { Switch } from '@/components/ui/switch'
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
      is_active: routing.is_active,
    },
  })

  // Update form when routing changes
  useEffect(() => {
    form.reset({
      name: routing.name,
      description: routing.description || '',
      is_active: routing.is_active,
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

        // Handle duplicate name
        if (error.error?.includes('name already exists')) {
          form.setError('name', {
            message: error.error || 'Routing name already exists',
          })
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
          <SheetTitle>Edit Routing</SheetTitle>
          <SheetDescription>
            Update routing details.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
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
