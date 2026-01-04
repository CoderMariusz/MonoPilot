/**
 * Phase 2: Scanner & Labels Settings
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * Contains 4 settings organized into 2 subsections
 */

'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { WarehouseSettings } from '@/lib/validation/warehouse-settings';

interface Phase2ScannerSettingsProps {
  settings: Partial<WarehouseSettings>;
  onChange: (field: keyof WarehouseSettings, value: any) => void;
  isReadOnly?: boolean;
  errors?: Record<string, string>;
}

export function Phase2ScannerSettings({ settings, onChange, isReadOnly = false, errors = {} }: Phase2ScannerSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Scanner Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Scanner Settings
        </h3>

        <div className="space-y-2">
          <Label htmlFor="scanner_idle_timeout_sec">Scanner Idle Timeout</Label>
          <Input
            id="scanner_idle_timeout_sec"
            data-testid="scanner_idle_timeout_sec"
            type="number"
            value={settings.scanner_idle_timeout_sec ?? 300}
            onChange={(e) => onChange('scanner_idle_timeout_sec', Number(e.target.value))}
            disabled={isReadOnly}
            min={60}
            max={3600}
            className={errors.scanner_idle_timeout_sec ? 'border-red-500' : ''}
            aria-invalid={!!errors.scanner_idle_timeout_sec}
            aria-describedby={errors.scanner_idle_timeout_sec ? 'scanner_idle_timeout_sec-error' : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Scanner session timeout after inactivity ({Math.floor((settings.scanner_idle_timeout_sec ?? 300) / 60)} minutes, 60-3600 seconds)
          </p>
          {errors.scanner_idle_timeout_sec && (
            <p id="scanner_idle_timeout_sec-error" className="text-sm text-red-500" role="alert">
              ⚠ {errors.scanner_idle_timeout_sec}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="scanner_sound_feedback">Scanner Sound Feedback</Label>
            <p className="text-sm text-muted-foreground">
              Play audio feedback on scan success/failure
            </p>
          </div>
          <Switch
            id="scanner_sound_feedback"
            data-testid="scanner_sound_feedback"
            checked={settings.scanner_sound_feedback ?? true}
            onCheckedChange={(checked) => onChange('scanner_sound_feedback', checked)}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Label Printing */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Label Printing
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="print_label_on_receipt">Print Label on Receipt</Label>
            <p className="text-sm text-muted-foreground">
              Automatically print LP label after GRN completion
            </p>
          </div>
          <Switch
            id="print_label_on_receipt"
            data-testid="print_label_on_receipt"
            checked={settings.print_label_on_receipt ?? true}
            onCheckedChange={(checked) => onChange('print_label_on_receipt', checked)}
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="label_copies_default">Default Label Copies</Label>
          <Input
            id="label_copies_default"
            data-testid="label_copies_default"
            type="number"
            value={settings.label_copies_default ?? 1}
            onChange={(e) => onChange('label_copies_default', Number(e.target.value))}
            disabled={isReadOnly || !settings.print_label_on_receipt}
            min={1}
            max={10}
            className={errors.label_copies_default ? 'border-red-500' : ''}
            aria-invalid={!!errors.label_copies_default}
            aria-describedby={errors.label_copies_default ? 'label_copies_default-error' : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Number of label copies per LP (1-10)
          </p>
          {errors.label_copies_default && (
            <p id="label_copies_default-error" className="text-sm text-red-500" role="alert">
              ⚠ {errors.label_copies_default}
            </p>
          )}
          {!settings.print_label_on_receipt && (
            <p className="text-sm text-yellow-600">Manual printing required</p>
          )}
        </div>
      </div>
    </div>
  );
}
