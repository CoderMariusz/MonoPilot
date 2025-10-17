'use client';

import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Box, 
  Palette, 
  Upload, 
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface WorkOrder {
  id: number;
  wo_number: string;
  product_id: number;
  quantity: number;
  status: string;
  kpi_scope: string;
  product: {
    part_number: string;
    description: string;
  uom: string;
  };
}

interface Pallet {
  id: number;
  pallet_number: string;
  wo_id: number;
  status: string;
  created_at: string;
  work_order: {
    wo_number: string;
    product: {
      part_number: string;
      description: string;
    };
  };
}

export default function PackTerminal() {
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [selectedWOId, setSelectedWOId] = useState<number | null>(null);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pack output form
  const [packForm, setPackForm] = useState({
    boxes: '',
    box_weight_kg: '',
    pallet_id: '',
    input_lps: [] as number[]
  });
  
  // Pallet creation form
  const [palletForm, setPalletForm] = useState({
    wo_id: '',
    line_id: ''
  });
  
  // Available input LPs
  const [inputLPs, setInputLPs] = useState<any[]>([]);

  useEffect(() => {
    fetchWorkOrders();
    fetchPallets();
  }, []);

  useEffect(() => {
    if (selectedWOId) {
      fetchInputLPs(selectedWOId);
    }
  }, [selectedWOId]);

  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/work-orders');
      if (response.ok) {
        const data = await response.json();
        // Filter for Finished Goods (FG) work orders
        const fgWorkOrders = data.filter((wo: WorkOrder) => wo.kpi_scope === 'FG');
        setWorkOrders(fgWorkOrders);
      }
    } catch (err) {
      setError('Failed to fetch work orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchPallets = async () => {
    try {
      const response = await fetch('/api/scanner/pallets');
      if (response.ok) {
        const data = await response.json();
        setPallets(data.pallets || []);
      }
    } catch (err) {
      console.error('Failed to fetch pallets:', err);
    }
  };

  const fetchInputLPs = async (woId: number) => {
    try {
      // Fetch available LPs for this work order that can be used for packing
      const response = await fetch(`/api/license-plates?wo_id=${woId}&status=Available&qa_status=Passed`);
      if (response.ok) {
        const data = await response.json();
        setInputLPs(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch input LPs:', err);
    }
  };

  const handleCreatePallet = async () => {
    if (!palletForm.wo_id) {
      alert('Please select a work order');
      return;
    }

    try {
      const response = await fetch('/api/scanner/pallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(palletForm)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Pallet ${data.pallet.pallet_number} created successfully`);
        setPalletForm({ wo_id: '', line_id: '' });
        fetchPallets();
      } else {
        const errorData = await response.json();
        alert(`Failed to create pallet: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to create pallet');
    }
  };

  const handleRecordOutput = async () => {
    if (!selectedWOId || !packForm.boxes || !packForm.box_weight_kg) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch(`/api/scanner/pack/${selectedWOId}/output`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packForm)
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Output recorded successfully: ${data.output.box_lp.lp_number}`);
        setPackForm({ boxes: '', box_weight_kg: '', pallet_id: '', input_lps: [] });
        fetchPallets();
    } else {
        const errorData = await response.json();
        alert(`Failed to record output: ${errorData.error}`);
      }
    } catch (err) {
      alert('Failed to record output');
    }
  };

  const selectedWO = selectedWOId ? workOrders.find(wo => wo.id === selectedWOId) : null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Pack Terminal</h1>
              <p className="text-slate-600">Finished Goods Packing Operations</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-800">
              <XCircle className="w-5 h-5" />
              <span>{error}</span>
      </div>
        </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Work Order Selection */}
          <div className="space-y-6">
            {/* Work Order Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Select Work Order
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Work Order
            </label>
            <select
              value={selectedWOId || ''}
                    onChange={(e) => setSelectedWOId(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
                    <option value="">Select a work order</option>
                    {workOrders.map((wo) => (
                <option key={wo.id} value={wo.id}>
                        {wo.wo_number} - {wo.product.part_number}
                </option>
              ))}
            </select>
          </div>

        {selectedWO && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-2">Selected Work Order</h3>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div><strong>WO:</strong> {selectedWO.wo_number}</div>
                      <div><strong>Product:</strong> {selectedWO.product.part_number}</div>
                      <div><strong>Description:</strong> {selectedWO.product.description}</div>
                      <div><strong>Quantity:</strong> {selectedWO.quantity} {selectedWO.product.uom}</div>
                      <div><strong>Status:</strong> {selectedWO.status}</div>
                    </div>
                </div>
                  )}
                </div>
              </div>

            {/* Available Input LPs */}
            {selectedWOId && (
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  Available Input LPs
                </h2>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {inputLPs.map((lp) => (
                    <div
                      key={lp.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        packForm.input_lps.includes(lp.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => {
                        setPackForm(prev => ({
                          ...prev,
                          input_lps: prev.input_lps.includes(lp.id)
                            ? prev.input_lps.filter(id => id !== lp.id)
                            : [...prev.input_lps, lp.id]
                        }));
                      }}
                    >
                        <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">{lp.lp_number}</div>
                          <div className="text-sm text-slate-600">
                            {lp.quantity} {lp.product?.uom || 'kg'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lp.qa_status === 'Passed' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {lp.stage_suffix && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {lp.stage_suffix}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Pack Output */}
          <div className="space-y-6">
            {/* Pack Output Form */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Record Pack Output
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                      Number of Boxes
                </label>
                <input
                  type="number"
                      value={packForm.boxes}
                      onChange={(e) => setPackForm(prev => ({ ...prev, boxes: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 24"
                />
              </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Box Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={packForm.box_weight_kg}
                      onChange={(e) => setPackForm(prev => ({ ...prev, box_weight_kg: e.target.value }))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 25.0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Assign to Pallet (Optional)
                  </label>
                  <select
                    value={packForm.pallet_id}
                    onChange={(e) => setPackForm(prev => ({ ...prev, pallet_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">No pallet</option>
                    {pallets
                      .filter(p => p.status === 'building')
                      .map((pallet) => (
                        <option key={pallet.id} value={pallet.id}>
                          {pallet.pallet_number} - {pallet.work_order.wo_number}
                        </option>
                      ))}
                  </select>
                </div>

                {packForm.boxes && packForm.box_weight_kg && (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <h3 className="font-medium text-green-900 mb-2">Output Summary</h3>
                    <div className="text-sm text-green-800 space-y-1">
                      <div><strong>Boxes:</strong> {packForm.boxes}</div>
                      <div><strong>Box Weight:</strong> {packForm.box_weight_kg} kg</div>
                      <div><strong>Total Weight:</strong> {(parseFloat(packForm.boxes) * parseFloat(packForm.box_weight_kg)).toFixed(2)} kg</div>
                    </div>
                  </div>
                )}

              <button
                  onClick={handleRecordOutput}
                  disabled={!selectedWOId || !packForm.boxes || !packForm.box_weight_kg}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Upload className="w-4 h-4" />
                  Record Pack Output
              </button>
              </div>
            </div>

            {/* Create Pallet */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Create New Pallet
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Work Order
                  </label>
                  <select
                    value={palletForm.wo_id}
                    onChange={(e) => setPalletForm(prev => ({ ...prev, wo_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select work order</option>
                    {workOrders.map((wo) => (
                      <option key={wo.id} value={wo.id}>
                        {wo.wo_number} - {wo.product.part_number}
                      </option>
                    ))}
                  </select>
      </div>

              <button
                  onClick={handleCreatePallet}
                  disabled={!palletForm.wo_id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  <Plus className="w-4 h-4" />
                  Create Pallet
              </button>
              </div>
            </div>
            </div>
            
          {/* Right Column - Pallets */}
          <div className="space-y-6">
            {/* Active Pallets */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Active Pallets
              </h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {pallets.map((pallet) => (
                  <div
                    key={pallet.id}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                        <div>
                        <div className="font-medium text-slate-900">
                          {pallet.pallet_number}
                        </div>
                        <div className="text-sm text-slate-600">
                          {pallet.work_order.wo_number}
                        </div>
                        <div className="text-sm text-slate-600">
                          {pallet.work_order.product.part_number}
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        pallet.status === 'building'
                          ? 'bg-blue-100 text-blue-800'
                          : pallet.status === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pallet.status}
                                  </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      Created: {new Date(pallet.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}