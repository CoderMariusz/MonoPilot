'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLicensePlates, updateLicensePlate } from '@/lib/clientState';
import { mockLocations } from '@/lib/mockData';
import { toast } from '@/lib/toast';

interface AmendLPModalProps {
  lpId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AmendLPModal({ lpId, isOpen, onClose }: AmendLPModalProps) {
  const licensePlates = useLicensePlates();
  const lp = licensePlates.find(l => l.id === lpId.toString());
  const [quantity, setQuantity] = useState('');
  const [locationId, setLocationId] = useState<number>(0);

  useEffect(() => {
    if (lp) {
      setQuantity(lp.quantity.toString());
      setLocationId(parseInt(lp.location_id || '0'));
    }
  }, [lp]);

  if (!isOpen || !lp) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateLicensePlate(parseInt(lp.id), {
      quantity: parseFloat(quantity),
      location_id: locationId.toString(),
    });

    toast.success('License Plate updated successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Amend License Plate</h2>
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
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Location
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              >
                {mockLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                QA Status
              </label>
              <input
                type="text"
                value={lp.qa_status}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
              />
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
