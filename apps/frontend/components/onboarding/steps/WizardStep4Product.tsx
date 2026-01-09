'use client'

/**
 * WizardStep4Product Component
 * Story: 01.14 - Wizard Steps Complete
 *
 * Step 4: Create first product
 * - Industry selection (Bakery, Dairy, Meat, Beverages, Snacks, Other)
 * - Template selection from industry templates
 * - Pre-filled form from template
 * - "Start from Scratch" option
 */

import { useState, useCallback, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Loader2,
  Info,
  AlertTriangle,
  Package,
  Cookie,
  Milk,
  Beef,
  Wine,
  Box,
  Croissant,
  Check,
} from 'lucide-react'
import { INDUSTRY_TEMPLATES, type IndustryConfig, type ProductTemplate } from '@/lib/constants/product-templates'
import type { Step4Response } from '@/lib/services/wizard-service'

/**
 * Product form schema
 */
const productFormSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be at most 50 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must be uppercase alphanumeric with hyphens'),
  name: z
    .string()
    .min(2, 'Product name is required')
    .max(255, 'Name must be at most 255 characters'),
  product_type: z.enum(['finished_good', 'raw_material', 'wip']),
  uom: z.string().min(1).max(10),
  shelf_life_days: z.number().int().positive().nullable().optional(),
  storage_temp: z.enum(['ambient', 'chilled', 'frozen']),
})

type ProductFormData = z.infer<typeof productFormSchema>

interface WizardStep4ProductProps {
  onNext: (data: Step4Response) => void
  onBack: () => void
}

/**
 * Industry icon mapping
 */
const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bakery: Croissant,
  dairy: Milk,
  meat: Beef,
  beverages: Wine,
  snacks: Cookie,
  other: Box,
}

/**
 * Product type labels
 */
const PRODUCT_TYPE_LABELS: Record<string, string> = {
  finished_good: 'Finished Good',
  raw_material: 'Raw Material',
  wip: 'Work in Progress',
}

/**
 * Storage temp labels
 */
const STORAGE_TEMP_LABELS: Record<string, string> = {
  ambient: 'Ambient (Room Temp)',
  chilled: 'Chilled (0-4C)',
  frozen: 'Frozen (-18C)',
}

