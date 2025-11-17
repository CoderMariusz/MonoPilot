'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import DataGrid, {
  Column,
  RenderCellProps,
  RenderEditCellProps,
} from 'react-data-grid';
import {
  GripVertical,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { produce } from 'immer';
import Papa from 'papaparse';
import { parsePastedData } from '@/lib/spreadsheet/pasteHandler';
import 'react-data-grid/lib/styles.css';

// ============================================================================
// Types
// ============================================================================

export type EntityType = 'po' | 'wo';

export type ValidationStatus = 'valid' | 'warning' | 'error' | 'pending';

export interface SpreadsheetRow {
  id: string;
  _rowNumber: number;
  _validationStatus: ValidationStatus;
  _validationMessage?: string;
  _isDirty: boolean;
  [key: string]: any; // Allow dynamic fields based on entity type
}

export interface ColumnConfig<T extends SpreadsheetRow> {
  key: keyof T | string;
  name: string;
  width?: number | string;
  editable?: boolean;
  required?: boolean;
  type?: 'text' | 'number' | 'date' | 'datetime' | 'select';
  options?: Array<{ value: string; label: string }>;
  validator?: (value: any, row: T) => { isValid: boolean; message?: string };
  formatter?: (value: any, row: T) => string;
}

interface SpreadsheetTableProps<T extends SpreadsheetRow> {
  entityType: EntityType;
  columns: ColumnConfig<T>[];
  rows: T[];
  onRowsChange: (
    rows: T[],
    changes: {
      type: 'add' | 'update' | 'delete' | 'reorder';
      indexes?: number[];
    }
  ) => void;
  onPaste?: (data: string[][]) => void;
  onBatchValidate?: (rows: T[]) => Promise<T[]>;
  autoSaveDelay?: number; // ms, default 500
  enableDragDrop?: boolean;
  enablePaste?: boolean;
  maxRows?: number;
  className?: string;
}

// ============================================================================
// Sub-Components
// ============================================================================

function DragHandle({
  rowIdx,
  onDragStart,
  onDrop,
}: {
  rowIdx: number;
  onDragStart: (e: React.DragEvent, rowIdx: number) => void;
  onDrop: (e: React.DragEvent, rowIdx: number) => void;
}) {
  return (
    <div
      draggable
      onDragStart={e => onDragStart(e, rowIdx)}
      onDragOver={e => e.preventDefault()}
      onDrop={e => onDrop(e, rowIdx)}
      className="cursor-grab active:cursor-grabbing px-2 py-1 text-gray-400 hover:text-gray-600 flex items-center justify-center h-full"
      title="Drag to reorder"
    >
      <GripVertical size={16} />
    </div>
  );
}

function ValidationIcon({ status }: { status: ValidationStatus }) {
  switch (status) {
    case 'valid':
      return <CheckCircle size={16} className="text-green-600" />;
    case 'warning':
      return <AlertCircle size={16} className="text-yellow-600" />;
    case 'error':
      return <XCircle size={16} className="text-red-600" />;
    case 'pending':
      return (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
      );
    default:
      return null;
  }
}

function RowNumberCell({
  rowIdx,
  status,
}: {
  rowIdx: number;
  status: ValidationStatus;
}) {
  return (
    <div className="flex items-center gap-2 px-2">
      <span className="text-sm text-gray-500">{rowIdx + 1}</span>
      <ValidationIcon status={status} />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SpreadsheetTable<T extends SpreadsheetRow>({
  entityType,
  columns,
  rows,
  onRowsChange,
  onPaste,
  autoSaveDelay = 500,
  enableDragDrop = true,
  enablePaste = true,
  maxRows = 100,
  className = '',
}: SpreadsheetTableProps<T>) {
  const [localRows, setLocalRows] = useState<T[]>(rows);
  const [draggedRow, setDraggedRow] = useState<number | null>(null);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Sync external rows to local state
  useEffect(() => {
    setLocalRows(rows);
  }, [rows]);

  // ============================================================================
  // Row Operations
  // ============================================================================

  const addRow = useCallback(() => {
    if (localRows.length >= maxRows) {
      alert(`Maximum ${maxRows} rows allowed`);
      return;
    }

    const newRow: T = {
      id: `row-${Date.now()}`,
      _rowNumber: localRows.length + 1,
      _validationStatus: 'pending',
      _isDirty: true,
    } as T;

    // Initialize fields based on column config
    columns.forEach(col => {
      if (typeof col.key === 'string' && !col.key.startsWith('_')) {
        (newRow as any)[col.key] = '';
      }
    });

    const updatedRows = [...localRows, newRow];
    setLocalRows(updatedRows);
    onRowsChange(updatedRows, { type: 'add' });
  }, [localRows, columns, maxRows, onRowsChange]);

  const deleteRow = useCallback(
    (rowIdx: number) => {
      const updatedRows = localRows.filter((_, idx) => idx !== rowIdx);
      // Recalculate row numbers
      const renumbered = updatedRows.map((row, idx) => ({
        ...row,
        _rowNumber: idx + 1,
      }));
      setLocalRows(renumbered);
      onRowsChange(renumbered, { type: 'delete', indexes: [rowIdx] });
    },
    [localRows, onRowsChange]
  );

  const updateRows = useCallback(
    (updatedRows: T[]) => {
      setLocalRows(updatedRows);

      // Debounced auto-save
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        onRowsChange(updatedRows, { type: 'update' });
      }, autoSaveDelay);
    },
    [onRowsChange, autoSaveDelay]
  );

  // ============================================================================
  // Drag & Drop
  // ============================================================================

  const handleDragStart = useCallback((e: React.DragEvent, rowIdx: number) => {
    setDraggedRow(rowIdx);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIdx: number) => {
      e.preventDefault();
      if (draggedRow === null || draggedRow === dropIdx) return;

      const updatedRows = produce(localRows, draft => {
        const [movedRow] = draft.splice(draggedRow, 1);
        draft.splice(dropIdx, 0, movedRow);

        // Recalculate row numbers
        draft.forEach((row, idx) => {
          row._rowNumber = idx + 1;
        });
      });

      setLocalRows(updatedRows);
      onRowsChange(updatedRows, {
        type: 'reorder',
        indexes: [draggedRow, dropIdx],
      });
      setDraggedRow(null);
    },
    [draggedRow, localRows, onRowsChange]
  );

  // ============================================================================
  // Paste Handler
  // ============================================================================

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      if (!enablePaste) return;

      const pastedText = e.clipboardData.getData('text');
      if (!pastedText) return;

      e.preventDefault();

      // Parse TSV (Tab-Separated Values from Excel)
      const parsed = Papa.parse<string[]>(pastedText, {
        delimiter: '\t',
        skipEmptyLines: true,
      });

      if (parsed.data.length === 0) {
        alert('No data found in clipboard');
        return;
      }

      // Auto-detect if first row is header
      const hasHeaderRow = detectHeaderRow(parsed.data[0], columns);

      // Parse pasted data into rows
      const result = parsePastedData<T>(parsed.data, columns, {
        hasHeaderRow,
        startRowNumber: localRows.length + 1,
      });

      if (result.errors.length > 0) {
        const confirmPaste = confirm(
          `Found ${result.errors.length} errors in pasted data:\n${result.errors.slice(0, 3).join('\n')}${
            result.errors.length > 3 ? '\n...' : ''
          }\n\nContinue anyway?`
        );
        if (!confirmPaste) return;
      }

      // Append pasted rows to existing rows
      if (result.rows.length > 0) {
        const updatedRows = [...localRows, ...result.rows];
        setLocalRows(updatedRows);
        onRowsChange(updatedRows, { type: 'add' });

        // Show success message
        alert(
          `✓ Pasted ${result.rows.length} rows from Excel\n${
            result.warnings.length > 0
              ? `\nWarnings:\n${result.warnings.join('\n')}`
              : ''
          }`
        );
      }

      // Call custom onPaste handler if provided
      if (onPaste) {
        onPaste(parsed.data);
      }
    },
    [enablePaste, columns, localRows, onRowsChange, onPaste]
  );

  /**
   * Detect if first row is a header row
   * Heuristic: If first row contains mostly text and subsequent rows contain numbers,
   * it's likely a header
   */
  function detectHeaderRow(
    firstRow: string[],
    columns: ColumnConfig<T>[]
  ): boolean {
    if (firstRow.length === 0) return false;

    // Check if first row matches column names (case-insensitive)
    const editableColumns = columns.filter(
      col => col.editable !== false && !String(col.key).startsWith('_')
    );

    const matchCount = firstRow.filter((cell, idx) => {
      if (idx >= editableColumns.length) return false;
      const colName = editableColumns[idx].name.toLowerCase();
      const cellLower = cell.trim().toLowerCase();
      return (
        colName.includes(cellLower) ||
        cellLower.includes(colName.replace(' *', ''))
      );
    }).length;

    // If > 50% of cells match column names, it's likely a header
    return matchCount > firstRow.length / 2;
  }

  // ============================================================================
  // Column Definitions for DataGrid
  // ============================================================================

  const gridColumns = useCallback((): Column<T>[] => {
    const cols: Column<T>[] = [];

    // Drag handle column
    if (enableDragDrop) {
      cols.push({
        key: '_drag',
        name: '',
        width: 40,
        frozen: true,
        renderCell: ({ rowIdx }) => (
          <DragHandle
            rowIdx={rowIdx}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        ),
      } as Column<T>);
    }

    // Row number + validation status column
    cols.push({
      key: '_rowNumber',
      name: '#',
      width: 70,
      frozen: true,
      renderCell: ({ row, rowIdx }) => (
        <RowNumberCell rowIdx={rowIdx} status={row._validationStatus} />
      ),
    } as Column<T>);

    // Data columns
    columns.forEach(col => {
      cols.push({
        key: col.key as string,
        name: col.name + (col.required ? ' *' : ''),
        width: typeof col.width === 'number' ? col.width : undefined,
        editable: col.editable !== false,
        renderCell: (props: RenderCellProps<T>) => {
          const value = props.row[col.key];
          const displayValue = col.formatter
            ? col.formatter(value, props.row)
            : (value?.toString() ?? '');

          return (
            <div className="px-2 py-1 h-full flex items-center">
              {displayValue}
            </div>
          );
        },
        renderEditCell: (props: RenderEditCellProps<T>) => {
          const value = props.row[col.key];

          if (col.type === 'select' && col.options) {
            return (
              <select
                autoFocus
                className="w-full h-full px-2 border-2 border-blue-500 focus:outline-none"
                value={value?.toString() ?? ''}
                onChange={e => {
                  props.onRowChange(
                    { ...props.row, [col.key]: e.target.value },
                    true
                  );
                }}
                onBlur={() => props.onClose(true)}
              >
                <option value="">Select...</option>
                {col.options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            );
          }

          const inputType =
            col.type === 'number'
              ? 'number'
              : col.type === 'date'
                ? 'date'
                : col.type === 'datetime'
                  ? 'datetime-local'
                  : 'text';

          return (
            <input
              autoFocus
              type={inputType}
              className="w-full h-full px-2 border-2 border-blue-500 focus:outline-none"
              value={value?.toString() ?? ''}
              onChange={e => {
                props.onRowChange(
                  { ...props.row, [col.key]: e.target.value },
                  true
                );
              }}
              onBlur={() => props.onClose(true)}
            />
          );
        },
      } as Column<T>);
    });

    // Actions column
    cols.push({
      key: '_actions',
      name: 'Actions',
      width: 80,
      renderCell: ({ rowIdx }) => (
        <div className="flex items-center gap-1 px-2">
          <button
            type="button"
            onClick={() => deleteRow(rowIdx)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete row"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    } as Column<T>);

    return cols;
  }, [columns, enableDragDrop, handleDragStart, handleDrop, deleteRow]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`spreadsheet-table ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {entityType === 'po' ? 'Purchase Orders' : 'Work Orders'} Bulk Entry
          </h3>
          <span className="text-sm text-gray-600">
            {localRows.length} / {maxRows} rows
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={addRow}
            disabled={localRows.length >= maxRows}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={16} />
            Add Row
          </button>
        </div>
      </div>

      {/* Data Grid */}
      <div
        ref={gridRef}
        className="rdg-light border border-gray-300 rounded-lg overflow-hidden"
        onPaste={handlePaste}
        tabIndex={0}
      >
        <DataGrid
          columns={gridColumns()}
          rows={localRows}
          onRowsChange={updateRows}
          rowKeyGetter={row => row.id}
          className="fill-grid"
          style={{ height: '600px' }}
          rowHeight={40}
          headerRowHeight={44}
        />
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Keyboard Shortcuts:</strong> Tab/Shift+Tab = Navigate cells,
          Enter = Edit cell, Esc = Cancel edit
          {enablePaste && ', Ctrl+V = Paste from Excel'}
          {enableDragDrop && ', Drag ⋮⋮ icon = Reorder rows'}
        </p>
      </div>
    </div>
  );
}
