'use client';
import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { toast } from '@/lib/toast';
import { ASNsAPI } from '@/lib/api';

interface UploadASNModalProps {
  isOpen: boolean;
  onClose: () => void;
  poId?: number;
  poNumber?: string;
  supplierId?: number;
}

export function UploadASNModal({ isOpen, onClose, poId, poNumber, supplierId }: UploadASNModalProps) {
  const [asnNumber, setAsnNumber] = useState('');
  const [expectedArrival, setExpectedArrival] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    if (!asnNumber || !expectedArrival || !supplierId) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await ASNsAPI.create({
        asn_number: asnNumber,
        supplier_id: supplierId,
        po_id: poId,
        expected_arrival: expectedArrival,
        items: [] // TODO: add file parsing or manual entry in future
      });
      
      if (result.success) {
        toast.success(`ASN ${asnNumber} uploaded successfully`);
        setAsnNumber('');
        setExpectedArrival('');
        onClose();
      } else {
        toast.error(result.message || 'Failed to upload ASN');
      }
    } catch (error) {
      toast.error('Error uploading ASN');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Upload ASN</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              ASN Number *
            </label>
            <input
              type="text"
              value={asnNumber}
              onChange={e => setAsnNumber(e.target.value)}
              placeholder="ASN-2025-001"
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Expected Arrival Date *
            </label>
            <input
              type="date"
              value={expectedArrival}
              onChange={e => setExpectedArrival(e.target.value)}
              className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              PO Reference
            </label>
            <input
              type="text"
              value={poNumber || 'N/A'}
              disabled
              className="w-full border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-600"
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
            Note: File upload and item entry will be added in a future update.
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 rounded hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Uploading...' : 'Upload ASN'}
          </button>
        </div>
      </div>
    </div>
  );
}
