/**
 * Shelf Life Configuration Modal Component
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Main modal dialog containing all shelf life configuration sections:
 * - Calculated Shelf Life Section
 * - Override Section
 * - Storage Conditions Section
 * - Best Before Section
 * - FEFO Settings Section
 * - Ingredient Shelf Life Table
 *
 * States:
 * - Loading: Spinner while fetching data
 * - Empty: No configuration, show CTAs
 * - Error: Inline field errors + actionable messages
 * - Success: All sections populated
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { ZodError } from 'zod'
import {
  useShelfLifeConfig,
  useUpdateShelfLifeConfig,
  useCalculateShelfLife,
} from '@/lib/hooks/use-shelf-life-config'
import { updateShelfLifeConfigSchema } from '@/lib/validation/shelf-life-schemas'
import type {
  StorageCondition,
  ShelfLifeMode,
  LabelFormat,
  PickingStrategy,
  EnforcementLevel,
  ShelfLifeFormState,
  ShelfLifeFormErrors,
  UpdateShelfLifeRequest,
} from '@/lib/types/shelf-life'

import { CalculatedShelfLifeSection } from './CalculatedShelfLifeSection'
import { OverrideSection } from './OverrideSection'
import { StorageConditionsSection } from './StorageConditionsSection'
import { BestBeforeSection } from './BestBeforeSection'
import { FEFOSettingsSection } from './FEFOSettingsSection'
import { IngredientShelfLifeTable } from './IngredientShelfLifeTable'

interface ShelfLifeConfigModalProps {
  productId: string
  productCode: string
  productName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave?: () => void
}

// Default form state
const defaultFormState: ShelfLifeFormState = {
  use_override: false,
  override_days: '',
  override_reason: '',
  processing_impact_days: '0',
  safety_buffer_percent: '20',
  storage_temp_min: '',
  storage_temp_max: '',
  storage_humidity_min: '',
  storage_humidity_max: '',
  storage_conditions: [],
  storage_instructions: '',
  shelf_life_mode: 'fixed',
  label_format: 'best_before_day',
  picking_strategy: 'FEFO',
  min_remaining_for_shipment: '',
  enforcement_level: 'warn',
  expiry_warning_days: '7',
  expiry_critical_days: '3',
}

export function ShelfLifeConfigModal({
  productId,
  productCode,
  productName,
  open,
  onOpenChange,
  onSave,
}: ShelfLifeConfigModalProps) {
  const { toast } = useToast()
  const [formState, setFormState] = useState<ShelfLifeFormState>(defaultFormState)
  const [errors, setErrors] = useState<ShelfLifeFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Queries and mutations
  const {
    data: shelfLifeData,
    isLoading: isLoadingConfig,
    error: loadError,
    refetch,
  } = useShelfLifeConfig(open ? productId : null)

  const updateMutation = useUpdateShelfLifeConfig(productId)
  const calculateMutation = useCalculateShelfLife(productId)

  // Reset form when modal opens or data changes
  useEffect(() => {
    if (open && shelfLifeData) {
      // Use flat structure from backend
      setFormState({
        use_override: shelfLifeData.override_days != null,
        override_days: shelfLifeData.override_days?.toString() || '',
        override_reason: shelfLifeData.override_reason || '',
        processing_impact_days: shelfLifeData.processing_impact_days?.toString() || '0',
        safety_buffer_percent: shelfLifeData.safety_buffer_percent?.toString() || '20',
        storage_temp_min: shelfLifeData.storage_temp_min?.toString() || '',
        storage_temp_max: shelfLifeData.storage_temp_max?.toString() || '',
        storage_humidity_min: shelfLifeData.storage_humidity_min?.toString() || '',
        storage_humidity_max: shelfLifeData.storage_humidity_max?.toString() || '',
        storage_conditions: shelfLifeData.storage_conditions || [],
        storage_instructions: shelfLifeData.storage_instructions || '',
        shelf_life_mode: shelfLifeData.shelf_life_mode || 'fixed',
        label_format: shelfLifeData.label_format || 'best_before_day',
        picking_strategy: shelfLifeData.picking_strategy || 'FEFO',
        min_remaining_for_shipment: shelfLifeData.min_remaining_for_shipment?.toString() || '',
        enforcement_level: shelfLifeData.enforcement_level || 'warn',
        expiry_warning_days: shelfLifeData.expiry_warning_days?.toString() || '7',
        expiry_critical_days: shelfLifeData.expiry_critical_days?.toString() || '3',
      })
      setErrors({})
    } else if (open && !shelfLifeData) {
      setFormState(defaultFormState)
      setErrors({})
    }
  }, [open, shelfLifeData])

  // Handle form field changes
  const handleChange = useCallback(
    (field: string, value: string | boolean | StorageCondition[]) => {
      setFormState((prev) => ({ ...prev, [field]: value }))
      // Clear error for this field
      if (errors[field as keyof ShelfLifeFormErrors]) {
        setErrors((prev) => {
          const newErrors = { ...prev }
          delete newErrors[field as keyof ShelfLifeFormErrors]
          return newErrors
        })
      }
    },
    [errors]
  )

  // Validate form data
  const validateForm = (): boolean => {
    try {
      const data: UpdateShelfLifeRequest = {
        use_override: formState.use_override,
        override_days: formState.override_days ? parseInt(formState.override_days, 10) : null,
        override_reason: formState.override_reason || null,
        processing_impact_days: parseInt(formState.processing_impact_days, 10) || 0,
        safety_buffer_percent: parseFloat(formState.safety_buffer_percent) || 20,
        storage_temp_min: formState.storage_temp_min
          ? parseFloat(formState.storage_temp_min)
          : null,
        storage_temp_max: formState.storage_temp_max
          ? parseFloat(formState.storage_temp_max)
          : null,
        storage_humidity_min: formState.storage_humidity_min
          ? parseFloat(formState.storage_humidity_min)
          : null,
        storage_humidity_max: formState.storage_humidity_max
          ? parseFloat(formState.storage_humidity_max)
          : null,
        storage_conditions: formState.storage_conditions,
        storage_instructions: formState.storage_instructions || null,
        shelf_life_mode: formState.shelf_life_mode,
        label_format: formState.label_format,
        picking_strategy: formState.picking_strategy,
        min_remaining_for_shipment: formState.min_remaining_for_shipment
          ? parseInt(formState.min_remaining_for_shipment, 10)
          : null,
        enforcement_level: formState.enforcement_level,
        expiry_warning_days: parseInt(formState.expiry_warning_days, 10) || 7,
        expiry_critical_days: parseInt(formState.expiry_critical_days, 10) || 3,
      }

      updateShelfLifeConfigSchema.parse(data)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: ShelfLifeFormErrors = {}
        error.errors.forEach((err) => {
          const field = err.path[0] as keyof ShelfLifeFormErrors
          fieldErrors[field] = err.message
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  // Handle recalculate
  const handleRecalculate = async () => {
    try {
      await calculateMutation.mutateAsync(true)
      toast({
        title: 'Recalculation Complete',
        description: 'Shelf life has been recalculated from ingredients.',
      })
      await refetch()
    } catch (error) {
      toast({
        title: 'Recalculation Failed',
        description: error instanceof Error ? error.message : 'Failed to recalculate shelf life',
        variant: 'destructive',
      })
    }
  }

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const data: UpdateShelfLifeRequest = {
        use_override: formState.use_override,
        override_days: formState.override_days ? parseInt(formState.override_days, 10) : null,
        override_reason: formState.override_reason || null,
        processing_impact_days: parseInt(formState.processing_impact_days, 10) || 0,
        safety_buffer_percent: parseFloat(formState.safety_buffer_percent) || 20,
        storage_temp_min: formState.storage_temp_min
          ? parseFloat(formState.storage_temp_min)
          : null,
        storage_temp_max: formState.storage_temp_max
          ? parseFloat(formState.storage_temp_max)
          : null,
        storage_humidity_min: formState.storage_humidity_min
          ? parseFloat(formState.storage_humidity_min)
          : null,
        storage_humidity_max: formState.storage_humidity_max
          ? parseFloat(formState.storage_humidity_max)
          : null,
        storage_conditions: formState.storage_conditions,
        storage_instructions: formState.storage_instructions || null,
        shelf_life_mode: formState.shelf_life_mode,
        label_format: formState.label_format,
        picking_strategy: formState.picking_strategy,
        min_remaining_for_shipment: formState.min_remaining_for_shipment
          ? parseInt(formState.min_remaining_for_shipment, 10)
          : null,
        enforcement_level: formState.enforcement_level,
        expiry_warning_days: parseInt(formState.expiry_warning_days, 10) || 7,
        expiry_critical_days: parseInt(formState.expiry_critical_days, 10) || 3,
      }

      await updateMutation.mutateAsync(data)

      toast({
        title: 'Configuration Saved',
        description: 'Shelf life configuration saved successfully',
      })

      onSave?.()
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Save Failed',
        description:
          error instanceof Error ? error.message : 'Failed to save shelf life configuration',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate final days for display
  const calculatedDays = shelfLifeData?.calculated_days ?? null
  const overrideDaysNum = formState.override_days ? parseInt(formState.override_days, 10) : null
  const finalDays = formState.use_override && overrideDaysNum ? overrideDaysNum : calculatedDays

  // Check for missing ingredients
  const missingIngredients =
    shelfLifeData?.ingredients?.filter((i) => i.shelf_life_days == null) || []

  // Determine if there's an active BOM
  const hasActiveBom = !!shelfLifeData?.bom_version

  // Is empty state (no config yet)
  const isEmpty = !isLoadingConfig && !shelfLifeData && !loadError

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] p-0"
        aria-describedby="shelf-life-modal-description"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg">
            Shelf Life Configuration: {productName}
          </DialogTitle>
          <DialogDescription id="shelf-life-modal-description">
            Product: {productName} (SKU: {productCode})
            {shelfLifeData?.bom_version && (
              <>
                {' | '}BOM Version: {shelfLifeData.bom_version}
                {shelfLifeData.bom_effective_date && (
                  <> | Effective: {new Date(shelfLifeData.bom_effective_date).toLocaleDateString()}</>
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Loading State */}
        {isLoadingConfig && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Calculating Shelf Life...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Analyzing ingredient shelf lives...
            </p>
          </div>
        )}

        {/* Empty State */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Shelf Life Configuration</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              This product does not have shelf life settings configured yet.
            </p>
            <p className="text-sm text-muted-foreground mb-4">Options:</p>
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleRecalculate}
                disabled={calculateMutation.isPending || !hasActiveBom}
                variant="default"
              >
                {calculateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Calculating...
                  </>
                ) : (
                  'Calculate from Ingredients'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleChange('use_override', true)}
              >
                Set Manually
              </Button>
            </div>
            {!hasActiveBom && (
              <p className="text-sm text-muted-foreground mt-4">
                No active BOM found. Create a BOM first or set shelf life manually.
              </p>
            )}
          </div>
        )}

        {/* Success State - Form Content */}
        {!isLoadingConfig && !isEmpty && (
          <ScrollArea className="max-h-[60vh] px-6 py-4">
            <div className="space-y-6">
              {/* Calculated Shelf Life Section */}
              <CalculatedShelfLifeSection
                calculatedDays={calculatedDays}
                calculationMethod={shelfLifeData?.calculation_method || 'auto_min_ingredients'}
                shortestIngredient={
                  shelfLifeData?.shortest_ingredient_id
                    ? {
                        id: shelfLifeData.shortest_ingredient_id,
                        name: shelfLifeData.shortest_ingredient_name || '',
                        days: shelfLifeData.shortest_ingredient_days || 0,
                      }
                    : null
                }
                processingImpactDays={parseInt(formState.processing_impact_days, 10) || 0}
                safetyBufferPercent={parseFloat(formState.safety_buffer_percent) || 20}
                safetyBufferDays={shelfLifeData?.safety_buffer_days || 0}
                needsRecalculation={shelfLifeData?.needs_recalculation || false}
                onRecalculate={handleRecalculate}
                isRecalculating={calculateMutation.isPending}
                hasActiveBom={hasActiveBom}
                missingIngredients={missingIngredients}
              />

              {/* Override Section */}
              <OverrideSection
                useOverride={formState.use_override}
                calculatedDays={calculatedDays}
                overrideDays={formState.override_days}
                overrideReason={formState.override_reason}
                onChange={handleChange}
                errors={{
                  override_days: errors.override_days,
                  override_reason: errors.override_reason,
                }}
              />

              {/* Storage Conditions Section */}
              <StorageConditionsSection
                tempMin={formState.storage_temp_min}
                tempMax={formState.storage_temp_max}
                humidityMin={formState.storage_humidity_min}
                humidityMax={formState.storage_humidity_max}
                conditions={formState.storage_conditions}
                instructions={formState.storage_instructions}
                onChange={handleChange}
                errors={{
                  storage_temp_min: errors.storage_temp_min,
                  storage_temp_max: errors.storage_temp_max,
                  storage_humidity_min: errors.storage_humidity_min,
                  storage_humidity_max: errors.storage_humidity_max,
                  storage_instructions: errors.storage_instructions,
                }}
              />

              {/* Best Before Section */}
              <BestBeforeSection
                shelfLifeMode={formState.shelf_life_mode}
                labelFormat={formState.label_format}
                finalDays={finalDays}
                onChange={handleChange}
              />

              {/* FEFO Settings Section */}
              <FEFOSettingsSection
                pickingStrategy={formState.picking_strategy}
                minRemainingForShipment={formState.min_remaining_for_shipment}
                enforcementLevel={formState.enforcement_level}
                expiryWarningDays={formState.expiry_warning_days}
                expiryCriticalDays={formState.expiry_critical_days}
                finalDays={finalDays}
                onChange={handleChange}
                errors={{
                  min_remaining_for_shipment: errors.min_remaining_for_shipment,
                  expiry_warning_days: errors.expiry_warning_days,
                  expiry_critical_days: errors.expiry_critical_days,
                }}
              />

              {/* Ingredient Shelf Life Table */}
              <IngredientShelfLifeTable
                ingredients={shelfLifeData?.ingredients || []}
                shortestIngredientId={shelfLifeData?.shortest_ingredient_id || null}
                onIngredientClick={(ingredientId) => {
                  // TODO: Navigate to ingredient configuration
                  console.log('Configure ingredient:', ingredientId)
                }}
              />

              {/* Last Updated Info */}
              {shelfLifeData?.updated_at && (
                <p className="text-xs text-muted-foreground text-right">
                  Last Updated: {new Date(shelfLifeData.updated_at).toLocaleString()}
                  {shelfLifeData.updated_by && ` By: ${shelfLifeData.updated_by}`}
                </p>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {!isLoadingConfig && !isEmpty && (
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
