'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLicensePlates, updateLicensePlate } from '@/lib/clientState';
import type { QAStatus } from '@/lib/types';
import { toast } from '@/lib/toast';

interface ChangeQAStatusModalProps {
  lpId: number;
  isOpen: boolean;
  onClose: () => void;
}

const QA_STATUSES: QAStatus[] = ['Pending', 'Passed', 'Failed', 'Quarantine'];

export function ChangeQAStatusModal({ lpId, isOpen, onClose }: ChangeQAStatusModalProps) {
  const licensePlates = useLicensePlates();
  const lp = licensePlates.find(l => l.id === lpId);
  const [qaStatus, setQAStatus] = useState<QAStatus>('Pending');

  useEffect(() => {
    if (lp) {
      setQAStatus(lp.qa_status);
    }
  }, [lp]);

  if (!isOpen || !lp) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateLicensePlate(lp.id, { qa_status: qaStatus });

    toast.success('QA Status updated successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Change QA Status</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                LP Number
              </label>
              <input
                type="text"
                value={lp.lp_number}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product
              </label>
              <input
                type="text"
                value={lp.product?.description || 'N/A'}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current QA Status
              </label>
              <div className="px-3 py-2 border border-slate-300 rounded-md bg-slate-50">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  lp.qa_status === 'Passed' ? 'bg-green-100 text-green-800' :
                  lp.qa_status === 'Failed' ? 'bg-red-100 text-red-800' :
                  lp.qa_status === 'Quarantine' ? 'bg-orange-100 text-orange-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {lp.qa_status}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New QA Status
              </label>
              <select
                value={qaStatus}
                onChange={(e) => setQAStatus(e.target.value as QAStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              >
                {QA_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
            >
              Update Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
