/**
 * Settings History Modal
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * Displays audit trail of settings changes
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface SettingsHistoryEntry {
  id: string;
  setting_name: string;
  old_value: string;
  new_value: string;
  changed_by: string;
  changed_at: string;
}

interface SettingsHistoryModalProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsHistoryModal({ open, onClose }: SettingsHistoryModalProps) {
  const [history, setHistory] = useState<SettingsHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/warehouse/settings/history?limit=50');
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" data-testid="settings-history-modal">
        <DialogHeader>
          <DialogTitle>Settings Change History</DialogTitle>
          <DialogDescription>
            Last 50 changes to warehouse settings
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-500">Failed to load history: {error}</p>
            <Button onClick={fetchHistory} className="mt-4">Try Again</Button>
          </div>
        )}

        {!isLoading && !error && history.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No change history available yet.
          </div>
        )}

        {!isLoading && !error && history.length > 0 && (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Setting Name</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono text-sm">{entry.setting_name}</TableCell>
                    <TableCell>{entry.old_value}</TableCell>
                    <TableCell>{entry.new_value}</TableCell>
                    <TableCell>{entry.changed_by}</TableCell>
                    <TableCell>{formatDate(entry.changed_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
