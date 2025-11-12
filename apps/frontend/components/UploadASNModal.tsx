/**
 * Upload ASN Modal (Placeholder)
 * EPIC-002 Scanner & Warehouse v2 - Phase 1
 * 
 * Temporary placeholder for ASN upload functionality.
 * Full implementation will be added in Phase 2.
 * 
 * @component
 */

'use client';

import React from 'react';

interface UploadASNModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId?: number;
  poNumber?: string;
  supplierId?: number;
}

export function UploadASNModal({ isOpen, onClose, poId }: UploadASNModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Upload ASN</h2>
        <p className="text-slate-600 mb-6">
          ASN upload functionality is not yet implemented. 
          Please use the "Create ASN" feature instead.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

