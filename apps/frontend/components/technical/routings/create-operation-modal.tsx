/**
 * Create Operation Modal
 * Story: 2.16 Routing Operations
 * AC-016.1: Add operation with machine/line assignment
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

interface ProductionLine {
  id: string
  code: string
  name: string
}

export function CreateOperationModal({ routingId, open, onClose, onSuccess }: CreateOperationModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])
  const [lines, setLines] = useState<ProductionLine[]>([])
  const { toast } = useToast()

  const form = useForm<CreateOperationInput>({
    resolver: zodResolver(createOperationSchema),
    defaultValues: {
      sequence: 1,
      operation_name: '',
      machine_id: null,
      line_id: null,
      expected_duration_minutes: 60,
      expected_yield_percent: 100.00,
      setup_time_minutes: 0,
      labor_cost: null,
    },
  })

  // AC-016.7: Fetch machines and lines for dropdowns
  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Fetch machines
        const machinesRes = await fetch('/api/settings/machines?status=active')
        if (machinesRes.ok) {
          const machinesData = await machinesRes.json()
          setMachines(machinesData.machines || [])
        }

        // Fetch production lines
        const linesRes = await fetch('/api/settings/lines?status=active')
        if (linesRes.ok) {
          const linesData = await linesRes.json()
          setLines(linesData.lines || [])
        }
      } catch (error) {
        console.error('Error fetching resources:', error)
      }
    }

    if (open) {
      fetchResources()
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

        // AC-016.6: Handle duplicate sequence
        if (error.code === 'DUPLICATE_SEQUENCE') {
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
              name="operation_name"
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

            <div className="grid grid-cols-2 gap-4">
              {/* Machine Dropdown (AC-016.7) */}
              <FormField
                control={form.control}
                name="machine_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Machine</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
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

              {/* Production Line Dropdown */}
              <FormField
                control={form.control}
                name="line_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Production Line</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select line (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {lines.map((line) => (
                          <SelectItem key={line.id} value={line.id}>
                            {line.code} - {line.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expected Duration */}
              <FormField
                control={form.control}
                name="expected_duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Duration (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Time to complete operation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Time to prepare</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Expected Yield */}
              <FormField
                control={form.control}
                name="expected_yield_percent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Yield (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>0.01 - 100.00</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Labor Cost */}
              <FormField
                control={form.control}
                name="labor_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labor Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseFloat(e.target.value) : null)
                        }
                      />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
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
