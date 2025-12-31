/**
 * WOSettingsSection Component
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Work Order settings section with 9 fields:
 * - material_check, copy_routing, auto_select_bom, require_bom (toggles)
 * - allow_overproduction (toggle)
 * - overproduction_limit (number, dependent on allow_overproduction)
 * - prefix, format (text)
 * - scheduling_buffer (number)
 */

'use client';

import * as React from 'react';
import { Control, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import type { PlanningSettingsInput } from '@/lib/validation/planning-settings-schemas';

interface WOSettingsSectionProps {
  control: Control<PlanningSettingsInput>;
  errors: FieldErrors<PlanningSettingsInput>;
  watch: UseFormWatch<PlanningSettingsInput>;
}

export function WOSettingsSection({ control, errors, watch }: WOSettingsSectionProps) {
  const allowOverproduction = watch('wo_allow_overproduction');

  return (
    <div className="space-y-6">
      {/* Material Check Toggle */}
      <FormField
        control={control}
        name="wo_material_check"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Check Material Availability on Create</FormLabel>
              <FormDescription>
                Verify material stock when creating work order
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="wo_material_check"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Copy Routing Toggle */}
      <FormField
        control={control}
        name="wo_copy_routing"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Copy Routing Operations to WO</FormLabel>
              <FormDescription>
                Automatically copy routing operations when creating work order
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="wo_copy_routing"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Auto-Select BOM Toggle */}
      <FormField
        control={control}
        name="wo_auto_select_bom"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Auto-Select Active BOM</FormLabel>
              <FormDescription>
                Automatically select active BOM for product when creating WO
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="wo_auto_select_bom"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Require BOM Toggle */}
      <FormField
        control={control}
        name="wo_require_bom"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require BOM to Create WO</FormLabel>
              <FormDescription>
                Block WO creation if product has no active BOM
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="wo_require_bom"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Allow Overproduction Toggle */}
      <FormField
        control={control}
        name="wo_allow_overproduction"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Allow Overproduction</FormLabel>
              <FormDescription>
                Allow actual production quantity to exceed planned quantity
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="wo_allow_overproduction"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Overproduction Limit */}
      <FormField
        control={control}
        name="wo_overproduction_limit"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Overproduction Limit (%)</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 10}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  disabled={!allowOverproduction}
                  data-testid="wo_overproduction_limit"
                  className="max-w-xs"
                  min={0}
                  max={100}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </FormControl>
            <FormDescription>
              Maximum overproduction allowed when enabled
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Auto-Numbering Prefix */}
      <FormField
        control={control}
        name="wo_auto_number_prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Auto-Numbering Prefix</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="WO-"
                data-testid="wo_auto_number_prefix"
                className="max-w-xs"
              />
            </FormControl>
            <FormDescription>
              Prefix for auto-generated WO numbers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Auto-Numbering Format */}
      <FormField
        control={control}
        name="wo_auto_number_format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Auto-Numbering Format</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="YYYY-NNNNN"
                data-testid="wo_auto_number_format"
                className="max-w-xs"
              />
            </FormControl>
            <FormDescription>
              Format for WO number generation (YYYY=year, NNNNN=sequence). Example: WO-2025-00078
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Default Scheduling Buffer */}
      <FormField
        control={control}
        name="wo_default_scheduling_buffer_hours"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Scheduling Buffer (hours)</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 2}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  data-testid="wo_default_scheduling_buffer_hours"
                  className="max-w-xs"
                  min={0}
                  max={168}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </FormControl>
            <FormDescription>
              Buffer time added to scheduled end time for planning
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
