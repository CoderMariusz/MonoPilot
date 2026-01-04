/**
 * Create ASN Page
 * Story 05.8: ASN Management
 * AC-3: Create ASN from PO with auto-populated items
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { useCreateASNFromPO } from '@/lib/hooks/use-asns'
import { createASNFromPOSchema, type CreateASNFromPOInput } from '@/lib/validation/asn-schemas'

// Mock PO data - in real implementation, this would come from an API
const MOCK_POS = [
  { id: '1', number: 'PO-2024-00123', supplier: 'Test Supplier', expected_date: '2024-03-01', items: 2 },
  { id: '2', number: 'PO-2024-00124', supplier: 'Another Supplier', expected_date: '2024-03-05', items: 3 },
]

export default function NewASNPage() {
  const router = useRouter()
  const { toast } = useToast()
  const createASN = useCreateASNFromPO()

  const [selectedPO, setSelectedPO] = useState<typeof MOCK_POS[0] | null>(null)
  const [items, setItems] = useState<any[]>([])

  const form = useForm<CreateASNFromPOInput>({
    resolver: zodResolver(createASNFromPOSchema),
    defaultValues: {
      po_id: '',
      expected_date: '',
      carrier: '',
      tracking_number: '',
      notes: '',
    },
  })

  const handlePOSelect = (poId: string) => {
    const po = MOCK_POS.find((p) => p.id === poId)
    if (!po) return

    setSelectedPO(po)
    form.setValue('po_id', poId)
    form.setValue('expected_date', po.expected_date)

    // Mock items - in real implementation, this would fetch from API
    setItems([
      { id: '1', product_code: 'RM-FLOUR-001', product_name: 'Wheat Flour', qty: 100, uom: 'kg' },
      { id: '2', product_code: 'RM-SUGAR-001', product_name: 'Sugar', qty: 50, uom: 'kg' },
    ])
  }

  const onSubmit = async (data: CreateASNFromPOInput) => {
    try {
      const result = await createASN.mutateAsync(data)
      toast({
        title: 'Success',
        description: 'ASN created successfully',
      })
      router.push(`/warehouse/asns/${result.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create ASN',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">New ASN</h1>
          <p className="text-muted-foreground text-sm">Create advance shipping notice from purchase order</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* PO Selection */}
          <FormField
            control={form.control}
            name="po_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Order *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    handlePOSelect(value)
                  }}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger name="po_id">
                      <SelectValue placeholder="Select a purchase order" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PO-2024-00123">PO-2024-00123 - Test Supplier</SelectItem>
                    <SelectItem value="PO-2024-00124">PO-2024-00124 - Another Supplier</SelectItem>
                    <SelectItem value="PO-2024-FULLY-RECEIVED" disabled>
                      PO-2024-FULLY-RECEIVED (Fully Received)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Supplier (auto-filled, read-only) */}
          {selectedPO && (
            <FormItem>
              <FormLabel>Supplier</FormLabel>
              <Input
                name="supplier"
                value={selectedPO.supplier}
                disabled
                className="bg-muted"
              />
            </FormItem>
          )}

          {/* Expected Date */}
          <FormField
            control={form.control}
            name="expected_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Date *</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                  />
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

          {/* Items Table (auto-populated from PO) */}
          {items.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Items</h3>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Code</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>UoM</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.product_code}</TableCell>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{item.uom}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={createASN.isPending}>
              {createASN.isPending ? 'Creating...' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
