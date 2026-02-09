'use client';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  isConnected: boolean;
  lastUpdated?: string;
  docs?: string;
}

interface IntegrationCardProps {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function IntegrationCard({
  integration,
  onConnect,
  onDisconnect
}: IntegrationCardProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">{integration.icon}</div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100">
              {integration.name}
            </h3>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            integration.isConnected
              ? 'bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          {integration.isConnected ? '✓ Connected' : 'Not Connected'}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-1">
        {integration.description}
      </p>

      {/* Last Updated */}
      {integration.isConnected && integration.lastUpdated && (
        <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
          Connected on {formatDate(integration.lastUpdated)}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {integration.isConnected ? (
          <>
            <button
              onClick={onDisconnect}
              className="flex-1 px-3 py-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-800 transition-colors font-medium text-sm"
            >
              Disconnect
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onConnect}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium text-sm"
            >
              Connect
            </button>
            {integration.docs && (
              <a
                href={integration.docs}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
                title="View documentation"
              >
                Docs
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
