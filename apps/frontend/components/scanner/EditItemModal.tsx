/**
 * Edit Item Modal - Quick popup for manual corrections
 * Story 1.7.1 - AC-4 (Tap-to-Edit)
 *
 * Gloves-friendly popup to edit auto-filled values:
 * - LP number (read-only - auto-generated)
 * - Batch number (editable)
 * - Quantity (editable)
 * - Expiry date (editable)
 *
 * Design:
 * - Large tap targets (60px height)
 * - Minimal fields (3-4 inputs max)
 * - Save/Cancel buttons in thumb zone
 * - Auto-focus on first editable field (batch)
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface EditItemData {
  lp_number: string;
  batch: string;
  quantity: number;
  uom: string;
  expiry_date: string | null;
  product_name: string;
}

interface EditItemModalProps {
  item: EditItemData;
  onSave: (updatedItem: EditItemData) => void;
  onCancel: () => void;
  batchConfidence?: number; // AI prediction confidence (0-100)
}

export default function EditItemModal({
  item,
  onSave,
  onCancel,
  batchConfidence,
}: EditItemModalProps) {
  const [batch, setBatch] = useState(item.batch);
  const [quantity, setQuantity] = useState(String(item.quantity));
  const [expiryDate, setExpiryDate] = useState(item.expiry_date || '');

  const batchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on batch input
  useEffect(() => {
    batchInputRef.current?.focus();
  }, []);

  const handleSave = () => {
    // Validate quantity
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      alert('Quantity must be a positive number');
      return;
    }

    // Validate batch (required)
    if (!batch.trim()) {
      alert('Batch number is required');
      return;
    }

    onSave({
      ...item,
      batch: batch.trim(),
      quantity: qty,
      expiry_date: expiryDate.trim() || null,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  // Show AI confidence badge if batch was AI-predicted
  const showConfidenceBadge = batchConfidence !== undefined && batchConfidence > 0 && batchConfidence < 100;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onCancel}
        data-testid="edit-modal-backdrop"
      />

      {/* Modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-4 rounded-t-3xl flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit Item</h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-blue-700 rounded-full"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product name */}
        <div className="px-4 pt-4 pb-2 border-b border-gray-200">
          <div className="text-sm text-gray-600">Product</div>
          <div className="font-medium text-gray-900">{item.product_name}</div>
        </div>

        {/* Form */}
        <div className="px-4 py-4 space-y-4">
          {/* LP Number (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              LP Number (auto-generated)
            </label>
            <input
              type="text"
              value={item.lp_number}
              readOnly
              className="w-full h-[60px] px-4 text-lg bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Batch Number (editable) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Batch Number
              </label>
              {showConfidenceBadge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    batchConfidence! >= 80
                      ? 'bg-green-100 text-green-700'
                      : batchConfidence! >= 60
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-orange-100 text-orange-700'
                  }`}
                  title={`AI prediction confidence: ${batchConfidence}%`}
                >
                  AI: {batchConfidence}%
                </span>
              )}
            </div>
            <input
              ref={batchInputRef}
              type="text"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-[60px] px-4 text-lg border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter batch number"
              data-testid="edit-batch-input"
            />
          </div>

          {/* Quantity (editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity ({item.uom})
            </label>
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-[60px] px-4 text-lg border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter quantity"
              data-testid="edit-quantity-input"
            />
          </div>

          {/* Expiry Date (editable) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expiry Date (optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-[60px] px-4 text-lg border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500"
              data-testid="edit-expiry-input"
            />
          </div>
        </div>

        {/* Action buttons (thumb zone) */}
        <div className="px-4 pb-6 pt-2 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-[60px] bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg text-lg"
            data-testid="edit-cancel-btn"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 h-[60px] bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg text-lg"
            data-testid="edit-save-btn"
          >
            ✓ Save
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
