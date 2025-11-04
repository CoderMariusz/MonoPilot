'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, Save, X } from 'lucide-react';
import type { Routing, RoutingOperation } from '@/lib/types';

interface RoutingBuilderProps {
  routing?: Routing;
  onSave: (routing: Omit<Routing, 'id' | 'created_at' | 'updated_at'> & { 
    operations?: Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>[] 
  }) => void;
  onCancel: () => void;
}

const AVAILABLE_REQUIREMENTS = ['Smoke', 'Roast', 'Dice', 'Mix'];

export function RoutingBuilder({ routing, onSave, onCancel }: RoutingBuilderProps) {
  const [formData, setFormData] = useState({
    name: routing?.name || '',
    product_id: routing?.product_id || undefined,
    is_active: routing?.is_active ?? true,
    notes: routing?.notes || '',
  });

  const [operations, setOperations] = useState<Omit<RoutingOperation, 'id' | 'routing_id' | 'created_at' | 'updated_at'>[]>(
    routing?.operations?.map(op => ({
      seq_no: op.seq_no,
      name: op.name,
      code: op.code,
      description: op.description,
      requirements: op.requirements || [],
    })) || [
      {
        seq_no: 1,
        name: '',
        code: '',
        description: '',
        requirements: [],
      }
    ]
  );

  const handleOperationChange = (index: number, field: keyof typeof operations[0], value: any) => {
    setOperations(prev => prev.map((op, i) => 
      i === index ? { ...op, [field]: value } : op
    ));
  };

  const handleRequirementToggle = (operationIndex: number, requirement: string) => {
    setOperations(prev => prev.map((op, i) => {
      if (i === operationIndex) {
        const currentRequirements = op.requirements || [];
        const newRequirements = currentRequirements.includes(requirement)
          ? currentRequirements.filter(r => r !== requirement)
          : [...currentRequirements, requirement];
        return { ...op, requirements: newRequirements };
      }
      return op;
    }));
  };

  const addOperation = () => {
    const nextSeqNo = Math.max(...operations.map(op => op.seq_no), 0) + 1;
    setOperations(prev => [...prev, {
      seq_no: nextSeqNo,
      name: '',
      code: '',
      description: '',
      requirements: [],
    }]);
  };

  const removeOperation = (index: number) => {
    if (operations.length > 1) {
      setOperations(prev => prev.filter((_, i) => i !== index));
    }
  };

  const moveOperation = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= operations.length) return;
    
    const newOperations = [...operations];
    const [movedOperation] = newOperations.splice(fromIndex, 1);
    newOperations.splice(toIndex, 0, movedOperation);
    
    // Update sequence numbers
    const updatedOperations = newOperations.map((op, index) => ({
      ...op,
      seq_no: index + 1,
    }));
    
    setOperations(updatedOperations);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a routing name');
      return;
    }

    if (operations.length === 0) {
      alert('Routing must have at least one operation');
      return;
    }

    if (operations.some(op => !op.name.trim())) {
      alert('Please fill in all operation names');
      return;
    }

    onSave({
      ...formData,
      operations: operations.map((op, index) => ({
        seq_no: index + 1, // Auto-numeruj: 1, 2, 3...
        name: op.name,
        code: op.code,
        description: op.description,
        requirements: op.requirements || [],
      })),
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">
            {routing ? 'Edit Routing' : 'Create Routing'}
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            Define the sequence of operations and their requirements
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Basic Information */}
        <div className="mb-8">
          <h4 className="text-lg font-medium text-slate-900 mb-4">Basic Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Routing Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g., Standard Production Route"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product ID
              </label>
              <input
                type="number"
                value={formData.product_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, product_id: parseInt(e.target.value) || undefined }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Optional product ID"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-4 w-4 text-slate-900 focus:ring-slate-900 border-slate-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-slate-700">
                Active
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                rows={2}
                placeholder="Optional notes about this routing"
              />
            </div>
          </div>
        </div>

        {/* Operations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-slate-900">Operations</h4>
            <button
              onClick={addOperation}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Operation
            </button>
          </div>

          <div className="space-y-4">
            {operations.map((operation, index) => (
              <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <GripVertical className="w-4 h-4 text-slate-400 cursor-move" />
                      <span className="text-sm font-medium text-slate-600">
                        Step {operation.seq_no}
                      </span>
                    </div>
                    {index > 0 && (
                      <button
                        onClick={() => moveOperation(index, index - 1)}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        ↑ Move Up
                      </button>
                    )}
                    {index < operations.length - 1 && (
                      <button
                        onClick={() => moveOperation(index, index + 1)}
                        className="text-xs text-slate-600 hover:text-slate-900"
                      >
                        ↓ Move Down
                      </button>
                    )}
                  </div>
                  {operations.length > 1 && (
                    <button
                      onClick={() => removeOperation(index)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Remove operation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Operation Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={operation.name}
                      onChange={(e) => handleOperationChange(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="e.g., Preparation"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Code
                    </label>
                    <input
                      type="text"
                      value={operation.code}
                      onChange={(e) => handleOperationChange(index, 'code', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      placeholder="e.g., PREP"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={operation.description}
                      onChange={(e) => handleOperationChange(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                      rows={2}
                      placeholder="Describe what this operation does"
                    />
                  </div>
                </div>

                {/* Requirements */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Requirements
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_REQUIREMENTS.map(requirement => (
                      <button
                        key={requirement}
                        type="button"
                        onClick={() => handleRequirementToggle(index, requirement)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          operation.requirements?.includes(requirement)
                            ? 'bg-blue-500 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {requirement}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Select the requirements for this operation (Smoke, Roast, Dice, Mix)
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
        >
          <Save className="w-4 h-4" />
          {routing ? 'Update Routing' : 'Create Routing'}
        </button>
      </div>
    </div>
  );
}
