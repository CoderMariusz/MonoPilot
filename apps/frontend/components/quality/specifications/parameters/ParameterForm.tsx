'use client'

/**
 * ParameterForm Component
 * Story: 06.4 - Test Parameters
 *
 * Dialog form for adding/editing parameters.
 * Shows conditional fields based on parameter type:
 * - numeric: Min, Max (at least one required), Target (optional), Unit
 * - text: Target (optional), Acceptance Criteria
 * - boolean: Target dropdown (Yes/No)
 * - range: Min & Max (both required), Target (optional), Unit
 */

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TestMethodAutocomplete } from './TestMethodAutocomplete'
import { UnitSelector } from './UnitSelector'
import type {
  QualitySpecParameter,
  CreateParameterRequest,
  UpdateParameterRequest,
  ParameterType,
} from '@/lib/types/quality'

export interface ParameterFormProps {
  /** Whether dialog is open */
  open: boolean
  /** Callback to close dialog */
  onOpenChange: (open: boolean) => void
  /** Existing parameter for edit mode (null for create) */
  parameter?: QualitySpecParameter | null
  /** Whether save is in progress */
  saving?: boolean
  /** Callback on save */
  onSave: (data: CreateParameterRequest | UpdateParameterRequest) => void
}

const parameterTypes: { value: ParameterType; label: string }[] = [
  { value: 'numeric', label: 'Numeric' },
  { value: 'text', label: 'Text' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'range', label: 'Range' },
]

