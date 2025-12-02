/**
 * Create Routing Modal
 * Story: 2.24 Routing Restructure
 * AC-2.24.5: Create routing with name (unique per org)
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createRoutingSchema } from '@/lib/validation/routing-schemas'

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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

// Use z.input type for form (before zod transforms)
type FormInput = z.input<typeof createRoutingSchema>

interface CreateRoutingModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateRoutingModal({ open, onClose, onSuccess }: CreateRoutingModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<FormInput>({
    resolver: zodResolver(createRoutingSchema),
    defaultValues: {
      name: '',
      description: '',
      is_active: true,
    },
  })

  const onSubmit = async (data: FormInput) => {
    try {
      setSubmitting(true)

      const response = await fetch('/api/technical/routings', {
        method: 'POST',
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

        throw new Error(error.error || 'Failed to create routing')
      }

      toast({
        title: 'Success',
        description: 'Routing created successfully',
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Routing</DialogTitle>
          <DialogDescription>
            Define a new production routing template. Routings can be assigned to BOMs.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                    1-100 characters, must be unique within organization
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
