/**
 * ProductAllergenSection Component (Story 02.3 - MVP)
 * Purpose: Main allergen management section for Product Detail page
 *
 * Features (MVP):
 * - Auto-Inheritance Banner (if BOM exists)
 * - Contains allergen list (direct presence)
 * - May Contain allergen list (cross-contamination)
 * - Add Allergen button (opens modal)
 * - Recalculate button (if BOM exists)
 * - Loading, empty, error states
 *
 * Excluded (Phase 1+):
 * - Risk assessment forms
 * - Free From section
 * - Allergen history panel
 * - Label generation
 *
 * Props:
 * - productId: Product UUID
 *
 * Usage:
 * <ProductAllergenSection productId={product.id} />
 */

'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { InheritanceBanner } from './inheritance-banner'
import { AllergenList } from './allergen-list'
import { AddAllergenModal } from './add-allergen-modal'
import { useToast } from '@/hooks/use-toast'
import type { ProductAllergen, ProductAllergensResponse } from '@/lib/types/product-allergen'

interface ProductAllergenSectionProps {
  productId: string
  className?: string
}

export function ProductAllergenSection({
  productId,
  className,
}: ProductAllergenSectionProps) {
  const { toast } = useToast()

  const [data, setData] = React.useState<ProductAllergensResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isRecalculating, setIsRecalculating] = React.useState(false)
  const [showAddModal, setShowAddModal] = React.useState(false)

  // Load allergens on mount
  React.useEffect(() => {
    loadAllergens()
  }, [productId])

  async function loadAllergens() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/v1/technical/products/${productId}/allergens`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found')
        }
        throw new Error('Failed to load allergens')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allergens')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRecalculate() {
    if (!data?.inheritance_status.bom_version) {
      toast({
        title: 'No BOM Found',
        description: 'This product does not have an active BOM to recalculate from.',
        variant: 'destructive',
      })
      return
    }

    setIsRecalculating(true)

    try {
      // TODO: Get BOM ID from product data (for now, assume endpoint exists)
      const response = await fetch(`/api/v1/technical/products/${productId}/allergens/recalculate`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to recalculate allergens')
      }

      toast({
        title: 'Allergens Recalculated',
        description: 'Allergen inheritance has been updated from the current BOM.',
      })

      // Reload allergens
      await loadAllergens()
    } catch (err) {
      toast({
        title: 'Recalculation Failed',
        description: err instanceof Error ? err.message : 'Failed to recalculate allergens',
        variant: 'destructive',
      })
    } finally {
      setIsRecalculating(false)
    }
  }

  async function handleRemoveAllergen(allergen: ProductAllergen) {
    if (!confirm(`Remove ${allergen.allergen_name} from allergen declarations?`)) {
      return
    }

    try {
      const response = await fetch(
        `/api/v1/technical/products/${productId}/allergens/${allergen.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to remove allergen')
      }

      toast({
        title: 'Allergen Removed',
        description: `${allergen.allergen_name} has been removed from allergen declarations.`,
      })

      // Reload allergens
      await loadAllergens()
    } catch (err) {
      toast({
        title: 'Remove Failed',
        description: err instanceof Error ? err.message : 'Failed to remove allergen',
        variant: 'destructive',
      })
    }
  }

  function handleAddSuccess() {
    toast({
      title: 'Allergen Added',
      description: 'Allergen declaration has been added successfully.',
    })
    loadAllergens()
  }

  // Loading State
  if (isLoading) {
    return (
      <div className={className}>
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  // Error State
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadAllergens}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!data) {
    return null
  }

  // Separate allergens by relation type
  const containsAllergens = data.allergens.filter((a) => a.relation_type === 'contains')
  const mayContainAllergens = data.allergens.filter((a) => a.relation_type === 'may_contain')

  const hasBom = !!data.inheritance_status.bom_version
  const hasAnyAllergens = data.allergens.length > 0

  // Empty State
  if (!hasAnyAllergens) {
    return (
      <div className={className}>
        {hasBom && (
          <InheritanceBanner
            inheritanceStatus={data.inheritance_status}
            onRecalculate={handleRecalculate}
            loading={isRecalculating}
            className="mb-6"
          />
        )}

        <div className="text-center py-12 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            No Allergens Declared
          </h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            {hasBom
              ? 'This product has no allergen declarations. Add allergens manually or recalculate from BOM.'
              : 'This product has no BOM. Allergen auto-inheritance requires a Bill of Materials. You can add allergens manually.'}
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Allergen
            </Button>
            {hasBom && (
              <Button variant="outline" onClick={handleRecalculate} disabled={isRecalculating}>
                Calculate from BOM
              </Button>
            )}
          </div>
        </div>

        <AddAllergenModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          productId={productId}
          onSuccess={handleAddSuccess}
        />
      </div>
    )
  }

  // Success State (with allergens)
  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Inheritance Banner */}
        {hasBom && (
          <InheritanceBanner
            inheritanceStatus={data.inheritance_status}
            onRecalculate={handleRecalculate}
            loading={isRecalculating}
          />
        )}

        {/* Contains Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Contains (Present in Product)
            </h3>
            <Button onClick={() => setShowAddModal(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Allergen
            </Button>
          </div>
          <AllergenList
            allergens={containsAllergens}
            onRemove={handleRemoveAllergen}
          />
        </div>

        {/* May Contain Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              May Contain (Cross-Contamination Risk)
            </h3>
          </div>
          <AllergenList
            allergens={mayContainAllergens}
            onRemove={handleRemoveAllergen}
          />
        </div>
      </div>

      <AddAllergenModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        productId={productId}
        onSuccess={handleAddSuccess}
      />
    </div>
  )
}
