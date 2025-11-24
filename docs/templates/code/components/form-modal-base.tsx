// Component: Form Modal Base
// Location: apps/frontend/components/{module}/{Resource}FormModal.tsx
// Replace: {Resource}, {resource}, {module}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { create{Resource}Schema, type Create{Resource}Input } from '@/lib/validation/{resource}-schemas'
import { toast } from 'sonner'

interface {Resource}FormModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  editMode?: boolean
  initialData?: Create{Resource}Input & { id?: string }
}

export function {Resource}FormModal({
  open,
  onClose,
  onSuccess,
  editMode = false,
  initialData
}: {Resource}FormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<Create{Resource}Input>({
    resolver: zodResolver(create{Resource}Schema),
    defaultValues: initialData || {
      code: '',
      name: '',
      status: 'active',
    },
  })

  const onSubmit = async (data: Create{Resource}Input) => {
    setIsSubmitting(true)

    try {
      const url = editMode && initialData?.id
        ? `/api/{module}/{resources}/${initialData.id}`
        : `/api/{module}/{resources}`

      const method = editMode ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        const action = editMode ? 'updated' : 'created'
        toast.success(`{Resource} ${action} successfully`)
        form.reset()
        onClose()
        onSuccess?.()
      } else {
        const error = await res.json()
        toast.error(error.error || `Failed to ${editMode ? 'update' : 'create'} {resource}`)
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editMode ? 'Edit {Resource}' : 'Create {Resource}'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., ITEM-001"
                      {...field}
                      disabled={editMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Main Item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : editMode ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
