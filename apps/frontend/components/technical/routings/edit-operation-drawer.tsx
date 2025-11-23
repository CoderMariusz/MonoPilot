/**
 * Edit Operation Drawer
 * Story: 2.16 Routing Operations
 * AC-016.4: Edit operation
 */

'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { updateOperationSchema, type UpdateOperationInput } from '@/lib/validation/routing-schemas'
import type { RoutingOperation } from '@/lib/services/routing-service'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface EditOperationDrawerProps {
  routingId: string
  operation: RoutingOperation
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

export function EditOperationDrawer({
  routingId,
  operation,
  open,
  onClose,
  onSuccess,
}: EditOperationDrawerProps) {
  const [submitting, setSubmitting] = useState(false)
  const [machines, setMachines] = useState<Machine[]>([])
  const [lines, setLines] = useState<ProductionLine[]>([])
  const { toast } = useToast()

  const form = useForm<UpdateOperationInput>({
    resolver: zodResolver(updateOperationSchema),
    defaultValues: {
      sequence: operation.sequence,
      operation_name: operation.operation_name,
      machine_id: operation.machine_id,
      line_id: operation.line_id,
      expected_duration_minutes: operation.expected_duration_minutes,
      expected_yield_percent: operation.expected_yield_percent,
      setup_time_minutes: operation.setup_time_minutes,
      labor_cost: operation.labor_cost,
    },
  })

  // Fetch resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const machinesRes = await fetch('/api/settings/machines?status=active')
        if (machinesRes.ok) {
          const machinesData = await machinesRes.json()
          setMachines(machinesData.machines || [])
        }

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

  // Update form when operation changes
  useEffect(() => {
    form.reset({
      sequence: operation.sequence,
      operation_name: operation.operation_name,
      machine_id: operation.machine_id,
      line_id: operation.line_id,
      expected_duration_minutes: operation.expected_duration_minutes,
      expected_yield_percent: operation.expected_yield_percent,
      setup_time_minutes: operation.setup_time_minutes,
      labor_cost: operation.labor_cost,
    })
  }, [operation, form])

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

        if (error.code === 'DUPLICATE_SEQUENCE') {
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
            Update operation details and assignments.
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
                    Execution order (1, 2, 3...). Must be unique within this routing.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Operation Name */}
            <FormField
              control={form.control}
              name="operation_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operation Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Mixing" />
                  </FormControl>
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

            {/* Production Line */}
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
                  <FormMessage />
                </FormItem>
              )}
            />

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
                  <FormMessage />
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
