'use client';

import { useState } from 'react';
import { WebhookList } from './WebhookList';
import { WebhookForm } from './WebhookForm';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  auth?: {
    type: 'none' | 'bearer' | 'basic';
    token?: string;
  };
  lastTriggered?: string;
  successCount?: number;
  failureCount?: number;
  createdAt?: string;
}

const AVAILABLE_EVENTS = [
  { id: 'task.created', label: 'Task Created', category: 'Tasks' },
  { id: 'task.updated', label: 'Task Updated', category: 'Tasks' },
  { id: 'task.deleted', label: 'Task Deleted', category: 'Tasks' },
  { id: 'task.completed', label: 'Task Completed', category: 'Tasks' },
  { id: 'shopping.added', label: 'Item Added', category: 'Shopping' },
  { id: 'shopping.removed', label: 'Item Removed', category: 'Shopping' },
  { id: 'shopping.checked', label: 'Item Checked', category: 'Shopping' },
  { id: 'role.created', label: 'Role Created', category: 'Settings' },
  { id: 'role.updated', label: 'Role Updated', category: 'Settings' },
  { id: 'role.deleted', label: 'Role Deleted', category: 'Settings' },
  { id: 'integration.connected', label: 'Integration Connected', category: 'Integrations' },
  { id: 'integration.disconnected', label: 'Integration Disconnected', category: 'Integrations' }
];

export function WebhooksManager() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([
    {
      id: 'webhook-1',
      url: 'https://api.example.com/webhooks/tasks',
      events: ['task.created', 'task.completed'],
      isActive: true,
      auth: {
        type: 'bearer',
        token: 'sk_live_...'
      },
      lastTriggered: new Date(Date.now() - 3600000).toISOString(),
      successCount: 156,
      failureCount: 2,
      createdAt: new Date(Date.now() - 7776000000).toISOString()
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

  const handleSaveWebhook = (webhook: Omit<Webhook, 'id' | 'createdAt' | 'lastTriggered'>) => {
    if (editingWebhook) {
      setWebhooks(
        webhooks.map(w =>
          w.id === editingWebhook.id
            ? { ...webhook, id: editingWebhook.id, createdAt: editingWebhook.createdAt, lastTriggered: editingWebhook.lastTriggered }
            : w
        )
      );
    } else {
      const newWebhook: Webhook = {
        ...webhook,
        id: `webhook-${Date.now()}`,
        createdAt: new Date().toISOString()
      };
      setWebhooks([...webhooks, newWebhook]);
    }
    setEditingWebhook(null);
    setShowForm(false);
  };

  const handleDeleteWebhook = (webhookId: string) => {
    if (confirm('Are you sure you want to delete this webhook?')) {
      setWebhooks(webhooks.filter(w => w.id !== webhookId));
    }
  };

  const handleToggleWebhook = (webhookId: string) => {
    setWebhooks(
      webhooks.map(w =>
        w.id === webhookId ? { ...w, isActive: !w.isActive } : w
      )
    );
  };

  const handleEditWebhook = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Create Webhook Button */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {webhooks.length} webhook{webhooks.length !== 1 ? 's' : ''} configured
        </div>
        <button
          onClick={() => {
            setEditingWebhook(null);
            setShowForm(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Create Webhook
        </button>
      </div>

      {/* Webhook Form */}
      {showForm && (
        <WebhookForm
          webhook={editingWebhook}
          availableEvents={AVAILABLE_EVENTS}
          onSave={handleSaveWebhook}
          onCancel={() => {
            setShowForm(false);
            setEditingWebhook(null);
          }}
        />
      )}

      {/* Webhooks List */}
      <WebhookList
        webhooks={webhooks}
        onEdit={handleEditWebhook}
        onDelete={handleDeleteWebhook}
        onToggle={handleToggleWebhook}
      />
    </div>
  );
}
