'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, User, Lock } from 'lucide-react';

interface QAOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpNumber: string;
  currentQAStatus: string;
  onOverride: (data: QAOverrideData) => void;
}

interface QAOverrideData {
  reason: string;
  pin: string;
  new_qa_status: string;
  supervisor_name: string;
}

export function QAOverrideModal({ 
  isOpen, 
  onClose, 
  lpNumber, 
  currentQAStatus, 
  onOverride 
}: QAOverrideModalProps) {
  const [formData, setFormData] = useState<QAOverrideData>({
    reason: '',
    pin: '',
    new_qa_status: 'Passed',
    supervisor_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPinError(null);

    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(formData.pin)) {
      setPinError('PIN must be 4-6 digits');
      return;
    }

    if (!formData.reason.trim()) {
      setError('Reason is required');
      return;
    }

    if (!formData.supervisor_name.trim()) {
      setError('Supervisor name is required');
      return;
    }

    setLoading(true);
    
    try {
      await onOverride(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Override failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof QAOverrideData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear PIN error when user starts typing
    if (field === 'pin' && pinError) {
      setPinError(null);
    }
  };

  const getQAStatusColor = (status: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-green-100 text-green-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Quarantine':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold text-slate-900">QA Override</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-sm text-slate-600 mb-1">License Plate</div>
          <div className="font-medium text-slate-900">{lpNumber}</div>
          <div className="text-sm text-slate-600">
            Current Status: <span className={`px-2 py-1 rounded text-xs font-medium ${getQAStatusColor(currentQAStatus)}`}>
              {currentQAStatus}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New QA Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Override to Status
            </label>
            <select
              value={formData.new_qa_status}
              onChange={(e) => handleInputChange('new_qa_status', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              required
            >
              <option value="Passed">Passed</option>
              <option value="Failed">Failed</option>
              <option value="Quarantine">Quarantine</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Reason for Override *
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="Explain why this override is necessary..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              rows={3}
              required
            />
          </div>

          {/* Supervisor Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Supervisor Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={formData.supervisor_name}
                onChange={(e) => handleInputChange('supervisor_name', e.target.value)}
                placeholder="Enter supervisor name"
                className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Supervisor PIN *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="password"
                value={formData.pin}
                onChange={(e) => handleInputChange('pin', e.target.value)}
                placeholder="Enter 4-6 digit PIN"
                className={`w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent ${
                  pinError ? 'border-red-300' : 'border-slate-300'
                }`}
                maxLength={6}
                required
              />
            </div>
            {pinError && (
              <p className="text-red-600 text-xs mt-1">{pinError}</p>
            )}
          </div>

          {/* Audit Trail Notice */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium mb-1">Audit Trail Notice</div>
                <div>
                  This override will be logged with your name, PIN, reason, and timestamp. 
                  All QA overrides are subject to review and may require additional approval.
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Override QA Status
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

