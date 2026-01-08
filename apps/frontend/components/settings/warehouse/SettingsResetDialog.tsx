/**
 * Settings Reset Confirmation Dialog
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * Confirms reset to default values
 */

'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangleIcon } from 'lucide-react';

interface SettingsResetDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function SettingsResetDialog({ open, onClose, onConfirm }: SettingsResetDialogProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!isConfirmed) return;

    try {
      setIsResetting(true);
      await onConfirm();
      setIsConfirmed(false);
      onClose();
    } catch (err) {
      console.error('Failed to reset settings:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleClose = () => {
    setIsConfirmed(false);
    onClose();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset to Defaults</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to reset all warehouse settings to default values?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Alert variant="destructive">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">This action will:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Restore all 25 settings to factory defaults</li>
                <li>Preserve your organization context</li>
                <li>Log this change in audit trail</li>
                <li>Affect all users in your organization</li>
              </ul>
              <p className="mt-2">Current customizations will be lost.</p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="border rounded-md p-4 bg-muted/50">
          <p className="text-sm font-medium mb-2">Preview of changes:</p>
          <ul className="text-sm space-y-1 text-muted-foreground font-mono">
            <li>• auto_generate_lp_number → true</li>
            <li>• lp_number_prefix → &quot;LP&quot;</li>
            <li>• enable_fifo → true</li>
            <li>• enable_batch_tracking → true</li>
            <li>• (and 21 more settings...)</li>
          </ul>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="confirm-reset"
            checked={isConfirmed}
            onCheckedChange={(checked) => setIsConfirmed(checked as boolean)}
          />
          <Label htmlFor="confirm-reset" className="text-sm cursor-pointer">
            I understand this action cannot be undone
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleClose}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={!isConfirmed || isResetting}
          >
            {isResetting ? 'Resetting...' : 'Reset to Defaults'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
