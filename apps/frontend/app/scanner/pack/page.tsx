'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, CheckCircle } from 'lucide-react';
import { useWorkOrders, updateWorkOrder, addLicensePlate, addStockMove } from '@/lib/clientState';
import { toast } from '@/lib/toast';
import { mockLocations } from '@/lib/mockData';
import type { WorkOrder } from '@/lib/types';

interface CreatedLP {
  lpNumber: string;
  productPartNumber: string;
  productDescription: string;
  quantity: number;
  location: string;
}

export default function PackTerminalPage() {
  const router = useRouter();
  const [woNumber, setWoNumber] = useState('');
  const [scannedWO, setScannedWO] = useState<WorkOrder | null>(null);
  const [packQty, setPackQty] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<number>(1);
  const [createdLPs, setCreatedLPs] = useState<CreatedLP[]>([]);

  const woInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  const workOrders = useWorkOrders();

  const locations = mockLocations;

  useEffect(() => {
    woInputRef.current?.focus();
  }, []);

  const handleScanWO = () => {
    const wo = workOrders.find(w => w.wo_number === woNumber.trim());
    if (!wo) {
      toast.error('Work Order not found');
      return;
    }
    if (!wo.product) {
      toast.error('Product not found for this WO');
      return;
    }
    setScannedWO(wo);
    setWoNumber('');
    toast.success(`WO ${wo.wo_number} loaded successfully`);
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  const generateLPNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `LP-${timestamp}-${random}`;
  };

  const handleCreateFinishGood = () => {
    if (!scannedWO || !packQty) {
      toast.error('Please enter quantity to pack');
      return;
    }

    const qty = parseFloat(packQty);
    const woQty = parseFloat(scannedWO.quantity);

    if (qty <= 0 || qty > woQty) {
      toast.error(`Invalid quantity. WO quantity: ${woQty}`);
      return;
    }

    const lpNumber = generateLPNumber();
    const selectedLocation = locations.find(l => l.id === selectedLocationId);

    if (!selectedLocation || !scannedWO.product) {
      toast.error('Location or product not found');
      return;
    }

    const newLP = addLicensePlate({
      lp_number: lpNumber,
      product_id: scannedWO.product.id,
      location_id: selectedLocationId,
      quantity: qty.toString(),
      qa_status: 'Pending',
      grn_id: null,
    });

    addStockMove({
      move_number: `SM-${lpNumber}`,
      lp_id: newLP.id,
      from_location_id: 3,
      to_location_id: selectedLocationId,
      quantity: qty.toString(),
      status: 'completed',
      move_date: new Date().toISOString().split('T')[0],
    });

    const created: CreatedLP = {
      lpNumber,
      productPartNumber: scannedWO.product.part_number,
      productDescription: scannedWO.product.description,
      quantity: qty,
      location: `${selectedLocation.code} - ${selectedLocation.name}`,
    };

    setCreatedLPs([...createdLPs, created]);
    toast.success(`Created LP ${lpNumber} with ${qty} ${scannedWO.product.uom}`);

    const remainingQty = woQty - qty;
    if (remainingQty <= 0) {
      updateWorkOrder(scannedWO.id, { 
        status: 'completed',
        quantity: '0'
      });
      toast.success(`Work Order ${scannedWO.wo_number} completed`);
    } else {
      updateWorkOrder(scannedWO.id, { 
        quantity: remainingQty.toString()
      });
      setScannedWO({ ...scannedWO, quantity: remainingQty.toString() });
    }

    setPackQty('');
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  const handleDone = () => {
    setScannedWO(null);
    setCreatedLPs([]);
    setPackQty('');
    setTimeout(() => woInputRef.current?.focus(), 100);
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
        {!scannedWO ? (
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
            <label className="block text-base sm:text-lg font-semibold text-slate-900 mb-3">
              Scan Work Order
            </label>
            <div className="flex gap-2">
              <input
                ref={woInputRef}
                type="text"
                value={woNumber}
                onChange={(e) => setWoNumber(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleScanWO()}
                placeholder="Enter WO number"
                className="flex-1 px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[48px]"
              />
              <button
                onClick={handleScanWO}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold min-h-[48px]"
              >
                Scan
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">{scannedWO.wo_number}</h2>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    {scannedWO.product?.part_number} - {scannedWO.product?.description}
                  </p>
                  <p className="text-sm sm:text-base text-slate-600 mt-1">
                    Target Quantity: {scannedWO.quantity} {scannedWO.product?.uom}
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-semibold">
                  {scannedWO.status}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">
                Create Finish Good
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Quantity to Pack
                  </label>
                  <input
                    ref={qtyInputRef}
                    type="number"
                    value={packQty}
                    onChange={(e) => setPackQty(e.target.value)}
                    placeholder="Enter quantity"
                    className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[48px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Location for New LP
                  </label>
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(Number(e.target.value))}
                    className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[48px] bg-white"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.code} - {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCreateFinishGood}
                  className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg min-h-[56px] flex items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  Create Finish Good
                </button>
              </div>
            </div>

            {createdLPs.length > 0 && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Created License Plates</h3>
                <div className="space-y-2">
                  {createdLPs.map((lp, idx) => (
                    <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 text-sm sm:text-base">{lp.lpNumber}</p>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            {lp.productPartNumber} - {lp.productDescription}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600">
                            Qty: {lp.quantity} | Location: {lp.location}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleDone}
                  className="w-full mt-4 px-6 py-4 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-bold text-lg min-h-[56px]"
                >
                  Done
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
