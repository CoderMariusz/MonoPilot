'use client';

/**
 * GanttErrorState Component (Story 03.15)
 * Error state on API failure
 *
 * Features:
 * - Error icon
 * - "Failed to Load Schedule View" message
 * - Retry button
 * - Switch to List View link
 */

import React from 'react';
import { AlertCircle, RefreshCw, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface GanttErrorStateProps {
  onRetry: () => void;
  errorMessage?: string;
}

export function GanttErrorState({
  onRetry,
  errorMessage,
}: GanttErrorStateProps) {
  return (
    <div
      data-testid="error-state"
      className="flex flex-col items-center justify-center min-h-[400px] bg-red-50 rounded-lg border border-red-200 p-8"
    >
      {/* Icon */}
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Failed to Load Schedule View
      </h3>

      {/* Description */}
      <p className="text-gray-600 text-center max-w-md mb-2">
        Unable to retrieve work order scheduling data.
        Please check your connection and try again.
      </p>

      {/* Error code (if provided) */}
      {errorMessage && (
        <p className="text-sm text-gray-500 mb-6 font-mono bg-gray-100 px-3 py-1 rounded">
          Error: {errorMessage}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Button onClick={onRetry} data-testid="retry-button">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>

        <Link href="/planning/work-orders">
          <Button
            variant="ghost"
            className="text-blue-600"
            data-testid="switch-to-list-view"
          >
            <List className="w-4 h-4 mr-2" />
            Switch to List View
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default GanttErrorState;
