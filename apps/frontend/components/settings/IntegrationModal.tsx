'use client';

import { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  icon: string;
}

interface IntegrationModalProps {
  integration: Integration;
  onSave: (apiKey: string) => void;
  onClose: () => void;
}

export function IntegrationModal({
  integration,
  onSave,
  onClose
}: IntegrationModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    if (apiKey.length < 10) {
      setError('API key seems too short. Please check and try again.');
      return;
    }

    onSave(apiKey);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{integration.icon}</span>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Connect {integration.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Secure connection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key or Token
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError('');
                }}
                placeholder="Paste your API key here"
                className={`w-full px-4 py-2 rounded-lg border ${
                  error
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    : 'border-gray-300 dark:border-gray-700'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showKey ? '👁️' : '🔒'}
              </button>
            </div>
            {error && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Your API key will be encrypted and stored securely.
            </p>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-900 dark:text-blue-100">
              🔐 API keys are encrypted and never displayed in plain text after saving.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
            >
              Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
