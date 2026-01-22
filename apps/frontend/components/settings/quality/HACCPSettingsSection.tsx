/**
 * HACCPSettingsSection Component
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Frontend Implementation
 *
 * HACCP (Hazard Analysis Critical Control Point) settings section with fields:
 * - ccp_deviation_escalation_minutes (number)
 * - ccp_auto_create_ncr (toggle)
 */

'use client';

import * as React from 'react';
import { Control } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import type { UpdateQualitySettingsInput } from '@/lib/validation/quality-settings';

interface HACCPSettingsSectionProps {
  control: Control<UpdateQualitySettingsInput>;
  isReadOnly?: boolean;
}

export function HACCPSettingsSection({
  control,
  isReadOnly = false,
}: HACCPSettingsSectionProps) {
  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          HACCP settings control Critical Control Point (CCP) monitoring and deviation handling.
          These settings are essential for food safety compliance.
        </AlertDescription>
      </Alert>

      {/* CCP Deviation Escalation Minutes */}
      <FormField
        control={control}
        name="ccp_deviation_escalation_minutes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CCP Deviation Escalation Time</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="15"
                  value={field.value ?? 15}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? undefined : parseInt(val, 10));
                  }}
                  disabled={isReadOnly}
                  data-testid="ccp_deviation_escalation_minutes"
                  className="max-w-xs"
                  min={1}
                  max={1440}
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </FormControl>
            <FormDescription>
              Time before CCP deviation escalates to QA Manager (1-1440 minutes, default 15)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Auto-Create NCR on CCP Deviation */}
      <FormField
        control={control}
        name="ccp_auto_create_ncr"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Auto-Create NCR on CCP Deviation</FormLabel>
              <FormDescription>
                Automatically create a Non-Conformance Report when a CCP deviation is recorded
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value ?? true}
                onCheckedChange={field.onChange}
                disabled={isReadOnly}
                data-testid="ccp_auto_create_ncr"
              />
            </FormControl>
          </FormItem>
        )}
      />

      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <h4 className="font-medium mb-2">About CCP Monitoring</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Critical Control Points are steps where food safety hazards can be prevented or eliminated</li>
          <li>Deviations from critical limits must be addressed immediately</li>
          <li>Escalation alerts ensure timely response by quality management</li>
          <li>NCR auto-creation ensures full traceability of deviations</li>
        </ul>
      </div>
    </div>
  );
}
