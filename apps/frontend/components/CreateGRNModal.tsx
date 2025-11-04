'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { usePurchaseOrders, useProducts, addGRN, addLicensePlate, addStockMove, useSettings } from '@/lib/clientState';
import { LocationsAPI } from '@/lib/api/locations';
import type { Location } from '@/lib/types';
import { toast } from '@/lib/toast';

interface CreateGRNModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface GRNLineItem {
  product_id: number;
  quantity_ordered: string;
  quantity_received: string;
  location_id: number;
}

export function CreateGRNModal({ isOpen, onClose, onSuccess }: CreateGRNModalProps) {
  const purchaseOrders = usePurchaseOrders();
  const { products } = useProducts();
  const settings = useSettings();
  const [selectedPO, setSelectedPO] = useState<number | null>(null);
  const [lineItems, setLineItems] = useState<GRNLineItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const data = await LocationsAPI.getAll();
        setLocations(data);
      } catch (error) {
        console.error('Failed to load locations:', error);
      }
    };
    if (isOpen) {
      loadLocations();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // GRN can be created for submitted, confirmed, or received POs
  const availablePOs = purchaseOrders.filter(po => 
    po.status === 'submitted' || po.status === 'confirmed' || po.status === 'received'
  );
  const selectedPOData = availablePOs.find(po => po.id === selectedPO);

  const handlePOSelect = (poId: number) => {
    setSelectedPO(poId);
    const po = purchaseOrders.find(p => p.id === poId);
    if (po?.purchase_order_items) {
      const defaultLocationId = locations.length > 0 ? locations[0].id : (settings.warehouse?.default_location_id || 0);
      setLineItems(po.purchase_order_items.map(item => ({
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered.toString(),
        quantity_received: item.quantity_received.toString(),
        location_id: defaultLocationId,
      })));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPO) {
      toast.error('Please select a Purchase Order');
      return;
    }

    const grnNumber = `GRN-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
    const selectedPOData = purchaseOrders.find(p => p.id === selectedPO);
    const warehouseLocationId = settings.warehouse.default_location_id;
    const timestamp = new Date().toISOString();
    
    const grnItems = lineItems.map((item, index) => {
      const lpNumber = `LP-2024-${String(Date.now() + index).slice(-3)}`;
      const product = products.find(p => p.id === item.product_id);
      
      const newLP = addLicensePlate({
        lp_number: lpNumber,
        lp_code: lpNumber,
        item_id: item.product_id.toString(),
        product_id: item.product_id.toString(),
        location_id: item.location_id.toString(),
        quantity: parseFloat(item.quantity_received),
        status: 'Available',
        qa_status: 'Passed',
        grn_id: null,
      });

      addStockMove({
        move_number: grnNumber,
        lp_id: newLP.id,
        from_location_id: null,
        to_location_id: warehouseLocationId.toString(),
        quantity: parseFloat(item.quantity_received),
        reason: 'Goods Received',
        status: 'completed',
        move_date: timestamp,
        wo_number: selectedPOData?.po_number,
      });

      return {
        id: Date.now() + index,
        grn_id: 0,
        product_id: item.product_id,
        quantity_ordered: item.quantity_ordered,
        quantity_received: item.quantity_received,
        location_id: item.location_id,
        lp_number: lpNumber,
        created_at: timestamp,
        updated_at: timestamp,
      };
    });

    addGRN({
      grn_number: grnNumber,
      po_id: selectedPO,
      status: 'draft',
      received_date: timestamp,
      created_by: 'System',
      grn_items: grnItems,
    });

    toast.success('GRN created successfully');
    onSuccess?.();
    onClose();
    setSelectedPO(null);
    setLineItems([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">Create GRN</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Purchase Order
            </label>
            <select
              value={selectedPO || ''}
              onChange={(e) => handlePOSelect(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
              required
            >
              <option value="">Select a PO...</option>
              {availablePOs.map((po) => (
                <option key={po.id} value={po.id}>
                  {po.po_number} - {po.supplier?.name}
                </option>
              ))}
            </select>
          </div>

          {selectedPOData && lineItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-medium text-slate-900">Line Items</h3>
              {lineItems.map((item, index) => {
                const product = products.find(p => p.id === item.product_id);
                return (
                  <div key={index} className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-md">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Product</label>
                      <div className="text-sm text-slate-900">{product?.description}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Ordered Qty</label>
                      <div className="text-sm text-slate-600">{item.quantity_ordered}</div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Received Qty</label>
                      <input
                        type="number"
                        value={item.quantity_received}
                        onChange={(e) => {
                          const newItems = [...lineItems];
                          newItems[index].quantity_received = e.target.value;
                          setLineItems(newItems);
                        }}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                      <select
                        value={item.location_id}
                        onChange={(e) => {
                          const newItems = [...lineItems];
                          newItems[index].location_id = Number(e.target.value);
                          setLineItems(newItems);
                        }}
                        className="w-full px-2 py-1 border border-slate-300 rounded text-sm"
                      >
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800"
              disabled={!selectedPO || lineItems.length === 0}
            >
              Create GRN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
