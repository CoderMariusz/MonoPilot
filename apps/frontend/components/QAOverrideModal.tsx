'use client';

import { useState } from 'react';
import { X, Save, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface QAOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpId: number;
  lpNumber: string;
  currentStatus: string;
  onOverride: (data: any) => void;
}

export function QAOverrideModal({ 
  isOpen, 
  onClose, 
  lpId, 
  lpNumber, 
  currentStatus, 
  onOverride 
}: QAOverrideModalProps) {
  const [formData, setFormData] = useState({
    new_status: '',
    reason: '',
    pin: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/scanner/lp/${lpId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: formData.new_status,
          reason: formData.reason,
          pin: formData.pin
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to override QA status');
      }

      const result = await response.json();
      onOverride(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getStatusOptions = () => {
    const options = [];
    
    switch (currentStatus) {
      case 'pending':
        options.push(
          { value: 'Passed', label: 'Passed', color: 'text-green-600' },
          { value: 'failed', label: 'Failed', color: 'text-red-600' },
          { value: 'on_hold', label: 'On Hold', color: 'text-orange-600' }
        );
        break;
      case 'Failed':
        options.push(
          { value: 'Passed', label: 'Passed', color: 'text-green-600' },
          { value: 'Pending', label: 'Pending', color: 'text-blue-600' }
        );
        break;
      case 'Quarantine':
        options.push(
          { value: 'Passed', label: 'Passed', color: 'text-green-600' },
          { value: 'Pending', label: 'Pending', color: 'text-blue-600' }
        );
        break;
      case 'Passed':
        options.push(
          { value: 'failed', label: 'Failed', color: 'text-red-600' },
          { value: 'on_hold', label: 'On Hold', color: 'text-orange-600' }
        );
        break;
    }
    
    return options;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Quarantine':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              QA Status Override
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              LP: {lpNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Current QA Status
            </label>
            <div className={`px-3 py-2 rounded-md border text-sm font-medium ${getStatusColor(currentStatus)}`}>
              {currentStatus}
            </div>
          </div>

          {/* New Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New QA Status
            </label>
            <select
              value={formData.new_status}
              onChange={(e) => handleInputChange('new_status', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              required
            >
              <option value="">Select new status</option>
              {getStatusOptions().map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Override
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              rows={3}
              placeholder="Provide a detailed reason for the QA status override..."
              required
            />
          </div>

          {/* Supervisor PIN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Supervisor PIN
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={formData.pin}
                onChange={(e) => handleInputChange('pin', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="Enter supervisor PIN"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showPin ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              PIN is required for QA status override
            </p>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <h4 className="font-medium">Override Warning</h4>
                <p className="text-sm mt-1">
                  This action will override the QA status and will be logged for audit purposes. 
                  Please ensure you have proper authorization.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.new_status || !formData.reason || !formData.pin}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Overriding...' : 'Override QA Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
