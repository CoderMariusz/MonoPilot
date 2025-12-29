/**
 * Override Section Component
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Manual override form with:
 * - Radio group: Use Calculated vs Manual Override
 * - Override days input (conditional)
 * - Override reason textarea (required when override enabled)
 * - Warning if override differs significantly from calculated
 */

'use client'

import { AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface OverrideSectionProps {
  useOverride: boolean
  calculatedDays: number | null
  overrideDays: string
  overrideReason: string
  onChange: (field: string, value: string | boolean) => void
  errors: {
    override_days?: string
    override_reason?: string
  }
}

export function OverrideSection({
  useOverride,
  calculatedDays,
  overrideDays,
  overrideReason,
  onChange,
  errors,
}: OverrideSectionProps) {
  const overrideDaysNum = overrideDays ? parseInt(overrideDays, 10) : null
  const diffFromCalculated =
    calculatedDays != null && overrideDaysNum != null ? overrideDaysNum - calculatedDays : null

  // Show warning if override differs by more than 10% from calculated
  const showDifferenceWarning =
    calculatedDays != null &&
    overrideDaysNum != null &&
    diffFromCalculated != null &&
    Math.abs(diffFromCalculated / calculatedDays) > 0.1

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Final Shelf Life (Override)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Radio group */}
        <RadioGroup
          value={useOverride ? 'manual' : 'calculated'}
          onValueChange={(value) => onChange('use_override', value === 'manual')}
          className="space-y-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value="calculated"
              id="use-calculated"
              disabled={calculatedDays == null}
            />
            <Label
              htmlFor="use-calculated"
              className={cn('cursor-pointer', calculatedDays == null && 'text-muted-foreground')}
            >
              Use Calculated Value{' '}
              {calculatedDays != null ? `(${calculatedDays} days)` : '(N/A)'}
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="manual" id="use-manual" />
            <Label htmlFor="use-manual" className="cursor-pointer">
              Manual Override
            </Label>
          </div>
        </RadioGroup>

        {/* Override inputs (shown when manual override selected) */}
        {useOverride && (
          <div className="space-y-4 pt-2 pl-6 border-l-2 border-muted">
            {/* Override days input */}
            <div className="space-y-2">
              <Label htmlFor="override_days">
                Shelf Life Days <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="override_days"
                  type="number"
                  min="1"
                  max="3650"
                  value={overrideDays}
                  onChange={(e) => onChange('override_days', e.target.value)}
                  className={cn('w-32', errors.override_days && 'border-red-500')}
                  placeholder="e.g., 7"
                  aria-required="true"
                  aria-invalid={!!errors.override_days}
                  aria-describedby={errors.override_days ? 'override-days-error' : undefined}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
              {errors.override_days && (
                <p id="override-days-error" className="text-sm text-red-500">
                  {errors.override_days}
                </p>
              )}
            </div>

            {/* Override reason textarea */}
            <div className="space-y-2">
              <Label htmlFor="override_reason">
                Override Reason <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="override_reason"
                value={overrideReason}
                onChange={(e) => onChange('override_reason', e.target.value)}
                className={cn(errors.override_reason && 'border-red-500')}
                placeholder="Explain why you are overriding the calculated shelf life (minimum 10 characters)"
                rows={3}
                aria-required="true"
                aria-invalid={!!errors.override_reason}
                aria-describedby={errors.override_reason ? 'override-reason-error' : undefined}
              />
              <p className="text-xs text-muted-foreground">
                {overrideReason.length}/500 characters (minimum 10)
              </p>
              {errors.override_reason && (
                <p id="override-reason-error" className="text-sm text-red-500">
                  {errors.override_reason}
                </p>
              )}
            </div>

            {/* Warning when override differs significantly */}
            {showDifferenceWarning && diffFromCalculated != null && (
              <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  {diffFromCalculated > 0
                    ? `Override (${overrideDaysNum} days) exceeds calculated shelf life (${calculatedDays} days). Ensure this is backed by testing.`
                    : `Override is ${Math.abs(diffFromCalculated)} days shorter than calculated`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
