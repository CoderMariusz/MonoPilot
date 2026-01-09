'use client'

/**
 * WizardStep2Warehouse Component
 * Story: 01.14 - Wizard Steps Complete
 *
 * Step 2: Create first warehouse
 * - Pre-filled code "WH-MAIN" (editable)
 * - Warehouse name input (required)
 * - Type dropdown with tooltips
 * - Skip button creates demo warehouse
 */

import { useState, useCallback } from 'react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Info, AlertTriangle, Warehouse } from 'lucide-react'
import type { Step2Response } from '@/lib/services/wizard-service'

/**
 * Validation schema for step 2
 */
const step2FormSchema = z.object({
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(20, 'Code must be at most 20 characters')
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  name: z
    .string()
    .min(2, 'Warehouse name is required')
    .max(100, 'Name must be at most 100 characters'),
  type: z.enum(['GENERAL', 'RAW_MATERIALS', 'WIP', 'FINISHED_GOODS', 'QUARANTINE']),
})

type Step2FormData = z.infer<typeof step2FormSchema>

/**
 * Warehouse type options with tooltips
 */
const WAREHOUSE_TYPES = [
  {
    value: 'GENERAL',
    label: 'General',
    tooltip: 'Multi-purpose warehouse (recommended for start)',
  },
  {
    value: 'RAW_MATERIALS',
    label: 'Raw Materials',
    tooltip: 'Store incoming ingredients and packaging',
  },
  {
    value: 'WIP',
    label: 'Work in Progress',
    tooltip: 'For items currently in production',
  },
  {
    value: 'FINISHED_GOODS',
    label: 'Finished Goods',
    tooltip: 'Completed products ready for shipping',
  },
  {
    value: 'QUARANTINE',
    label: 'Quarantine',
    tooltip: 'Items on hold for quality inspection',
  },
] as const

interface WizardStep2WarehouseProps {
  onNext: (data: Step2Response) => void
  onBack: () => void
  initialData?: Partial<Step2FormData>
}

export function WizardStep2Warehouse({
  onNext,
  onBack,
  initialData,
}: WizardStep2WarehouseProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<Step2FormData>({
    resolver: zodResolver(step2FormSchema),
    defaultValues: {
      code: initialData?.code || 'WH-MAIN',
      name: initialData?.name || '',
      type: initialData?.type || 'GENERAL',
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form

  const selectedType = watch('type')

  const onSubmit = useCallback(
    async (data: Step2FormData) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/v1/settings/onboarding/step/2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create warehouse')
        }

        onNext(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create warehouse')
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
      const response = await fetch('/api/v1/settings/onboarding/step/2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create demo warehouse')
      }

      onNext(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create demo warehouse')
    } finally {
      setIsSkipping(false)
    }
  }, [onNext])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSubmit(onSubmit)()
      }
    },
    [handleSubmit, onSubmit]
  )

  // Loading state
  if (isLoading && !error) {
    return (
      <div className="space-y-6" role="status" aria-label="Creating warehouse">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={handleKeyDown}
        className="space-y-6"
        aria-label="Create warehouse form"
      >
        {/* Icon and intro */}
        <div className="flex items-center gap-4 pb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <Warehouse className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium">Create Your First Warehouse</h3>
            <p className="text-sm text-muted-foreground">
              A warehouse is where you store inventory. Most businesses start with one.
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

        {/* Warehouse Code */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="warehouse-code">Warehouse Code</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>A short unique identifier (e.g., WH-MAIN, WH-EAST)</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Input
            id="warehouse-code"
            {...register('code')}
            placeholder="WH-MAIN"
            className={errors.code ? 'border-red-500' : ''}
            aria-invalid={!!errors.code}
            aria-describedby={errors.code ? 'code-error' : undefined}
          />
          {errors.code && (
            <p id="code-error" className="text-sm text-red-500">
              {errors.code.message}
            </p>
          )}
        </div>

        {/* Warehouse Name */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="warehouse-name">
              Warehouse Name <span className="text-red-500">*</span>
            </Label>
          </div>
          <Input
            id="warehouse-name"
            {...register('name')}
            placeholder="Main Warehouse"
            className={errors.name ? 'border-red-500' : ''}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? 'name-error' : undefined}
            autoFocus
          />
          {errors.name && (
            <p id="name-error" className="text-sm text-red-500">
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Warehouse Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="warehouse-type">Warehouse Type</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Categorize your warehouse by its primary use</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select
            value={selectedType}
            onValueChange={(value) =>
              setValue('type', value as Step2FormData['type'])
            }
          >
            <SelectTrigger id="warehouse-type" aria-label="Select warehouse type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {WAREHOUSE_TYPES.map((type) => (
                <Tooltip key={type.value}>
                  <TooltipTrigger asChild>
                    <SelectItem value={type.value}>{type.label}</SelectItem>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{type.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </SelectContent>
          </Select>
          {/* Type description */}
          <p className="text-sm text-muted-foreground">
            {WAREHOUSE_TYPES.find((t) => t.value === selectedType)?.tooltip}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4">
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
              {isSkipping ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Skip - Use Demo Warehouse
            </Button>
          </div>
          <Button type="submit" disabled={isLoading || isSkipping}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Next
          </Button>
        </div>
      </form>
    </TooltipProvider>
  )
}
