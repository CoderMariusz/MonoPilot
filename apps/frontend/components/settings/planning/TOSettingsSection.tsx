/**
 * TOSettingsSection Component
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Transfer Order settings section with 5 fields:
 * - allow_partial_shipments (toggle)
 * - require_lp_selection (toggle)
 * - prefix, format (text)
 * - transit_days (number)
 */

'use client';

import * as React from 'react';
import { Control, FieldErrors } from 'react-hook-form';
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

interface TOSettingsSectionProps {
  control: Control<PlanningSettingsInput>;
  errors: FieldErrors<PlanningSettingsInput>;
}

export function TOSettingsSection({ control, errors }: TOSettingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Allow Partial Shipments Toggle */}
      <FormField
        control={control}
        name="to_allow_partial_shipments"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Allow Partial Shipments</FormLabel>
              <FormDescription>
                Allow transfer orders to be shipped in multiple shipments
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="to_allow_partial_shipments"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Require LP Selection Toggle */}
      <FormField
        control={control}
        name="to_require_lp_selection"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require License Plate Selection</FormLabel>
              <FormDescription>
                Require LP assignment when creating transfer order (requires Epic 05 - Warehouse)
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="to_require_lp_selection"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Auto-Numbering Prefix */}
      <FormField
        control={control}
        name="to_auto_number_prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Auto-Numbering Prefix</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="TO-"
                data-testid="to_auto_number_prefix"
                className="max-w-xs"
              />
            </FormControl>
            <FormDescription>
              Prefix for auto-generated TO numbers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Auto-Numbering Format */}
      <FormField
        control={control}
        name="to_auto_number_format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Auto-Numbering Format</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="YYYY-NNNNN"
                data-testid="to_auto_number_format"
                className="max-w-xs"
              />
            </FormControl>
            <FormDescription>
              Format for TO number generation (YYYY=year, NNNNN=sequence). Example: TO-2025-00042
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Default Transit Days */}
      <FormField
        control={control}
        name="to_default_transit_days"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Transit Days</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  {...field}
                  value={field.value ?? 1}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  data-testid="to_default_transit_days"
                  className="max-w-xs"
                  min={0}
                  max={365}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </FormControl>
            <FormDescription>
              Default transit time between warehouses
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
