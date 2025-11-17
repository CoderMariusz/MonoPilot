'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { Bom } from '@/lib/types';

interface BOMTimelineProps {
  productId: number;
  versions: Bom[];
  onVersionUpdate?: (versionId: number, updates: { effective_from?: string; effective_to?: string | null }) => Promise<void>;
  onVersionSelect?: (versionIds: number[]) => void;
}

type DragEdge = 'start' | 'end' | null;

interface Overlap {
  version1Id: number;
  version2Id: number;
}

const STATUS_COLORS = {
  DRAFT: { bg: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-700' },
  ACTIVE: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
  'PHASED_OUT': { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700' },
  INACTIVE: { bg: 'bg-gray-100', border: 'border-gray-400', text: 'text-gray-600' },
};

export function BOMTimeline({ productId, versions, onVersionUpdate, onVersionSelect }: BOMTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [selectedVersions, setSelectedVersions] = useState<number[]>([]);
  const [dragState, setDragState] = useState<{
    versionId: number;
    edge: DragEdge;
    originalDate: string | null;
    ghostPosition?: number;
  } | null>(null);

  // Calculate timeline range (earliest effective_from to latest effective_to + buffer)
  const timelineRange = useMemo(() => {
    if (versions.length === 0) {
      const today = new Date();
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      const sixMonthsAhead = new Date(today);
      sixMonthsAhead.setMonth(today.getMonth() + 6);
      return { start: sixMonthsAgo, end: sixMonthsAhead };
    }

    const dates = versions.flatMap((v) => {
      const effectiveFrom = new Date(v.effective_from);
      const effectiveTo = v.effective_to ? new Date(v.effective_to) : new Date();
      return [effectiveFrom, effectiveTo];
    });

    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    // Add 1 month buffer on each side
    minDate.setMonth(minDate.getMonth() - 1);
    maxDate.setMonth(maxDate.getMonth() + 1);

    return { start: minDate, end: maxDate };
  }, [versions]);

  // Detect overlaps between version date ranges
  const overlaps = useMemo((): Overlap[] => {
    const detectedOverlaps: Overlap[] = [];
    for (let i = 0; i < versions.length; i++) {
      for (let j = i + 1; j < versions.length; j++) {
        const v1 = versions[i];
        const v2 = versions[j];

        const v1Start = new Date(v1.effective_from).getTime();
        const v1End = v1.effective_to ? new Date(v1.effective_to).getTime() : Infinity;
        const v2Start = new Date(v2.effective_from).getTime();
        const v2End = v2.effective_to ? new Date(v2.effective_to).getTime() : Infinity;

        // Check for overlap: v1 starts before v2 ends AND v2 starts before v1 ends
        if (v1Start <= v2End && v2Start <= v1End) {
          detectedOverlaps.push({ version1Id: v1.id, version2Id: v2.id });
        }
      }
    }
    return detectedOverlaps;
  }, [versions]);

  // Check if a version has overlap
  const hasOverlap = (versionId: number): boolean => {
    return overlaps.some((o) => o.version1Id === versionId || o.version2Id === versionId);
  };

  // Convert date to timeline X position (percentage)
  const dateToPosition = (date: Date): number => {
    const range = timelineRange.end.getTime() - timelineRange.start.getTime();
    const offset = date.getTime() - timelineRange.start.getTime();
    return (offset / range) * 100;
  };

  // Convert timeline X position to date
  const positionToDate = (percentage: number): Date => {
    const range = timelineRange.end.getTime() - timelineRange.start.getTime();
    const offset = (percentage / 100) * range;
    return new Date(timelineRange.start.getTime() + offset);
  };

  // Handle version bar click (selection)
  const handleVersionClick = (versionId: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Click for multi-select
      setSelectedVersions((prev) => {
        const newSelection = prev.includes(versionId)
          ? prev.filter((id) => id !== versionId)
          : prev.length < 2
          ? [...prev, versionId]
          : [prev[1], versionId]; // Keep only last 2 selections

        if (onVersionSelect) {
          onVersionSelect(newSelection);
        }
        return newSelection;
      });
    } else {
      // Single select
      setSelectedVersions([versionId]);
      if (onVersionSelect) {
        onVersionSelect([versionId]);
      }
    }
  };

  // Handle drag start
  const handleDragStart = (versionId: number, edge: DragEdge, event: React.MouseEvent) => {
    event.stopPropagation();
    const version = versions.find((v) => v.id === versionId);
    if (!version) return;

    setDragState({
      versionId,
      edge,
      originalDate: edge === 'start' ? version.effective_from : version.effective_to,
    });
  };

  // Handle drag move
  const handleDragMove = (event: React.MouseEvent) => {
    if (!dragState || !timelineRef.current) return;

    const rect = timelineRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    setDragState((prev) => (prev ? { ...prev, ghostPosition: percentage } : null));
  };

  // Handle drag end
  const handleDragEnd = async (event: React.MouseEvent) => {
    if (!dragState || !timelineRef.current || dragState.ghostPosition === undefined) {
      setDragState(null);
      return;
    }

    const newDate = positionToDate(dragState.ghostPosition);
    const newDateString = newDate.toISOString().split('T')[0];

    const version = versions.find((v) => v.id === dragState.versionId);
    if (!version) {
      setDragState(null);
      return;
    }

    // Validate the new date
    if (dragState.edge === 'start') {
      // effective_from cannot be after effective_to
      if (version.effective_to && newDateString > version.effective_to) {
        alert('Start date cannot be after end date');
        setDragState(null);
        return;
      }

      // Update effective_from
      if (onVersionUpdate) {
        try {
          await onVersionUpdate(dragState.versionId, { effective_from: newDateString });
        } catch (err) {
          alert('Failed to update version date');
        }
      }
    } else if (dragState.edge === 'end') {
      // effective_to cannot be before effective_from
      if (newDateString < version.effective_from) {
        alert('End date cannot be before start date');
        setDragState(null);
        return;
      }

      // Update effective_to
      if (onVersionUpdate) {
        try {
          await onVersionUpdate(dragState.versionId, { effective_to: newDateString });
        } catch (err) {
          alert('Failed to update version date');
        }
      }
    }

    setDragState(null);
  };

  // Format date for display
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Ongoing';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Generate month labels for X-axis
  const monthLabels = useMemo(() => {
    const labels: { date: Date; position: number }[] = [];
    const current = new Date(timelineRange.start);
    current.setDate(1); // Start of month

    while (current <= timelineRange.end) {
      labels.push({
        date: new Date(current),
        position: dateToPosition(new Date(current)),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return labels;
  }, [timelineRange]);

  if (versions.length === 0) {
    return (
      <div className="border border-slate-200 rounded-lg p-8 text-center text-slate-500">
        No BOM versions found for this product.
      </div>
    );
  }

  return (
    <div className="border border-slate-200 rounded-lg p-4 bg-white">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">BOM Version Timeline</h3>
        <p className="text-sm text-slate-600">
          Drag edges to adjust dates. Ctrl+Click to compare versions. Red outline indicates overlap.
        </p>
      </div>

      {/* Timeline container */}
      <div
        ref={timelineRef}
        className="relative"
        onMouseMove={dragState ? handleDragMove : undefined}
        onMouseUp={dragState ? handleDragEnd : undefined}
        onMouseLeave={dragState ? handleDragEnd : undefined}
        style={{ minHeight: `${versions.length * 60 + 60}px` }}
      >
        {/* X-axis (month labels) */}
        <div className="relative h-8 border-b border-slate-300 mb-4">
          {monthLabels.map((label, idx) => (
            <div
              key={idx}
              className="absolute top-0 flex flex-col items-center"
              style={{ left: `${label.position}%`, transform: 'translateX(-50%)' }}
            >
              <div className="text-xs text-slate-600">
                {label.date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </div>
              <div className="w-px h-2 bg-slate-300" />
            </div>
          ))}
        </div>

        {/* Version bars (Y-axis rows) */}
        {versions.map((version, idx) => {
          const startPos = dateToPosition(new Date(version.effective_from));
          const endPos = version.effective_to
            ? dateToPosition(new Date(version.effective_to))
            : dateToPosition(timelineRange.end);
          const width = endPos - startPos;

          const colors = STATUS_COLORS[version.status as keyof typeof STATUS_COLORS] || STATUS_COLORS.DRAFT;
          const isSelected = selectedVersions.includes(version.id);
          const isOverlapping = hasOverlap(version.id);

          return (
            <div
              key={version.id}
              className="relative h-12 mb-2"
              style={{ top: `${idx * 60}px` }}
            >
              {/* Version bar */}
              <div
                className={`absolute h-10 rounded cursor-pointer transition-all ${colors.bg} ${
                  colors.border
                } border-2 ${isOverlapping ? 'border-red-500' : ''} ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                style={{ left: `${startPos}%`, width: `${width}%` }}
                onClick={(e) => handleVersionClick(version.id, e)}
              >
                {/* Version label */}
                <div className="px-2 py-1 text-xs font-medium truncate">
                  <div className={`${colors.text}`}>
                    BOM v{version.version} - {version.status.toUpperCase()}
                  </div>
                  <div className="text-slate-600 text-[10px]">
                    {formatDate(version.effective_from || '')} → {formatDate(version.effective_to || null)}
                  </div>
                </div>

                {/* Overlap warning icon */}
                {isOverlapping && (
                  <div className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                )}

                {/* Drag handles */}
                <div
                  className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleDragStart(version.id, 'start', e)}
                  title="Drag to adjust start date"
                />
                <div
                  className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
                  onMouseDown={(e) => handleDragStart(version.id, 'end', e)}
                  title="Drag to adjust end date"
                />
              </div>

              {/* Ghost bar during drag */}
              {dragState?.versionId === version.id && dragState.ghostPosition !== undefined && (
                <div
                  className="absolute h-10 rounded border-2 border-dashed border-blue-400 bg-blue-50 opacity-50 pointer-events-none"
                  style={{
                    left: dragState.edge === 'start' ? `${dragState.ghostPosition}%` : `${startPos}%`,
                    width:
                      dragState.edge === 'start'
                        ? `${endPos - dragState.ghostPosition}%`
                        : `${dragState.ghostPosition - startPos}%`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Selected versions info */}
      {selectedVersions.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Selected:</span> {selectedVersions.length} version(s)
            {selectedVersions.length === 2 && (
              <span className="ml-2 text-blue-600">
                (Ctrl+Click to deselect or select another version for comparison)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Overlaps warning */}
      {overlaps.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-800">
            <span className="font-bold">Warning:</span> {overlaps.length} version overlap(s) detected. Adjust dates to
            resolve conflicts.
          </p>
        </div>
      )}
    </div>
  );
}
