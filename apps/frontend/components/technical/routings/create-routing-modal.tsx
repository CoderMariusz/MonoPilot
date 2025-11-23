/**
 * Create Routing Modal
 * Story: 2.15 Routing CRUD
 * AC-015.3: Create routing modal with validation
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createRoutingSchema, type CreateRoutingInput } from '@/lib/validation/routing-schemas'
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

interface CreateRoutingModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateRoutingModal({ open, onClose, onSuccess }: CreateRoutingModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<CreateRoutingInput>({
    resolver: zodResolver(createRoutingSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      status: 'active',
      is_reusable: true,
    },
  })

  const onSubmit = async (data: CreateRoutingInput) => {
    try {
      setSubmitting(true)

      const response = await fetch('/api/technical/routings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()

        // AC-015.4: Handle duplicate code
        if (response.status === 409) {
          form.setError('code', {
            message: error.error || 'Routing code already exists',
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
            Define a new production routing with operations and resource assignments.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Code Field (AC-015.1) */}
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
                      className="font-mono"
                      onChange={(e) => {
                        // AC-015.3: Auto-uppercase
                        field.onChange(e.target.value.toUpperCase())
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Routing code must be unique per organization (2-50 chars, uppercase alphanumeric + hyphens)
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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

            {/* Reusable Checkbox (AC-015.1) */}
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
