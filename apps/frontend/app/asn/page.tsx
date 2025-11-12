/**
 * ASN Management Page
 * EPIC-002 Scanner & Warehouse v2 - Phase 1
 * 
 * Main page for managing Advanced Shipping Notices:
 * - View all ASNs
 * - Create new ASN
 * - View ASN details
 * - Submit/Receive/Cancel ASNs
 * 
 * @page /asn
 */

'use client';

import React, { useState } from 'react';
import ASNTable from '../../components/ASNTable';
import CreateASNModal from '../../components/CreateASNModal';
import ASNDetailsModal from '../../components/ASNDetailsModal';
import type { ASN } from '../../lib/types';

export default function ASNPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedASNId, setSelectedASNId] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleViewDetails = (asn: ASN) => {
    setSelectedASNId(asn.id);
    setIsDetailsModalOpen(true);
  };

  const handleCreateSuccess = (asnId: number) => {
    setRefreshTrigger(prev => prev + 1);
    // Optionally open details modal
    setSelectedASNId(asnId);
    setIsDetailsModalOpen(true);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <ASNTable
        onViewDetails={handleViewDetails}
        onCreateNew={() => setIsCreateModalOpen(true)}
        refreshTrigger={refreshTrigger}
      />

      <CreateASNModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <ASNDetailsModal
        asnId={selectedASNId}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedASNId(null);
        }}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

