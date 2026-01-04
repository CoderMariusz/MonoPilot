/**
 * Edit ASN Page
 * Story 05.8: ASN Management
 * AC-11: Edit ASN when status is pending
 */

'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { useASN, useUpdateASN } from '@/lib/hooks/use-asns'
import { updateASNSchema, type UpdateASNInput } from '@/lib/validation/asn-schemas'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditASNPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()

  const { data: asn, isLoading, error } = useASN(id)
  const updateASN = useUpdateASN()

  const form = useForm<UpdateASNInput>({
    resolver: zodResolver(updateASNSchema),
    defaultValues: {
      expected_date: '',
      carrier: '',
      tracking_number: '',
      notes: '',
    },
  })

  // Pre-fill form when data loads
  useEffect(() => {
    if (asn) {
      // Check if ASN can be edited
      if (asn.status !== 'pending') {
        toast({
          title: 'Error',
          description: `Cannot modify ASN in ${asn.status} status`,
          variant: 'destructive',
        })
        router.push(`/warehouse/asns/${id}`)
        return
      }

      form.reset({
        expected_date: asn.expected_date,
        carrier: asn.carrier || '',
        tracking_number: asn.tracking_number || '',
        notes: asn.notes || '',
      })
    }
  }, [asn, form, toast, router, id])

  const onSubmit = async (data: UpdateASNInput) => {
    try {
      await updateASN.mutateAsync({ id, data })
      toast({
        title: 'Success',
        description: 'ASN updated successfully',
      })
      router.push(`/warehouse/asns/${id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update ASN',
        variant: 'destructive',
      })
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  // Error state
  if (error || !asn) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading ASN</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {error?.message || 'ASN not found'}
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Edit ASN</h1>
          <p className="text-muted-foreground text-sm">{asn.asn_number}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* PO and Supplier (read-only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FormLabel>Purchase Order</FormLabel>
              <Input value={asn.po_number} disabled className="bg-muted" />
            </div>
            <div>
              <FormLabel>Supplier</FormLabel>
              <Input value={asn.supplier_name} disabled className="bg-muted" />
            </div>
          </div>

          {/* Expected Date */}
          <FormField
            control={form.control}
            name="expected_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Carrier */}
          <FormField
            control={form.control}
            name="carrier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Carrier</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., FedEx, UPS, DHL"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tracking Number */}
          <FormField
            control={form.control}
            name="tracking_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tracking Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter tracking number"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Notes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any notes about this shipment"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateASN.isPending}>
              {updateASN.isPending ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
