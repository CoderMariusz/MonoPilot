'use client';

import { useState, useEffect } from 'react';
import {
  Palette,
  Plus,
  Scan,
  Package,
  CheckCircle,
  XCircle,
  Printer,
  Truck,
  AlertTriangle,
  ChevronRight,
  Box
} from 'lucide-react';

/**
 * EPIC-002 Phase 4: Scanner Pallet Terminal
 *
 * Dedicated scanner page for pallet operations:
 * - Create pallets
 * - Scan and add LPs to pallets
 * - Close/seal pallets
 * - Print ZPL labels
 * - Ship pallets
 */

interface Pallet {
  id: number;
  pallet_number: string;
  pallet_type: string;
  status: 'open' | 'closed' | 'shipped';
  location_id?: number;
  wo_id?: number;
  target_boxes?: number;
  actual_boxes: number;
  created_at: string;
  closed_at?: string;
  work_order?: {
    wo_number: string;
    product: {
      part_number: string;
      description: string;
    };
  };
  items?: PalletItem[];
}

interface PalletItem {
  id: number;
  lp_id: number;
  quantity: number;
  uom: string;
  license_plate: {
    lp_code: string;
    product: {
      part_number: string;
      description: string;
    };
  };
}

type Step = 'select' | 'create' | 'scan' | 'close' | 'print' | 'ship';