export function WizardStep4Product({ onNext, onBack }: WizardStep4ProductProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [confirmedTemplate, setConfirmedTemplate] = useState<ProductTemplate | null>(null)
  const [startFromScratch, setStartFromScratch] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      sku: '',
      name: '',
      product_type: 'finished_good',
      uom: 'EA',
      shelf_life_days: null,
      storage_temp: 'ambient',
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form

  const productType = watch('product_type')
  const storageTemp = watch('storage_temp')

  // Apply template values when template is confirmed
  useEffect(() => {
    if (confirmedTemplate) {
      setValue('product_type', confirmedTemplate.prefill.product_type)
      setValue('uom', confirmedTemplate.prefill.uom)
      setValue('shelf_life_days', confirmedTemplate.prefill.shelf_life_days)
      setValue('storage_temp', confirmedTemplate.prefill.storage_temp)
    }
  }, [confirmedTemplate, setValue])

  const handleIndustrySelect = useCallback((industryId: string) => {
    setSelectedIndustry(industryId)
    setSelectedTemplateId(null)
    setConfirmedTemplate(null)
    setStartFromScratch(false)
  }, [])

  const handleTemplateClick = useCallback((templateId: string) => {
    setSelectedTemplateId(templateId)
  }, [])

  const handleConfirmTemplate = useCallback((template: ProductTemplate) => {
    setConfirmedTemplate(template)
    setStartFromScratch(false)
  }, [])

  const handleStartFromScratch = useCallback(() => {
    setSelectedIndustry(null)
    setSelectedTemplateId(null)
    setConfirmedTemplate(null)
    setStartFromScratch(true)
    reset({
      sku: '',
      name: '',
      product_type: 'finished_good',
      uom: 'EA',
      shelf_life_days: null,
      storage_temp: 'ambient',
    })
  }, [reset])

  const onSubmit = useCallback(
    async (data: ProductFormData) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/v1/settings/onboarding/step/4', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create product')
        }

        onNext(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create product')
      } finally {
        setIsLoading(false)
      }
    },
    [onNext]
  )

  const handleSkip = useCallback(async () => {
    setIsSkipping(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/settings/onboarding/step/4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to skip product creation')
      }

      onNext(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to skip product creation')
    } finally {
      setIsSkipping(false)
    }
  }, [onNext])

  // Get current industry config
  const currentIndustry: IndustryConfig | undefined = INDUSTRY_TEMPLATES.find(
    (i) => i.id === selectedIndustry
  )

  // Get currently selected template (for highlighting)
  const selectedTemplate = currentIndustry?.templates.find(
    (t) => t.id === selectedTemplateId
  )

  // Show form when template confirmed or starting from scratch
  const showForm = confirmedTemplate || startFromScratch

  // Loading state
  if (isLoading && !error) {
    return (
      <div className="space-y-6" role="status" aria-label="Creating product">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Icon and intro */}
        <div className="flex items-center gap-4 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
            <Package className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium">Create Your First Product</h3>
            <p className="text-sm text-muted-foreground">
              Select your industry to get pre-configured templates, or start from scratch.
            </p>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!showForm ? (
          <>
            {/* Industry selection */}
            <div className="space-y-3">
              <Label>Select Your Industry</Label>
              <div className="grid grid-cols-3 gap-3">
                {INDUSTRY_TEMPLATES.map((industry) => {
                  const Icon = INDUSTRY_ICONS[industry.id] || Box
                  return (
                    <IndustryCard
                      key={industry.id}
                      industry={industry}
                      Icon={Icon}
                      isSelected={selectedIndustry === industry.id}
                      onSelect={() => handleIndustrySelect(industry.id)}
                    />
                  )
                })}
              </div>
            </div>

            {/* Template selection (when industry is selected) */}
            {currentIndustry && currentIndustry.templates.length > 0 && (
              <div className="space-y-3">
                <Label>Select a Template</Label>
                <div className="grid grid-cols-2 gap-3">
                  {currentIndustry.templates.map((template: ProductTemplate) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      isSelected={selectedTemplateId === template.id}
                      onSelect={() => handleTemplateClick(template.id)}
                    />
                  ))}
                </div>
                {/* Confirm template button */}
                {selectedTemplate && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={() => handleConfirmTemplate(selectedTemplate)}
                    >
                      Use {selectedTemplate.name} Template
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Start from scratch button */}
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={handleStartFromScratch}
                className="text-muted-foreground"
              >
                Or start from scratch
              </Button>
            </div>
          </>
        ) : (
          /* Product form */
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {confirmedTemplate && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                Using template: <strong>{confirmedTemplate.name}</strong>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setConfirmedTemplate(null)
                    setStartFromScratch(false)
                  }}
                  className="ml-2 h-auto p-0"
                >
                  Change
                </Button>
              </div>
            )}

            {startFromScratch && (
              <div className="rounded-lg bg-muted/50 p-3 text-sm">
                Starting from scratch
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setStartFromScratch(false)}
                  className="ml-2 h-auto p-0"
                >
                  Use templates instead
                </Button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* SKU */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="product-sku">
                    SKU <span className="text-red-500">*</span>
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Stock Keeping Unit - unique product identifier</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="product-sku"
                  {...register('sku')}
                  placeholder="WWB-001"
                  className={errors.sku ? 'border-red-500' : ''}
                  onChange={(e) => setValue('sku', e.target.value.toUpperCase())}
                />
                {errors.sku && (
                  <p className="text-xs text-red-500">{errors.sku.message}</p>
                )}
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="product-name">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="product-name"
                  {...register('name')}
                  placeholder="Whole Wheat Bread"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Product Type */}
              <div className="space-y-2">
                <Label htmlFor="product-type">Product Type</Label>
                <Select
                  value={productType}
                  onValueChange={(v) =>
                    setValue('product_type', v as ProductFormData['product_type'])
                  }
                >
                  <SelectTrigger id="product-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit of Measure */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="product-uom">Unit of Measure</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>EA = Each, KG = Kilogram, L = Liter</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="product-uom"
                  {...register('uom')}
                  placeholder="EA"
                  className={errors.uom ? 'border-red-500' : ''}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Shelf Life */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="product-shelf-life">Shelf Life (Days)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>How many days until the product expires</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="product-shelf-life"
                  type="number"
                  {...register('shelf_life_days', {
                    setValueAs: (v) => (v === '' ? null : parseInt(v, 10)),
                  })}
                  placeholder="7"
                />
              </div>

              {/* Storage Temp */}
              <div className="space-y-2">
                <Label htmlFor="product-storage-temp">Storage Temperature</Label>
                <Select
                  value={storageTemp}
                  onValueChange={(v) =>
                    setValue('storage_temp', v as ProductFormData['storage_temp'])
                  }
                >
                  <SelectTrigger id="product-storage-temp">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STORAGE_TEMP_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit button for form */}
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create Product
              </Button>
            </div>
          </form>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading || isSkipping}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSkip}
              disabled={isLoading || isSkipping}
              className="text-muted-foreground"
            >
              {isSkipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Skip - Create Products Later
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

/**
 * Industry card component
 */
function IndustryCard({
  industry,
  Icon,
  isSelected,
  onSelect,
}: {
  industry: IndustryConfig
  Icon: React.ComponentType<{ className?: string }>
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'border-2 border-primary ring-2 ring-primary/20'
          : 'hover:border-muted-foreground/50'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <CardContent className="flex flex-col items-center justify-center p-4">
        <Icon className="h-8 w-8 mb-2 text-muted-foreground" />
        <p className="text-sm font-medium text-center">{industry.name}</p>
        {isSelected && <Check className="h-4 w-4 text-primary mt-1" />}
      </CardContent>
    </Card>
  )
}

/**
 * Template card component
 */
function TemplateCard({
  template,
  isSelected,
  onSelect,
}: {
  template: ProductTemplate
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'border-2 border-primary ring-2 ring-primary/20'
          : 'hover:border-muted-foreground/50'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{template.name}</p>
            <p className="text-xs text-muted-foreground">
              {template.prefill.uom} | {template.prefill.shelf_life_days} days |{' '}
              {STORAGE_TEMP_LABELS[template.prefill.storage_temp]}
            </p>
          </div>
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </div>
      </CardContent>
    </Card>
  )
}
