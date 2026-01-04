/**
 * useWarehouseSettings Hook
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * React hook for managing warehouse settings state
 */

'use client';

import { useState, useEffect } from 'react';
import { WarehouseSettings } from '@/lib/validation/warehouse-settings';

export function useWarehouseSettings() {
  const [settings, setSettings] = useState<WarehouseSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/warehouse/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<WarehouseSettings>) => {
    try {
      const response = await fetch('/api/warehouse/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Failed to update settings');
      }
      const data = await response.json();
      setSettings(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  const resetSettings = async () => {
    try {
      const response = await fetch('/api/warehouse/settings/reset', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to reset settings');
      }
      const data = await response.json();
      setSettings(data);
      return data;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    resetSettings,
    refetch: fetchSettings,
  };
}
