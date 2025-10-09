'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, CheckCircle, X, Check, AlertTriangle } from 'lucide-react';
import { useWorkOrders, useLicensePlates, updateWorkOrder, updateLicensePlate, addLicensePlate, addStockMove } from '@/lib/clientState';
import { toast } from '@/lib/toast';
import { AlertDialog } from '@/components/AlertDialog';
import type { WorkOrder, LicensePlate, BomItem } from '@/lib/types';

interface StagedLP {
  lp: LicensePlate;
  stagedQuantity: number;
}

interface InsufficientMaterial {
  material: string;
  needed: number;
  available: number;
  shortage: number;
  uom: string;
}

export default function ProcessTerminalPage() {
  const router = useRouter();
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedWOId, setSelectedWOId] = useState<number | null>(null);
  const [lpNumber, setLpNumber] = useState('');
  const [currentScannedLP, setCurrentScannedLP] = useState<LicensePlate | null>(null);
  const [stageQuantity, setStageQuantity] = useState('');
  const [stagedLPsByOrder, setStagedLPsByOrder] = useState<{ [key: number]: StagedLP[] }>({});
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [insufficientMaterials, setInsufficientMaterials] = useState<InsufficientMaterial[]>([]);
  const [quantityToCreate, setQuantityToCreate] = useState('');

  const lpInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const createQtyInputRef = useRef<HTMLInputElement>(null);

  const workOrders = useWorkOrders();
  const licensePlates = useLicensePlates();

  const lines = ['Line 1', 'Line 2', 'Line 3', 'Line 4'];
  
  const availableWOs = workOrders.filter(wo => 
    wo.line_number === selectedLine &&
    (wo.status === 'in_progress' || wo.status === 'released') && 
    wo.product?.type === 'PR'
  );
  
  const selectedWO = workOrders.find(wo => wo.id === selectedWOId);
  const stagedLPsForCurrentOrder = selectedWOId ? (stagedLPsByOrder[selectedWOId] || []) : [];
  const bomItems = selectedWO?.product?.activeBom?.bomItems || [];

  useEffect(() => {
    if (selectedWOId) {
      setLpNumber('');
      setCurrentScannedLP(null);
      setStageQuantity('');
      lpInputRef.current?.focus();
    }
  }, [selectedWOId]);

  useEffect(() => {
    if (selectedLine) {
      setSelectedWOId(null);
    }
  }, [selectedLine]);

  const getStagedMaterialIds = (): Set<number> => {
    const materialIds = new Set<number>();
    stagedLPsForCurrentOrder.forEach(staged => {
      materialIds.add(staged.lp.product_id);
    });
    return materialIds;
  };

  const isBomComponentStaged = (materialId: number): boolean => {
    return getStagedMaterialIds().has(materialId);
  };

  const allBomComponentsStaged = (): boolean => {
    if (bomItems.length === 0) return false;
    return bomItems.every(item => isBomComponentStaged(item.material_id));
  };

  const getAlreadyStagedFromLP = (lpId: number): number => {
    return stagedLPsForCurrentOrder
      .filter(staged => staged.lp.id === lpId)
      .reduce((sum, staged) => sum + staged.stagedQuantity, 0);
  };

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

    const isValidMaterial = bomItems.some(item => item.material_id === lp.product_id);
    if (!isValidMaterial) {
      setAlertMessage("Cannot scan this item - doesn't match order BOM");
      setShowAlert(true);
      setLpNumber('');
      return;
    }

    setCurrentScannedLP(lp);
    setLpNumber('');
    setStageQuantity('');
    toast.success(`LP ${lp.lp_number} scanned successfully`);
    setTimeout(() => qtyInputRef.current?.focus(), 100);
  };

  const handleConfirmStaging = () => {
    if (!currentScannedLP || !stageQuantity || !selectedWOId) {
      toast.error('Please enter quantity to stage');
      return;
    }

    const qty = parseFloat(stageQuantity);
    const lpTotalQty = parseFloat(currentScannedLP.quantity);
    const alreadyStaged = getAlreadyStagedFromLP(currentScannedLP.id);
    const availableQty = lpTotalQty - alreadyStaged;

    if (qty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (alreadyStaged >= lpTotalQty) {
      toast.error(`This LP is fully staged (${alreadyStaged} ${currentScannedLP.product?.uom} already used)`);
      return;
    }

    if (qty > availableQty) {
      toast.error(`Only ${availableQty} ${currentScannedLP.product?.uom} available from this LP (${alreadyStaged} already staged)`);
      return;
    }

    const staged: StagedLP = {
      lp: currentScannedLP,
      stagedQuantity: qty,
    };

    setStagedLPsByOrder(prev => ({
      ...prev,
      [selectedWOId]: [...(prev[selectedWOId] || []), staged],
    }));

    toast.success(`Staged ${qty} ${currentScannedLP.product?.uom} from ${currentScannedLP.lp_number}`);
    
    setCurrentScannedLP(null);
    setStageQuantity('');
    setTimeout(() => lpInputRef.current?.focus(), 100);
  };

  const handleRemoveStaged = (index: number) => {
    if (!selectedWOId) return;
    
    const updated = [...stagedLPsForCurrentOrder];
    const removed = updated.splice(index, 1)[0];
    
    setStagedLPsByOrder(prev => ({
      ...prev,
      [selectedWOId]: updated,
    }));
    
    toast.success(`Removed ${removed.lp.lp_number} from staging`);
  };

  const calculateMaterialNeeds = (qtyToCreate: number): { [materialId: number]: number } => {
    const needs: { [materialId: number]: number } = {};
    
    bomItems.forEach(item => {
      const requiredPerUnit = parseFloat(item.quantity);
      needs[item.material_id] = requiredPerUnit * qtyToCreate;
    });
    
    return needs;
  };

  const checkMaterialAvailability = (qtyToCreate: number): InsufficientMaterial[] => {
    const needs = calculateMaterialNeeds(qtyToCreate);
    const insufficient: InsufficientMaterial[] = [];
    
    Object.keys(needs).forEach(materialIdStr => {
      const materialId = parseInt(materialIdStr);
      const needed = needs[materialId];
      
      const availableInStaging = stagedLPsForCurrentOrder
        .filter(staged => staged.lp.product_id === materialId)
        .reduce((sum, staged) => sum + staged.stagedQuantity, 0);
      
      if (availableInStaging < needed) {
        const bomItem = bomItems.find(item => item.material_id === materialId);
        const material = bomItem?.material;
        
        insufficient.push({
          material: material?.part_number || `Material ${materialId}`,
          needed,
          available: availableInStaging,
          shortage: needed - availableInStaging,
          uom: bomItem?.uom || '',
        });
      }
    });
    
    return insufficient;
  };

  const consumeMaterialsFIFO = (qtyToCreate: number) => {
    const needs = calculateMaterialNeeds(qtyToCreate);
    const updatedStaging = [...stagedLPsForCurrentOrder];
    
    Object.keys(needs).forEach(materialIdStr => {
      const materialId = parseInt(materialIdStr);
      let remainingToConsume = needs[materialId];
      
      for (let i = 0; i < updatedStaging.length && remainingToConsume > 0; i++) {
        const staged = updatedStaging[i];
        
        if (staged.lp.product_id === materialId) {
          const toConsume = Math.min(remainingToConsume, staged.stagedQuantity);
          
          const currentLPQty = parseFloat(staged.lp.quantity);
          const newLPQty = currentLPQty - toConsume;
          updateLicensePlate(staged.lp.id, { quantity: newLPQty.toString() });
          
          staged.stagedQuantity -= toConsume;
          remainingToConsume -= toConsume;
        }
      }
    });
    
    const remainingStaging = updatedStaging.filter(staged => staged.stagedQuantity > 0);
    
    if (selectedWOId) {
      setStagedLPsByOrder(prev => ({
        ...prev,
        [selectedWOId]: remainingStaging,
      }));
    }
  };

  const generateLPNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `PR-${timestamp}-${random}`;
  };

  const handleCreatePR = () => {
    if (!selectedWO || !selectedWOId || !quantityToCreate) {
      toast.error('Please enter quantity to create');
      return;
    }

    const qtyToCreate = parseFloat(quantityToCreate);
    
    if (qtyToCreate <= 0) {
      toast.error('Invalid quantity');
      return;
    }

    const insufficient = checkMaterialAvailability(qtyToCreate);
    
    if (insufficient.length > 0) {
      setInsufficientMaterials(insufficient);
      setShowInsufficientModal(true);
      return;
    }

    proceedWithCreation(qtyToCreate);
  };

  const proceedWithCreation = (qtyToCreate: number) => {
    if (!selectedWO || !selectedWOId) return;

    consumeMaterialsFIFO(qtyToCreate);

    const prLPNumber = generateLPNumber();
    const newPRLP = addLicensePlate({
      lp_number: prLPNumber,
      product_id: selectedWO.product!.id,
      location_id: 3,
      quantity: qtyToCreate.toString(),
      qa_status: 'Pending',
      grn_id: null,
    });

    addStockMove({
      move_number: `SM-${prLPNumber}`,
      lp_id: newPRLP.id,
      from_location_id: 3,
      to_location_id: 3,
      quantity: qtyToCreate.toString(),
      status: 'completed',
      move_date: new Date().toISOString().split('T')[0],
    });

    const woQty = parseFloat(selectedWO.quantity);
    const remainingQty = woQty - qtyToCreate;
    
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

    toast.success(`Created PR ${prLPNumber} - ${qtyToCreate} ${selectedWO.product!.uom}`);
    
    setQuantityToCreate('');
    setShowInsufficientModal(false);
    setTimeout(() => createQtyInputRef.current?.focus(), 100);
  };

  const handleReset = () => {
    setSelectedLine(null);
    setSelectedWOId(null);
    setLpNumber('');
    setCurrentScannedLP(null);
    setStageQuantity('');
    setQuantityToCreate('');
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

      {showInsufficientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg font-bold text-slate-900">Insufficient Materials</h3>
            </div>
            
            <div className="space-y-2 mb-6">
              {insufficientMaterials.map((item, idx) => (
                <div key={idx} className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="font-medium text-slate-900">{item.material}</p>
                  <p className="text-sm text-slate-600">
                    Needed: {item.needed} {item.uom} | Available: {item.available} {item.uom}
                  </p>
                  <p className="text-sm text-red-600 font-medium">
                    Short by: {item.shortage} {item.uom}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => proceedWithCreation(parseFloat(quantityToCreate))}
                className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
              >
                Proceed Anyway
              </button>
              <button
                onClick={() => setShowInsufficientModal(false)}
                className="flex-1 px-4 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
            Step 1: Select Production Line
          </label>
          <select
            value={selectedLine || ''}
            onChange={(e) => setSelectedLine(e.target.value || null)}
            className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
          >
            <option value="">-- Select Line --</option>
            {lines.map(line => (
              <option key={line} value={line}>{line}</option>
            ))}
          </select>
        </div>

        {selectedLine && (
          <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
            <label className="block text-base sm:text-lg font-semibold text-slate-900 mb-3">
              Step 2: Select Work Order ({selectedLine})
            </label>
            <select
              value={selectedWOId || ''}
              onChange={(e) => setSelectedWOId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
            >
              <option value="">-- Select a WO --</option>
              {availableWOs.map(wo => (
                <option key={wo.id} value={wo.id}>
                  {wo.wo_number} - {wo.product?.part_number} ({wo.quantity} {wo.product?.uom})
                </option>
              ))}
            </select>
          </div>
        )}

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
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Required Materials (BOM):</h3>
                <div className="space-y-1">
                  {bomItems.map((item) => {
                    const isStaged = isBomComponentStaged(item.material_id);
                    return (
                      <div key={item.id} className="flex items-center justify-between bg-white px-3 py-2 rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {item.material?.part_number} - {item.material?.description}
                          </p>
                          <p className="text-xs text-slate-500">
                            Required: {item.quantity} {item.uom}
                          </p>
                        </div>
                        {isStaged ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <X className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
              <label className="block text-base sm:text-lg font-semibold text-slate-900 mb-3">
                Step 3: Scan License Plate
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

            {currentScannedLP && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 mb-2">Scanned LP Details</h3>
                    <div className="space-y-1 text-sm text-slate-700">
                      <p><span className="font-medium">LP Number:</span> {currentScannedLP.lp_number}</p>
                      <p><span className="font-medium">Product:</span> {currentScannedLP.product?.part_number} - {currentScannedLP.product?.description}</p>
                      <p><span className="font-medium">Location:</span> {currentScannedLP.location?.code} - {currentScannedLP.location?.name}</p>
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p><span className="font-medium">Original LP Quantity:</span> {currentScannedLP.quantity} {currentScannedLP.product?.uom}</p>
                        <p><span className="font-medium">Already Staged:</span> {getAlreadyStagedFromLP(currentScannedLP.id)} {currentScannedLP.product?.uom}</p>
                        <p className="font-bold text-blue-700">
                          <span className="font-medium">Available to Stage:</span> {parseFloat(currentScannedLP.quantity) - getAlreadyStagedFromLP(currentScannedLP.id)} {currentScannedLP.product?.uom}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Quantity to Stage from this LP
                        </label>
                        <input
                          ref={qtyInputRef}
                          type="number"
                          value={stageQuantity}
                          onChange={(e) => setStageQuantity(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleConfirmStaging()}
                          placeholder={`Max: ${parseFloat(currentScannedLP.quantity) - getAlreadyStagedFromLP(currentScannedLP.id)}`}
                          className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                        />
                      </div>
                      
                      <button
                        onClick={handleConfirmStaging}
                        disabled={!stageQuantity}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold min-h-[48px] disabled:bg-slate-300 disabled:cursor-not-allowed"
                      >
                        Confirm & Add to Staging
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {stagedLPsForCurrentOrder.length > 0 && (
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
                <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                  Staged Materials ({stagedLPsForCurrentOrder.length})
                </h3>
                <div className="space-y-2">
                  {stagedLPsForCurrentOrder.map((staged, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{staged.lp.lp_number}</p>
                        <p className="text-sm text-slate-600">
                          {staged.lp.product?.part_number} - {staged.lp.product?.description}
                        </p>
                        <p className="text-sm font-semibold text-blue-700">
                          Staged: {staged.stagedQuantity} {staged.lp.product?.uom}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveStaged(idx)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm border border-slate-200">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3">
                Step 4: Create Process Recipe
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quantity to Create ({selectedWO.product?.uom})
                </label>
                <input
                  ref={createQtyInputRef}
                  type="number"
                  value={quantityToCreate}
                  onChange={(e) => setQuantityToCreate(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && allBomComponentsStaged() && handleCreatePR()}
                  placeholder="Enter quantity"
                  className="w-full px-4 py-3 text-base border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
                />
              </div>

              <button
                onClick={handleCreatePR}
                disabled={!allBomComponentsStaged() || !quantityToCreate}
                className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold min-h-[48px] disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                <Package className="w-5 h-5 inline mr-2" />
                {allBomComponentsStaged() ? 'Create Process Recipe' : 'All BOM Components Required'}
              </button>

              <button
                onClick={handleReset}
                className="w-full mt-3 px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-semibold min-h-[48px]"
              >
                Reset / New Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
