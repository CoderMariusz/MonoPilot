/**
 * PlanningSettingsForm Component
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Main form component with:
 * - Three collapsible sections (PO, TO, WO)
 * - Dirty state tracking for unsaved changes warning
 * - Save button with loading state
 * - Success/error toast notifications
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingCart, Truck, Factory, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

import { CollapsibleSection } from './CollapsibleSection';
import { POSettingsSection } from './POSettingsSection';
import { TOSettingsSection } from './TOSettingsSection';
import { WOSettingsSection } from './WOSettingsSection';

import { useUpdatePlanningSettings } from '@/lib/hooks/use-planning-settings';
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes';
import { planningSettingsSchema } from '@/lib/validation/planning-settings-schemas';
import type { PlanningSettings } from '@/lib/types/planning-settings';
import type { PlanningSettingsInput } from '@/lib/validation/planning-settings-schemas';

interface PlanningSettingsFormProps {
  /** Initial settings from the server */
  initialSettings: PlanningSettings;
}

export function PlanningSettingsForm({ initialSettings }: PlanningSettingsFormProps) {
  const { toast } = useToast();
  const updateMutation = useUpdatePlanningSettings();

  // Initialize form with react-hook-form and Zod resolver
  const form = useForm<PlanningSettingsInput>({
    resolver: zodResolver(planningSettingsSchema),
    defaultValues: {
      // PO Settings
      po_require_approval: initialSettings.po_require_approval,
      po_approval_threshold: initialSettings.po_approval_threshold,
      po_approval_roles: initialSettings.po_approval_roles,
      po_auto_number_prefix: initialSettings.po_auto_number_prefix,
      po_auto_number_format: initialSettings.po_auto_number_format,
      po_default_payment_terms: initialSettings.po_default_payment_terms,
      po_default_currency: initialSettings.po_default_currency,

      // TO Settings
      to_allow_partial_shipments: initialSettings.to_allow_partial_shipments,
      to_require_lp_selection: initialSettings.to_require_lp_selection,
      to_auto_number_prefix: initialSettings.to_auto_number_prefix,
      to_auto_number_format: initialSettings.to_auto_number_format,
      to_default_transit_days: initialSettings.to_default_transit_days,

      // WO Settings
      wo_material_check: initialSettings.wo_material_check,
      wo_copy_routing: initialSettings.wo_copy_routing,
      wo_auto_select_bom: initialSettings.wo_auto_select_bom,
      wo_require_bom: initialSettings.wo_require_bom,
      wo_allow_overproduction: initialSettings.wo_allow_overproduction,
      wo_overproduction_limit: initialSettings.wo_overproduction_limit,
      wo_auto_number_prefix: initialSettings.wo_auto_number_prefix,
      wo_auto_number_format: initialSettings.wo_auto_number_format,
      wo_default_scheduling_buffer_hours: initialSettings.wo_default_scheduling_buffer_hours,
    },
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = form;

  // Unsaved changes warning
  useUnsavedChanges(isDirty);

  // Handle form submission
  const onSubmit = async (data: PlanningSettingsInput) => {
    try {
      await updateMutation.mutateAsync(data);
      toast({
        title: 'Success',
        description: 'Planning settings saved successfully',
      });
      // Reset form state to mark as not dirty
      reset(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* PO Settings Section */}
        <CollapsibleSection
          title="PO Settings"
          icon={<ShoppingCart className="h-5 w-5" />}
          storageKey="po"
          testId="po-settings"
          defaultOpen
        >
          <POSettingsSection
            control={control}
            errors={errors}
            watch={watch}
          />
        </CollapsibleSection>

        {/* TO Settings Section */}
        <CollapsibleSection
          title="TO Settings"
          icon={<Truck className="h-5 w-5" />}
          storageKey="to"
          testId="to-settings"
          defaultOpen
        >
          <TOSettingsSection
            control={control}
            errors={errors}
          />
        </CollapsibleSection>

        {/* WO Settings Section */}
        <CollapsibleSection
          title="WO Settings"
          icon={<Factory className="h-5 w-5" />}
          storageKey="wo"
          testId="wo-settings"
          defaultOpen
        >
          <WOSettingsSection
            control={control}
            errors={errors}
            watch={watch}
          />
        </CollapsibleSection>

        {/* Footer with Save Button */}
        <div className="flex justify-end border-t pt-6">
          <Button
            type="submit"
            disabled={!isDirty || isSubmitting || updateMutation.isPending}
          >
            {(isSubmitting || updateMutation.isPending) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