export function ParameterForm({
  open,
  onOpenChange,
  parameter,
  saving = false,
  onSave,
}: ParameterFormProps) {
  const isEdit = !!parameter

  // Form state
  const [parameterName, setParameterName] = React.useState('')
  const [parameterType, setParameterType] = React.useState<ParameterType>('numeric')
  const [targetValue, setTargetValue] = React.useState('')
  const [minValue, setMinValue] = React.useState('')
  const [maxValue, setMaxValue] = React.useState('')
  const [unit, setUnit] = React.useState<string | null>(null)
  const [testMethod, setTestMethod] = React.useState<string | null>(null)
  const [instrumentRequired, setInstrumentRequired] = React.useState(false)
  const [isCritical, setIsCritical] = React.useState(false)
  const [acceptanceCriteria, setAcceptanceCriteria] = React.useState('')
  const [samplingInstructions, setSamplingInstructions] = React.useState('')

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  // Reset form when dialog opens/closes or parameter changes
  React.useEffect(() => {
    if (open) {
      if (parameter) {
        setParameterName(parameter.parameter_name)
        setParameterType(parameter.parameter_type)
        setTargetValue(parameter.target_value || '')
        setMinValue(parameter.min_value?.toString() || '')
        setMaxValue(parameter.max_value?.toString() || '')
        setUnit(parameter.unit || null)
        setTestMethod(parameter.test_method || null)
        setInstrumentRequired(parameter.instrument_required)
        setIsCritical(parameter.is_critical)
        setAcceptanceCriteria(parameter.acceptance_criteria || '')
        setSamplingInstructions(parameter.sampling_instructions || '')
      } else {
        // Reset to defaults for create
        setParameterName('')
        setParameterType('numeric')
        setTargetValue('')
        setMinValue('')
        setMaxValue('')
        setUnit(null)
        setTestMethod(null)
        setInstrumentRequired(false)
        setIsCritical(false)
        setAcceptanceCriteria('')
        setSamplingInstructions('')
      }
      setErrors({})
    }
  }, [open, parameter])

  // Clear incompatible values when type changes
  React.useEffect(() => {
    if (parameterType === 'text' || parameterType === 'boolean') {
      setMinValue('')
      setMaxValue('')
      setUnit(null)
    }
    if (parameterType === 'boolean') {
      if (!['Yes', 'No', ''].includes(targetValue)) {
        setTargetValue('')
      }
    }
  }, [parameterType, targetValue])

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Name required
    if (!parameterName.trim()) {
      newErrors.parameterName = 'Parameter name is required'
    } else if (parameterName.length < 2) {
      newErrors.parameterName = 'Parameter name must be at least 2 characters'
    } else if (parameterName.length > 200) {
      newErrors.parameterName = 'Parameter name must not exceed 200 characters'
    }

    // Type-specific validation
    if (parameterType === 'numeric') {
      if (!minValue && !maxValue) {
        newErrors.minValue = 'Numeric parameters require at least Min or Max value'
      }
    }

    if (parameterType === 'range') {
      if (!minValue) {
        newErrors.minValue = 'Range parameters require both Min and Max value'
      }
      if (!maxValue) {
        newErrors.maxValue = 'Range parameters require both Min and Max value'
      }
    }

    // Min < Max when both provided
    if (minValue && maxValue) {
      const min = parseFloat(minValue)
      const max = parseFloat(maxValue)
      if (!isNaN(min) && !isNaN(max) && min >= max) {
        newErrors.maxValue = 'Max must be greater than Min'
      }
    }

    // Field length validation
    if (acceptanceCriteria.length > 1000) {
      newErrors.acceptanceCriteria = 'Must not exceed 1000 characters'
    }
    if (samplingInstructions.length > 1000) {
      newErrors.samplingInstructions = 'Must not exceed 1000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = () => {
    if (!validate()) return

    const data: CreateParameterRequest = {
      parameter_name: parameterName.trim(),
      parameter_type: parameterType,
      target_value: targetValue || null,
      min_value: minValue ? parseFloat(minValue) : null,
      max_value: maxValue ? parseFloat(maxValue) : null,
      unit: unit || null,
      test_method: testMethod || null,
      instrument_required: instrumentRequired,
      is_critical: isCritical,
      acceptance_criteria: acceptanceCriteria || null,
      sampling_instructions: samplingInstructions || null,
    }

    onSave(data)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave()
    }
  }

  const showMinMax = parameterType === 'numeric' || parameterType === 'range'
  const showUnit = parameterType === 'numeric' || parameterType === 'range'
  const showBooleanTarget = parameterType === 'boolean'
  const showTextTarget = parameterType === 'text' || parameterType === 'numeric' || parameterType === 'range'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Parameter' : 'Add Parameter'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update the parameter details below.'
              : 'Define a new test parameter for this specification.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Parameter Name */}
          <div className="grid gap-2">
            <Label htmlFor="parameter-name">
              Parameter Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="parameter-name"
              value={parameterName}
              onChange={(e) => setParameterName(e.target.value)}
              placeholder="e.g., Internal Temperature, Color, Moisture Content"
              className={errors.parameterName ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.parameterName && (
              <p className="text-sm text-red-500">{errors.parameterName}</p>
            )}
          </div>

          {/* Parameter Type */}
          <div className="grid gap-2">
            <Label htmlFor="parameter-type">
              Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={parameterType}
              onValueChange={(value) => setParameterType(value as ParameterType)}
            >
              <SelectTrigger id="parameter-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {parameterTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {parameterType === 'numeric' && 'Numeric values with min/max limits (at least one required)'}
              {parameterType === 'text' && 'Free text entry, manually evaluated against criteria'}
              {parameterType === 'boolean' && 'Yes/No evaluation'}
              {parameterType === 'range' && 'Value must fall within min-max range (both required)'}
            </p>
          </div>

          {/* Min/Max Values */}
          {showMinMax && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="min-value">
                  Min Value {parameterType === 'range' && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="min-value"
                  type="number"
                  step="any"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="e.g., 60"
                  className={errors.minValue ? 'border-red-500' : ''}
                />
                {errors.minValue && (
                  <p className="text-sm text-red-500">{errors.minValue}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max-value">
                  Max Value {parameterType === 'range' && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="max-value"
                  type="number"
                  step="any"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="e.g., 80"
                  className={errors.maxValue ? 'border-red-500' : ''}
                />
                {errors.maxValue && (
                  <p className="text-sm text-red-500">{errors.maxValue}</p>
                )}
              </div>
            </div>
          )}

          {/* Target Value (Text/Numeric/Range) */}
          {showTextTarget && (
            <div className="grid gap-2">
              <Label htmlFor="target-value">Target Value</Label>
              <Input
                id="target-value"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder={parameterType === 'numeric' || parameterType === 'range' ? 'e.g., 72' : 'e.g., Golden brown'}
              />
              <p className="text-xs text-muted-foreground">
                Optional target/expected value
              </p>
            </div>
          )}

          {/* Target Value (Boolean) */}
          {showBooleanTarget && (
            <div className="grid gap-2">
              <Label htmlFor="target-bool">Target Value</Label>
              <Select
                value={targetValue}
                onValueChange={setTargetValue}
              >
                <SelectTrigger id="target-bool">
                  <SelectValue placeholder="Select expected value" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Expected boolean result
              </p>
            </div>
          )}

          {/* Unit */}
          {showUnit && (
            <div className="grid gap-2">
              <Label>Unit of Measure</Label>
              <UnitSelector
                value={unit}
                onChange={setUnit}
              />
            </div>
          )}

          {/* Test Method */}
          <div className="grid gap-2">
            <Label>Test Method</Label>
            <TestMethodAutocomplete
              value={testMethod}
              onChange={setTestMethod}
            />
          </div>

          {/* Toggles Row */}
          <div className="flex flex-wrap gap-6 py-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="is-critical"
                checked={isCritical}
                onCheckedChange={setIsCritical}
              />
              <Label htmlFor="is-critical" className="cursor-pointer">
                Critical Parameter
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="instrument-required"
                checked={instrumentRequired}
                onCheckedChange={setInstrumentRequired}
              />
              <Label htmlFor="instrument-required" className="cursor-pointer">
                Requires Equipment
              </Label>
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div className="grid gap-2">
            <Label htmlFor="acceptance-criteria">Acceptance Criteria</Label>
            <Textarea
              id="acceptance-criteria"
              value={acceptanceCriteria}
              onChange={(e) => setAcceptanceCriteria(e.target.value)}
              placeholder="Describe acceptance criteria for this parameter..."
              rows={3}
              className={errors.acceptanceCriteria ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Additional criteria for evaluation</span>
              <span className={acceptanceCriteria.length > 1000 ? 'text-red-500' : ''}>
                {acceptanceCriteria.length}/1000
              </span>
            </div>
            {errors.acceptanceCriteria && (
              <p className="text-sm text-red-500">{errors.acceptanceCriteria}</p>
            )}
          </div>

          {/* Sampling Instructions */}
          <div className="grid gap-2">
            <Label htmlFor="sampling-instructions">Sampling Instructions</Label>
            <Textarea
              id="sampling-instructions"
              value={samplingInstructions}
              onChange={(e) => setSamplingInstructions(e.target.value)}
              placeholder="How to sample for this test..."
              rows={3}
              className={errors.samplingInstructions ? 'border-red-500' : ''}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Guidance on sampling procedure</span>
              <span className={samplingInstructions.length > 1000 ? 'text-red-500' : ''}>
                {samplingInstructions.length}/1000
              </span>
            </div>
            {errors.samplingInstructions && (
              <p className="text-sm text-red-500">{errors.samplingInstructions}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Add Parameter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ParameterForm
