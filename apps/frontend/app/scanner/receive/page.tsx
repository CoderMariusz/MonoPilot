/**
 * Scanner Receive Terminal
 * EPIC-002 Scanner & Warehouse v2 - Phase 1
 * 
 * Mobile-friendly terminal for receiving ASN:
 * - Step 1: Select ASN from submitted list
 * - Step 2: Scan items one-by-one (LP, quantity, batch, expiry)
 * - Step 3: Confirm and create GRN with LPs
 * 
 * Optimized for handheld scanners (Android/Windows CE)
 * 
 * @page /scanner/receive
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, Package, Scan, AlertTriangle } from 'lucide-react';
import { ASNsAPI } from '../../../lib/api/asns';
import { supabase } from '../../../lib/supabase/client';
import { useAuth } from '../../../lib/auth/AuthContext';
import type { ASN, ASNItem, ASNForReceiving } from '../../../lib/types';
import { toast } from '../../../lib/toast';

interface ScannedItem {
  asn_item_id: number;
  product_id: number;
  product_code: string;
  product_name: string;
  expected_quantity: number;
  received_quantity: number;
  uom: string;
  batch: string;
  expiry_date: string;
  lp_number: string;
}

type Step = 'select' | 'scan' | 'confirm';

export default function ScannerReceivePage() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State
  const [step, setStep] = useState<Step>('select');
  const [asnList, setAsnList] = useState<ASNForReceiving[]>([]);
  const [selectedASN, setSelectedASN] = useState<ASN | null>(null);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  
  // Form inputs
  const [lpNumber, setLpNumber] = useState('');
  const [receivedQty, setReceivedQty] = useState('');
  const [batch, setBatch] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for scanner input
  const lpInputRef = useRef<HTMLInputElement>(null);

  // Load ASNs on mount
  useEffect(() => {
    loadASNList();
  }, []);

  // Auto-focus LP input when scanning step
  useEffect(() => {
    if (step === 'scan' && lpInputRef.current) {
      lpInputRef.current.focus();
    }
  }, [step, currentItemIndex]);

  const loadASNList = async () => {
    try {
      setLoading(true);
      const data = await ASNsAPI.getForReceiving();
      setAsnList(data);
    } catch (err) {
      console.error('Error loading ASNs:', err);
      toast.error('Failed to load ASNs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectASN = async (asnId: number) => {
    try {
      setLoading(true);
      const asn = await ASNsAPI.getById(asnId);
      if (!asn || !asn.asn_items || asn.asn_items.length === 0) {
        toast.error('ASN has no items');
        return;
      }
      setSelectedASN(asn);
      
      // Pre-fill batch and expiry from first item if available
      const firstItem = asn.asn_items[0];
      if (firstItem.batch) setBatch(firstItem.batch);
      if (firstItem.expiry_date) setExpiryDate(firstItem.expiry_date);
      
      setStep('scan');
      setCurrentItemIndex(0);
    } catch (err) {
      console.error('Error loading ASN:', err);
      toast.error('Failed to load ASN details');
    } finally {
      setLoading(false);
    }
  };

  const handleScanItem = () => {
    if (!selectedASN || !selectedASN.asn_items) return;
    
    const currentItem = selectedASN.asn_items[currentItemIndex];
    if (!currentItem) return;

    // Validation
    if (!lpNumber.trim()) {
      toast.error('Please enter LP number');
      return;
    }
    if (!receivedQty || parseFloat(receivedQty) <= 0) {
      toast.error('Please enter valid quantity');
      return;
    }
    if (!batch.trim()) {
      toast.error('Batch number is required');
      return;
    }

    const scannedItem: ScannedItem = {
      asn_item_id: currentItem.id,
      product_id: currentItem.product_id,
      product_code: currentItem.product?.part_number || 'Unknown',
      product_name: currentItem.product?.description || '',
      expected_quantity: currentItem.quantity,
      received_quantity: parseFloat(receivedQty),
      uom: currentItem.uom,
      batch: batch,
      expiry_date: expiryDate,
      lp_number: lpNumber,
    };

    setScannedItems([...scannedItems, scannedItem]);
    
    // Move to next item
    if (currentItemIndex < selectedASN.asn_items.length - 1) {
      setCurrentItemIndex(currentItemIndex + 1);
      
      // Pre-fill next item's batch/expiry if available
      const nextItem = selectedASN.asn_items[currentItemIndex + 1];
      setLpNumber('');
      setReceivedQty('');
      if (nextItem.batch) setBatch(nextItem.batch);
      if (nextItem.expiry_date) setExpiryDate(nextItem.expiry_date);
      
      toast.success(`Item ${currentItemIndex + 1}/${selectedASN.asn_items.length} scanned`);
    } else {
      // All items scanned
      toast.success('All items scanned!');
      setStep('confirm');
    }
  };

  const handleConfirm = async () => {
    if (!selectedASN || !user) {
      toast.error('Missing ASN or user data');
      return;
    }

    try {
      setLoading(true);

      // Call RPC to create GRN from ASN
      const { data, error: rpcError } = await supabase.rpc('create_grn_from_asn', {
        p_asn_id: selectedASN.id,
        p_received_by: parseInt(user.id, 10),
        p_notes: 'Received via scanner terminal',
      });

      if (rpcError) throw new Error(rpcError.message);
      if (!data || data.length === 0) throw new Error('No data returned');

      const result = data[0];
      const grnId = result.grn_id;
      const grnNumber = result.grn_number;

      // Now create LPs for each scanned item
      for (const item of scannedItems) {
        // Get default receiving location
        const { data: settingsData, error: settingsError } = await supabase
          .from('warehouse_settings')
          .select('default_receiving_location_id')
          .single();

        if (settingsError) {
          console.warn('No default receiving location found, using location ID 1');
        }

        const locationId = settingsData?.default_receiving_location_id || 1;

        // Create LP
        const { error: lpError } = await supabase
          .from('license_plates')
          .insert({
            lp_number: item.lp_number,
            product_id: item.product_id,
            location_id: locationId,
            quantity: item.received_quantity,
            uom: item.uom,
            batch: item.batch,
            expiry_date: item.expiry_date || null,
            qa_status: 'Pending',
            grn_id: grnId,
            asn_id: selectedASN.id,
          });

        if (lpError) {
          console.error('Error creating LP:', lpError);
          throw new Error(`Failed to create LP ${item.lp_number}`);
        }
      }

      toast.success(`GRN ${grnNumber} created with ${scannedItems.length} LPs`);
      
      // Reset and go back to selection
      resetForm();
      setStep('select');
      loadASNList();
    } catch (err) {
      console.error('Error creating GRN:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to create GRN');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedASN(null);
    setScannedItems([]);
    setCurrentItemIndex(0);
    setLpNumber('');
    setReceivedQty('');
    setBatch('');
    setExpiryDate('');
    setError(null);
  };

  const handleBack = () => {
    if (step === 'scan') {
      if (currentItemIndex > 0) {
        // Go to previous item
        setCurrentItemIndex(currentItemIndex - 1);
        setScannedItems(scannedItems.slice(0, -1));
      } else {
        // Cancel receiving
        if (confirm('Cancel receiving? All scanned items will be lost.')) {
          resetForm();
          setStep('select');
        }
      }
    } else if (step === 'confirm') {
      setStep('scan');
      setCurrentItemIndex(selectedASN?.asn_items?.length ? selectedASN.asn_items.length - 1 : 0);
    } else {
      router.push('/scanner');
    }
  };

  const currentItem = selectedASN?.asn_items?.[currentItemIndex];
  const progress = selectedASN?.asn_items?.length 
    ? ((currentItemIndex / selectedASN.asn_items.length) * 100).toFixed(0)
    : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="text-lg font-bold text-slate-900">
          {step === 'select' && 'Select ASN'}
          {step === 'scan' && 'Scan Items'}
          {step === 'confirm' && 'Confirm Receipt'}
        </h1>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Step 1: Select ASN */}
        {step === 'select' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-12 text-slate-600">Loading ASNs...</div>
            ) : asnList.length === 0 ? (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No ASNs ready for receiving</p>
                <p className="text-slate-500 text-sm mt-1">
                  ASNs must be in submitted status
                </p>
              </div>
            ) : (
              asnList.map((asn) => (
                <button
                  key={asn.asn_id}
                  onClick={() => handleSelectASN(asn.asn_id)}
                  className="w-full bg-white rounded-lg border border-slate-200 p-4 text-left hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-slate-900 text-lg">{asn.asn_number}</div>
                    <div className="text-sm text-slate-600">{asn.items_count} items</div>
                  </div>
                  <div className="text-sm text-slate-600">{asn.supplier_name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Expected: {new Date(asn.expected_arrival).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Step 2: Scan Items */}
        {step === 'scan' && currentItem && selectedASN && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Item {currentItemIndex + 1} of {selectedASN.asn_items.length}
                </span>
                <span className="text-sm font-medium text-purple-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Current Item Info */}
            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-xs text-slate-500 mb-1">PRODUCT</div>
              <div className="font-semibold text-slate-900 text-lg mb-1">
                {currentItem.product?.part_number || 'Unknown'}
              </div>
              <div className="text-sm text-slate-600 mb-3">
                {currentItem.product?.description || ''}
              </div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Expected:</span>{' '}
                  <span className="font-medium text-slate-900">
                    {currentItem.quantity} {currentItem.uom}
                  </span>
                </div>
                {currentItem.batch && (
                  <div>
                    <span className="text-slate-500">Batch:</span>{' '}
                    <span className="font-medium text-slate-900">{currentItem.batch}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scan Form */}
            <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  LP Number *
                </label>
                <input
                  ref={lpInputRef}
                  type="text"
                  value={lpNumber}
                  onChange={(e) => setLpNumber(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanItem()}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-lg"
                  placeholder="Scan or enter LP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Received Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={receivedQty}
                  onChange={(e) => setReceivedQty(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanItem()}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-lg"
                  placeholder={`Enter qty (${currentItem.uom})`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Batch Number *
                </label>
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanItem()}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  placeholder="Enter batch"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                onClick={handleScanItem}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 flex items-center justify-center gap-2"
              >
                <Scan className="w-5 h-5" />
                {currentItemIndex < (selectedASN.asn_items.length - 1) ? 'Next Item' : 'Finish Scanning'}
              </button>
            </div>

            {/* Scanned Items List */}
            {scannedItems.length > 0 && (
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="text-sm font-medium text-slate-700 mb-3">
                  Scanned ({scannedItems.length})
                </div>
                <div className="space-y-2">
                  {scannedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm pb-2 border-b border-slate-100 last:border-0">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{item.product_code}</div>
                        <div className="text-xs text-slate-500">
                          {item.received_quantity} {item.uom} • LP: {item.lp_number}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && selectedASN && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <div>
                <div className="font-medium text-green-900">All items scanned!</div>
                <div className="text-sm text-green-700">Ready to create GRN</div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="text-sm font-medium text-slate-700 mb-3">Summary</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">ASN:</span>
                  <span className="font-medium text-slate-900">{selectedASN.asn_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Supplier:</span>
                  <span className="font-medium text-slate-900">{selectedASN.supplier?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Items:</span>
                  <span className="font-medium text-slate-900">{scannedItems.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">LPs Created:</span>
                  <span className="font-medium text-slate-900">{scannedItems.length}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-slate-400 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {loading ? 'Creating GRN...' : 'Confirm & Create GRN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

