'use client';

import { Lightbulb } from 'lucide-react';

/**
 * NPD Dashboard Page - Kanban Board View
 *
 * Displays NPD pipeline as 5-column Kanban board (G0 → G4)
 * with drag-drop gate advancement, stats bar, and filters.
 *
 * @since Story NPD-1.3
 */
export default function NPDDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lightbulb className="w-8 h-8 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900">NPD Dashboard</h1>
          </div>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            + New Project
          </button>
        </div>

        {/* Placeholder for Kanban Board */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center text-gray-500">
            <Lightbulb className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">NPD Kanban Board</h2>
            <p className="text-gray-600">Kanban board will be implemented in Task 3</p>
            <p className="text-sm text-gray-500 mt-4">
              This page follows the Innovation Light theme (gray-50 background, blue-500 primary)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
