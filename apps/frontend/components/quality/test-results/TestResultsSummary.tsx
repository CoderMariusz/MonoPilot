'use client';

/**
 * Test Results Summary Component
 * Story: 06.6 - Test Results Recording
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Displays summary statistics for test results:
 * - Total tests count
 * - Pass/Fail/Marginal counts with color coding
 * - Pass rate progress bar
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.6.test-results-recording.md}
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { InspectionSummary } from '@/lib/validation/quality-test-results-schema';

interface TestResultsSummaryProps {
  summary: InspectionSummary;
}

export function TestResultsSummary({ summary }: TestResultsSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Test Results Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{summary.total}</div>
            <div className="text-sm text-muted-foreground">Total Tests</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{summary.pass}</div>
            <div className="text-sm text-muted-foreground">Passed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{summary.fail}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{summary.marginal}</div>
            <div className="text-sm text-muted-foreground">Marginal</div>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span>Pass Rate</span>
            <span className="font-medium">{summary.pass_rate.toFixed(1)}%</span>
          </div>
          <Progress value={summary.pass_rate} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}

export default TestResultsSummary;
