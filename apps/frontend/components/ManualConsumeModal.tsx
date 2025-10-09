'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Minus } from 'lucide-react';
import type { LicensePlate } from '@/lib/types';

interface ManualConsumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lp: LicensePlate | null;
  availableQuantity: number;
  onConfirm: (quantity: number) => void;
}

export function ManualConsumeModal({ isOpen, onClose, lp, availableQuantity, onConfirm }: ManualConsumeModalProps) {
  const [quantity, setQuantity] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuantity('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen || !lp) return null;

  const handleConfirm = () => {
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      return;
    }
    if (qty > availableQuantity) {
      return;
    }
    onConfirm(qty);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Minus className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Manual Consume - {lp.lp_number}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-2">LP Details</h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium text-slate-600">Product:</span>{' '}
                <span className="text-slate-900">{lp.product?.part_number} - {lp.product?.description}</span>
              </p>
              <p>
                <span className="font-medium text-slate-600">Available to Consume:</span>{' '}
                <span className="text-slate-900 font-bold">{availableQuantity} {lp.product?.uom}</span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quantity to Consume
            </label>
            <input
              ref={inputRef}
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Max: ${availableQuantity}`}
              className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleConfirm}
            disabled={!quantity || parseFloat(quantity) <= 0 || parseFloat(quantity) > availableQuantity}
            className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Consume
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
