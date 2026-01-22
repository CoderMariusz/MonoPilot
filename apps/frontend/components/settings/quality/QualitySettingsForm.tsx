/**
 * QualitySettingsForm Component
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Frontend Implementation
 *
 * Main form component with:
 * - Five collapsible sections (Inspection, NCR, CAPA, HACCP, Audit)
 * - Dirty state tracking for unsaved changes warning
 * - Save button with loading state (hidden for non-admin users)
 * - Success/error toast notifications
 * - All 4 states: loading, error, empty, success
 */

'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ClipboardCheck,
  AlertOctagon,
  FileCheck2,
  ShieldAlert,
  FileText,
  Loader2,
  AlertCircle,
  Settings,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

import { QualityCollapsibleSection } from './QualityCollapsibleSection';
import { InspectionSettingsSection } from './InspectionSettingsSection';
import { NCRSettingsSection } from './NCRSettingsSection';
import { CAPASettingsSection } from './CAPASettingsSection';
import { HACCPSettingsSection } from './HACCPSettingsSection';
import { AuditSettingsSection } from './AuditSettingsSection';

import { useQualitySettings, useUpdateQualitySettings, useCanUpdateQualitySettings } from '@/lib/hooks/use-quality-settings';
import { useUnsavedChanges } from '@/lib/hooks/use-unsaved-changes';
import { updateQualitySettingsSchema } from '@/lib/validation/quality-settings';
import type { QualitySettings, UpdateQualitySettingsInput } from '@/lib/validation/quality-settings';

