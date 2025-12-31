/**
 * Planning Settings Page
 * Story: 03.17 - Planning Settings (Module Configuration)
 *
 * Server component that fetches initial settings and renders the form.
 * Route: /settings/planning
 */

'use client';

import * as React from 'react';
import { AlertCircle, Loader2, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PlanningSettingsForm } from '@/components/settings/planning/PlanningSettingsForm';
import { usePlanningSettings } from '@/lib/hooks/use-planning-settings';

/**
 * Loading skeleton for the page
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Section skeletons */}
      {[1, 2, 3].map((i) => (
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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="h-12 w-12 text-destructive mb-4" />
      <h2 className="text-lg font-semibold mb-2">Failed to Load Planning Settings</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        Unable to retrieve planning configuration. Check your connection.
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
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Settings className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold mb-2">No Planning Settings Found</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        Planning settings have not been configured for your organization.
        Initialize with default recommended settings.
      </p>
      <Button onClick={onInitialize}>Initialize Default Settings</Button>
      <p className="text-sm text-muted-foreground mt-4">
        Note: Default settings are optimized for food manufacturing best practices.
      </p>
    </div>
  );
}

export default function PlanningSettingsPage() {
  const { data: settings, isLoading, error, refetch } = usePlanningSettings();

  // Loading state
  if (isLoading) {
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

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Planning Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure purchasing, transfer, and work order settings for your organization.
        </p>
      </div>

      {/* Form */}
      <PlanningSettingsForm initialSettings={settings} />
    </div>
  );
}
