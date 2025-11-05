'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase/client-browser';

interface AuditEvent {
  id: number;
  entity: string;
  entity_id: number;
  action: string;
  before: any;
  after: any;
  actor_id: string | null;
  created_at: string;
}

interface ProductHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
}

export function ProductHistoryModal({ isOpen, onClose, productId }: ProductHistoryModalProps) {
  const [history, setHistory] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<AuditEvent | null>(null);

  useEffect(() => {
    if (isOpen && productId) {
      loadHistory();
    }
  }, [isOpen, productId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      
      // Query audit_log table (only source of truth)
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .eq('entity', 'products')
        .eq('entity_id', productId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load product history:', error);
        setHistory([]);
        return;
      }

      console.log('Loaded product history:', data?.length || 0, 'entries');
      
      // Deduplicate entries - remove duplicates based on entity_id, action, and created_at (within 1 second)
      if (data && data.length > 0) {
        const deduplicated = data.reduce((acc: AuditEvent[], current: AuditEvent) => {
          // Check if there's already an entry with same entity_id, action, and similar timestamp (within 1 second)
          const duplicate = acc.find(entry => 
            entry.entity_id === current.entity_id &&
            entry.action === current.action &&
            Math.abs(new Date(entry.created_at).getTime() - new Date(current.created_at).getTime()) < 1000
          );
          
          if (!duplicate) {
            acc.push(current);
          }
          return acc;
        }, []);
        
        console.log('Deduplicated:', deduplicated.length, 'entries (removed', data.length - deduplicated.length, 'duplicates)');
        setHistory(deduplicated);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('Failed to load product history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatEventType = (action: string): string => {
    const actionUpper = action.toUpperCase();
    const typeMap: { [key: string]: string } = {
      'CREATE': 'Created',
      'UPDATE': 'Updated',
      'ARCHIVE': 'Archived',
      'DELETE': 'Deleted',
      'ACTIVATE': 'Activated',
      'STATUS_CHANGE': 'Status Changed'
    };
    return typeMap[actionUpper] || action;
  };

  const formatFieldName = (field: string): string => {
    const fieldMap: { [key: string]: string } = {
      'description': 'Description',
      'std_price': 'Standard Price',
      'uom': 'Unit of Measure',
      'expiry_policy': 'Expiry Policy',
      'shelf_life_days': 'Shelf Life Days',
      'supplier_id': 'Supplier',
      'tax_code_id': 'Tax Code',
      'lead_time_days': 'Lead Time Days',
      'moq': 'MOQ',
      'product_version': 'Product Version',
      'is_active': 'Active Status',
      'production_lines': 'Production Lines',
      'product_group': 'Product Group',
      'product_type': 'Product Type'
    };
    return fieldMap[field] || field;
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'none';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.length > 0 ? value.join(', ') : 'none';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">Product History</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No history entries found for this product.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedEntry(selectedEntry?.id === entry.id ? null : entry)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`text-sm font-medium px-3 py-1 rounded ${
                        entry.action?.toUpperCase() === 'CREATE' ? 'bg-green-100 text-green-800' :
                        entry.action?.toUpperCase() === 'UPDATE' ? 'bg-blue-100 text-blue-800' :
                        entry.action?.toUpperCase() === 'ARCHIVE' ? 'bg-red-100 text-red-800' :
                        entry.action?.toUpperCase() === 'DELETE' ? 'bg-red-200 text-red-900' :
                        entry.action?.toUpperCase() === 'ACTIVATE' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {formatEventType(entry.action)}
                      </span>
                      {/* Show changed fields in header for UPDATE actions */}
                      {entry.action?.toUpperCase() === 'UPDATE' && entry.before && entry.after && (() => {
                        const changedFields: string[] = [];
                        const oldVal = entry.before;
                        const newVal = entry.after;
                        
                        for (const key in newVal) {
                          if (JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key])) {
                            changedFields.push(formatFieldName(key));
                          }
                        }
                        
                        return changedFields.length > 0 ? (
                          <span className="text-xs text-slate-600 font-medium">
                            {changedFields.join(', ')}
                          </span>
                        ) : null;
                      })()}
                    </div>
                    <div className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </div>
                  </div>

                  {selectedEntry?.id === entry.id && entry.action?.toUpperCase() === 'UPDATE' && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="space-y-3">
                        {entry.before && entry.after && (() => {
                          const changes: { [key: string]: { old: any; new: any } } = {};
                          const oldVal = entry.before;
                          const newVal = entry.after;
                          
                          // Find changed fields
                          for (const key in newVal) {
                            if (JSON.stringify(oldVal[key]) !== JSON.stringify(newVal[key])) {
                              changes[key] = { old: oldVal[key], new: newVal[key] };
                            }
                          }

                          return Object.keys(changes).length > 0 ? (
                            <div>
                              <h4 className="text-sm font-medium text-slate-900 mb-2">Changes:</h4>
                              <div className="bg-slate-50 rounded p-3 space-y-2">
                                {Object.entries(changes).map(([field, change]) => (
                                  <div key={field} className="text-sm">
                                    <span className="font-medium text-slate-900">{formatFieldName(field)}:</span>{' '}
                                    <span className="text-red-600">{formatValue(change.old)}</span>
                                    {' → '}
                                    <span className="text-green-600">{formatValue(change.new)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-slate-500">No field changes detected</div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {selectedEntry?.id === entry.id && entry.action?.toUpperCase() === 'CREATE' && entry.after && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <h4 className="text-sm font-medium text-slate-900 mb-2">Initial Values:</h4>
                      <div className="bg-slate-50 rounded p-3 space-y-1 text-sm text-slate-700">
                        {Object.entries(entry.after)
                          .filter(([key]) => !['id', 'created_at', 'updated_at', 'created_by', 'updated_by'].includes(key))
                          .map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{formatFieldName(key)}:</span> {formatValue(value)}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {selectedEntry?.id === entry.id && entry.action?.toUpperCase() === 'ARCHIVE' && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="text-sm text-slate-600">
                        Product was archived. is_active set to false.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

