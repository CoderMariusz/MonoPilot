import type { Metadata } from 'next';
import { IntegrationsManager } from '@/components/settings/IntegrationsManager';

export const metadata: Metadata = {
  title: 'Integrations | Settings',
  description: 'Manage external integrations and API connections'
};

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Integrations
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Connect and manage external services and APIs.
        </p>
      </div>

      <IntegrationsManager />
    </div>
  );
}
