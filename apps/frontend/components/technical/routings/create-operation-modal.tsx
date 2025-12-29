/**
 * Create Operation Modal
 * Story: 2.24 Routing Restructure, Story 02.8 Routing Operations
 * AC-2.24.6: Add operation with labor_cost_per_hour
 * AC-15-17: Instructions textarea
 * AC-18-21: Attachments upload (added after creation)
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Info } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CreateOperationModalProps {
  routingId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /** Existing sequences for parallel operations detection */
  existingSequences?: number[]
  /** Next available sequence number */
  nextSequence?: number
}

interface Machine {
  id: string
  code: string
  name: string
}

// Extended schema to include setup_time, cleanup_time, instructions
interface ExtendedCreateOperationInput extends CreateOperationInput {
  setup_time_minutes?: number
  cleanup_time_minutes?: number
  instructions?: string
}

export function CreateOperationModal({
  routingId,
  open,
  onClose,
  onSuccess,
  existingSequences = [],
  nextSequence = 1,
}: CreateOperationModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])
  const [showParallelInfo, setShowParallelInfo] = useState(false)
  const { toast } = useToast()

  const form = useForm<ExtendedCreateOperationInput>({
    resolver: zodResolver(createOperationSchema),
    defaultValues: {
      sequence: nextSequence,
      name: '',
      description: '',
      machine_id: undefined,
      estimated_duration_minutes: undefined,
      labor_cost_per_hour: undefined,
      setup_time_minutes: 0,
      cleanup_time_minutes: 0,
      instructions: '',
    },
  })

  // Watch sequence field for parallel ops info
  const watchedSequence = form.watch('sequence')

  useEffect(() => {
    if (watchedSequence && existingSequences.includes(watchedSequence)) {
      setShowParallelInfo(true)
    } else {
      setShowParallelInfo(false)
    }
  }, [watchedSequence, existingSequences])

  // Reset form when modal opens with correct next sequence
  useEffect(() => {
    if (open) {
      form.reset({
        sequence: nextSequence,
        name: '',
        description: '',
        machine_id: undefined,
        estimated_duration_minutes: undefined,
        labor_cost_per_hour: undefined,
        setup_time_minutes: 0,
        cleanup_time_minutes: 0,
        instructions: '',
      })
    }
  }, [open, nextSequence, form])

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
                    Order of operation. Use same sequence for parallel operations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Parallel operations info (AC-23) */}
            {showParallelInfo && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Sequence {watchedSequence} is already used. This operation will run in parallel
                  with existing operations at this sequence.
                </AlertDescription>
              </Alert>
            )}

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
                    <FormLabel>Expected Duration (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>How long this operation takes</FormDescription>
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
                    <FormDescription>Hourly labor rate</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Setup Time */}
              <FormField
                control={form.control}
                name="setup_time_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setup Time (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormDescription>Time to prepare equipment (default: 0)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cleanup Time */}
              <FormField
                control={form.control}
                name="cleanup_time_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cleanup Time (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormDescription>Time to clean after operation (default: 0)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Instructions (AC-15-17) */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ''}
                      placeholder="Step-by-step instructions for operators..."
                      rows={4}
                      maxLength={2000}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional, max 2000 characters ({(field.value?.length || 0)}/2000)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