/**
 * Loading skeleton for the page
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6" data-testid="quality-settings-loading">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Section skeletons */}
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-64" />
          </div>
        </div>
      ))}

      {/* Button skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

/**
 * Error state component
 */
function ErrorState({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="quality-settings-error"
    >
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-semibold mb-2">Failed to Load Quality Settings</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        Unable to retrieve quality configuration. Check your connection.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        Error: {error.message}
      </p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  );
}

/**
 * Empty state component (shown if settings could not be auto-initialized)
 */
function EmptyState({ onInitialize }: { onInitialize: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 text-center"
      data-testid="quality-settings-empty"
    >
      <Settings className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-2">No Quality Settings Found</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        Quality settings have not been configured for your organization.
        Initialize with default recommended settings.
      </p>
      <Button onClick={onInitialize}>Initialize Default Settings</Button>
      <p className="text-sm text-muted-foreground mt-4">
        Note: Default settings are optimized for food manufacturing best practices.
      </p>
    </div>
  );
}

export function QualitySettingsForm() {
  const { toast } = useToast();
  const { data: settings, isLoading, error, refetch } = useQualitySettings();
  const { data: canUpdate, isLoading: isLoadingPermissions } = useCanUpdateQualitySettings();
  const updateMutation = useUpdateQualitySettings();

  // Initialize form with react-hook-form and Zod resolver
  const form = useForm<UpdateQualitySettingsInput>({
    resolver: zodResolver(updateQualitySettingsSchema),
    defaultValues: {},
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { isDirty, isSubmitting },
    reset,
  } = form;

  // Update form values when settings are loaded
  React.useEffect(() => {
    if (settings) {
      reset({
        // Inspection Settings
        require_incoming_inspection: settings.require_incoming_inspection,
        require_final_inspection: settings.require_final_inspection,
        auto_create_inspection_on_grn: settings.auto_create_inspection_on_grn,
        default_sampling_level: settings.default_sampling_level,
        require_hold_reason: settings.require_hold_reason,
        require_disposition_on_release: settings.require_disposition_on_release,
        // NCR Settings
        ncr_auto_number_prefix: settings.ncr_auto_number_prefix,
        ncr_require_root_cause: settings.ncr_require_root_cause,
        ncr_critical_response_hours: settings.ncr_critical_response_hours,
        ncr_major_response_hours: settings.ncr_major_response_hours,
        // CAPA Settings
        capa_auto_number_prefix: settings.capa_auto_number_prefix,
        capa_require_effectiveness: settings.capa_require_effectiveness,
        capa_effectiveness_wait_days: settings.capa_effectiveness_wait_days,
        coa_auto_number_prefix: settings.coa_auto_number_prefix,
        coa_require_approval: settings.coa_require_approval,
        // HACCP Settings
        ccp_deviation_escalation_minutes: settings.ccp_deviation_escalation_minutes,
        ccp_auto_create_ncr: settings.ccp_auto_create_ncr,
        // Audit Settings
        require_change_reason: settings.require_change_reason,
        retention_years: settings.retention_years,
      });
    }
  }, [settings, reset]);

  // Unsaved changes warning
  useUnsavedChanges(isDirty);

  // Handle form submission
  const onSubmit = async (data: UpdateQualitySettingsInput) => {
    try {
      await updateMutation.mutateAsync(data);
      toast({
        title: 'Success',
        description: 'Quality settings saved successfully',
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

  const isReadOnly = !canUpdate && !isLoadingPermissions;

  // Loading state
  if (isLoading || isLoadingPermissions) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <LoadingSkeleton />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <ErrorState error={error} onRetry={() => refetch()} />
      </div>
    );
  }

  // Empty state (should rarely happen due to auto-init)
  if (!settings) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <EmptyState onInitialize={() => refetch()} />
      </div>
    );
  }

  // Success state
  return (
    <div className="container mx-auto py-6 max-w-4xl" data-testid="quality-settings-form">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Quality Settings</h1>
          {isDirty && !isReadOnly && (
            <span className="text-sm font-medium text-yellow-600">Unsaved changes</span>
          )}
        </div>
        <p className="text-muted-foreground mt-2">
          Configure quality module operational parameters including inspection requirements,
          NCR/CAPA settings, HACCP thresholds, and audit trail policies.
        </p>
      </div>

      {/* Read-only warning */}
      {isReadOnly && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have read-only access. Contact your administrator to modify quality settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Form */}
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Inspection Settings Section */}
          <QualityCollapsibleSection
            title="Inspection Settings"
            icon={<ClipboardCheck className="h-5 w-5" />}
            storageKey="inspection"
            testId="inspection-settings"
            defaultOpen
          >
            <InspectionSettingsSection
              control={control}
              isReadOnly={isReadOnly}
            />
          </QualityCollapsibleSection>

          {/* NCR Settings Section */}
          <QualityCollapsibleSection
            title="NCR Settings"
            icon={<AlertOctagon className="h-5 w-5" />}
            storageKey="ncr"
            testId="ncr-settings"
            defaultOpen
          >
            <NCRSettingsSection
              control={control}
              isReadOnly={isReadOnly}
            />
          </QualityCollapsibleSection>

          {/* CAPA Settings Section */}
          <QualityCollapsibleSection
            title="CAPA Settings"
            icon={<FileCheck2 className="h-5 w-5" />}
            storageKey="capa"
            testId="capa-settings"
            defaultOpen
          >
            <CAPASettingsSection
              control={control}
              watch={watch}
              isReadOnly={isReadOnly}
            />
          </QualityCollapsibleSection>

          {/* HACCP Settings Section */}
          <QualityCollapsibleSection
            title="HACCP Settings"
            icon={<ShieldAlert className="h-5 w-5" />}
            storageKey="haccp"
            testId="haccp-settings"
            defaultOpen
          >
            <HACCPSettingsSection
              control={control}
              isReadOnly={isReadOnly}
            />
          </QualityCollapsibleSection>

          {/* Audit Settings Section */}
          <QualityCollapsibleSection
            title="Audit Settings"
            icon={<FileText className="h-5 w-5" />}
            storageKey="audit"
            testId="audit-settings"
            defaultOpen
          >
            <AuditSettingsSection
              control={control}
              isReadOnly={isReadOnly}
            />
          </QualityCollapsibleSection>

          {/* Footer with Save Button - Hidden for non-admin users */}
          {!isReadOnly && (
            <div className="flex justify-end border-t pt-6">
              <Button
                type="submit"
                disabled={!isDirty || isSubmitting || updateMutation.isPending}
                data-testid="save-quality-settings"
              >
                {(isSubmitting || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          )}
        </form>
      </Form>

      {/* Info Notice */}
      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Changes to these settings affect all users in your organization and apply to new quality records.
          Existing records are not affected retroactively.
        </AlertDescription>
      </Alert>
    </div>
  );
}
