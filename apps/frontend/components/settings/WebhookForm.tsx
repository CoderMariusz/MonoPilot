'use client';

import { useState } from 'react';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  auth?: {
    type: 'none' | 'bearer' | 'basic';
    token?: string;
  };
}

interface Event {
  id: string;
  label: string;
  category: string;
}

interface WebhookFormProps {
  webhook: Webhook | null;
  availableEvents: Event[];
  onSave: (webhook: Omit<Webhook, 'id' | 'createdAt' | 'lastTriggered'>) => void;
  onCancel: () => void;
}

export function WebhookForm({
  webhook,
  availableEvents,
  onSave,
  onCancel
}: WebhookFormProps) {
  const [url, setUrl] = useState(webhook?.url ?? '');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(webhook?.events ?? []);
  const [authType, setAuthType] = useState<'none' | 'bearer' | 'basic'>(webhook?.auth?.type ?? 'none');
  const [authToken, setAuthToken] = useState(webhook?.auth?.token ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!url.trim()) {
      newErrors.url = 'Webhook URL is required';
    } else {
      try {
        new URL(url);
      } catch {
        newErrors.url = 'Invalid URL format';
      }
    }

    if (selectedEvents.length === 0) {
      newErrors.events = 'At least one event must be selected';
    }

    if ((authType === 'bearer' || authType === 'basic') && !authToken.trim()) {
      newErrors.authToken = `${authType === 'bearer' ? 'Bearer' : 'Basic'} token is required`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    onSave({
      url,
      events: selectedEvents,
      isActive: webhook?.isActive ?? true,
      auth: authType === 'none' ? undefined : { type: authType, token: authToken }
    });
  };

  const eventsByCategory = availableEvents.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  const categories = Object.keys(eventsByCategory).sort();

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          {webhook ? 'Edit Webhook' : 'Create New Webhook'}
        </h2>
      </div>

      {/* URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Webhook URL *
        </label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/webhooks"
          className={`w-full px-4 py-2 rounded-lg border ${
            errors.url
              ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-gray-300 dark:border-gray-700'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
        />
        {errors.url && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.url}</p>}
      </div>

      {/* Events */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Events *
        </label>
        <div className="space-y-4">
          {categories.map(category => (
            <div key={category} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">{category}</h4>
              <div className="grid grid-cols-2 gap-3">
                {eventsByCategory[category].map(event => (
                  <label key={event.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedEvents.includes(event.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEvents([...selectedEvents, event.id]);
                        } else {
                          setSelectedEvents(selectedEvents.filter(id => id !== event.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 dark:text-blue-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        {errors.events && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{errors.events}</p>}
      </div>

      {/* Authentication */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Authentication
        </label>
        <div className="space-y-3">
          <select
            value={authType}
            onChange={(e) => setAuthType(e.target.value as 'none' | 'bearer' | 'basic')}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="none">No Authentication</option>
            <option value="bearer">Bearer Token</option>
            <option value="basic">Basic Auth</option>
          </select>

          {(authType === 'bearer' || authType === 'basic') && (
            <input
              type="password"
              value={authToken}
              onChange={(e) => setAuthToken(e.target.value)}
              placeholder={authType === 'bearer' ? 'Enter your bearer token' : 'Enter username:password'}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.authToken
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-300 dark:border-gray-700'
              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
            />
          )}
          {errors.authToken && <p className="text-red-600 dark:text-red-400 text-sm">{errors.authToken}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
        >
          {webhook ? 'Update Webhook' : 'Create Webhook'}
        </button>
      </div>
    </form>
  );
}
