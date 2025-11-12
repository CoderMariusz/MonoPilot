'use client';

/**
 * RecordByProductModal Component
 * Epic: EPIC-001 BOM Complexity v2 - Phase 1 (By-Products)
 * 
 * Purpose: Record actual by-product output during/after production
 * Use case: Production Operator records actual quantity of by-product produced (e.g., 14.5kg bones)
 * 
 * Features:
 * - Display expected vs actual quantity
 * - Variance calculation and color coding
 * - Location selection for by-product storage
 * - Optional notes
 * - Creates License Plate for by-product
 */

import React, { useState, useEffect } from 'react';
import { X, Package, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { WorkOrdersAPI } from '../lib/api/workOrders';
import { LocationsAPI } from '../lib/api/locations';
import type { WOByProduct } from '../lib/types';

interface RecordByProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  byProduct: WOByProduct;
  woId: number;
  onSuccess: () => void;
}

export default function RecordByProductModal({
  isOpen,
  onClose,
  byProduct,
  woId,
  onSuccess,
}: RecordByProductModalProps) {
  const [actualQuantity, setActualQuantity] = useState<string>('');
  const [locationId, setLocationId] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLocations();
      // Pre-fill with expected quantity
      setActualQuantity(byProduct.expected_quantity.toString());
    }
  }, [isOpen, byProduct.expected_quantity]);

  const loadLocations = async () => {
    try {
      const data = await LocationsAPI.getAll();
      setLocations(data.filter((loc: any) => loc.is_active));
    } catch (err) {
      console.error('Error loading locations:', err);
    }
  };

  const calculateVariance = () => {
    const actual = parseFloat(actualQuantity) || 0;
    const expected = byProduct.expected_quantity;
    const variance = actual - expected;
    const variancePct = expected > 0 ? (variance / expected) * 100 : 0;

    return {
      variance,
      variancePct,
      isOver: variance > 0,
      isUnder: variance < 0,
      isOnTarget: Math.abs(variancePct) <= 5, // Within ±5%
    };
  };

  const variance = actualQuantity ? calculateVariance() : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const actual = parseFloat(actualQuantity);
    if (isNaN(actual) || actual < 0) {
      setError('Please enter a valid quantity (≥ 0)');
      return;
    }

    if (!locationId) {
      setError('Please select a storage location');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await WorkOrdersAPI.recordByProductOutput(
        woId,
        byProduct.id,
        actual,
        locationId,
        notes || undefined
      );

      console.log('By-product recorded successfully:', result);
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('Error recording by-product:', err);
      setError(err.message || 'Failed to record by-product output');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setActualQuantity('');
    setLocationId(null);
    setNotes('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-slate-700" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Record By-Product Output</h2>
              <p className="text-sm text-slate-600 mt-1">
                {byProduct.product?.product_code} - {byProduct.product?.description}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Expected vs Actual Comparison */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700 font-medium mb-1">Expected Quantity</p>
              <p className="text-2xl font-bold text-blue-900">
                {byProduct.expected_quantity.toFixed(2)} {byProduct.uom}
              </p>
              <p className="text-xs text-blue-600 mt-1">Based on BOM yield percentage</p>
            </div>

            <div
              className={`border rounded-lg p-4 ${
                variance
                  ? variance.isOnTarget
                    ? 'bg-green-50 border-green-200'
                    : variance.isOver
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-red-50 border-red-200'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p
                className={`text-sm font-medium mb-1 ${
                  variance
                    ? variance.isOnTarget
                      ? 'text-green-700'
                      : variance.isOver
                      ? 'text-amber-700'
                      : 'text-red-700'
                    : 'text-slate-700'
                }`}
              >
                Actual Quantity
              </p>
              <p
                className={`text-2xl font-bold ${
                  variance
                    ? variance.isOnTarget
                      ? 'text-green-900'
                      : variance.isOver
                      ? 'text-amber-900'
                      : 'text-red-900'
                    : 'text-slate-900'
                }`}
              >
                {actualQuantity || '—'} {byProduct.uom}
              </p>
              {variance && (
                <div className="flex items-center gap-1 mt-1">
                  {variance.isOver ? (
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <p
                    className={`text-xs font-medium ${
                      variance.isOver ? 'text-amber-700' : 'text-red-700'
                    }`}
                  >
                    {variance.isOver ? '+' : ''}
                    {variance.variance.toFixed(2)} {byProduct.uom} (
                    {variance.isOver ? '+' : ''}
                    {variance.variancePct.toFixed(1)}%)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actual Quantity Input */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Actual Quantity Produced <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={actualQuantity}
              onChange={(e) => setActualQuantity(e.target.value)}
              placeholder={`e.g., ${byProduct.expected_quantity.toFixed(2)}`}
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-lg"
              required
              autoFocus
            />
            <p className="text-xs text-slate-600 mt-1">
              Enter the actual quantity of by-product produced (can be different from expected)
            </p>
          </div>

          {/* Storage Location */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Storage Location <span className="text-red-500">*</span>
            </label>
            <select
              value={locationId || ''}
              onChange={(e) => setLocationId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              required
            >
              <option value="">Select location</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.code} - {location.name} (Warehouse: {location.warehouse?.code})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-600 mt-1">
              Location where by-product will be stored
            </p>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="e.g., Quality bones, sent to stock room"
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-1">What happens next:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>A new License Plate (LP) will be created for this by-product</li>
                  <li>LP will be placed at the selected storage location</li>
                  <li>QA status will be set to "Pending" for quality inspection</li>
                  <li>By-product will appear in inventory and traceability reports</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-300 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Package className="w-4 h-4" />
                  Record Output & Create LP
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

