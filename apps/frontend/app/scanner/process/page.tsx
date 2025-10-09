'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { useWorkOrders, useLicensePlates, updateWorkOrder, updateLicensePlate } from '@/lib/clientState';
import { toast } from '@/lib/toast';
import type { WorkOrder, LicensePlate } from '@/lib/types';

interface ConsumedItem {
  lpNumber: string;
  materialPartNumber: string;
  materialDescription: string;
  quantity: number;
  uom: string;
}

export default function ProcessTerminalPage() {
  const router = useRouter();
  const [woNumber, setWoNumber] = useState('');
  const [scannedWO, setScannedWO] = useState<WorkOrder | null>(null);
  const [lpNumber, setLpNumber] = useState('');
  const [scannedLP, setScannedLP] = useState<LicensePlate | null>(null);
  const [consumeQty, setConsumeQty] = useState('');
  const [consumedItems, setConsumedItems] = useState<ConsumedItem[]>([]);
  const [currentBomIndex, setCurrentBomIndex] = useState(0);

  const woInputRef = useRef<HTMLInputElement>(null);
  const lpInputRef = useRef<HTMLInputElement>(null);

  const workOrders = useWorkOrders();
  const licensePlates = useLicensePlates();

  useEffect(() => {
    woInputRef.current?.focus();
  }, []);

  const handleScanWO = () => {
    const wo = workOrders.find(w => w.wo_number === woNumber.trim());
    if (!wo) {
      toast.error('Work Order not found');
      return;
    }
    if (!wo.product?.activeBom?.bomItems || wo.product.activeBom.bomItems.length === 0) {
      toast.error('No BOM items found for this product');
      return;
    }
    setScannedWO(wo);
    setWoNumber('');
    toast.success(`WO ${wo.wo_number} loaded successfully`);
    setTimeout(() => lpInputRef.current?.focus(), 100);
  };

  const handleScanLP = () => {
    const lp = licensePlates.find(l => l.lp_number === lpNumber.trim());
    if (!lp) {
      toast.error('License Plate not found');
      return;
    }

    const currentBomItem = scannedWO?.product?.activeBom?.bomItems?.[currentBomIndex];
    if (currentBomItem && lp.product_id !== currentBomItem.material_id) {
      toast.error(`Expected ${currentBomItem.material?.part_number}, got ${lp.product?.part_number}`);
      return;
    }

    setScannedLP(lp);
    setLpNumber('');
    toast.success(`LP ${lp.lp_number} scanned`);
  };

  const handleConsume = () => {
    if (!scannedLP || !scannedWO || !consumeQty) {
      toast.error('Please enter quantity to consume');
      return;
    }

    const qty = parseFloat(consumeQty);
    const availableQty = parseFloat(scannedLP.quantity);

    if (qty <= 0 || qty > availableQty) {
      toast.error(`Invalid quantity. Available: ${availableQty}`);
      return;
    }

    const newQty = availableQty - qty;
    updateLicensePlate(scannedLP.id, { quantity: newQty.toString() });

    const consumed: ConsumedItem = {
      lpNumber: scannedLP.lp_number,
      materialPartNumber: scannedLP.product?.part_number || '',
      materialDescription: scannedLP.product?.description || '',
      quantity: qty,
      uom: scannedLP.product?.uom || '',
    };

    setConsumedItems([...consumedItems, consumed]);
    toast.success(`Consumed ${qty} ${scannedLP.product?.uom} from ${scannedLP.lp_number}`);

    setScannedLP(null);
    setConsumeQty('');
    
    const bomItems = scannedWO.product?.activeBom?.bomItems || [];
    if (currentBomIndex < bomItems.length - 1) {
      setCurrentBomIndex(currentBomIndex + 1);
    }

    setTimeout(() => lpInputRef.current?.focus(), 100);
  };

  const handleCompleteWO = () => {
    if (!scannedWO) return;

    updateWorkOrder(scannedWO.id, { status: 'completed' });
    toast.success(`Work Order ${scannedWO.wo_number} completed`);

    setScannedWO(null);
    setConsumedItems([]);
    setCurrentBomIndex(0);
    setTimeout(() => woInputRef.current?.focus(), 100);
  };

  const bomItems = scannedWO?.product?.activeBom?.bomItems || [];
  const currentBomItem = bomItems[currentBomIndex];

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
                className="flex-1 px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
              />
              <button
                onClick={handleScanWO}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold min-h-[48px]"
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
                    Quantity: {scannedWO.quantity} {scannedWO.product?.uom}
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-semibold">
                  {scannedWO.status}
                </span>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="text-base font-semibold text-slate-900 mb-3">BOM Items Required:</h3>
                <div className="space-y-2">
                  {bomItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg ${
                        idx === currentBomIndex
                          ? 'bg-yellow-50 border border-yellow-300'
                          : idx < currentBomIndex
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm sm:text-base">
                            {item.material?.part_number} - {item.material?.description}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600">
                            Need: {parseFloat(item.quantity) * parseFloat(scannedWO.quantity)} {item.uom}
                          </p>
                        </div>
                        {idx < currentBomIndex && (
                          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        )}
                        {idx === currentBomIndex && (
                          <span className="text-xs font-semibold text-yellow-700">NEXT</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {currentBomItem && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                <div className="mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                    Scan Material: {currentBomItem.material?.part_number}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600">
                    {currentBomItem.material?.description}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      ref={lpInputRef}
                      type="text"
                      value={lpNumber}
                      onChange={(e) => setLpNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleScanLP()}
                      placeholder="Scan LP number"
                      className="flex-1 px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                    />
                    <button
                      onClick={handleScanLP}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold min-h-[48px]"
                    >
                      Scan
                    </button>
                  </div>

                  {scannedLP && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-slate-900 text-sm sm:text-base">{scannedLP.lp_number}</p>
                          <p className="text-xs sm:text-sm text-slate-600 mt-1">
                            {scannedLP.product?.part_number} - {scannedLP.product?.description}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600">
                            Location: {scannedLP.location?.code} - Available: {scannedLP.quantity} {scannedLP.product?.uom}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={consumeQty}
                          onChange={(e) => setConsumeQty(e.target.value)}
                          placeholder="Quantity to consume"
                          className="flex-1 px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[48px]"
                        />
                        <button
                          onClick={handleConsume}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold min-h-[48px]"
                        >
                          Consume
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {consumedItems.length > 0 && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">Consumed Items</h3>
                <div className="space-y-2">
                  {consumedItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 text-sm sm:text-base">
                            {item.materialPartNumber} - {item.materialDescription}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600">
                            LP: {item.lpNumber} - Consumed: {item.quantity} {item.uom}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {currentBomIndex >= bomItems.length - 1 && consumedItems.length > 0 && (
                  <button
                    onClick={handleCompleteWO}
                    className="w-full mt-4 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold text-lg min-h-[56px]"
                  >
                    Complete Work Order
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
