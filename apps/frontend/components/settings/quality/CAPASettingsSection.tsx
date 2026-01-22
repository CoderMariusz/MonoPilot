/**
 * CAPASettingsSection Component
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Frontend Implementation
 *
 * Corrective and Preventive Action settings section with fields:
 * - capa_auto_number_prefix (text)
 * - capa_require_effectiveness (toggle)
 * - capa_effectiveness_wait_days (number)
 * - coa_auto_number_prefix (text)
 * - coa_require_approval (toggle)
 */

'use client';

import * as React from 'react';
import { Control, UseFormWatch } from 'react-hook-form';
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

interface CAPASettingsSectionProps {
  control: Control<UpdateQualitySettingsInput>;
  watch: UseFormWatch<UpdateQualitySettingsInput>;
  isReadOnly?: boolean;
}

export function CAPASettingsSection({
  control,
  watch,
  isReadOnly = false,
}: CAPASettingsSectionProps) {
  const requireEffectiveness = watch('capa_require_effectiveness');

  return (
    <div className="space-y-6">
      {/* CAPA Auto-Number Prefix */}
      <FormField
        control={control}
        name="capa_auto_number_prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CAPA Auto-Number Prefix</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? 'CAPA-'}
                placeholder="CAPA-"
                disabled={isReadOnly}
                data-testid="capa_auto_number_prefix"
                className="max-w-xs"
                maxLength={10}
              />
            </FormControl>
            <FormDescription>
              Prefix for auto-generated CAPA numbers (e.g., CAPA-0001). Max 10 characters.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Require Effectiveness Check */}
      <FormField
        control={control}
        name="capa_require_effectiveness"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require Effectiveness Check</FormLabel>
              <FormDescription>
                CAPA effectiveness must be verified before closing
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="capa_require_effectiveness"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Effectiveness Wait Days */}
      <FormField
        control={control}
        name="capa_effectiveness_wait_days"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Effectiveness Wait Period</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="30"
                  value={field.value ?? 30}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseInt(val, 10));
                  }}
                  disabled={isReadOnly || !requireEffectiveness}
                  data-testid="capa_effectiveness_wait_days"
                  className="max-w-xs"
                  min={0}
                  max={365}
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </FormControl>
            <FormDescription>
              Minimum days to wait before effectiveness check (0-365 days, default 30)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="border-t pt-6 mt-6">
        <h4 className="text-sm font-medium mb-4 text-muted-foreground">Certificate of Analysis (CoA) Settings</h4>
      </div>

      {/* CoA Auto-Number Prefix */}
      <FormField
        control={control}
        name="coa_auto_number_prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CoA Auto-Number Prefix</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? 'COA-'}
                placeholder="COA-"
                disabled={isReadOnly}
                data-testid="coa_auto_number_prefix"
                className="max-w-xs"
                maxLength={10}
              />
            </FormControl>
            <FormDescription>
              Prefix for auto-generated Certificate of Analysis numbers. Max 10 characters.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Require CoA Approval */}
      <FormField
        control={control}
        name="coa_require_approval"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require CoA Approval</FormLabel>
              <FormDescription>
                Certificates of Analysis must be approved before release
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="coa_require_approval"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
