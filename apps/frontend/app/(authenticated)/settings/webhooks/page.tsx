import type { Metadata } from 'next';
import { WebhooksManager } from '@/components/settings/WebhooksManager';

export const metadata: Metadata = {
  title: 'Webhooks | Settings',
  description: 'Manage webhooks and event subscriptions'
};

export default function WebhooksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Webhooks
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Configure webhooks to receive real-time event notifications.
        </p>
      </div>

      <WebhooksManager />
    </div>
  );
}
