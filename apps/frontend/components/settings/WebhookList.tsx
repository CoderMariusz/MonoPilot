'use client';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggered?: string;
  successCount?: number;
  failureCount?: number;
  createdAt?: string;
}

interface WebhookListProps {
  webhooks: Webhook[];
  onEdit: (webhook: Webhook) => void;
  onDelete: (webhookId: string) => void;
  onToggle: (webhookId: string) => void;
}

export function WebhookList({ webhooks, onEdit, onDelete, onToggle }: WebhookListProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return 'Never';
    const now = Date.now();
    const then = new Date(dateString).getTime();
    const diff = now - then;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return formatDate(dateString);
  };

  if (webhooks.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <div className="text-4xl mb-4">🪝</div>
        <p className="text-gray-600 dark:text-gray-400">No webhooks configured yet</p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Create a webhook to start receiving event notifications</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <div
          key={webhook.id}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left: Details */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={webhook.isActive}
                  onChange={() => onToggle(webhook.id)}
                  className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <p className="font-mono text-sm text-gray-700 dark:text-gray-300 break-all">
                    {webhook.url}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Created {formatDate(webhook.createdAt)}
                  </p>
                </div>
              </div>

              {/* Events */}
              <div>
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Events ({webhook.events.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {webhook.events.map(event => (
                    <span
                      key={event}
                      className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-xs font-medium"
                    >
                      {event}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {webhook.successCount ?? 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-red-600 dark:text-red-400">
                    {webhook.failureCount ?? 0}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatTime(webhook.lastTriggered)}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Last Trigger</div>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(webhook)}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-sm whitespace-nowrap"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete(webhook.id)}
                className="text-red-600 dark:text-red-400 hover:underline font-medium text-sm whitespace-nowrap"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
