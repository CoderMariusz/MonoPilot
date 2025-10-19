'use client';

import { useState, useEffect  } from 'react';
import { Save } from 'lucide-react';
import { useSettings, updateSettings } from '@/lib/clientState';
import { LocationsAPI } from '@/lib/api/locations';
import type { Location } from '@/lib/types';
import { toast } from '@/lib/toast';

export function SettingsForm() {
  const settings = useSettings();
  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    toast.success('Settings saved successfully');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">General Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={formData.general.company_name}
              onChange={(e) => setFormData({
                ...formData,
                general: { ...formData.general, company_name: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Timezone
            </label>
            <select
              value={formData.general.timezone}
              onChange={(e) => setFormData({
                ...formData,
                general: { ...formData.general, timezone: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
            >
              <option value="America/New_York">America/New_York</option>
              <option value="America/Chicago">America/Chicago</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date Format
            </label>
            <select
              value={formData.general.date_format}
              onChange={(e) => setFormData({
                ...formData,
                general: { ...formData.general, date_format: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Currency
            </label>
            <select
              value={formData.general.currency}
              onChange={(e) => setFormData({
                ...formData,
                general: { ...formData.general, currency: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Production Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default LP Prefix
            </label>
            <input
              type="text"
              value={formData.production.default_lp_prefix}
              onChange={(e) => setFormData({
                ...formData,
                production: { ...formData.production, default_lp_prefix: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              WO Number Format
            </label>
            <input
              type="text"
              value={formData.production.wo_number_format}
              onChange={(e) => setFormData({
                ...formData,
                production: { ...formData.production, wo_number_format: e.target.value }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
            />
          </div>

          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.production.auto_complete_wos}
                onChange={(e) => setFormData({
                  ...formData,
                  production: { ...formData.production, auto_complete_wos: e.target.checked }
                })}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">Auto-complete Work Orders</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Warehouse Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Default Location
            </label>
            <select
              value={formData.warehouse.default_location_id || ''}
              onChange={(e) => setFormData({
                ...formData,
                warehouse: { ...formData.warehouse, default_location_id: e.target.value ? Number(e.target.value) : null }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
            >
              <option value="">Select location</option>
              {mockLocations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.warehouse.qa_required}
                onChange={(e) => setFormData({
                  ...formData,
                  warehouse: { ...formData.warehouse, qa_required: e.target.checked }
                })}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">QA Required for Incoming Goods</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.warehouse.lp_split_allowed}
                onChange={(e) => setFormData({
                  ...formData,
                  warehouse: { ...formData.warehouse, lp_split_allowed: e.target.checked }
                })}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">Allow License Plate Splitting</span>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Notification Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.email_notifications}
                onChange={(e) => setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, email_notifications: e.target.checked }
                })}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">Enable Email Notifications</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.notifications.low_stock_alerts}
                onChange={(e) => setFormData({
                  ...formData,
                  notifications: { ...formData.notifications, low_stock_alerts: e.target.checked }
                })}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">Low Stock Alerts</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Stock Alert Threshold
            </label>
            <input
              type="number"
              value={formData.notifications.threshold_quantity}
              onChange={(e) => setFormData({
                ...formData,
                notifications: { ...formData.notifications, threshold_quantity: Number(e.target.value) }
              })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="px-6 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors text-sm font-medium flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </form>
  );
}
