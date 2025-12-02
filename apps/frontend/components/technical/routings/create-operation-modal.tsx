/**
 * Create Operation Modal
 * Story: 2.24 Routing Restructure
 * AC-2.24.6: Add operation with labor_cost_per_hour
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createOperationSchema, type CreateOperationInput } from '@/lib/validation/routing-schemas'
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
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface CreateOperationModalProps {
  routingId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface Machine {
  id: string
  code: string
  name: string
}

export function CreateOperationModal({ routingId, open, onClose, onSuccess }: CreateOperationModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])
  const { toast } = useToast()

  const form = useForm<CreateOperationInput>({
    resolver: zodResolver(createOperationSchema),
    defaultValues: {
      sequence: 1,
      name: '',
      description: '',
      machine_id: undefined,
      estimated_duration_minutes: undefined,
      labor_cost_per_hour: undefined,
    },
  })

  // Fetch machines for dropdown
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const machinesRes = await fetch('/api/settings/machines?status=active')
        if (machinesRes.ok) {
          const machinesData = await machinesRes.json()
          setMachines(machinesData.machines || [])
        }
      } catch (error) {
        console.error('Error fetching machines:', error)
      }
    }

    if (open) {
      fetchMachines()
    }
  }, [open])

  const onSubmit = async (data: CreateOperationInput) => {
    try {
      setSubmitting(true)

      const response = await fetch(`/api/technical/routings/${routingId}/operations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()

        // Handle duplicate sequence
        if (error.error?.includes('Sequence')) {
          form.setError('sequence', {
            message: error.error || 'Sequence already exists',
          })
          return
        }

        throw new Error(error.error || 'Failed to create operation')
      }

      toast({
        title: 'Success',
        description: 'Operation added successfully',
      })

      form.reset()
      onSuccess()
    } catch (error) {
      console.error('Error creating operation:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create operation',
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
          <DialogTitle>Add Operation</DialogTitle>
          <DialogDescription>
            Define a new operation for this routing.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Sequence Field */}
            <FormField
              control={form.control}
              name="sequence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sequence *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Execution order (1, 2, 3...). Must be unique within this routing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Operation Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Mixing" />
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
                      placeholder="Describe the operation..."
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>Optional, max 500 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Machine Dropdown */}
            <FormField
              control={form.control}
              name="machine_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Machine</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select machine (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {machines.map((machine) => (
                        <SelectItem key={machine.id} value={machine.id}>
                          {machine.code} - {machine.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Estimated Duration */}
              <FormField
                control={form.control}
                name="estimated_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>0-10000 minutes</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Labor Cost Per Hour */}
              <FormField
                control={form.control}
                name="labor_cost_per_hour"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labor Cost Per Hour</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>0-9999.99</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Adding...' : 'Add Operation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
