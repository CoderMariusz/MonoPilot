/**
 * Create New Specification Page
 * Story: 06.3 - Product Specifications
 *
 * Route: /quality/specifications/new
 *
 * Features:
 * - Create new draft specification
 * - Product selection
 * - All required and optional fields
 * - Redirect to detail page on success
 */

'use client'

import { useRouter } from 'next/navigation'
import { SpecificationForm } from '@/components/quality/specifications'
import { useCreateSpecification } from '@/lib/hooks/use-specifications'
import { useToast } from '@/hooks/use-toast'
import type { CreateSpecificationInput } from '@/lib/types/quality'

export default function CreateSpecificationPage() {
  const router = useRouter()
  const { toast } = useToast()
  const createMutation = useCreateSpecification()

  const handleSubmit = async (data: CreateSpecificationInput) => {
    try {
      const result = await createMutation.mutateAsync(data)
      toast({
        title: 'Specification Created',
        description: `Draft specification ${result.specification.spec_number} has been created.`,
      })
      // Redirect to detail page
      router.push(`/quality/specifications/${result.specification.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create specification',
        variant: 'destructive',
      })
    }
  }

  const handleCancel = () => {
    router.push('/quality/specifications')
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-3xl">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Create Specification</h1>
        <p className="text-slate-600 mt-1">
          Create a new quality specification draft. After creation, it can be
          reviewed and approved to make it active.
        </p>
      </div>

      {/* Form */}
      <SpecificationForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        saving={createMutation.isPending}
        isEdit={false}
      />
    </div>
  )
}
