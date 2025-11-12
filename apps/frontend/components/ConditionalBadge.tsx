'use client';

import React from 'react';
import type { BomItemCondition } from '@/lib/types';

/**
 * EPIC-001 Phase 4: UI Components
 * Conditional Badge Component
 *
 * Visual indicator for conditional BOM items
 * Shows condition type and provides tooltip with details
 */

interface ConditionalBadgeProps {
  condition: BomItemCondition | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export default function ConditionalBadge({
  condition,
  size = 'sm',
  showDetails = true,
}: ConditionalBadgeProps) {
  if (!condition) {
    return null; // Unconditional items don't show badge
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const getRulesSummary = (): string => {
    if (condition.rules.length === 0) return 'No rules';
    if (condition.rules.length === 1) {
      const rule = condition.rules[0];
      return `${rule.field} ${rule.operator} ${rule.value}`;
    }
    return `${condition.rules.length} rules (${condition.type})`;
  };

  const getConditionText = (): string => {
    if (condition.rules.length === 1) {
      const rule = condition.rules[0];

      // Friendly text for common conditions
      if (rule.field === 'order_flags' && rule.operator === 'contains') {
        return String(rule.value);
      }
      if (rule.field === 'customer_id' && rule.operator === 'equals') {
        return `Customer ${rule.value}`;
      }
      if (rule.field === 'order_type' && rule.operator === 'equals') {
        return String(rule.value);
      }
    }

    return `Conditional (${condition.type})`;
  };

  return (
    <div className="inline-flex items-center group relative">
      <span
        className={`
          inline-flex items-center rounded-full font-medium
          bg-amber-100 text-amber-800 border border-amber-300
          ${sizeClasses[size]}
        `}
        title={showDetails ? getRulesSummary() : undefined}
      >
        <svg
          className="w-3 h-3 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        {getConditionText()}
      </span>

      {showDetails && (
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-64">
          <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
            <div className="font-semibold mb-2">Condition Details</div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="font-medium">{condition.type}</span>
              </div>
              <div className="text-gray-400 mt-2 mb-1">Rules:</div>
              {condition.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 rounded px-2 py-1 text-xs"
                >
                  <span className="text-blue-400">{rule.field}</span>{' '}
                  <span className="text-gray-400">{rule.operator}</span>{' '}
                  <span className="text-green-400">
                    {Array.isArray(rule.value)
                      ? rule.value.join(', ')
                      : String(rule.value)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
              This material is included only when conditions are met
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple conditional indicator (just icon)
 */
export function ConditionalIcon() {
  return (
    <svg
      className="w-4 h-4 text-amber-600"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <title>Conditional item</title>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

/**
 * Badge showing condition met/not met status
 */
export function ConditionMetBadge({
  conditionMet,
  isConditional,
}: {
  conditionMet: boolean;
  isConditional: boolean;
}) {
  if (!isConditional) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Standard
      </span>
    );
  }

  if (conditionMet) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        Included
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
      Excluded
    </span>
  );
}
