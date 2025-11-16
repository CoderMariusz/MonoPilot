/**
 * Scanner Receive Terminal - Variant B (Single-Screen Scanner)
 * Story 1.7.1 - Scanner Module UX Redesign
 *
 * Single-screen scanner interface with always-on camera:
 * - Top 40%: Camera viewfinder (continuous scanning)
 * - Middle 40%: Scanned items list
 * - Bottom 20%: Action buttons (thumb zone)
 *
 * Target metrics:
 * - 8-10 items/min (100% faster than Variant A)
 * - 2-5 taps per workflow (90% reduction)
 * - 0 typing (100% reduction)
 *
 * Fallback: If camera unavailable, redirects to /scanner/receive (Variant A)
 *
 * @page /scanner/receive-v2
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SingleScreenScanner from '../../../components/scanner/SingleScreenScanner';
import { ASNsAPI } from '../../../lib/api/asns';
import { GRNsAPI } from '../../../lib/api/grns';
import { LicensePlatesAPI } from '../../../lib/api/licensePlates';
import { useAuth } from '../../../lib/auth/AuthContext';
import type { ASN } from '../../../lib/types';
import { toast } from '../../../lib/toast';
import { Package, ArrowLeft } from 'lucide-react';
import { offlineQueue } from '../../../lib/offline/offlineQueue';

type Step = 'select' | 'scan';

export default function ScannerReceiveV2Page() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState<Step>('select');
  const [asnList, setAsnList] = useState<any[]>([]);
  const [selectedASN, setSelectedASN] = useState<ASN | null>(null);
  const [loading, setLoading] = useState(false);

  // Load ASNs on mount or if asn_id provided in URL
  useEffect(() => {
    const asnId = searchParams?.get('asn_id');
    if (asnId) {
      loadASN(parseInt(asnId));
    } else {
      loadASNList();
    }
  }, [searchParams]);

  const loadASNList = async () => {
    try {
      setLoading(true);
      const data = await ASNsAPI.getForReceiving();
      setAsnList(data);
      setStep('select');
    } catch (err) {
      console.error('Error loading ASNs:', err);
      toast.error('Failed to load ASNs');
    } finally {
      setLoading(false);
    }
  };

  const loadASN = async (asnId: number) => {
    try {
      setLoading(true);
      const asn = await ASNsAPI.getById(asnId);
      if (!asn || !asn.asn_items || asn.asn_items.length === 0) {
        toast.error('ASN not found or has no items');
        setStep('select');
        return;
      }
      setSelectedASN(asn);
      setStep('scan');
    } catch (err) {
      console.error('Error loading ASN:', err);
      toast.error('Failed to load ASN');
      setStep('select');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectASN = async (asnId: number) => {
    await loadASN(asnId);
  };

  const handleFinishScanning = async (scannedItems: any[]) => {
    if (!selectedASN || !user) {
      toast.error('Missing ASN or user context');
      return;
    }

    // Get warehouse_id from PO if available
    const warehouseId = selectedASN.purchase_order?.warehouse_id || 1; // TODO: Get from settings
    const poNumber = selectedASN.purchase_order?.number || '';

    // Check if offline
    if (!navigator.onLine) {
      console.log('[ScannerReceiveV2] Offline - adding to queue...');

      try {
        // Add to offline queue
        await offlineQueue.addToQueue({
          asn_id: selectedASN.id,
          scanned_items: scannedItems,
          warehouse_id: warehouseId,
          po_id: selectedASN.po_id || 0,
          po_number: poNumber,
          user_id: user.id,
        });

        toast.success(`✓ ${scannedItems.length} items saved offline. Will sync when online.`);
        router.push('/scanner');
        return;
      } catch (err: any) {
        console.error('Error adding to offline queue:', err);
        toast.error(`Failed to save offline: ${err.message}`);
        throw err;
      }
    }

    // Online - create GRN immediately
    try {
      // Create GRN
      const grnData = {
        asn_id: selectedASN.id,
        po_id: selectedASN.po_id || 0,
        warehouse_id: warehouseId,
        received_by: user.id,
        received_at: new Date().toISOString(),
        status: 'completed' as const,
        notes: `Scanned ${scannedItems.length} items via Single-Screen Scanner (Variant B)`,
      };

      const grn = await GRNsAPI.create(grnData);

      // Create License Plates for each scanned item
      for (const item of scannedItems) {
        const lpData = {
          lp_number: item.lp_number,
          product_id: item.product_id,
          quantity: item.quantity,
          uom: item.uom,
          batch_number: item.batch,
          expiry_date: item.expiry_date,
          warehouse_id: warehouseId,
          location_id: warehouseId, // TODO: Get default receive location
          status: 'available' as const,
          grn_id: grn.id,
          po_number: poNumber,
          supplier_batch_number: item.batch,
        };

        await LicensePlatesAPI.create(lpData);
      }

      // Success - return to scanner hub
      toast.success(`✓ GRN ${grn.grn_number} created with ${scannedItems.length} LPs`);
      router.push('/scanner');
    } catch (err: any) {
      console.error('Error creating GRN:', err);
      throw err; // Re-throw for SingleScreenScanner to handle
    }
  };

  const handleCancel = () => {
    setSelectedASN(null);
    setStep('select');
  };

  // Render: ASN selection screen
  if (step === 'select') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-blue-600 text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/scanner')}
              className="p-1 hover:bg-blue-700 rounded"
              aria-label="Back to Scanner Hub"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">Receive ASN</h1>
              <p className="text-sm text-blue-100">Single-Screen Scanner (Variant B)</p>
            </div>
          </div>
        </div>

        {/* ASN List */}
        <div className="px-4 py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading ASNs...</div>
          ) : asnList.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No ASNs available for receiving</p>
            </div>
          ) : (
            <div className="space-y-3">
              {asnList.map(asn => (
                <button
                  key={asn.id}
                  onClick={() => handleSelectASN(asn.id)}
                  className="w-full bg-white border border-gray-200 rounded-lg p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition"
                  data-testid="asn-card"
                >
                  <div className="font-semibold text-gray-900">{asn.asn_number}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {asn.supplier_name} • {asn.item_count || 0} items
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    PO: {asn.po_number} • Expected: {asn.expected_date ? new Date(asn.expected_date).toLocaleDateString() : 'N/A'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render: Single-Screen Scanner
  if (step === 'scan' && selectedASN) {
    return (
      <SingleScreenScanner
        asn={selectedASN}
        onFinish={handleFinishScanning}
        onCancel={handleCancel}
      />
    );
  }

  return null;
}
