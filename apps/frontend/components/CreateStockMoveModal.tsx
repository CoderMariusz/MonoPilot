'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLicensePlates, addStockMove } from '@/lib/clientState';
import { LocationsAPI } from '@/lib/api/locations';
import { toast } from '@/lib/toast';
import type { Location } from '@/lib/types';

interface CreateStockMoveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateStockMoveModal({ isOpen, onClose, onSuccess }: CreateStockMoveModalProps) {
  const licensePlates = useLicensePlates();
  const [selectedLP, setSelectedLP] = useState<number | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [toLocationId, setToLocationId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');

  // Load locations on component mount
  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await LocationsAPI.getAll();
        setLocations(data);
        if (data.length > 0) {
          setToLocationId(data[0].id);
        }
      } catch (error) {
        console.error('Error loading locations:', error);
        toast.error('Failed to load locations');
      }
    };

    if (isOpen) {
      loadLocations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedLPData = licensePlates.find(lp => lp.id === selectedLP.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLP || !selectedLPData) {
      toast.error('Please select a License Plate');
      return;
    }

    if (parseFloat(quantity) > selectedLPData.quantity) {
      toast.error('Quantity cannot exceed available quantity');
      return;
    }

    const moveNumber = `SM-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;

    addStockMove({
      move_number: moveNumber,
      lp_id: selectedLP.toString(),
      from_location_id: selectedLPData.location_id,
      to_location_id: toLocationId.toString(),
      quantity: parseFloat(quantity),
      reason: 'Manual Stock Move',
      status: 'draft',
      move_date: null,
    });

    toast.success('Stock Move created successfully');
    onSuccess?.();
    onClose();
    setSelectedLP(null);
    setQuantity('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create Stock Move</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select License Plate
              </label>
              <select
                value={selectedLP || ''}
                onChange={(e) => setSelectedLP(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                required
              >
                <option value="">Select an LP...</option>
                {licensePlates.map((lp) => (
                  <option key={lp.id} value={lp.id}>
                    {lp.lp_number} - {lp.product?.description} ({lp.quantity} {lp.product?.uom})
                  </option>
                ))}
              </select>
            </div>

            {selectedLPData && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    From Location
                  </label>
                  <input
                    type="text"
                    value={selectedLPData.location?.name || 'N/A'}
                    disabled
                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    To Location
                  </label>
                  <select
                    value={toLocationId}
                    onChange={(e) => setToLocationId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    required
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity (Available: {selectedLPData.quantity})
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    max={selectedLPData.quantity}
                    step="0.01"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                    required
                  />
                </div>
              </>
            )}
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
              disabled={!selectedLP}
            >
              Create Move
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
