'use client'

/**
 * WizardStep3Locations Component
 * Story: 01.14 - Wizard Steps Complete
 *
 * Step 3: Create storage locations
 * - Template selection (Simple, Basic, Full, Custom)
 * - Preview of locations to be created
 * - Custom mode: add locations one by one
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  AlertTriangle,
  MapPin,
  Plus,
  Trash2,
  Check,
} from 'lucide-react'
import { LOCATION_TEMPLATES, type LocationTemplate } from '@/lib/constants/wizard-templates'
import type { Step3Response } from '@/lib/services/wizard-service'

/**
 * Custom location schema
 */
const customLocationSchema = z.object({
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[A-Z0-9-]+$/, 'Code must be uppercase alphanumeric with hyphens'),
  name: z.string().min(2, 'Name is required').max(255),
  location_type: z.enum(['bulk', 'pallet', 'shelf', 'floor', 'staging']),
})

type CustomLocation = z.infer<typeof customLocationSchema>

interface WizardStep3LocationsProps {
  onNext: (data: Step3Response) => void
  onBack: () => void
  warehouseId: string
}

const LOCATION_TYPE_LABELS: Record<string, string> = {
  bulk: 'Bulk Storage',
  pallet: 'Pallet Rack',
  shelf: 'Shelving',
  floor: 'Floor Space',
  staging: 'Staging Area',
}

export function WizardStep3Locations({
  onNext,
  onBack,
}: WizardStep3LocationsProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('simple')
  const [isLoading, setIsLoading] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Custom locations state
  const [customLocations, setCustomLocations] = useState<CustomLocation[]>([])
  const [isAddingCustom, setIsAddingCustom] = useState(false)

  // Custom location form
  const customForm = useForm<CustomLocation>({
    resolver: zodResolver(customLocationSchema),
    defaultValues: {
      code: '',
      name: '',
      location_type: 'shelf',
    },
  })

  const {
    register: registerCustom,
    handleSubmit: handleSubmitCustom,
    reset: resetCustom,
    setValue: setCustomValue,
    watch: watchCustom,
    formState: { errors: customErrors },
  } = customForm

  const customLocationType = watchCustom('location_type')

  const handleTemplateSelect = useCallback((templateId: string) => {
    setSelectedTemplate(templateId)
    if (templateId !== 'custom') {
      setCustomLocations([])
    }
  }, [])

  const handleAddCustomLocation = useCallback(
    (data: CustomLocation) => {
      setCustomLocations((prev) => [...prev, data])
      resetCustom()
      setIsAddingCustom(false)
    },
    [resetCustom]
  )

  const handleRemoveCustomLocation = useCallback((index: number) => {
    setCustomLocations((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleSubmit = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const body =
        selectedTemplate === 'custom'
          ? { template: 'custom', custom_locations: customLocations }
          : { template: selectedTemplate }

      const response = await fetch('/api/v1/settings/onboarding/step/3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create locations')
      }

      onNext(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create locations')
    } finally {
      setIsLoading(false)
    }
  }, [selectedTemplate, customLocations, onNext])

  const handleSkip = useCallback(async () => {
    setIsSkipping(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/settings/onboarding/step/3', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skip: true }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create default location')
      }

      onNext(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create default location')
    } finally {
      setIsSkipping(false)
    }
  }, [onNext])

  // Get current template for preview
  const currentTemplate = LOCATION_TEMPLATES.find((t) => t.id === selectedTemplate)

  // Loading state
  if (isLoading && !error) {
    return (
      <div className="space-y-6" role="status" aria-label="Creating locations">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Icon and intro */}
      <div className="flex items-center gap-4 pb-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
          <MapPin className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-medium">Set Up Storage Locations</h3>
          <p className="text-sm text-muted-foreground">
            Locations help you organize inventory within your warehouse.
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

      {/* Template selection */}
      <div className="grid grid-cols-2 gap-4">
        {LOCATION_TEMPLATES.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onSelect={() => handleTemplateSelect(template.id)}
          />
        ))}

        {/* Custom option */}
        <Card
          className={`cursor-pointer transition-all ${
            selectedTemplate === 'custom'
              ? 'border-2 border-primary ring-2 ring-primary/20'
              : 'hover:border-muted-foreground/50'
          }`}
          onClick={() => handleTemplateSelect('custom')}
          role="button"
          tabIndex={0}
          aria-pressed={selectedTemplate === 'custom'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleTemplateSelect('custom')
            }
          }}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Custom</CardTitle>
              {selectedTemplate === 'custom' && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
            <CardDescription className="text-xs">
              Create your own structure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">User-defined</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Template preview or Custom form */}
      {selectedTemplate === 'custom' ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Custom Locations</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddingCustom(true)}
              disabled={isAddingCustom}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>

          {/* Add custom location form */}
          {isAddingCustom && (
            <form
              onSubmit={handleSubmitCustom(handleAddCustomLocation)}
              className="space-y-4 rounded-lg border border-dashed p-4"
            >
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-code">Code</Label>
                  <Input
                    id="custom-code"
                    {...registerCustom('code')}
                    placeholder="SHELF-A1"
                    className={customErrors.code ? 'border-red-500' : ''}
                  />
                  {customErrors.code && (
                    <p className="text-xs text-red-500">{customErrors.code.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-name">Name</Label>
                  <Input
                    id="custom-name"
                    {...registerCustom('name')}
                    placeholder="Shelf A1"
                    className={customErrors.name ? 'border-red-500' : ''}
                  />
                  {customErrors.name && (
                    <p className="text-xs text-red-500">{customErrors.name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-type">Type</Label>
                  <Select
                    value={customLocationType}
                    onValueChange={(v) =>
                      setCustomValue('location_type', v as CustomLocation['location_type'])
                    }
                  >
                    <SelectTrigger id="custom-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingCustom(false)
                    resetCustom()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm">
                  Add
                </Button>
              </div>
            </form>
          )}

          {/* Custom locations list */}
          {customLocations.length > 0 ? (
            <div className="space-y-2">
              {customLocations.map((loc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg bg-muted p-3"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{loc.code}</Badge>
                    <span className="text-sm">{loc.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {LOCATION_TYPE_LABELS[loc.location_type]}
                    </Badge>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveCustomLocation(index)}
                    aria-label={`Remove ${loc.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              No custom locations added yet. Click &quot;Add Location&quot; to create one.
            </p>
          )}
        </div>
      ) : currentTemplate ? (
        <div className="rounded-lg border p-4">
          <h4 className="mb-3 font-medium">Preview: {currentTemplate.name}</h4>
          <div className="space-y-2">
            {currentTemplate.locations.map((loc) => (
              <div
                key={loc.code}
                className="flex items-center gap-3 rounded-lg bg-muted p-3"
              >
                <Badge variant="outline">{loc.code}</Badge>
                <span className="text-sm">{loc.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {LOCATION_TYPE_LABELS[loc.location_type]}
                </Badge>
                {loc.parent_code && (
                  <span className="text-xs text-muted-foreground">
                    (parent: {loc.parent_code})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
            {isSkipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Skip - Create Locations Later
          </Button>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={
            isLoading ||
            isSkipping ||
            (selectedTemplate === 'custom' && customLocations.length === 0)
          }
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Next
        </Button>
      </div>
    </div>
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
  template: LocationTemplate
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{template.name}</CardTitle>
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </div>
        <CardDescription className="text-xs">{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">
          {template.locations.length} location{template.locations.length !== 1 ? 's' : ''}
        </Badge>
      </CardContent>
    </Card>
  )
}
