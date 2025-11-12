'use client';

/**
 * CreateBOMVersionModal Component
 * Epic: EPIC-001 BOM Complexity v2 - Phase 2 (Multi-Version BOM)
 * 
 * Purpose: Create a new BOM version based on existing one
 * Use case: Product Manager plans future recipe change
 * 
 * Features:
 * - Clone existing BOM
 * - Set effective date range
 * - Validate date overlaps
 * - Preview version comparison
 * - Automatic version number increment
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Copy, CheckCircle } from 'lucide-react';
import { BomsAPI, BomVersionHelper } from '../lib/api/boms';

interface CreateBOMVersionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceBomId: number;
  sourceBomVersion: string;
  productId: number;
  onSuccess: (newBomId: number) => void;
}

export default function CreateBOMVersionModal({
  isOpen,
  onClose,
  sourceBomId,
  sourceBomVersion,
  productId,
  onSuccess,
}: CreateBOMVersionModalProps) {
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [hasExpiry, setHasExpiry] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Set default: start from tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setEffectiveFrom(tomorrow.toISOString().split('T')[0]);
      
      // Calculate next version (minor increment by default)
      const nextVersion = BomVersionHelper.calculateNextVersion(sourceBomVersion, 'minor');
      setNewVersion(nextVersion);
      
      setHasExpiry(false);
      setEffectiveTo('');
      setValidationError(null);
      setError(null);
    }
  }, [isOpen, sourceBomVersion]);

  useEffect(() => {
    if (effectiveFrom && productId) {
      validateDateRange();
    }
  }, [effectiveFrom, effectiveTo, productId]);

  const validateDateRange = async () => {
    if (!effectiveFrom) return;

    try {
      setIsValidating(true);
      setValidationError(null);

      const result = await BomsAPI.validateDateRange(
        productId,
        effectiveFrom,
        hasExpiry ? effectiveTo : null
      );

      if (!result.is_valid) {
        setValidationError(result.error_message);
      }
    } catch (err: any) {
      console.error('Validation error:', err);
      setValidationError(err.message);
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!effectiveFrom) {
      setError('Effective from date is required');
      return;
    }

    if (hasExpiry && !effectiveTo) {
      setError('Effective to date is required when expiry is enabled');
      return;
    }

    if (hasExpiry && effectiveTo && new Date(effectiveTo) <= new Date(effectiveFrom)) {
      setError('Effective to date must be after effective from date');
      return;
    }

    if (validationError) {
      setError('Please fix validation errors before proceeding');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await BomsAPI.cloneBOMWithDates(
        sourceBomId,
        effectiveFrom,
        hasExpiry ? effectiveTo : null
      );

      console.log('New BOM version created:', result);
      onSuccess(result.id);
      handleClose();
    } catch (err: any) {
      console.error('Error creating BOM version:', err);
      setError(err.message || 'Failed to create BOM version');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setEffectiveFrom('');
    setEffectiveTo('');
    setHasExpiry(false);
    setNewVersion('');
    setValidationError(null);
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
            <Copy className="w-6 h-6 text-slate-700" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create New BOM Version</h2>
              <p className="text-sm text-slate-600 mt-1">
                Clone BOM v{sourceBomVersion} and set new effective dates
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
          {/* Source BOM Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-blue-800 mb-2">
              <Copy className="w-4 h-4" />
              <span className="font-semibold">Source BOM</span>
            </div>
            <p className="text-sm text-blue-700">
              All materials and settings from <strong>Version {sourceBomVersion}</strong> will be copied to the new version.
            </p>
          </div>

          {/* New Version Number */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              New Version Number
            </label>
            <input
              type="text"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder="e.g., 1.1, 2.0"
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
            />
            <p className="text-xs text-slate-600 mt-1">
              Version number for this BOM (e.g., 1.1 for minor change, 2.0 for major change)
            </p>
          </div>

          {/* Effective From Date */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Effective From <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={effectiveFrom}
              onChange={(e) => setEffectiveFrom(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              required
            />
            <p className="text-xs text-slate-600 mt-1">
              Date when this BOM version becomes active
            </p>
          </div>

          {/* Effective To Date (Optional) */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="hasExpiry"
                checked={hasExpiry}
                onChange={(e) => setHasExpiry(e.target.checked)}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <label htmlFor="hasExpiry" className="text-sm font-semibold text-slate-700">
                Set expiry date (optional)
              </label>
            </div>

            {hasExpiry && (
              <input
                type="date"
                value={effectiveTo}
                onChange={(e) => setEffectiveTo(e.target.value)}
                min={effectiveFrom || new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
              />
            )}
            <p className="text-xs text-slate-600 mt-1">
              {hasExpiry 
                ? 'Date when this BOM version expires (useful for seasonal variants)'
                : 'Leave unchecked for permanent BOM (no expiry)'}
            </p>
          </div>

          {/* Validation Status */}
          {isValidating && (
            <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="flex items-center gap-2 text-slate-700">
                <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Validating date range...</span>
              </div>
            </div>
          )}

          {validationError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg">
              <div className="flex items-start gap-3 text-red-800">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Date range conflict</p>
                  <p className="text-sm mt-1">{validationError}</p>
                </div>
              </div>
            </div>
          )}

          {!validationError && effectiveFrom && !isValidating && (
            <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Date range is valid - no conflicts detected</span>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-slate-700">
                <p className="font-semibold mb-1">How BOM versioning works:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Each product can have multiple BOM versions with different date ranges</li>
                  <li>Work Orders automatically use the BOM that matches their scheduled date</li>
                  <li>Date ranges cannot overlap for the same product</li>
                  <li>Historical Work Orders preserve their BOM version (snapshot)</li>
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
              disabled={isSubmitting || !!validationError || isValidating}
              className="px-6 py-3 bg-slate-900 text-white rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Create New Version
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
