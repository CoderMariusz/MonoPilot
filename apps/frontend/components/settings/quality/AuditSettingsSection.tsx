/**
 * AuditSettingsSection Component
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Frontend Implementation
 *
 * Audit trail and document retention settings section with fields:
 * - require_change_reason (toggle)
 * - retention_years (number)
 */

'use client';

import * as React from 'react';
import { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import type { UpdateQualitySettingsInput } from '@/lib/validation/quality-settings';

interface AuditSettingsSectionProps {
  control: Control<UpdateQualitySettingsInput>;
  isReadOnly?: boolean;
}

export function AuditSettingsSection({
  control,
  isReadOnly = false,
}: AuditSettingsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Require Change Reason */}
      <FormField
        control={control}
        name="require_change_reason"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require Change Reason</FormLabel>
              <FormDescription>
                Users must provide a reason when modifying critical quality records
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="require_change_reason"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Retention Years */}
      <FormField
        control={control}
        name="retention_years"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Document Retention Period</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="7"
                  value={field.value ?? 7}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseInt(val, 10));
                  }}
                  disabled={isReadOnly}
                  data-testid="retention_years"
                  className="max-w-xs"
                  min={1}
                  max={50}
                />
                <span className="text-sm text-muted-foreground">years</span>
              </div>
            </FormControl>
            <FormDescription>
              How long quality records are retained (1-50 years, default 7)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Regulatory Note:</strong> Many food safety regulations require
          minimum retention periods. FDA typically requires 2 years beyond product
          shelf life or 3 years from record creation. GFSI standards may require
          longer retention. Consult your compliance team for specific requirements.
        </AlertDescription>
      </Alert>

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <h4 className="font-medium mb-2">Audit Trail Coverage</h4>
        <p className="mb-2">When enabled, change reasons are required for:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>NCR status changes and disposition decisions</li>
          <li>CAPA action modifications</li>
          <li>Inspection result corrections</li>
          <li>Hold and release decisions</li>
          <li>Quality settings changes</li>
        </ul>
      </div>
    </div>
  );
}
