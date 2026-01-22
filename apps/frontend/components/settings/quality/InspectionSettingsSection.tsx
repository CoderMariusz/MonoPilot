/**
 * InspectionSettingsSection Component
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Frontend Implementation
 *
 * Inspection settings section with fields:
 * - require_incoming_inspection (toggle)
 * - require_final_inspection (toggle)
 * - auto_create_inspection_on_grn (toggle)
 * - default_sampling_level (select)
 * - require_hold_reason (toggle)
 * - require_disposition_on_release (toggle)
 */

'use client';

import * as React from 'react';
import { Control } from 'react-hook-form';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import type { UpdateQualitySettingsInput } from '@/lib/validation/quality-settings';

interface InspectionSettingsSectionProps {
  control: Control<UpdateQualitySettingsInput>;
  isReadOnly?: boolean;
}

const SAMPLING_LEVEL_OPTIONS = [
  { value: 'I', label: 'Level I - Reduced Inspection' },
  { value: 'II', label: 'Level II - Normal Inspection (Default)' },
  { value: 'III', label: 'Level III - Tightened Inspection' },
  { value: 'S-1', label: 'S-1 - Special Level 1' },
  { value: 'S-2', label: 'S-2 - Special Level 2' },
  { value: 'S-3', label: 'S-3 - Special Level 3' },
  { value: 'S-4', label: 'S-4 - Special Level 4' },
];

export function InspectionSettingsSection({
  control,
  isReadOnly = false,
}: InspectionSettingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Require Incoming Inspection */}
      <FormField
        control={control}
        name="require_incoming_inspection"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require Incoming Inspection</FormLabel>
              <FormDescription>
                All received materials must pass incoming inspection before use
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="require_incoming_inspection"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Require Final Inspection */}
      <FormField
        control={control}
        name="require_final_inspection"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require Final Inspection</FormLabel>
              <FormDescription>
                Finished products must pass final inspection before shipping
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="require_final_inspection"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Auto-Create Inspection on GRN */}
      <FormField
        control={control}
        name="auto_create_inspection_on_grn"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Auto-Create Inspection on GRN</FormLabel>
              <FormDescription>
                Automatically create incoming inspection when goods receipt is completed
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="auto_create_inspection_on_grn"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Default Sampling Level */}
      <FormField
        control={control}
        name="default_sampling_level"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default AQL Sampling Level</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value ?? 'II'}
              disabled={isReadOnly}
            >
              <FormControl>
                <SelectTrigger
                  className="max-w-md"
                  data-testid="default_sampling_level"
                >
                  <SelectValue placeholder="Select sampling level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {SAMPLING_LEVEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Default AQL inspection level for sampling plans (General: I, II, III; Special: S-1 to S-4)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="border-t pt-6 mt-6">
        <h4 className="text-sm font-medium mb-4 text-muted-foreground">Hold Settings</h4>
      </div>

      {/* Require Hold Reason */}
      <FormField
        control={control}
        name="require_hold_reason"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require Hold Reason</FormLabel>
              <FormDescription>
                A reason must be provided when placing inventory on hold
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="require_hold_reason"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Require Disposition on Release */}
      <FormField
        control={control}
        name="require_disposition_on_release"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require Disposition on Release</FormLabel>
              <FormDescription>
                Disposition decision must be documented when releasing held inventory
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="require_disposition_on_release"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
