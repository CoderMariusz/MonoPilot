'use client';

import { useState } from 'react';
import { WOTemplatesAPI, type CreateWOTemplateData, type WOTemplateConfig } from '@/lib/api/woTemplates';

interface SaveTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderData: WOTemplateConfig;
  productId: number;
  productName: string;
}

export function SaveTemplateModal({
  isOpen,
  onClose,
  workOrderData,
  productId,
  productName,
}: SaveTemplateModalProps) {
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!templateName.trim()) {
      setError('Template name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const templateData: CreateWOTemplateData = {
        template_name: templateName.trim(),
        description: description.trim() || undefined,
        product_id: productId,
        config_json: workOrderData,
        is_default: isDefault,
      };

      await WOTemplatesAPI.create(templateData);

      // Success - close modal and reset
      setTemplateName('');
      setDescription('');
      setIsDefault(false);
      onClose();

      // Show success message
      alert(`Template "${templateName}" saved successfully!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Save as Template</h2>
          <p className="text-sm text-slate-600 mt-1">
            Save this Work Order configuration as a reusable template
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Product: <span className="font-medium">{productName}</span>
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Standard Chicken Sausage Setup"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description of when to use this template"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Default Template Checkbox */}
          <div className="flex items-start">
            <input
              type="checkbox"
              id="is-default"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="mt-1 mr-2"
            />
            <label htmlFor="is-default" className="text-sm text-slate-700">
              <span className="font-medium">Set as default template</span>
              <p className="text-xs text-slate-500 mt-0.5">
                Auto-suggest this template when creating WOs for this product
              </p>
            </label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Template Preview */}
          <div className="bg-slate-50 border border-slate-200 rounded-md p-3">
            <p className="text-xs font-medium text-slate-700 mb-2">Template will save:</p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• Product: {productName}</li>
              {workOrderData.bom_id && <li>• BOM ID: {workOrderData.bom_id}</li>}
              {workOrderData.line_id && <li>• Line ID: {workOrderData.line_id}</li>}
              {workOrderData.shift && <li>• Shift: {workOrderData.shift}</li>}
              {workOrderData.operations && workOrderData.operations.length > 0 && (
                <li>• Operations: {workOrderData.operations.length} steps</li>
              )}
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
