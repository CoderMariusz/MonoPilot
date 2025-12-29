/**
 * Storage Conditions Section Component
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Storage conditions configuration form:
 * - Temperature min/max inputs
 * - Humidity min/max inputs (optional)
 * - Multi-select checkboxes for special conditions
 * - Storage instructions textarea
 */

'use client'

import { Thermometer, Droplets, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { StorageCondition } from '@/lib/types/shelf-life'

interface StorageConditionsSectionProps {
  tempMin: string
  tempMax: string
  humidityMin: string
  humidityMax: string
  conditions: StorageCondition[]
  instructions: string
  onChange: (field: string, value: string | StorageCondition[]) => void
  errors: {
    storage_temp_min?: string
    storage_temp_max?: string
    storage_humidity_min?: string
    storage_humidity_max?: string
    storage_instructions?: string
  }
}

const STORAGE_CONDITIONS: { value: StorageCondition; label: string }[] = [
  { value: 'original_packaging', label: 'Keep in original packaging' },
  { value: 'protect_sunlight', label: 'Protect from direct sunlight' },
  { value: 'refrigeration_required', label: 'Refrigeration required' },
  { value: 'freezing_allowed', label: 'Freezing allowed' },
  { value: 'controlled_atmosphere', label: 'Controlled atmosphere' },
]

export function StorageConditionsSection({
  tempMin,
  tempMax,
  humidityMin,
  humidityMax,
  conditions,
  instructions,
  onChange,
  errors,
}: StorageConditionsSectionProps) {
  const handleConditionToggle = (conditionValue: StorageCondition, checked: boolean) => {
    if (checked) {
      onChange('storage_conditions', [...conditions, conditionValue])
    } else {
      onChange(
        'storage_conditions',
        conditions.filter((c) => c !== conditionValue)
      )
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Storage Conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Temperature Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <Label>
              Temperature Range <span className="text-red-500">*</span>
            </Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temp_min" className="text-sm text-muted-foreground">
                Min
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="temp_min"
                  type="number"
                  min="-40"
                  max="100"
                  value={tempMin}
                  onChange={(e) => onChange('storage_temp_min', e.target.value)}
                  className={cn('w-full', errors.storage_temp_min && 'border-red-500')}
                  placeholder="e.g., 18"
                  aria-invalid={!!errors.storage_temp_min}
                />
                <span className="text-sm text-muted-foreground">C</span>
              </div>
              {errors.storage_temp_min && (
                <p className="text-sm text-red-500">{errors.storage_temp_min}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp_max" className="text-sm text-muted-foreground">
                Max
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="temp_max"
                  type="number"
                  min="-40"
                  max="100"
                  value={tempMax}
                  onChange={(e) => onChange('storage_temp_max', e.target.value)}
                  className={cn('w-full', errors.storage_temp_max && 'border-red-500')}
                  placeholder="e.g., 25"
                  aria-invalid={!!errors.storage_temp_max}
                />
                <span className="text-sm text-muted-foreground">C</span>
              </div>
              {errors.storage_temp_max && (
                <p className="text-sm text-red-500">{errors.storage_temp_max}</p>
              )}
            </div>
          </div>
        </div>

        {/* Humidity Range */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <Label>Humidity Range (optional)</Label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="humidity_min" className="text-sm text-muted-foreground">
                Min
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="humidity_min"
                  type="number"
                  min="0"
                  max="100"
                  value={humidityMin}
                  onChange={(e) => onChange('storage_humidity_min', e.target.value)}
                  className={cn('w-full', errors.storage_humidity_min && 'border-red-500')}
                  placeholder="e.g., 40"
                  aria-invalid={!!errors.storage_humidity_min}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              {errors.storage_humidity_min && (
                <p className="text-sm text-red-500">{errors.storage_humidity_min}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="humidity_max" className="text-sm text-muted-foreground">
                Max
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="humidity_max"
                  type="number"
                  min="0"
                  max="100"
                  value={humidityMax}
                  onChange={(e) => onChange('storage_humidity_max', e.target.value)}
                  className={cn('w-full', errors.storage_humidity_max && 'border-red-500')}
                  placeholder="e.g., 60"
                  aria-invalid={!!errors.storage_humidity_max}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              {errors.storage_humidity_max && (
                <p className="text-sm text-red-500">{errors.storage_humidity_max}</p>
              )}
            </div>
          </div>
        </div>

        {/* Special Conditions */}
        <div className="space-y-3">
          <Label>Special Conditions</Label>
          <div className="space-y-2">
            {STORAGE_CONDITIONS.map((condition) => (
              <div key={condition.value} className="flex items-center space-x-3">
                <Checkbox
                  id={`condition-${condition.value}`}
                  checked={conditions.includes(condition.value)}
                  onCheckedChange={(checked) =>
                    handleConditionToggle(condition.value, checked === true)
                  }
                  className="h-5 w-5"
                />
                <Label
                  htmlFor={`condition-${condition.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {condition.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Storage Instructions */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="storage_instructions">Storage Instructions (Label Text)</Label>
          </div>
          <Textarea
            id="storage_instructions"
            value={instructions}
            onChange={(e) => onChange('storage_instructions', e.target.value)}
            className={cn(errors.storage_instructions && 'border-red-500')}
            placeholder="e.g., Store in a cool, dry place. Keep away from direct sunlight."
            rows={3}
            maxLength={500}
            aria-invalid={!!errors.storage_instructions}
          />
          <p className="text-xs text-muted-foreground">{instructions.length}/500 characters</p>
          {errors.storage_instructions && (
            <p className="text-sm text-red-500">{errors.storage_instructions}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
