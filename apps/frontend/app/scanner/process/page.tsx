'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useWorkOrders, useLicensePlates, updateWorkOrder, updateLicensePlate, addLicensePlate, addStockMove } from '@/lib/clientState';
import { toast } from '@/lib/toast';
import { mockLocations } from '@/lib/mockData';
import type { WorkOrder, LicensePlate } from '@/lib/types';

interface CreatedPR {
  lpNumber: string;
  productPartNumber: string;
  productDescription: string;
  quantity: number;
  fromLP: string;
}

export default function ProcessTerminalPage() {
  const router = useRouter();
  const [selectedWOId, setSelectedWOId] = useState<number | null>(null);
  const [lpNumber, setLpNumber] = useState('');
  const [scannedLP, setScannedLP] = useState<LicensePlate | null>(null);
  const [consumeQty, setConsumeQty] = useState('');
  const [createdPRs, setCreatedPRs] = useState<CreatedPR[]>([]);

  const lpInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const workOrders = useWorkOrders();
  const licensePlates = useLicensePlates();

  const plannedWOs = workOrders.filter(wo => wo.status === 'planned' && wo.product?.type === 'PR');
  const selectedWO = workOrders.find(wo => wo.id === selectedWOId);

  useEffect(() => {
    if (selectedWOId) {
      lpInputRef.current?.focus();
    }
  }, [selectedWOId]);

  const handleScanLP = () => {
    if (!selectedWO) {
      toast.error('Please select a work order first');
      return;
    }

    const lp = licensePlates.find(l => l.lp_number === lpNumber.trim());
    if (!lp) {
      toast.error('License Plate not found');
      return;
    }

    const bomItems = selectedWO.product?.activeBom?.bomItems || [];
    const isValidMaterial = bomItems.some(item => item.material_id === lp.product_id);

    if (!isValidMaterial) {
      toast.error(`Invalid material! Expected one of: ${bomItems.map(item => item.material?.part_number).join(', ')}`);
      return;
    }

    setScannedLP(lp);
    setLpNumber('');
    toast.success(`LP ${lp.lp_number} scanned successfully`);
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  const generateLPNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PR-${timestamp}-${random}`;
  };

  const handleCreatePR = () => {
    if (!scannedLP || !selectedWO || !consumeQty) {
      toast.error('Please enter quantity to consume');
      return;
    }

    const qty = parseFloat(consumeQty);
    const availableQty = parseFloat(scannedLP.quantity);

    if (qty <= 0 || qty > availableQty) {
      toast.error(`Invalid quantity. Available: ${availableQty} ${scannedLP.product?.uom}`);
      return;
    }

    const newLPQty = availableQty - qty;
    updateLicensePlate(scannedLP.id, { quantity: newLPQty.toString() });

    const prLPNumber = generateLPNumber();
    const newPRLP = addLicensePlate({
      lp_number: prLPNumber,
      product_id: selectedWO.product!.id,
      location_id: 3,
      quantity: qty.toString(),
      qa_status: 'Pending',
      grn_id: null,
    });

    addStockMove({
      move_number: `SM-${prLPNumber}`,
      lp_id: newPRLP.id,
      from_location_id: scannedLP.location_id,
      to_location_id: 3,
      quantity: qty.toString(),
      status: 'completed',
      move_date: new Date().toISOString().split('T')[0],
    });

    const created: CreatedPR = {
      lpNumber: prLPNumber,
      productPartNumber: selectedWO.product!.part_number,
      productDescription: selectedWO.product!.description,
      quantity: qty,
      fromLP: scannedLP.lp_number,
    };

    setCreatedPRs([...createdPRs, created]);
    
    const woQty = parseFloat(selectedWO.quantity);
    const remainingQty = woQty - qty;
    
    if (remainingQty <= 0) {
      updateWorkOrder(selectedWO.id, { 
        status: 'completed',
        quantity: '0'
      });
      toast.success(`Work Order ${selectedWO.wo_number} completed!`);
    } else {
      updateWorkOrder(selectedWO.id, { 
        quantity: remainingQty.toString()
      });
    }

    toast.success(`Created PR ${prLPNumber} - ${qty} ${selectedWO.product!.uom}`);

    setScannedLP(null);
    setConsumeQty('');
    setTimeout(() => lpInputRef.current?.focus(), 100);
  };

  const handleReset = () => {
    setSelectedWOId(null);
    setScannedLP(null);
    setLpNumber('');
    setConsumeQty('');
    setCreatedPRs([]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/scanner')}
            className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">Process Terminal</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
          <label className="block text-base sm:text-lg font-semibold text-slate-900 mb-3">
            Select Work Order
          </label>
          <select
            value={selectedWOId || ''}
            onChange={(e) => setSelectedWOId(e.target.value ? Number(e.target.value) : null)}
            className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
          >
            <option value="">-- Select a planned WO --</option>
            {plannedWOs.map(wo => (
              <option key={wo.id} value={wo.id}>
                {wo.wo_number} - {wo.product?.part_number} ({wo.quantity} {wo.product?.uom})
              </option>
            ))}
          </select>
        </div>

        {selectedWO && (
          <>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{selectedWO.wo_number}</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedWO.product?.part_number} - {selectedWO.product?.description}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    Remaining: {selectedWO.quantity} {selectedWO.product?.uom}
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                  {selectedWO.status}
                </span>
              </div>

              <div className="border-t border-blue-200 pt-3 mt-3">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Required Materials:</h3>
                <div className="space-y-1">
                  {selectedWO.product?.activeBom?.bomItems?.map((item) => (
                    <div key={item.id} className="text-xs text-slate-600 bg-white px-2 py-1 rounded">
                      {item.material?.part_number} - {item.material?.description} ({item.quantity} {item.uom})
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
              <label className="block text-base sm:text-lg font-semibold text-slate-900 mb-3">
                Scan License Plate
              </label>
              <div className="flex gap-2">
                <input
                  ref={lpInputRef}
                  type="text"
                  value={lpNumber}
                  onChange={(e) => setLpNumber(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleScanLP()}
                  placeholder="Enter LP number"
                  className="flex-1 px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                />
                <button
                  onClick={handleScanLP}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold min-h-[48px]"
                >
                  Scan
                </button>
              </div>
            </div>

            {scannedLP && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Scanned LP Details</h3>
                    <div className="space-y-1 text-sm text-slate-700">
                      <p><span className="font-medium">LP Number:</span> {scannedLP.lp_number}</p>
                      <p><span className="font-medium">Product:</span> {scannedLP.product?.part_number} - {scannedLP.product?.description}</p>
                      <p><span className="font-medium">Available Qty:</span> {scannedLP.quantity} {scannedLP.product?.uom}</p>
                      <p><span className="font-medium">Location:</span> {scannedLP.location?.code} - {scannedLP.location?.name}</p>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Quantity to Consume
                        </label>
                        <input
                          ref={qtyInputRef}
                          type="number"
                          value={consumeQty}
                          onChange={(e) => setConsumeQty(e.target.value)}
                          placeholder={`Max: ${scannedLP.quantity}`}
                          className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                        />
                      </div>
                      <button
                        onClick={handleCreatePR}
                        disabled={!consumeQty}
                        className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold min-h-[48px] disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        <Package className="w-5 h-5 inline mr-2" />
                        Create Process Recipe
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {createdPRs.length > 0 && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  Created Process Recipes
                </h3>
                <div className="space-y-2">
                  {createdPRs.map((pr, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{pr.lpNumber}</p>
                        <p className="text-sm text-slate-600">{pr.productPartNumber} - {pr.productDescription}</p>
                        <p className="text-xs text-slate-500">From: {pr.fromLP}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-700">{pr.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleReset}
                  className="w-full mt-4 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold min-h-[48px]"
                >
                  Start New Work Order
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
