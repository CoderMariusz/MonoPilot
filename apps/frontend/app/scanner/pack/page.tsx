'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, CheckCircle } from 'lucide-react';
import { useWorkOrders, useLicensePlates, updateWorkOrder, updateLicensePlate, addLicensePlate, addStockMove } from '@/lib/clientState';
import { toast } from '@/lib/toast';
import { AlertDialog } from '@/components/AlertDialog';
import type { WorkOrder, LicensePlate } from '@/lib/types';

interface CreatedFG {
  lpNumber: string;
  productPartNumber: string;
  productDescription: string;
  quantity: number;
  fromLP: string;
}

export default function PackTerminalPage() {
  const router = useRouter();
  const [selectedWOId, setSelectedWOId] = useState<number | null>(null);
  const [lpNumber, setLpNumber] = useState('');
  const [scannedLPsByOrder, setScannedLPsByOrder] = useState<{ [key: number]: LicensePlate[] }>({});
  const [createdFGsByOrder, setCreatedFGsByOrder] = useState<{ [key: number]: CreatedFG[] }>({});
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const lpInputRef = useRef<HTMLInputElement>(null);

  const workOrders = useWorkOrders();
  const licensePlates = useLicensePlates();

  const availableWOs = workOrders.filter(wo => (wo.status === 'in_progress' || wo.status === 'released') && wo.product?.type === 'FG');
  const selectedWO = workOrders.find(wo => wo.id === selectedWOId);
  const scannedLPsForCurrentOrder = selectedWOId ? (scannedLPsByOrder[selectedWOId] || []) : [];
  const createdFGsForCurrentOrder = selectedWOId ? (createdFGsByOrder[selectedWOId] || []) : [];

  useEffect(() => {
    if (selectedWOId) {
      lpInputRef.current?.focus();
    }
  }, [selectedWOId]);

  const handleScanLP = () => {
    if (!selectedWO || !selectedWOId) {
      toast.error('Please select a work order first');
      return;
    }

    const lp = licensePlates.find(l => l.lp_number === lpNumber.trim());
    if (!lp) {
      toast.error('License Plate not found');
      return;
    }

    const alreadyScanned = scannedLPsForCurrentOrder.some(scannedLP => scannedLP.lp_number === lp.lp_number);
    if (alreadyScanned) {
      toast.error('This pallet has already been scanned for this order');
      setLpNumber('');
      return;
    }

    const bomItems = selectedWO.product?.activeBom?.bomItems || [];
    const isValidMaterial = bomItems.some(item => item.material_id === lp.product_id);

    if (!isValidMaterial) {
      setAlertMessage("Cannot scan this item - doesn't match order BOM");
      setShowAlert(true);
      setLpNumber('');
      return;
    }

    setScannedLPsByOrder({
      ...scannedLPsByOrder,
      [selectedWOId]: [...scannedLPsForCurrentOrder, lp]
    });
    setLpNumber('');
    toast.success(`Pallet ${lp.lp_number} added successfully`);
    setTimeout(() => lpInputRef.current?.focus(), 100);
  };

  const generateLPNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `FG-${timestamp}-${random}`;
  };

  const handleCreateFG = () => {
    if (scannedLPsForCurrentOrder.length === 0 || !selectedWO || !selectedWOId) {
      toast.error('Please scan at least one pallet first');
      return;
    }

    let totalQty = 0;
    const consumedPallets: string[] = [];

    scannedLPsForCurrentOrder.forEach(lp => {
      const qty = parseFloat(lp.quantity);
      totalQty += qty;
      consumedPallets.push(lp.lp_number);

      updateLicensePlate(lp.id, { quantity: '0' });
    });

    const fgLPNumber = generateLPNumber();
    const defaultLocationId = 1;

    const newFGLP = addLicensePlate({
      lp_number: fgLPNumber,
      product_id: selectedWO.product!.id,
      location_id: defaultLocationId,
      quantity: totalQty.toString(),
      qa_status: 'Pending',
      grn_id: null,
    });

    const firstLP = scannedLPsForCurrentOrder[0];
    addStockMove({
      move_number: `SM-${fgLPNumber}`,
      lp_id: newFGLP.id,
      from_location_id: firstLP.location_id,
      to_location_id: defaultLocationId,
      quantity: totalQty.toString(),
      status: 'completed',
      move_date: new Date().toISOString().split('T')[0],
    });

    const created: CreatedFG = {
      lpNumber: fgLPNumber,
      productPartNumber: selectedWO.product!.part_number,
      productDescription: selectedWO.product!.description,
      quantity: totalQty,
      fromLP: consumedPallets.join(', '),
    };

    setCreatedFGsByOrder({
      ...createdFGsByOrder,
      [selectedWOId]: [...createdFGsForCurrentOrder, created]
    });

    setScannedLPsByOrder({
      ...scannedLPsByOrder,
      [selectedWOId]: []
    });
    
    const woQty = parseFloat(selectedWO.quantity);
    const remainingQty = woQty - totalQty;
    
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

    toast.success(`Created FG ${fgLPNumber} from ${scannedLPsForCurrentOrder.length} pallets - Total: ${totalQty} ${selectedWO.product!.uom}`);
    
    setTimeout(() => lpInputRef.current?.focus(), 100);
  };

  const handleReset = () => {
    setSelectedWOId(null);
    setLpNumber('');
  };

  const handleRemovePallet = (lpToRemove: LicensePlate) => {
    if (!selectedWOId) return;
    
    setScannedLPsByOrder({
      ...scannedLPsByOrder,
      [selectedWOId]: scannedLPsForCurrentOrder.filter(lp => lp.id !== lpToRemove.id)
    });
    toast.success(`Removed pallet ${lpToRemove.lp_number}`);
  };

  const handleAlertClose = () => {
    setShowAlert(false);
    setTimeout(() => lpInputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AlertDialog
        isOpen={showAlert}
        onClose={handleAlertClose}
        title="BOM Validation Error"
        message={alertMessage}
      />

      <div className="bg-green-600 text-white p-4 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/scanner')}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold">Pack Terminal</h1>
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
            className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[48px]"
          >
            <option value="">-- Select a WO --</option>
            {availableWOs.map(wo => (
              <option key={wo.id} value={wo.id}>
                {wo.wo_number} - {wo.product?.part_number} ({wo.quantity} {wo.product?.uom})
              </option>
            ))}
          </select>
        </div>

        {selectedWO && (
          <>
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
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
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                  {selectedWO.status}
                </span>
              </div>

              <div className="border-t border-green-200 pt-3 mt-3">
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
                  className="flex-1 px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[48px]"
                />
                <button
                  onClick={handleScanLP}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold min-h-[48px]"
                >
                  Scan
                </button>
              </div>
            </div>

            {scannedLPsForCurrentOrder.length > 0 && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  Scanned Pallets ({scannedLPsForCurrentOrder.length})
                </h3>
                <div className="space-y-2">
                  {scannedLPsForCurrentOrder.map((lp) => (
                    <div key={lp.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{lp.lp_number}</p>
                        <p className="text-sm text-slate-600">{lp.product?.part_number} - {lp.product?.description}</p>
                        <p className="text-xs text-slate-500">Qty: {lp.quantity} {lp.product?.uom}</p>
                      </div>
                      <button
                        onClick={() => handleRemovePallet(lp)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCreateFG}
                  className="w-full mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold min-h-[48px]"
                >
                  <Package className="w-5 h-5 inline mr-2" />
                  Create Finished Good from {scannedLPsForCurrentOrder.length} Pallet{scannedLPsForCurrentOrder.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}

            {createdFGsForCurrentOrder.length > 0 && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  Created Finished Goods (This Order)
                </h3>
                <div className="space-y-2">
                  {createdFGsForCurrentOrder.map((fg, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{fg.lpNumber}</p>
                        <p className="text-sm text-slate-600">{fg.productPartNumber} - {fg.productDescription}</p>
                        <p className="text-xs text-slate-500">From: {fg.fromLP}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-700">{fg.quantity}</p>
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
