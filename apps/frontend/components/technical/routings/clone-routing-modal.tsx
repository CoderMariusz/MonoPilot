/**
 * Clone Routing Modal
 * Story: 02.7 - Routings CRUD
 * FR-2.47: Routing templates (clone functionality)
 *
 * Clones a routing with all operations:
 * - Shows source routing details (read-only)
 * - Editable new routing name and description
 * - Displays operation copy summary
 * - Pre-fills name with "- Copy" suffix
 * - Validates unique name
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info } from 'lucide-react'
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
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import type { Routing } from '@/lib/services/routing-service'

type FormInput = z.input<typeof createRoutingSchema>

interface CloneRoutingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceRouting: Routing | null
  onSuccess: () => void
}

export function CloneRoutingModal({
  open,
  onOpenChange,
  sourceRouting,
  onSuccess,
}: CloneRoutingModalProps) {
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

  // Pre-fill form when modal opens or sourceRouting changes
  useEffect(() => {
    if (open && sourceRouting) {
      form.reset({
        name: `${sourceRouting.name} - Copy`,
        description: sourceRouting.description || '',
        is_active: true,
      })
    }
  }, [open, sourceRouting, form])

  const onSubmit = async (data: FormInput) => {
    if (!sourceRouting) return

    try {
      setSubmitting(true)

      const response = await fetch(
        `/api/technical/routings/${sourceRouting.id}/clone`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            description: data.description,
          }),
        }
      )

      if (!response.ok) {
        const error = await response.json()

        // Handle 409 Conflict (duplicate name)
        if (response.status === 409 || error.error?.includes('already exists')) {
          form.setError('name', {
            message: 'Routing with this name already exists',
          })
          return
        }

        // Handle 404 (source not found)
        if (response.status === 404) {
          throw new Error('Source routing not found')
        }

        throw new Error(error.error || 'Failed to clone routing')
      }

      const result = await response.json()

      toast({
        title: 'Success',
        description: `Routing cloned successfully with ${result.data.operationsCount} operation(s)`,
      })

      form.reset()
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('Error cloning routing:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to clone routing',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onOpenChange(false)
  }

  if (!sourceRouting) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Clone Routing</DialogTitle>
          <DialogDescription>
            Create a copy of this routing with all operations
          </DialogDescription>
        </DialogHeader>

        {/* Source Routing Section (Read-Only) */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Source Routing:</span>
                <Badge variant="outline">
                  {sourceRouting.operations_count || 0} operations
                </Badge>
              </div>
              <h3 className="text-lg font-semibold">{sourceRouting.name}</h3>
              {sourceRouting.description && (
                <p className="text-sm text-muted-foreground">
                  {sourceRouting.description}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Operation Copy Summary Banner */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">
                All operations ({sourceRouting.operations_count || 0}) will be
                copied with their:
              </p>
              <ul className="ml-4 list-disc text-sm">
                <li>Sequence order</li>
                <li>Work center assignments</li>
                <li>Duration estimates</li>
                <li>Labor costs</li>
                <li>Instructions</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* New Routing Details Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Routing Name *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., Standard Bread Production - Copy"
                    />
                  </FormControl>
                  <FormDescription>
                    Must be unique within organization
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
                {submitting ? 'Cloning...' : 'Clone Routing'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
