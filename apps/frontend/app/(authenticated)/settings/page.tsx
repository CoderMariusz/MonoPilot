/**
 * Settings Dashboard Landing Page
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 * Story: 1.15 Settings Dashboard Landing Page (legacy)
 *
 * Provides visual overview of all available settings sections,
 * allowing users to discover and navigate to configuration areas.
 */

'use client';

import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { SettingsStatsCards } from '@/components/settings/SettingsStatsCards';

export default function SettingsPage() {
  return (
    <SettingsLayout
      title="Settings"
      description="Manage your organization settings and preferences"
    >
      <SettingsStatsCards />

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-900 dark:text-blue-100">
          <strong>Tip:</strong> Use the navigation sidebar to access different
          settings sections.
        </p>
      </div>
    </SettingsLayout>
  );
}
