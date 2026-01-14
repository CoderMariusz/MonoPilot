/**
 * Create BOM Page (Story 02.4 - TEC-006)
 * Form for creating a new Bill of Materials
 *
 * Features:
 * - Product selector with search
 * - Date range with validation
 * - Auto-versioning display
 * - Form validation with Zod
 * - All 4 UI states
 * - Keyboard navigation
 *
 * Acceptance Criteria:
 * - AC-08 to AC-13: Create BOM with all fields
 */

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TechnicalHeader } from '@/components/technical/TechnicalHeader'
import { BOMHeaderForm } from '@/components/technical/bom/BOMHeaderForm'
import { useCreateBOM } from '@/lib/hooks/use-boms'
import { useToast } from '@/hooks/use-toast'
import type { BOMFormData } from '@/lib/types/bom'

export default function CreateBOMPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  // Get pre-selected product from URL if provided
  const preSelectedProductId = searchParams.get('product_id')

  // Create mutation
  const createMutation = useCreateBOM()

  // Handle form submission
  const handleSubmit = async (data: BOMFormData) => {
    setError(null)

    try {
      const newBom = await createMutation.mutateAsync({
        product_id: data.product_id,
        effective_from: data.effective_from,
        effective_to: data.effective_to || undefined,
        status: data.status,
        output_qty: data.output_qty,
        output_uom: data.output_uom,
        yield_percent: data.yield_percent,
        notes: data.notes || undefined,
      })

      toast({
        title: 'Success',
        description: `BOM v${newBom.version} created successfully`,
      })

      // Navigate to the new BOM detail page
      router.push(`/technical/boms/${newBom.id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create BOM'
      setError(errorMessage)

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    }
  }

  // Handle cancel
  const handleCancel = () => {
    router.push('/technical/boms')
  }

  return (
    <div>
      <TechnicalHeader currentPage="boms" />

      <div className="container mx-auto py-6 px-4 max-w-3xl">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push('/technical/boms')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to BOMs
        </Button>

        {/* Page Header */}
        <Card>
          <CardHeader>
            <CardTitle>Create Bill of Materials</CardTitle>
            <CardDescription>
              Define a new BOM for a finished good or work-in-progress product.
              The version number will be automatically assigned based on existing
              BOMs for the selected product.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <BOMHeaderForm
              mode="create"
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={createMutation.isPending}
              error={error}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
