'use client';

/**
 * Test Results Table Component
 * Story: 06.6 - Test Results Recording
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Table displaying test results with:
 * - Parameter name and critical indicator
 * - Measured value with unit
 * - Specification range
 * - Pass/Fail/Marginal status badges
 * - Deviation percentage for marginal/fail
 * - Tester and timestamp
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.6.test-results-recording.md}
 */

import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import type { TestResult } from '@/lib/validation/quality-test-results-schema';

interface TestResultsTableProps {
  results: TestResult[];
  showInspection?: boolean;
}

export function TestResultsTable({ results, showInspection = false }: TestResultsTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass':
        return (
          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
            Pass
          </Badge>
        );
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
      case 'marginal':
        return (
          <Badge variant="default" className="bg-yellow-500 hover:bg-yellow-600">
            Marginal
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSpecDisplay = (result: TestResult) => {
    const param = result.parameter;
    if (!param) return '-';

    const min = param.min_value;
    const max = param.max_value;
    const target = param.target_value;

    if (min !== null && min !== undefined && max !== null && max !== undefined) {
      return `${min} - ${max}`;
    }
    if (min !== null && min !== undefined) {
      return `Min: ${min}`;
    }
    if (max !== null && max !== undefined) {
      return `Max: ${max}`;
    }
    if (target) {
      return `Target: ${target}`;
    }
    return '-';
  };

  const colSpan = showInspection ? 7 : 6;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Parameter</TableHead>
          <TableHead>Measured Value</TableHead>
          <TableHead>Specification</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Tested By</TableHead>
          <TableHead>Tested At</TableHead>
          {showInspection && <TableHead>Inspection</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.length === 0 ? (
          <TableRow>
            <TableCell colSpan={colSpan} className="text-center text-muted-foreground">
              No test results found
            </TableCell>
          </TableRow>
        ) : (
          results.map((result) => (
            <TableRow key={result.id}>
              <TableCell>
                <div className="font-medium">{result.parameter?.parameter_name || '-'}</div>
                {result.parameter?.is_critical && (
                  <Badge variant="destructive" className="mt-1">
                    Critical
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {result.measured_value}
                {result.parameter?.unit && ` ${result.parameter.unit}`}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {getSpecDisplay(result)}
              </TableCell>
              <TableCell>
                {getStatusBadge(result.result_status)}
                {result.deviation_pct !== null && result.deviation_pct !== undefined && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {result.deviation_pct.toFixed(1)}% from limit
                  </div>
                )}
              </TableCell>
              <TableCell>{result.tester?.name || 'Unknown'}</TableCell>
              <TableCell>{result.tested_at ? formatDate(result.tested_at) : '-'}</TableCell>
              {showInspection && (
                <TableCell>{result.inspection?.inspection_number || '-'}</TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export default TestResultsTable;
