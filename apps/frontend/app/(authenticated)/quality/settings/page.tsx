/**
 * Quality Settings Page
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Frontend Implementation
 *
 * Route: /quality/settings
 *
 * Implements organization-level quality settings to configure:
 * - Inspection requirements (incoming/final, auto-create on GRN)
 * - NCR settings (auto-numbering, response SLA, root cause)
 * - CAPA settings (auto-numbering, effectiveness requirements)
 * - HACCP settings (CCP deviation escalation, auto-NCR creation)
 * - Audit settings (change reason requirement, retention period)
 *
 * Permission checks:
 * - All authenticated users can view settings (read-only)
 * - Admin, Owner, QA Manager can edit and save settings
 * - Save button is hidden for non-authorized users
 */

import { QualitySettingsForm } from '@/components/settings/quality';

export const metadata = {
  title: 'Quality Settings | MonoPilot',
  description: 'Configure quality module operational parameters',
};

export default function QualitySettingsPage() {
  return <QualitySettingsForm />;
}
