'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, CheckCircle, Clock, Package } from 'lucide-react';

interface StageBoardOperation {
  seq: number;
  operation_name: string;
  required_kg: number;
  staged_kg: number;
  in_kg: number;
  remaining_kg: number;
  color_code: 'green' | 'amber' | 'red';
  one_to_one_components: Array<{
    material_id: number;
    material_name: string;
    one_to_one: boolean;
  }>;
}

interface StageBoardData {
  wo_id: number;
  operations: StageBoardOperation[];
}

interface StageBoardProps {
  woId: number;
  onOperationSelect?: (operation: StageBoardOperation) => void;
}

export function StageBoard({ woId, onOperationSelect }: StageBoardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stageData, setStageData] = useState<StageBoardData | null>(null);

  const loadStageData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/scanner/wo/${woId}/stage-status`);
      if (!response.ok) throw new Error('Failed to load stage data');
      
      const data = await response.json();
      setStageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stage data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (woId) {
      loadStageData();
    }
  }, [woId]);

  const getStatusIcon = (colorCode: string) => {
    switch (colorCode) {
      case 'green':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'amber':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'red':
        return <Clock className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (colorCode: string) => {
    switch (colorCode) {
      case 'green':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'amber':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case 'red':
        return 'bg-red-100 border-red-200 text-red-800';
      default:
        return 'bg-gray-100 border-gray-200 text-gray-800';
    }
  };

  const getProgressPercentage = (operation: StageBoardOperation) => {
    if (operation.required_kg <= 0) return 0;
    return Math.min(100, (operation.in_kg / operation.required_kg) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (!stageData) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">No Stage Data</h3>
        <p className="text-slate-600">Select a work order to view staging information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Stage Board - WO {stageData.wo_id}</h3>
        </div>
        
        <div className="p-4 space-y-4">
          {stageData.operations.map((operation) => {
            const progressPercentage = getProgressPercentage(operation);
            
            return (
              <div
                key={operation.seq}
                className={`p-4 rounded-lg border-2 ${getStatusColor(operation.color_code)} cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => onOperationSelect?.(operation)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(operation.color_code)}
                    <div>
                      <h4 className="font-medium text-lg">
                        {operation.seq}. {operation.operation_name}
                      </h4>
                      <div className="text-sm opacity-75">
                        Required: {operation.required_kg.toFixed(1)} kg
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {operation.in_kg.toFixed(1)} kg
                    </div>
                    <div className="text-sm opacity-75">
                      {progressPercentage.toFixed(1)}% Complete
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        operation.color_code === 'green' ? 'bg-green-600' :
                        operation.color_code === 'amber' ? 'bg-yellow-600' :
                        'bg-red-600'
                      }`}
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-xs opacity-75 mb-1">Staged</div>
                    <div className="font-medium">{operation.staged_kg.toFixed(1)} kg</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75 mb-1">IN</div>
                    <div className="font-medium">{operation.in_kg.toFixed(1)} kg</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75 mb-1">Remaining</div>
                    <div className="font-medium">{operation.remaining_kg.toFixed(1)} kg</div>
                  </div>
                  <div>
                    <div className="text-xs opacity-75 mb-1">Status</div>
                    <div className="font-medium capitalize">{operation.color_code}</div>
                  </div>
                </div>

                {/* 1:1 Components */}
                {operation.one_to_one_components.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white border-opacity-30">
                    <div className="text-xs opacity-75 mb-2">1:1 Components</div>
                    <div className="flex flex-wrap gap-1">
                      {operation.one_to_one_components.map((component) => (
                        <span
                          key={component.material_id}
                          className="px-2 py-1 bg-white bg-opacity-30 rounded text-xs font-medium"
                        >
                          {component.material_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Total Operations</div>
          <div className="text-2xl font-bold text-slate-900">{stageData.operations.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">Completed</div>
          <div className="text-2xl font-bold text-green-600">
            {stageData.operations.filter(op => op.color_code === 'green').length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="text-sm text-slate-600">In Progress</div>
          <div className="text-2xl font-bold text-yellow-600">
            {stageData.operations.filter(op => op.color_code === 'amber').length}
          </div>
        </div>
      </div>
    </div>
  );
}

