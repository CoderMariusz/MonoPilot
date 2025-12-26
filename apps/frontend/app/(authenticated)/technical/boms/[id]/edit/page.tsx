/**
 * Edit BOM Page (Story 02.4 - TEC-006)
 * Form for editing an existing Bill of Materials
 *
 * Features:
 * - Product selector locked (cannot change product)
 * - Date range with validation
 * - Status change
 * - Form validation with Zod
 * - All 4 UI states
 * - Keyboard navigation
 *
 * Acceptance Criteria:
 * - AC-14 to AC-17: Edit BOM (product locked)
 * - AC-18 to AC-20: Date range validation
 */

'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TechnicalHeader } from '@/components/technical/TechnicalHeader'
import { BOMHeaderForm } from '@/components/technical/bom/BOMHeaderForm'
import { useBOM, useUpdateBOM } from '@/lib/hooks/use-boms'
import { useToast } from '@/hooks/use-toast'
import type { BOMFormData } from '@/lib/types/bom'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EditBOMPage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { toast } = useToast()
  const [error, setError] = useState<string | null>(null)

  // Fetch BOM data
  const {
    data: bom,
    isLoading,
    error: fetchError,
    refetch,
  } = useBOM(id)

  // Update mutation
  const updateMutation = useUpdateBOM()

  // Handle form submission
  const handleSubmit = async (data: BOMFormData) => {
    setError(null)

    try {
      await updateMutation.mutateAsync({
        id,
        data: {
          effective_from: data.effective_from,
          effective_to: data.effective_to || undefined,
          status: data.status,
          output_qty: data.output_qty,
          output_uom: data.output_uom,
          notes: data.notes || undefined,
        },
      })

      toast({
        title: 'Success',
        description: 'BOM updated successfully',
      })

      // Navigate back to detail page
      router.push(`/technical/boms/${id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update BOM'
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
    router.push(`/technical/boms/${id}`)
  }

  // Loading State
  if (isLoading) {
    return (
      <div>
        <TechnicalHeader currentPage="boms" />
        <div className="container mx-auto py-6 px-4 max-w-3xl">
          <Button variant="ghost" className="mb-4" disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOM
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="text-muted-foreground">Loading BOM...</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Error State
  if (fetchError) {
    return (
      <div>
        <TechnicalHeader currentPage="boms" />
        <div className="container mx-auto py-6 px-4 max-w-3xl">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/technical/boms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOMs
          </Button>

          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  Failed to Load BOM
                </h2>
                <p className="text-muted-foreground mb-4">
                  {fetchError instanceof Error
                    ? fetchError.message
                    : 'Unable to load BOM for editing'}
                </p>
                <Button onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Empty State (BOM not found)
  if (!bom) {
    return (
      <div>
        <TechnicalHeader currentPage="boms" />
        <div className="container mx-auto py-6 px-4 max-w-3xl">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push('/technical/boms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOMs
          </Button>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-slate-300 mb-4" />
                <h2 className="text-xl font-semibold text-slate-900 mb-2">
                  BOM Not Found
                </h2>
                <p className="text-muted-foreground mb-4">
                  The requested BOM could not be found. It may have been deleted.
                </p>
                <Button onClick={() => router.push('/technical/boms')}>
                  View All BOMs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success State - Edit Form
  return (
    <div>
      <TechnicalHeader currentPage="boms" />

      <div className="container mx-auto py-6 px-4 max-w-3xl">
        {/* Back button */}
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => router.push(`/technical/boms/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to BOM
        </Button>

        {/* Edit Card */}
        <Card>
          <CardHeader>
            <CardTitle>Edit Bill of Materials</CardTitle>
            <CardDescription>
              Update the BOM for{' '}
              <span className="font-mono font-medium">
                {bom.product?.code}
              </span>{' '}
              v{bom.version}. The product cannot be changed after creation.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <BOMHeaderForm
              mode="edit"
              bom={bom}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={updateMutation.isPending}
              error={error}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
