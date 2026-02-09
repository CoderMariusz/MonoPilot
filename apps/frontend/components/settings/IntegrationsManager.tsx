'use client';

import { useState } from 'react';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationModal } from './IntegrationModal';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  isConnected: boolean;
  apiKey?: string;
  lastUpdated?: string;
  docs?: string;
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'slack',
    name: 'Slack',
    description: 'Send notifications and messages to Slack channels',
    icon: '💬',
    category: 'Communication',
    isConnected: false,
    docs: 'https://slack.com/api'
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync tasks and pull requests',
    icon: '🐙',
    category: 'Development',
    isConnected: false,
    docs: 'https://docs.github.com/en/rest'
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Process payments and subscriptions',
    icon: '💳',
    category: 'Payment',
    isConnected: false,
    docs: 'https://stripe.com/docs/api'
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Automate workflows with Zapier',
    icon: '⚡',
    category: 'Automation',
    isConnected: false,
    docs: 'https://zapier.com/platform/public-api'
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Store and sync files to Google Drive',
    icon: '📁',
    category: 'Cloud Storage',
    isConnected: false,
    docs: 'https://developers.google.com/drive'
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Send emails and manage campaigns',
    icon: '📧',
    category: 'Email',
    isConnected: false,
    docs: 'https://sendgrid.com/docs/api-reference'
  }
];

export function IntegrationsManager() {
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleConnect = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowModal(true);
  };

  const handleSaveIntegration = (apiKey: string) => {
    if (selectedIntegration) {
      setIntegrations(
        integrations.map(int =>
          int.id === selectedIntegration.id
            ? {
                ...int,
                isConnected: true,
                apiKey: apiKey.slice(0, 8) + '...' + apiKey.slice(-4),
                lastUpdated: new Date().toISOString()
              }
            : int
        )
      );
      setShowModal(false);
      setSelectedIntegration(null);
    }
  };

  const handleDisconnect = (integrationId: string) => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
      setIntegrations(
        integrations.map(int =>
          int.id === integrationId
            ? {
                ...int,
                isConnected: false,
                apiKey: undefined,
                lastUpdated: undefined
              }
            : int
        )
      );
    }
  };

  const categories = Array.from(
    new Set(integrations.map(int => int.category))
  ).sort();

  return (
    <div className="space-y-8">
      {/* Integration Modal */}
      {showModal && selectedIntegration && (
        <IntegrationModal
          integration={selectedIntegration}
          onSave={handleSaveIntegration}
          onClose={() => {
            setShowModal(false);
            setSelectedIntegration(null);
          }}
        />
      )}

      {/* Integrations by Category */}
      {categories.map(category => (
        <div key={category}>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {category}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {integrations
              .filter(int => int.category === category)
              .map(integration => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onConnect={() => handleConnect(integration)}
                  onDisconnect={() => handleDisconnect(integration.id)}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
