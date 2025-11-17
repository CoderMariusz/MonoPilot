'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { SpreadsheetTable } from '@/components/SpreadsheetTable';
import { getPOColumns, getWOColumns, POSpreadsheetRow, WOSpreadsheetRow } from '@/lib/spreadsheet/columnConfigs';
import { validatePORows, validateWORows, initializeValidationCache } from '@/lib/spreadsheet/batchValidator';
import { createAutoSaveManager } from '@/lib/spreadsheet/autoSave';

export default function SpreadsheetModePage() {
  const [mode, setMode] = useState<'po' | 'wo'>('wo');
  const [poRows, setPORows] = useState<POSpreadsheetRow[]>([]);
  const [woRows, setWORows] = useState<WOSpreadsheetRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showDraftNotification, setShowDraftNotification] = useState(false);
  const [validationSummary, setValidationSummary] = useState<{
    total: number;
    valid: number;
    warnings: number;
    errors: number;
  } | null>(null);

  // Auto-save managers (one per entity type)
  const poAutoSave = useMemo(() => createAutoSaveManager<POSpreadsheetRow>('po'), []);
  const woAutoSave = useMemo(() => createAutoSaveManager<WOSpreadsheetRow>('wo'), []);

  // Load drafts on mount
  useEffect(() => {
    if (draftLoaded) return;

    // Load PO draft
    const poDraft = poAutoSave.loadDraft();
    if (poDraft && poDraft.rows.length > 0) {
      setPORows(poDraft.rows);
      if (mode === 'po') {
        setShowDraftNotification(true);
      }
      console.log(`[AutoSave] Loaded PO draft: ${poDraft.rows.length} rows`);
    }

    // Load WO draft
    const woDraft = woAutoSave.loadDraft();
    if (woDraft && woDraft.rows.length > 0) {
      setWORows(woDraft.rows);
      if (mode === 'wo') {
        setShowDraftNotification(true);
      }
      console.log(`[AutoSave] Loaded WO draft: ${woDraft.rows.length} rows`);
    }

    setDraftLoaded(true);
  }, [draftLoaded, mode, poAutoSave, woAutoSave]);

  // Auto-validate rows when they change
  const handlePORowsChange = useCallback(
    async (
      rows: POSpreadsheetRow[],
      changes: { type: 'add' | 'update' | 'delete' | 'reorder'; indexes?: number[] }
    ) => {
      console.log('PO Rows changed:', changes, rows);
      setPORows(rows);

      // Auto-save draft
      poAutoSave.saveDraft(rows);

      // Run validation (debounced via SpreadsheetTable auto-save)
      if (rows.length > 0 && (changes.type === 'update' || changes.type === 'add')) {
        setIsValidating(true);
        try {
          const result = await validatePORows(rows);
          setPORows(result.rows);
          setValidationSummary(result.summary);

          if (result.duplicates.length > 0) {
            console.warn('Duplicate products found:', result.duplicates);
          }
        } catch (error) {
          console.error('Validation failed:', error);
        } finally {
          setIsValidating(false);
        }
      }
    },
    [poAutoSave]
  );

  const handleWORowsChange = useCallback(
    async (
      rows: WOSpreadsheetRow[],
      changes: { type: 'add' | 'update' | 'delete' | 'reorder'; indexes?: number[] }
    ) => {
      console.log('WO Rows changed:', changes, rows);
      setWORows(rows);

      // Auto-save draft
      woAutoSave.saveDraft(rows);

      // Run validation
      if (rows.length > 0 && (changes.type === 'update' || changes.type === 'add')) {
        setIsValidating(true);
        try {
          const result = await validateWORows(rows);
          setWORows(result.rows);
          setValidationSummary(result.summary);

          if (result.duplicates.length > 0) {
            console.warn('Potential duplicate WOs found:', result.duplicates);
          }
        } catch (error) {
          console.error('Validation failed:', error);
        } finally {
          setIsValidating(false);
        }
      }
    },
    [woAutoSave]
  );

  const handleBatchCreate = async () => {
    if (mode === 'po') {
      await handleBatchCreatePO();
    } else {
      await handleBatchCreateWO();
    }
  };

  const handleBatchCreateWO = async () => {
    if (woRows.length === 0) return;

    // Validate all rows are valid
    if (validationSummary && validationSummary.errors > 0) {
      alert(`Cannot create Work Orders: ${validationSummary.errors} validation errors found`);
      return;
    }

    setIsValidating(true);

    try {
      // Prepare WO data for API
      const workOrders = woRows.map((row) => ({
        product_id: parseInt(row._product_id || '0'),
        quantity: typeof row.quantity === 'string' ? parseFloat(row.quantity) : row.quantity,
        uom: row.uom || 'EA',
        line_id: row._line_id ? parseInt(row._line_id) : undefined,
        scheduled_start: row.scheduled_start || new Date().toISOString(),
        scheduled_end: row.scheduled_end,
        due_date: row.due_date,
        shift: row.shift || 'day',
        priority: row.priority ? parseInt(row.priority.toString()) : row._rowNumber,
        notes: row.notes,
        bom_id: row._bom_id ? parseInt(row._bom_id) : undefined,
      }));

      // Call batch API
      const response = await fetch('/api/work-orders/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrders }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `✅ Successfully created ${result.created} Work Order${result.created !== 1 ? 's' : ''}!\n\n` +
          `Work Orders:\n${result.workOrders?.map((wo: any) => `  • ${wo.number}`).join('\n') || ''}`
        );
        // Clear rows and draft after success
        setWORows([]);
        setValidationSummary(null);
        woAutoSave.clearDraft();
      } else {
        const errorMsg = result.errors?.map((e: any) => `  • Row ${e.index + 1}: ${e.error}`).join('\n') || 'Unknown error';
        alert(
          `❌ Failed to create Work Orders:\n\n${errorMsg}\n\n` +
          (result.rollback ? 'All changes rolled back (atomic transaction)' : '')
        );
      }
    } catch (error) {
      console.error('Batch WO creation error:', error);
      alert(`❌ Error creating Work Orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleBatchCreatePO = async () => {
    if (poRows.length === 0) return;

    // Validate all rows are valid
    if (validationSummary && validationSummary.errors > 0) {
      alert(`Cannot create Purchase Orders: ${validationSummary.errors} validation errors found`);
      return;
    }

    // Prompt for warehouse selection
    const warehouseId = prompt('Enter destination warehouse ID:');
    if (!warehouseId) {
      alert('Warehouse ID is required');
      return;
    }

    setIsValidating(true);

    try {
      // Prepare PO data for API
      const purchaseOrders = poRows.map((row) => ({
        product_id: parseInt(row._product_id || '0'),
        quantity: typeof row.quantity === 'string' ? parseFloat(row.quantity) : row.quantity,
        unit_price: row.unit_price ? (typeof row.unit_price === 'string' ? parseFloat(row.unit_price) : row.unit_price) : undefined,
        currency: row.currency || 'USD',
        requested_delivery_date: row.requested_delivery_date,
        notes: row.notes,
      }));

      // Call batch API
      const response = await fetch('/api/purchase-orders/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrders,
          warehouse_id: parseInt(warehouseId),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(
          `✅ Successfully created ${result.created} Purchase Order${result.created !== 1 ? 's' : ''}!\n\n` +
          `Total Lines: ${result.totalLines}\n\n` +
          `Purchase Orders:\n${result.purchaseOrders?.map((po: any) => `  • ${po.number} (${po.supplier_name}, ${po.lineCount} lines)`).join('\n') || ''}`
        );
        // Clear rows and draft after success
        setPORows([]);
        setValidationSummary(null);
        poAutoSave.clearDraft();
      } else {
        const errorMsg = result.errors?.map((e: any) => `  • ${e.index >= 0 ? `Row ${e.index + 1}` : 'General'}: ${e.error}`).join('\n') || 'Unknown error';
        alert(
          `❌ Failed to create Purchase Orders:\n\n${errorMsg}\n\n` +
          (result.rollback ? 'All changes rolled back (atomic transaction)' : '')
        );
      }
    } catch (error) {
      console.error('Batch PO creation error:', error);
      alert(`❌ Error creating Purchase Orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Spreadsheet Mode - Bulk Entry
          </h1>
          <p className="text-gray-600">
            Excel-like bulk creation for Purchase Orders and Work Orders. Paste from Excel, drag to reorder, edit inline.
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-6 flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <label className="text-sm font-medium text-gray-700">Entity Type:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('wo')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'wo'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Work Orders
            </button>
            <button
              type="button"
              onClick={() => setMode('po')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'po'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Purchase Orders
            </button>
          </div>
        </div>

        {/* Draft Recovery Notification */}
        {showDraftNotification && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Draft Recovered</h3>
                <p className="text-sm text-blue-700">
                  Your previous session has been restored. You can continue editing or clear the draft to start fresh.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowDraftNotification(false)}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              aria-label="Close notification"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Spreadsheet Table */}
        {mode === 'wo' ? (
          <SpreadsheetTable<WOSpreadsheetRow>
            entityType="wo"
            columns={getWOColumns()}
            rows={woRows}
            onRowsChange={handleWORowsChange}
            enableDragDrop
            enablePaste
            maxRows={100}
            className="shadow-lg"
          />
        ) : (
          <SpreadsheetTable<POSpreadsheetRow>
            entityType="po"
            columns={getPOColumns()}
            rows={poRows}
            onRowsChange={handlePORowsChange}
            enableDragDrop
            enablePaste
            maxRows={100}
            className="shadow-lg"
          />
        )}

        {/* Validation Summary */}
        {validationSummary && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Validation Summary</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl font-bold text-gray-900">{validationSummary.total}</div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">{validationSummary.valid}</div>
                <div className="text-sm text-green-700">Valid</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded">
                <div className="text-2xl font-bold text-yellow-600">{validationSummary.warnings}</div>
                <div className="text-sm text-yellow-700">Warnings</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded">
                <div className="text-2xl font-bold text-red-600">{validationSummary.errors}</div>
                <div className="text-sm text-red-700">Errors</div>
              </div>
            </div>
            {isValidating && (
              <div className="mt-3 text-sm text-blue-600 flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                Validating rows...
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => {
                if (mode === 'wo') {
                  setWORows([]);
                  woAutoSave.clearDraft();
                } else {
                  setPORows([]);
                  poAutoSave.clearDraft();
                }
                setValidationSummary(null);
                setShowDraftNotification(false);
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
            <span className="text-sm text-gray-600">
              {mode === 'wo' ? woRows.length : poRows.length} rows
              {validationSummary && (
                <span className="ml-2">
                  (✓ {validationSummary.valid} | ⚠️ {validationSummary.warnings} | ❌ {validationSummary.errors})
                </span>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={handleBatchCreate}
            disabled={
              (mode === 'wo' ? woRows.length : poRows.length) === 0 ||
              (validationSummary?.errors || 0) > 0
            }
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Create {mode === 'wo' ? woRows.length : poRows.length} {mode === 'wo' ? 'Work Order' : 'Purchase Order'}
            {(mode === 'wo' ? woRows.length : poRows.length) !== 1 ? 's' : ''}
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Add Row:</strong> Click "Add Row" button to add empty row</li>
            <li>• <strong>Paste from Excel:</strong> Copy data from Excel (Ctrl+C), click on grid, paste (Ctrl+V)</li>
            <li>• <strong>Edit Cell:</strong> Click cell to edit, press Tab/Shift+Tab to navigate, Enter to confirm</li>
            <li>• <strong>Reorder Rows:</strong> Drag ⋮⋮ handle to reorder (priority = row order)</li>
            <li>• <strong>Delete Row:</strong> Click 🗑️ trash icon</li>
            <li>• <strong>Create Batch:</strong> Click "Create X Orders" to submit all rows</li>
          </ul>
        </div>

        {/* Sample Data */}
        <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Sample Data to Paste (Copy &amp; Ctrl+V on grid)</h3>
          {mode === 'wo' ? (
            <pre className="text-xs bg-white p-3 rounded border border-gray-300 overflow-x-auto">
{`Product Code	Quantity	Scheduled Start	Due Date	Shift	Notes
PROD-001	100	2025-11-20T08:00	2025-11-20	day	Urgent - High priority
PROD-002	200	2025-11-20T10:00	2025-11-21	day	Standard production
PROD-003	150	2025-11-20T14:00	2025-11-22	day	Low priority`}
            </pre>
          ) : (
            <pre className="text-xs bg-white p-3 rounded border border-gray-300 overflow-x-auto">
{`Product Code	Quantity	Unit Price	Currency	Delivery Date	Notes
PROD-001	500	12.50	USD	2025-12-01	Bulk order
PROD-002	300	8.75	USD	2025-12-05	Restock
PROD-003	1000	5.25	USD	2025-12-10	Annual contract`}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
