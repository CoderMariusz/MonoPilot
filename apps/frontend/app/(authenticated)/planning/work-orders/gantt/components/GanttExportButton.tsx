'use client';

/**
 * GanttExportButton Component (Story 03.15)
 * PDF export trigger button
 *
 * Features:
 * - Triggers PDF export
 * - Shows loading state during export
 * - Uses client-side PDF generation (html2canvas + jsPDF) or API
 */

import React, { useState } from 'react';
import { Printer, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { GanttFilters } from '@/lib/types/gantt';

interface GanttExportButtonProps {
  filters: GanttFilters;
  disabled?: boolean;
}

export function GanttExportButton({
  filters,
  disabled,
}: GanttExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);

      // Build export URL
      const params = new URLSearchParams();
      params.append('format', 'pdf');
      if (filters.from_date) params.append('from_date', filters.from_date);
      if (filters.to_date) params.append('to_date', filters.to_date);
      if (filters.view_by) params.append('view_by', filters.view_by);

      const response = await fetch(`/api/planning/work-orders/gantt/export?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Get the blob
      const blob = await response.blob();

      // Generate filename
      const filename = `gantt-schedule-${filters.from_date || 'current'}-to-${filters.to_date || 'current'}.pdf`;

      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Schedule exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export schedule');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting}
          data-testid="export-pdf-btn"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Printer className="h-4 w-4 mr-2" />
          )}
          {isExporting ? 'Exporting...' : 'Print'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF}>
          <Download className="h-4 w-4 mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print...
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default GanttExportButton;
