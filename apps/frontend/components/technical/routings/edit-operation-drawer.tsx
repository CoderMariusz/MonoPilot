/**
 * Edit Operation Drawer
 * Story: 2.24 Routing Restructure, Story 02.8 Routing Operations
 * AC-2.24.6: Edit operation with labor_cost_per_hour
 * AC-15-17: Instructions textarea
 * AC-18-21: Attachments upload
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateOperationSchema, type UpdateOperationInput } from '@/lib/validation/routing-schemas'
import type { RoutingOperation } from '@/lib/types/routing-operation'
import type { Attachment } from './attachment-upload'
import { AttachmentUpload } from './attachment-upload'
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
import { Separator } from '@/components/ui/separator'
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

interface EditOperationDrawerProps {
  routingId: string
  operation: RoutingOperation
  open: boolean
  onClose: () => void
  onSuccess: () => void
  /** Existing sequences for parallel operations detection */
  existingSequences?: number[]
}

interface Machine {
  id: string
  code: string
  name: string
}

// Extended schema for edit form
interface ExtendedUpdateOperationInput extends UpdateOperationInput {
  setup_time_minutes?: number
  cleanup_time_minutes?: number
  instructions?: string
}

export function EditOperationDrawer({
  routingId,
  operation,
  open,
  onClose,
  onSuccess,
  existingSequences = [],
}: EditOperationDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [showParallelInfo, setShowParallelInfo] = useState(false)
  const { toast } = useToast()

  const form = useForm<ExtendedUpdateOperationInput>({
    resolver: zodResolver(updateOperationSchema),
    defaultValues: {
      sequence: operation.sequence,
      name: operation.name,
      description: operation.description || '',
      machine_id: operation.machine_id || undefined,
      estimated_duration_minutes: operation.duration ?? undefined,
      labor_cost_per_hour: operation.labor_cost_per_hour ?? undefined,
      setup_time_minutes: operation.setup_time ?? 0,
      cleanup_time_minutes: operation.cleanup_time ?? 0,
      instructions: operation.instructions ?? '',
    },
  })

  // Watch sequence field for parallel ops info
  const watchedSequence = form.watch('sequence')

  useEffect(() => {
    // Show info if sequence is used by another operation (not this one)
    const otherSeqs = existingSequences.filter((_, idx) => {
      const ops = existingSequences
      return ops.filter(s => s === watchedSequence).length > 0 &&
             watchedSequence !== operation.sequence
    })
    setShowParallelInfo(
      watchedSequence !== operation.sequence &&
      existingSequences.includes(watchedSequence as number)
    )
  }, [watchedSequence, existingSequences, operation.sequence])

  // Fetch machines
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

  // Update form when operation changes
  useEffect(() => {
    form.reset({
      sequence: operation.sequence,
      name: operation.name,
      description: operation.description || '',
      machine_id: operation.machine_id || undefined,
      estimated_duration_minutes: operation.duration ?? undefined,
      labor_cost_per_hour: operation.labor_cost_per_hour ?? undefined,
      setup_time_minutes: operation.setup_time ?? 0,
      cleanup_time_minutes: operation.cleanup_time ?? 0,
      instructions: operation.instructions ?? '',
    })
    // Reset attachments
    setAttachments(operation.attachments || [])
  }, [operation, form])

  // Fetch attachments when drawer opens
  useEffect(() => {
    const fetchAttachments = async () => {
      if (!open || !operation.id) return
      try {
        const response = await fetch(
          `/api/v1/technical/routings/${routingId}/operations/${operation.id}/attachments`
        )
        if (response.ok) {
          const data = await response.json()
          setAttachments(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching attachments:', error)
      }
    }
    fetchAttachments()
  }, [open, routingId, operation.id])

  const onSubmit = async (data: UpdateOperationInput) => {
    try {
      setSubmitting(true)

      const response = await fetch(`/api/technical/routings/${routingId}/operations/${operation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()

        if (error.error?.includes('Sequence')) {
          form.setError('sequence', {
            message: error.error || 'Sequence already exists',
          })
          return
        }

        throw new Error(error.error || 'Failed to update operation')
      }

      toast({
        title: 'Success',
        description: 'Operation updated successfully',
      })

      onSuccess()
    } catch (error) {
      console.error('Error updating operation:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update operation',
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
          <SheetTitle>Edit Operation</SheetTitle>
          <SheetDescription>
            Update operation details.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
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

            {/* Operation Name */}
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
                      value={field.value ?? ''}
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
                    onValueChange={(value) => field.onChange(value === 'none' ? null : value)}
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
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
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
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
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
                    <FormDescription>Time to prepare equipment</FormDescription>
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
                    <FormDescription>Time to clean after operation</FormDescription>
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

            {/* Attachments Section (AC-18-21) */}
            <Separator className="my-6" />

            <AttachmentUpload
              routingId={routingId}
              operationId={operation.id}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />

            <Separator className="my-6" />

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
