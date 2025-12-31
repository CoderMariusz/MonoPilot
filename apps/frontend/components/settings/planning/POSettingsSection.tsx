/**
 * POSettingsSection Component
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Purchase Order settings section with 7 fields:
 * - require_approval (toggle)
 * - approval_threshold (number, dependent on require_approval)
 * - approval_roles (multi-select)
 * - prefix, format (text)
 * - payment_terms, currency (select)
 */

'use client';

import * as React from 'react';
import { Control, FieldErrors, UseFormWatch } from 'react-hook-form';
import { Input } from '@/components/ui/input';
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
import { PAYMENT_TERMS_OPTIONS, CURRENCY_OPTIONS } from '@/lib/types/planning-settings';
import type { PlanningSettingsInput } from '@/lib/validation/planning-settings-schemas';

interface POSettingsSectionProps {
  control: Control<PlanningSettingsInput>;
  errors: FieldErrors<PlanningSettingsInput>;
  watch: UseFormWatch<PlanningSettingsInput>;
}

export function POSettingsSection({ control, errors, watch }: POSettingsSectionProps) {
  const requireApproval = watch('po_require_approval');

  return (
    <div className="space-y-6">
      {/* Require Approval Toggle */}
      <FormField
        control={control}
        name="po_require_approval"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Require PO Approval</FormLabel>
              <FormDescription>
                Require approval before PO confirmation
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="po_require_approval"
              />
            </FormControl>
          </FormItem>
        )}
      />

      {/* Approval Threshold */}
      <FormField
        control={control}
        name="po_approval_threshold"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Approval Threshold Amount</FormLabel>
            <FormControl>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={field.value ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    field.onChange(val === '' ? null : parseFloat(val));
                  }}
                  disabled={!requireApproval}
                  data-testid="po_approval_threshold"
                  className="max-w-xs"
                  min={0}
                />
                <span className="text-sm text-muted-foreground">PLN</span>
              </div>
            </FormControl>
            <FormDescription>
              Require approval for POs above this amount (0 = all orders)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Auto-Numbering Prefix */}
      <FormField
        control={control}
        name="po_auto_number_prefix"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Auto-Numbering Prefix</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="PO-"
                data-testid="po_auto_number_prefix"
                className="max-w-xs"
              />
            </FormControl>
            <FormDescription>
              Prefix for auto-generated PO numbers
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Auto-Numbering Format */}
      <FormField
        control={control}
        name="po_auto_number_format"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Auto-Numbering Format</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="YYYY-NNNNN"
                data-testid="po_auto_number_format"
                className="max-w-xs"
              />
            </FormControl>
            <FormDescription>
              Format for PO number generation (YYYY=year, NNNNN=sequence). Example: PO-2025-00123
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Default Payment Terms */}
      <FormField
        control={control}
        name="po_default_payment_terms"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Payment Terms</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger
                  className="max-w-xs"
                  data-testid="po_default_payment_terms"
                >
                  <SelectValue placeholder="Select payment terms" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PAYMENT_TERMS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Payment terms applied to new purchase orders
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Default Currency */}
      <FormField
        control={control}
        name="po_default_currency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Default Currency</FormLabel>
            <Select
              onValueChange={field.onChange}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger
                  className="max-w-xs"
                  data-testid="po_default_currency"
                >
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Default currency for new purchase orders
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
