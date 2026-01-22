'use client';

/**
 * Test Results Form Component
 * Story: 06.6 - Test Results Recording
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Form for recording test results during quality inspections.
 * - Parameter selection with details display
 * - Dynamic input type based on parameter type
 * - Validation and error display
 * - Optional equipment and calibration tracking
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.6.test-results-recording.md}
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { testResultCreateSchema, type TestResultCreate } from '@/lib/validation/quality-test-results-schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Parameter {
  id: string;
  parameter_name: string;
  parameter_type: 'boolean' | 'text' | 'numeric' | 'range';
  target_value?: string | null;
  min_value?: number | null;
  max_value?: number | null;
  unit?: string | null;
  is_critical?: boolean;
  test_method?: string | null;
}

interface TestResultsFormProps {
  inspectionId: string;
  parameters: Parameter[];
  onSubmit: (data: TestResultCreate) => Promise<void>;
  onCancel?: () => void;
}

export function TestResultsForm({
  inspectionId,
  parameters,
  onSubmit,
  onCancel,
}: TestResultsFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedParam, setSelectedParam] = useState<Parameter | null>(null);

  // Default form values
  const getDefaultFormValues = () => ({
    inspection_id: inspectionId,
    parameter_id: '',
    measured_value: '',
    notes: '',
  });

  const form = useForm<TestResultCreate>({
    resolver: zodResolver(testResultCreateSchema),
    defaultValues: getDefaultFormValues(),
  });

  const handleSubmit = async (data: TestResultCreate) => {
    setSubmitting(true);
    try {
      await onSubmit(data);
      form.reset(getDefaultFormValues());
      setSelectedParam(null);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleParameterChange = (paramId: string) => {
    const param = parameters.find((p) => p.id === paramId);
    setSelectedParam(param || null);
    form.setValue('parameter_id', paramId);
  };

  const getInputType = () => {
    if (selectedParam?.parameter_type === 'numeric' || selectedParam?.parameter_type === 'range') {
      return 'number';
    }
    return 'text';
  };

  const getPlaceholder = () => {
    if (selectedParam?.parameter_type === 'boolean') {
      return 'true/false or yes/no';
    }
    return 'Enter measured value';
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Record Test Result</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Parameter Selection */}
          <div>
            <Label>Parameter</Label>
            <Select
              value={form.watch('parameter_id')}
              onValueChange={handleParameterChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                {parameters.map((param) => (
                  <SelectItem key={param.id} value={param.id}>
                    <span className="flex items-center gap-2">
                      {param.parameter_name}
                      {param.is_critical && (
                        <Badge variant="destructive" className="ml-2">
                          Critical
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.parameter_id && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.parameter_id.message}
              </p>
            )}
          </div>

          {/* Parameter Details */}
          {selectedParam && (
            <div className="p-3 bg-slate-50 rounded-md space-y-1 text-sm">
              <p>
                <strong>Type:</strong> {selectedParam.parameter_type}
              </p>
              {selectedParam.target_value && (
                <p>
                  <strong>Target:</strong> {selectedParam.target_value}
                </p>
              )}
              {selectedParam.min_value !== null && selectedParam.min_value !== undefined && (
                <p>
                  <strong>Min:</strong> {selectedParam.min_value} {selectedParam.unit}
                </p>
              )}
              {selectedParam.max_value !== null && selectedParam.max_value !== undefined && (
                <p>
                  <strong>Max:</strong> {selectedParam.max_value} {selectedParam.unit}
                </p>
              )}
              {selectedParam.test_method && (
                <p>
                  <strong>Method:</strong> {selectedParam.test_method}
                </p>
              )}
            </div>
          )}

          {/* Measured Value */}
          <div>
            <Label>Measured Value</Label>
            <Input
              type={getInputType()}
              step={getInputType() === 'number' ? 'any' : undefined}
              placeholder={getPlaceholder()}
              {...form.register('measured_value')}
            />
            {form.formState.errors.measured_value && (
              <p className="text-sm text-red-600 mt-1">
                {form.formState.errors.measured_value.message}
              </p>
            )}
          </div>

          {/* Equipment (Optional) */}
          <div>
            <Label>Equipment (Optional)</Label>
            <Input placeholder="Equipment ID" {...form.register('equipment_id')} />
          </div>

          {/* Calibration Date (Optional) */}
          <div>
            <Label>Calibration Date (Optional)</Label>
            <Input type="date" {...form.register('calibration_date')} />
          </div>

          {/* Notes */}
          <div>
            <Label>Notes (Optional)</Label>
            <Textarea rows={3} placeholder="Additional notes..." {...form.register('notes')} />
            {form.formState.errors.notes && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.notes.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Result'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

export default TestResultsForm;
