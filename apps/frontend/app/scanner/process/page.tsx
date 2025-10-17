'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, CheckCircle, X, Check, AlertTriangle, Minus } from 'lucide-react';
import { useWorkOrders, useLicensePlates, updateWorkOrder, updateLicensePlate, addLicensePlate, addStockMove, addYieldReport, useYieldReports, useSettings, saveOrderProgress, getOrderProgress, clearOrderProgress, useMachines, getFilteredBomForWorkOrder } from '@/lib/clientState';
import { toast } from '@/lib/toast';
import { AlertDialog } from '@/components/AlertDialog';
import { ManualConsumeModal } from '@/components/ManualConsumeModal';
import type { WorkOrder, LicensePlate, BomItem, YieldReportDetail, YieldReportMaterial, StagedLP } from '@/lib/types';

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
  const [createdItemsCount, setCreatedItemsCount] = useState(0);
  const [consumedMaterials, setConsumedMaterials] = useState<{ [materialId: number]: number }>({});
  const [showManualConsumeModal, setShowManualConsumeModal] = useState(false);
  const [selectedLPForConsume, setSelectedLPForConsume] = useState<{ lp: LicensePlate; stagedQty: number } | null>(null);
  const [showYieldReportsModal, setShowYieldReportsModal] = useState(false);

  const lpInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const createQtyInputRef = useRef<HTMLInputElement>(null);

  const workOrders = useWorkOrders();
  const licensePlates = useLicensePlates();
  const yieldReports = useYieldReports();
  const settings = useSettings();
  const machines = useMachines();
  
  const [componentLineSelections, setComponentLineSelections] = useState<{[materialId: number]: string}>({});

  const lines = ['Line 1', 'Line 2', 'Line 3', 'Line 4'];
  
  const availableWOs = workOrders.filter(wo => 
    wo.machine?.name === selectedLine &&
    (wo.status === 'in_progress' || wo.status === 'released') && 
    wo.product?.type === 'PR'
  );
  
  const selectedWO = selectedWOId ? workOrders.find(wo => wo.id === selectedWOId.toString()) : undefined;
  const stagedLPsForCurrentOrder = selectedWOId ? (stagedLPsByOrder[selectedWOId] || []) : [];
  const bomItems = selectedWO ? getFilteredBomForWorkOrder(selectedWO) : [];

  useEffect(() => {
    if (selectedWOId && selectedWO) {
      const savedProgress = getOrderProgress(selectedWOId);
      
      if (savedProgress) {
        setStagedLPsByOrder(prev => ({
          ...prev,
          [selectedWOId]: savedProgress.staged_lps
        }));
        setCreatedItemsCount(savedProgress.boxes_created);
        setConsumedMaterials(savedProgress.consumed_materials || {});
        toast.success('Order progress restored');
      } else {
        setCreatedItemsCount(0);
        setConsumedMaterials({});
      }
      
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

  useEffect(() => {
    if (selectedWOId && selectedLine && selectedWO) {
      saveOrderProgress(selectedWOId, {
        id: `progress-${selectedWOId}`,
        order_id: selectedWOId.toString(),
        order_type: 'work_order',
        status: 'in_progress',
        progress_percentage: 0,
        wo_id: selectedWOId.toString(),
        staged_lps: stagedLPsForCurrentOrder,
        boxes_created: createdItemsCount,
        line: selectedLine,
        started_at: new Date().toISOString(),
        consumed_materials: consumedMaterials,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }, [stagedLPsForCurrentOrder, createdItemsCount, selectedLine, selectedWOId, consumedMaterials]);

  const getStagedMaterialIds = (): Set<string> => {
    const materialIds = new Set<string>();
    stagedLPsForCurrentOrder.forEach(staged => {
      if (staged.lp.product_id) {
        materialIds.add(staged.lp.product_id.toString());
      }
    });
    return materialIds;
  };

  const isBomComponentStaged = (materialId: number): boolean => {
    return getStagedMaterialIds().has(materialId.toString());
  };

  const allBomComponentsStaged = (): boolean => {
    if (bomItems.length === 0) return false;
    return bomItems.every(item => isBomComponentStaged(item.material_id));
  };

  const getAlreadyStagedFromLP = (lpId: number): number => {
    return stagedLPsForCurrentOrder
      .filter(staged => staged.lp.id === lpId.toString())
      .reduce((sum, staged) => sum + staged.quantity, 0);
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

    if (lp.qa_status === 'Quarantine') {
      toast.error(`Cannot scan LP ${lp.lp_number} - Status: Quarantine. This item is quarantined and cannot be used.`);
      setLpNumber('');
      setTimeout(() => lpInputRef.current?.focus(), 100);
      return;
    }

    const isValidMaterial = bomItems.some(item => item.material_id.toString() === lp.product_id?.toString());
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
    const lpTotalQty = currentScannedLP.quantity;
    const alreadyStaged = getAlreadyStagedFromLP(parseInt(currentScannedLP.id));
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
      quantity: qty,
      staged_at: new Date().toISOString(),
      line: componentLineSelections[currentScannedLP.product_id] || selectedLine || undefined,
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
      const requiredPerUnit = item.quantity;
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
        .filter(staged => staged.lp.product_id === materialId.toString())
        .reduce((sum, staged) => sum + staged.quantity, 0);
      
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
    const materialConsumed: { [materialId: number]: number } = {};
    
    const now = new Date();
    const moveDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const sortedBomItems = [...bomItems].sort((a, b) => {
      if (a.priority === undefined && b.priority === undefined) return 0;
      if (a.priority === undefined) return 1;
      if (b.priority === undefined) return -1;
      return a.priority - b.priority;
    });
    
    sortedBomItems.forEach(bomItem => {
      const materialId = bomItem.material_id;
      let remainingToConsume = needs[materialId];
      
      const selectedLine = componentLineSelections[materialId];
      
      for (let i = 0; i < updatedStaging.length && remainingToConsume > 0; i++) {
        const staged = updatedStaging[i];
        
        if (staged.lp.product_id === materialId.toString()) {
          if (selectedLine && staged.line !== selectedLine) {
            continue;
          }
          
          const toConsume = Math.min(remainingToConsume, staged.quantity);
          
          const currentLPQty = staged.lp.quantity;
          const newLPQty = currentLPQty - toConsume;
          updateLicensePlate(parseInt(staged.lp.id), { quantity: newLPQty });
          
          addStockMove({
            move_number: `SM-CONSUME-${Date.now()}-${staged.lp.lp_number}`,
            lp_id: staged.lp.id,
            from_location_id: staged.lp.location_id,
            to_location_id: null,
            quantity: -toConsume,
            reason: 'Consumption for Work Order',
            status: 'completed',
            move_date: moveDate,
            wo_number: selectedWO!.wo_number,
          });
          
          staged.quantity -= toConsume;
          remainingToConsume -= toConsume;
          
          materialConsumed[materialId] = (materialConsumed[materialId] || 0) + toConsume;
        }
      }
    });
    
    setConsumedMaterials(prev => {
      const updated = { ...prev };
      Object.keys(materialConsumed).forEach(matId => {
        const materialId = parseInt(matId);
        updated[materialId] = (updated[materialId] || 0) + materialConsumed[materialId];
      });
      return updated;
    });
    
    const remainingStaging = updatedStaging.filter(staged => staged.quantity > 0);
    
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

    for (const item of bomItems) {
      const productionLines = item.material?.production_lines;
      const needsLineSelection = productionLines && productionLines.length > 0 && !productionLines.includes('ALL');
      
      if (needsLineSelection && !componentLineSelections[item.material_id]) {
        toast.error(`Please select production line for ${item.material?.part_number || 'component'}`);
        return;
      }
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
    const warehouseLocationId = settings.warehouse.default_location_id || 1;
    
    const newPRLP = addLicensePlate({
      lp_number: prLPNumber,
      lp_code: prLPNumber,
      item_id: selectedWO.product!.id,
      product_id: selectedWO.product!.id,
      location_id: warehouseLocationId.toString(),
      quantity: qtyToCreate,
      status: 'Available',
      qa_status: 'Passed',
      grn_id: null,
    });
    
    const now = new Date();
    const moveDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    addStockMove({
      move_number: `SM-${prLPNumber}`,
      lp_id: newPRLP.id,
      from_location_id: null,
      to_location_id: warehouseLocationId.toString(),
      quantity: qtyToCreate,
      reason: 'Production Output',
      status: 'completed',
      move_date: moveDate,
      wo_number: selectedWO.wo_number,
    });

    const woQty = selectedWO.quantity;
    const remainingQty = woQty - qtyToCreate;
    
    if (remainingQty <= 0) {
      updateWorkOrder(parseInt(selectedWO.id), { 
        status: 'completed',
        quantity: 0
      });
      toast.success(`Work Order ${selectedWO.wo_number} completed!`);
    } else {
      updateWorkOrder(parseInt(selectedWO.id), { 
        quantity: remainingQty
      });
    }

    setCreatedItemsCount(prev => prev + qtyToCreate);

    toast.success(`Created PR ${prLPNumber} - ${qtyToCreate} ${selectedWO.product!.uom}`);
    
    setQuantityToCreate('');
    setShowInsufficientModal(false);
    setTimeout(() => createQtyInputRef.current?.focus(), 100);
  };

  const handleManualConsume = (lp: LicensePlate, stagedQty: number) => {
    setSelectedLPForConsume({ lp, stagedQty });
    setShowManualConsumeModal(true);
  };

  const handleManualConsumeConfirm = (quantity: number) => {
    if (!selectedLPForConsume || !selectedWOId) return;

    const { lp, stagedQty } = selectedLPForConsume;

    const currentLPQty = lp.quantity;
    const newLPQty = currentLPQty - quantity;
    updateLicensePlate(parseInt(lp.id), { quantity: newLPQty });

    const updatedStaging = stagedLPsForCurrentOrder.map(staged => {
      if (staged.lp.id === lp.id.toString()) {
        return {
          ...staged,
          quantity: staged.quantity - quantity
        };
      }
      return staged;
    }).filter(staged => staged.quantity > 0);

    setStagedLPsByOrder(prev => ({
      ...prev,
      [selectedWOId]: updatedStaging,
    }));

    setConsumedMaterials(prev => ({
      ...prev,
      [lp.product_id]: (prev[lp.product_id] || 0) + quantity
    }));

    const now = new Date();
    const moveDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    addStockMove({
      move_number: `SM-MANUAL-${Date.now()}`,
      lp_id: lp.id,
      from_location_id: lp.location_id,
      to_location_id: null,
      quantity: -quantity,
      reason: 'Manual Consumption',
      status: 'completed',
      move_date: moveDate,
      wo_number: selectedWO!.wo_number,
    });

    toast.success(`Consumed ${quantity} ${lp.product?.uom} from ${lp.lp_number}`);
    setShowManualConsumeModal(false);
    setSelectedLPForConsume(null);
  };

  const handleCloseOrder = () => {
    if (!selectedWO || !selectedWOId) return;

    let targetQty: number;
    let efficiency: number;

    if (bomItems.length === 0) {
      targetQty = createdItemsCount;
      efficiency = 100;
    } else {
      const materialRatios = bomItems.map(bomComp => {
        const consumedQty = consumedMaterials[bomComp.material_id] || 0;
        if (bomComp.quantity === 0) return Infinity;        
        return consumedQty / bomComp.quantity;
      });

      targetQty = Math.floor(Math.min(...materialRatios));
      efficiency = targetQty > 0 
        ? Math.round((createdItemsCount / targetQty) * 100) 
        : 0;
    }

    const materialsUsed: YieldReportMaterial[] = Object.keys(consumedMaterials).map(matId => {
      const materialId = parseInt(matId);
      const bomItem = bomItems.find(item => item.material_id === materialId);
      const material = bomItem?.material;
      
      const consumedQty = consumedMaterials[materialId];
      const standardQty = createdItemsCount * (bomItem?.quantity || 0);
      const yieldPercentage = consumedQty > 0 
        ? Math.round((standardQty / consumedQty) * 100)
        : 0;
      
      return {
        material_id: materialId,
        material_name: material?.description || 'Unknown Material',
        planned_qty: standardQty,
        actual_qty: consumedQty,
        variance: consumedQty - standardQty,
        item_code: material?.part_number || `MAT-${materialId}`,
        item_name: material?.description || 'Unknown Material',
        standard_qty: standardQty,
        consumed_qty: consumedQty,
        uom: bomItem?.uom || material?.uom || '',
        yield_percentage: yieldPercentage
      };
    });

    const yieldReport: YieldReportDetail = {
      id: Date.now(),
      wo_id: parseInt(selectedWO.id),
      work_order_id: parseInt(selectedWO.id),
      material_id: 0, // This will be set per material in materials_used
      planned_qty: targetQty,
      actual_qty: createdItemsCount,
      variance: createdItemsCount - targetQty,
      created_at: new Date().toISOString(),
      materials_used: materialsUsed,
      work_order_number: selectedWO.wo_number,
      product_name: `${selectedWO.product?.part_number} - ${selectedWO.product?.description}`,
      line_number: selectedWO.line_number || '',
      target_quantity: targetQty,
      actual_quantity: createdItemsCount,
      efficiency_percentage: efficiency,
      created_by: 'Operator'
    };

    addYieldReport(yieldReport);

    clearOrderProgress(selectedWOId);

    toast.success('Order closed, yield report generated');

    setShowYieldReportsModal(true);

    setSelectedLine(null);
    setSelectedWOId(null);
    setLpNumber('');
    setCurrentScannedLP(null);
    setStageQuantity('');
    setQuantityToCreate('');
    setCreatedItemsCount(0);
    setConsumedMaterials({});
    setStagedLPsByOrder(prev => {
      const updated = { ...prev };
      delete updated[selectedWOId];
      return updated;
    });
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

  const handleStartWorkOrder = () => {
    if (!selectedWO) return;
    
    updateWorkOrder(parseInt(selectedWO.id), { status: 'in_progress' });
    toast.success(`Work Order ${selectedWO.wo_number} started successfully`);
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/scanner')}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold">Process Terminal</h1>
          </div>
          <button
            onClick={() => setShowYieldReportsModal(true)}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors text-sm font-semibold"
          >
            View Yield Reports
          </button>
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
                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                    {selectedWO.status}
                  </span>
                  {selectedWO.status === 'released' && (
                    <button
                      onClick={handleStartWorkOrder}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
                    >
                      Start Work Order
                    </button>
                  )}
                </div>
              </div>

              <div className="border-t border-blue-200 pt-3 mt-3">
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Required Materials (BOM):</h3>
                <div className="space-y-1">
                  {bomItems.map((item) => {
                    const isStaged = isBomComponentStaged(item.material_id);
                    const productionLines = item.material?.production_lines;
                    const needsLineSelection = productionLines && productionLines.length > 0 && !productionLines.includes('ALL');
                    
                    return (
                      <div key={item.id} className="bg-white px-3 py-2 rounded">
                        <div className="flex items-center justify-between">
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
                        {needsLineSelection && (
                          <div className="mt-2">
                            <select
                              value={componentLineSelections[item.material_id] || ''}
                              onChange={(e) => setComponentLineSelections({
                                ...componentLineSelections,
                                [item.material_id]: e.target.value
                              })}
                              className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="">Select Production Line</option>
                              {productionLines.map(lineId => {
                                const machine = machines.find(m => m.id === parseInt(lineId));
                                return (
                                  <option key={lineId} value={lineId}>
                                    {machine?.name || `Line ${lineId}`}
                                  </option>
                                );
                              })}
                            </select>
                          </div>
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
                        <p><span className="font-medium">Already Staged:</span> {getAlreadyStagedFromLP(parseInt(currentScannedLP.id))} {currentScannedLP.product?.uom}</p>
                        <p className="font-bold text-blue-700">
                          <span className="font-medium">Available to Stage:</span> {currentScannedLP.quantity - getAlreadyStagedFromLP(parseInt(currentScannedLP.id))} {currentScannedLP.product?.uom}
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
                          placeholder={`Max: ${currentScannedLP.quantity - getAlreadyStagedFromLP(parseInt(currentScannedLP.id))}`}
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
                          Staged: {staged.quantity} {staged.lp.product?.uom}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleManualConsume(staged.lp, staged.quantity)}
                          className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors flex items-center gap-1"
                        >
                          <Minus className="w-4 h-4" />
                          Consume
                        </button>
                        <button
                          onClick={() => handleRemoveStaged(idx)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
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
                onClick={handleCloseOrder}
                className="w-full mt-3 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold min-h-[48px]"
              >
                Close Order
              </button>
            </div>
          </>
        )}
      </div>

      {showYieldReportsModal && yieldReports.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900">Order Closed - Yield Summary</h3>
              <button
                onClick={() => setShowYieldReportsModal(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-auto flex-1">
              {(() => {
                const latestReport = yieldReports[yieldReports.length - 1];
                const getYieldColor = (yieldPct: number) => {
                  if (yieldPct >= 90) return 'text-green-600';
                  if (yieldPct >= 70) return 'text-orange-600';
                  return 'text-red-600';
                };

                return (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-slate-600">Work Order</p>
                          <p className="text-lg font-semibold text-slate-900">{latestReport.work_order_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Product</p>
                          <p className="text-lg font-semibold text-slate-900">{latestReport.product_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Target Quantity</p>
                          <p className="text-lg font-semibold text-slate-900">{latestReport.target_quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Actual Quantity</p>
                          <p className="text-lg font-semibold text-slate-900">{latestReport.actual_quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Line</p>
                          <p className="text-lg font-semibold text-slate-900">{latestReport.line_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-slate-600">Efficiency</p>
                          <p className={`text-lg font-bold ${latestReport.efficiency_percentage >= 90 ? 'text-green-600' : latestReport.efficiency_percentage >= 70 ? 'text-orange-600' : 'text-red-600'}`}>
                            {latestReport.efficiency_percentage}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 mb-3">Material Yield Details</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                          <thead className="bg-slate-100">
                            <tr>
                              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 border-b">Material</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 border-b">BOM Standard</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 border-b">Consumed Qty</th>
                              <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700 border-b">Yield %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {latestReport.materials_used.map((mat, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm text-slate-900 border-b">
                                  <div>
                                    <p className="font-medium">{mat.item_code}</p>
                                    <p className="text-xs text-slate-600">{mat.item_name}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-900 border-b text-right">
                                  {mat.standard_qty} {mat.uom}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-900 border-b text-right">
                                  {mat.consumed_qty} {mat.uom}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold border-b text-right">
                                  <span className={getYieldColor(mat.yield_percentage)}>
                                    {mat.yield_percentage}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t">
                      <button
                        onClick={() => setShowYieldReportsModal(false)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <ManualConsumeModal
        isOpen={showManualConsumeModal}
        onClose={() => {
          setShowManualConsumeModal(false);
          setSelectedLPForConsume(null);
        }}
        lp={selectedLPForConsume?.lp || null}
        availableQuantity={selectedLPForConsume?.stagedQty || 0}
        onConfirm={handleManualConsumeConfirm}
      />
    </div>
  );
}
