/**
 * Warehouse Receiving Page
 * EPIC-002 Scanner & Warehouse v2 - Phase 1
 * 
 * Main page for warehouse receiving operations:
 * - View GRN list
 * - Receive ASN (create GRN from ASN)
 * - Create manual GRN
 * - View GRN details
 * 
 * @page /warehouse/receiving
 */

'use client';

import React, { useState } from 'react';
import { GRNTable } from '../../../components/GRNTable';
import ReceiveASNModal from '../../../components/ReceiveASNModal';

export default function ReceivingPage() {
  const [isReceiveASNModalOpen, setIsReceiveASNModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReceiveSuccess = (grnId: number, grnNumber: string) => {
    console.log(`GRN created: ${grnNumber} (ID: ${grnId})`);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Goods Receiving</h1>
            <p className="text-sm text-slate-600 mt-1">
              Manage incoming shipments and goods receipt notes
            </p>
          </div>
          <button
            onClick={() => setIsReceiveASNModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Receive ASN
          </button>
        </div>

        {/* GRN Table */}
        <div className="bg-white rounded-lg shadow">
          <GRNTable key={refreshTrigger} />
        </div>
      </div>

      {/* Receive ASN Modal */}
      <ReceiveASNModal
        isOpen={isReceiveASNModalOpen}
        onClose={() => setIsReceiveASNModalOpen(false)}
        onSuccess={handleReceiveSuccess}
      />
    </div>
  );
}