export default function PalletTerminal() {
  const [step, setStep] = useState<Step>('select');
  const [pallets, setPallets] = useState<Pallet[]>([]);
  const [selectedPallet, setSelectedPallet] = useState<Pallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Create pallet form
  const [createForm, setCreateForm] = useState({
    pallet_type: 'EURO',
    target_boxes: '',
    wo_id: '',
  });

  // Scan LP form
  const [scanInput, setScanInput] = useState('');
  const [scannedLP, setScannedLP] = useState<any>(null);

  useEffect(() => {
    fetchPallets();
  }, []);

  const fetchPallets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pallets?status=open');
      if (response.ok) {
        const result = await response.json();
        setPallets(result.data || []);
      }
    } catch (err) {
      setError('Failed to fetch pallets');
    } finally {
      setLoading(false);
    }
  };

  const fetchPalletDetails = async (palletId: number) => {
    try {
      const response = await fetch(`/api/pallets/${palletId}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedPallet({ ...result.pallet, items: result.items });
      }
    } catch (err) {
      setError('Failed to fetch pallet details');
    }
  };

  const handleCreatePallet = async () => {
    if (!createForm.pallet_type) {
      setError('Please select pallet type');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/pallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pallet_type: createForm.pallet_type,
          target_boxes: createForm.target_boxes ? parseInt(createForm.target_boxes) : null,
          wo_id: createForm.wo_id ? parseInt(createForm.wo_id) : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccess(`Pallet ${result.pallet.pallet_number} created!`);
        // Fetch full details to get items array
        await fetchPalletDetails(result.pallet.id);
        setCreateForm({ pallet_type: 'EURO', target_boxes: '', wo_id: '' });
        setStep('scan');
        fetchPallets();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create pallet');
      }
    } catch (err) {
      setError('Failed to create pallet');
    } finally {
      setLoading(false);
    }
  };

  const handleScanLP = async () => {
    if (!scanInput.trim()) {
      setError('Please scan or enter LP code');
      return;
    }

    if (!selectedPallet) {
      setError('No pallet selected');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // First, find the LP by code
      const lpResponse = await fetch(`/api/license-plates?lp_code=${scanInput}`);
      if (!lpResponse.ok) {
        setError('LP not found');
        return;
      }

      const lpData = await lpResponse.json();
      const lp = lpData[0];

      if (!lp) {
        setError('LP not found');
        return;
      }

      // Add LP to pallet
      const response = await fetch(`/api/pallets/${selectedPallet.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lp_id: lp.id,
          quantity: lp.quantity,
          uom: lp.uom,
        }),
      });

      if (response.ok) {
        setSuccess(`LP ${scanInput} added to pallet!`);
        setScanInput('');
        setScannedLP(lp);
        await fetchPalletDetails(selectedPallet.id);

        // Clear success message after 2 seconds
        setTimeout(() => setSuccess(null), 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to add LP to pallet');
      }
    } catch (err) {
      setError('Failed to scan LP');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePallet = async () => {
    if (!selectedPallet) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pallets/${selectedPallet.id}/close`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Pallet closed successfully!');
        setStep('print');
        await fetchPalletDetails(selectedPallet.id);
        fetchPallets();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to close pallet');
      }
    } catch (err) {
      setError('Failed to close pallet');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintLabel = async () => {
    if (!selectedPallet) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pallets/${selectedPallet.id}/label`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Label sent to printer!');

        // In real implementation, this would trigger ZPL printer
        console.log('ZPL Label:', data.zpl);

        setStep('ship');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to print label');
      }
    } catch (err) {
      setError('Failed to print label');
    } finally {
      setLoading(false);
    }
  };

  const handleShipPallet = async () => {
    if (!selectedPallet) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pallets/${selectedPallet.id}/ship`, {
        method: 'POST',
      });

      if (response.ok) {
        setSuccess('Pallet marked as shipped!');
        setTimeout(() => {
          setStep('select');
          setSelectedPallet(null);
          fetchPallets();
        }, 1500);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to ship pallet');
      }
    } catch (err) {
      setError('Failed to ship pallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Palette className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Pallet Terminal</h1>
                <p className="text-sm text-slate-600">
                  {step === 'select' && 'Select or create a pallet'}
                  {step === 'create' && 'Create new pallet'}
                  {step === 'scan' && 'Scan LPs to add to pallet'}
                  {step === 'close' && 'Close and seal pallet'}
                  {step === 'print' && 'Print pallet label'}
                  {step === 'ship' && 'Mark pallet as shipped'}
                </p>
              </div>
            </div>

            {selectedPallet && (
              <div className="text-right">
                <div className="text-sm font-medium text-slate-600">Current Pallet</div>
                <div className="text-lg font-bold text-orange-600">{selectedPallet.pallet_number}</div>
                <div className="text-xs text-slate-500">
                  {selectedPallet.items?.length || 0} LPs • {selectedPallet.status}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Step: Select Pallet */}
        {step === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setStep('create')}
              className="w-full bg-orange-600 text-white rounded-lg p-6 hover:bg-orange-700 transition-colors flex items-center justify-center gap-3 text-lg font-semibold"
            >
              <Plus className="w-6 h-6" />
              Create New Pallet
            </button>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Open Pallets</h2>
              {pallets.filter(p => p.status === 'open').length === 0 ? (
                <p className="text-slate-500 text-center py-4">No open pallets</p>
              ) : (
                <div className="space-y-2">
                  {pallets.filter(p => p.status === 'open').map((pallet) => (
                    <button
                      key={pallet.id}
                      onClick={() => {
                        setSelectedPallet(pallet);
                        fetchPalletDetails(pallet.id);
                        setStep('scan');
                      }}
                      className="w-full bg-slate-50 hover:bg-slate-100 rounded-lg p-4 text-left transition-colors flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{pallet.pallet_number}</div>
                        <div className="text-sm text-slate-600">
                          {pallet.pallet_type} • {pallet.actual_boxes || 0} LPs
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step: Create Pallet */}
        {step === 'create' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Create New Pallet</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pallet Type *
                </label>
                <select
                  value={createForm.pallet_type}
                  onChange={(e) => setCreateForm({ ...createForm, pallet_type: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                >
                  <option value="EURO">EURO Pallet</option>
                  <option value="CHEP">CHEP Pallet</option>
                  <option value="CUSTOM">Custom Pallet</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Target Boxes (Optional)
                </label>
                <input
                  type="number"
                  value={createForm.target_boxes}
                  onChange={(e) => setCreateForm({ ...createForm, target_boxes: e.target.value })}
                  placeholder="Enter target box count..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreatePallet}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-lg font-medium flex items-center justify-center gap-2"
                >
                  {loading ? 'Creating...' : 'Create Pallet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Scan LPs */}
        {step === 'scan' && selectedPallet && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Scan License Plates</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    LP Code
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleScanLP()}
                      placeholder="Scan or enter LP code..."
                      autoFocus
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg font-mono"
                    />
                    <button
                      onClick={handleScanLP}
                      disabled={loading}
                      className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Scan className="w-5 h-5" />
                      Scan
                    </button>
                  </div>
                </div>

                {/* Current Pallet Items */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900">Items on Pallet</h3>
                    <span className="text-sm text-slate-600">
                      {selectedPallet.items?.length || 0} LPs
                    </span>
                  </div>

                  {!selectedPallet.items || selectedPallet.items.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No items yet</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPallet.items.map((item) => (
                        <div key={item.id} className="bg-slate-50 rounded-lg p-3 flex items-center gap-3">
                          <Box className="w-5 h-5 text-slate-400" />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{item.license_plate.lp_code}</div>
                            <div className="text-xs text-slate-600">
                              {item.quantity} {item.uom}
                            </div>
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6">
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedPallet(null);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep('close')}
                  disabled={!selectedPallet.items || selectedPallet.items.length === 0}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-lg font-medium"
                >
                  Close Pallet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Close Pallet */}
        {step === 'close' && selectedPallet && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Close Pallet</h2>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-slate-600">Pallet Number</div>
                    <div className="font-semibold text-slate-900">{selectedPallet.pallet_number}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Type</div>
                    <div className="font-semibold text-slate-900">{selectedPallet.pallet_type}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Items</div>
                    <div className="font-semibold text-slate-900">
                      {selectedPallet.items?.length || 0} LPs
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-600">Status</div>
                    <div className="font-semibold text-slate-900 capitalize">{selectedPallet.status}</div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Closing this pallet will seal it and prevent further modifications. Make sure all items are added.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setStep('scan')}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-lg font-medium"
                >
                  Back to Scanning
                </button>
                <button
                  onClick={handleClosePallet}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-lg font-medium flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  {loading ? 'Closing...' : 'Close Pallet'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Print Label */}
        {step === 'print' && selectedPallet && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Print Pallet Label</h2>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <p className="text-green-800">Pallet closed successfully!</p>
              </div>

              <div className="bg-slate-50 rounded-lg p-6 text-center">
                <Printer className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-700 mb-2">Ready to print label for:</p>
                <p className="text-2xl font-bold text-orange-600">{selectedPallet.pallet_number}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedPallet(null);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-lg font-medium"
                >
                  Skip Printing
                </button>
                <button
                  onClick={handlePrintLabel}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-lg font-medium flex items-center justify-center gap-2"
                >
                  <Printer className="w-5 h-5" />
                  {loading ? 'Printing...' : 'Print Label'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step: Ship Pallet */}
        {step === 'ship' && selectedPallet && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Ship Pallet</h2>

            <div className="space-y-4">
              <div className="bg-slate-50 rounded-lg p-6 text-center">
                <Truck className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-700 mb-2">Ready to ship:</p>
                <p className="text-2xl font-bold text-orange-600 mb-4">{selectedPallet.pallet_number}</p>
                <p className="text-sm text-slate-600">
                  This will mark the pallet as shipped and update inventory.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setStep('select');
                    setSelectedPallet(null);
                  }}
                  className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-lg font-medium"
                >
                  Later
                </button>
                <button
                  onClick={handleShipPallet}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-lg font-medium flex items-center justify-center gap-2"
                >
                  <Truck className="w-5 h-5" />
                  {loading ? 'Shipping...' : 'Mark as Shipped'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
