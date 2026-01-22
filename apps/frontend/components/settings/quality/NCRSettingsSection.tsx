/**
 * NCRSettingsSection Component
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Frontend Implementation
 *
 * Non-Conformance Report settings section with fields:
 * - ncr_auto_number_prefix (text)
 * - ncr_require_root_cause (toggle)
 * - ncr_critical_response_hours (number)
 * - ncr_major_response_hours (number)
 */

'use client';

import * as React from 'react';
import { Control } from 'react-hook-form';
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
import type { UpdateQualitySettingsInput } from '@/lib/validation/quality-settings';

interface NCRSettingsSectionProps {
  control: Control<UpdateQualitySettingsInput>;
  isReadOnly?: boolean;
}

export function NCRSettingsSection({
  control,
  isReadOnly = false,
}: NCRSettingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* NCR Auto-Number Prefix */}
      <FormField
        control={control}
        name="ncr_auto_number_prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>NCR Auto-Number Prefix</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? 'NCR-'}
                placeholder="NCR-"
                disabled={isReadOnly}
                data-testid="ncr_auto_number_prefix"
                className="max-w-xs"
                maxLength={10}
              />
            </FormControl>
            <FormDescription>
              Prefix for auto-generated NCR numbers (e.g., NCR-0001). Max 10 characters.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Require Root Cause */}
      <FormField
        control={control}
        name="ncr_require_root_cause"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require Root Cause Analysis</FormLabel>
              <FormDescription>
                Root cause must be documented before closing an NCR
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="ncr_require_root_cause"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="border-t pt-6 mt-6">
        <h4 className="text-sm font-medium mb-4 text-muted-foreground">Response SLA (Service Level Agreement)</h4>
      </div>

      {/* Critical NCR Response Hours */}
      <FormField
        control={control}
        name="ncr_critical_response_hours"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Critical NCR Response Time</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="24"
                  value={field.value ?? 24}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseInt(val, 10));
                  }}
                  disabled={isReadOnly}
                  data-testid="ncr_critical_response_hours"
                  className="max-w-xs"
                  min={1}
                  max={168}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </FormControl>
            <FormDescription>
              Maximum time to respond to critical severity NCRs (1-168 hours, default 24)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Major NCR Response Hours */}
      <FormField
        control={control}
        name="ncr_major_response_hours"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Major NCR Response Time</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="48"
                  value={field.value ?? 48}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseInt(val, 10));
                  }}
                  disabled={isReadOnly}
                  data-testid="ncr_major_response_hours"
                  className="max-w-xs"
                  min={1}
                  max={336}
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
            </FormControl>
            <FormDescription>
              Maximum time to respond to major severity NCRs (1-336 hours, default 48)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
