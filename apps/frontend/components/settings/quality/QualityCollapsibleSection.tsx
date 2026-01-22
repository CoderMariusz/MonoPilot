/**
 * QualityCollapsibleSection Component
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Frontend Implementation
 *
 * Reusable collapsible section wrapper with icon and title.
 * Persists collapse state to localStorage.
 */

'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface QualityCollapsibleSectionProps {
  /** Section title */
  title: string;
  /** Icon component to display in header */
  icon: React.ReactNode;
  /** Whether section is open by default */
  defaultOpen?: boolean;
  /** Key for localStorage persistence (section ID) */
  storageKey: string;
  /** Section content */
  children: React.ReactNode;
  /** Test ID for E2E testing */
  testId?: string;
}

/**
 * localStorage key for collapsed sections
 */
const STORAGE_KEY = 'quality_settings_sections_collapsed';

/**
 * Get collapsed sections from localStorage
 */
function getCollapsedSections(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Update collapsed sections in localStorage
 */
function updateCollapsedSections(sectionId: string, collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getCollapsedSections();
    let updated: string[];
    if (collapsed) {
      updated = current.includes(sectionId) ? current : [...current, sectionId];
    } else {
      updated = current.filter((id) => id !== sectionId);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export function QualityCollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  storageKey,
  children,
  testId,
}: QualityCollapsibleSectionProps) {
  // Initialize from localStorage or default
  const [isOpen, setIsOpen] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen;
    const collapsed = getCollapsedSections();
    return !collapsed.includes(storageKey);
  });

  // Handle toggle
  const handleToggle = (open: boolean) => {
    setIsOpen(open);
    updateCollapsedSections(storageKey, !open);
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={handleToggle}
      className="border rounded-lg"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="flex w-full items-center justify-between p-4 hover:bg-muted/50"
          data-testid={isOpen ? `${testId}-collapse` : `${testId}-expand`}
        >
          <div className="flex items-center gap-3">
            {icon}
            <span className="text-lg font-semibold">{title}</span>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        className={`px-4 pb-4${isOpen ? ' pt-0' : ''}`}
        data-testid={`${testId}-content`}
      >
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
