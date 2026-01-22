/**
 * Edit Specification Page
 * Story: 06.3 - Product Specifications
 *
 * Route: /quality/specifications/[id]/edit
 *
 * Features:
 * - Edit draft specification only
 * - All fields editable except product
 * - Redirect to detail page on success
 * - Validation and error handling
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
import { SpecificationForm } from '@/components/quality/specifications'
import { useSpecification, useUpdateSpecification } from '@/lib/hooks/use-specifications'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import type { CreateSpecificationInput } from '@/lib/types/quality'

export default function EditSpecificationPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const specId = params.id as string

  // Fetch specification
  const { data, isLoading, error } = useSpecification(specId)
  const updateMutation = useUpdateSpecification()

  const specification = data?.specification

  // Check if specification can be edited
  const canEdit = specification?.status === 'draft'

  const handleSubmit = async (formData: CreateSpecificationInput) => {
    try {
      // Remove product_id from update data (cannot be changed)
      const { product_id, ...updateData } = formData

      await updateMutation.mutateAsync({
        id: specId,
        data: updateData,
      })

      toast({
        title: 'Specification Updated',
        description: 'Changes have been saved.',
      })

      // Redirect to detail page
      router.push(`/quality/specifications/${specId}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update specification',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    router.push(`/quality/specifications/${specId}`)
  }

  // If not draft, show error
  if (!isLoading && specification && !canEdit) {
    return (
      <div className="container mx-auto py-6 px-4 max-w-3xl">
        <Card className="border-orange-200">
          <CardContent className="p-8">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <AlertCircle className="w-12 h-12 text-orange-400" />
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Cannot Edit Specification
                </h2>
                <p className="mt-2 text-slate-600">
                  Only draft specifications can be edited. This specification
                  has status: <span className="font-semibold">{specification.status}</span>.
                </p>
                <p className="mt-2 text-slate-600">
                  To make changes, clone this specification as a new version.
                </p>
              </div>
              <Button variant="outline" onClick={() => router.push(`/quality/specifications/${specId}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Specification
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Edit Specification</h1>
        <p className="text-slate-600 mt-1">
          Update the draft specification. Changes will be saved immediately.
        </p>
      </div>

      {/* Form */}
      <SpecificationForm
        specification={specification}
        loading={isLoading}
        error={error instanceof Error ? error.message : null}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        saving={updateMutation.isPending}
        isEdit={true}
      />
    </div>
  )
}
