/**
 * Phase 0: Core Configuration Settings
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * Contains 14 settings organized into 6 subsections
 */

'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon, AlertTriangleIcon } from 'lucide-react';
import { WarehouseSettings } from '@/lib/validation/warehouse-settings';

interface Phase0CoreSettingsProps {
  settings: Partial<WarehouseSettings>;
  onChange: (field: keyof WarehouseSettings, value: any) => void;
  isReadOnly?: boolean;
  errors?: Record<string, string>;
}

export function Phase0CoreSettings({ settings, onChange, isReadOnly = false, errors = {} }: Phase0CoreSettingsProps) {
  // Generate LP preview
  const generateLpPreview = () => {
    if (!settings.auto_generate_lp_number || !settings.lp_number_prefix) {
      return '[Error - No prefix]';
    }
    const zeros = '0'.repeat(settings.lp_number_sequence_length || 8);
    return `${settings.lp_number_prefix}-${zeros}1`;
  };

  return (
    <div className="space-y-6">
      {/* License Plate Configuration */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          License Plate Configuration
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="auto_generate_lp_number">Auto-Generate LP Numbers</Label>
            <p className="text-sm text-muted-foreground">
              Automatically generate LP numbers on receipt
            </p>
          </div>
          <Switch
            id="auto_generate_lp_number"
            data-testid="auto_generate_lp_number"
            checked={settings.auto_generate_lp_number ?? true}
            onCheckedChange={(checked) => onChange('auto_generate_lp_number', checked)}
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lp_number_prefix">LP Number Prefix</Label>
          <Input
            id="lp_number_prefix"
            data-testid="lp_number_prefix"
            value={settings.lp_number_prefix ?? 'LP'}
            onChange={(e) => onChange('lp_number_prefix', e.target.value.toUpperCase())}
            disabled={isReadOnly || !settings.auto_generate_lp_number}
            placeholder="LP-"
            className={errors.lp_number_prefix ? 'border-red-500' : ''}
            aria-invalid={!!errors.lp_number_prefix}
            aria-describedby={errors.lp_number_prefix ? 'lp_number_prefix-error' : undefined}
          />
          <p className="text-xs text-muted-foreground">Uppercase alphanumeric + hyphens</p>
          {errors.lp_number_prefix && (
            <p id="lp_number_prefix-error" className="text-sm text-red-500" role="alert">
              ⚠ {errors.lp_number_prefix}
            </p>
          )}
          {!settings.auto_generate_lp_number && (
            <p className="text-sm text-yellow-600">⚠ Manual LP entry required on receipt</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="lp_number_sequence_length">LP Sequence Length</Label>
          <div className="flex items-center gap-4">
            <Slider
              id="lp_number_sequence_length"
              data-testid="lp_number_sequence_length"
              value={settings.lp_number_sequence_length ?? 8}
              onChange={(value) => onChange('lp_number_sequence_length', value)}
              min={4}
              max={12}
              step={1}
              disabled={isReadOnly || !settings.auto_generate_lp_number}
              className="flex-1"
            />
            <span className="text-sm font-medium w-16">{settings.lp_number_sequence_length ?? 8} digits</span>
          </div>
          <p className="text-sm text-muted-foreground">Preview: {generateLpPreview()}</p>
        </div>
      </div>

      {/* Pick Strategy */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Pick Strategy
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_fifo">Enable FIFO (First In, First Out)</Label>
            <p className="text-sm text-muted-foreground">
              Suggest oldest LPs for picking based on receipt date
            </p>
          </div>
          <Switch
            id="enable_fifo"
            data-testid="enable_fifo"
            checked={settings.enable_fifo ?? true}
            onCheckedChange={(checked) => onChange('enable_fifo', checked)}
            disabled={isReadOnly}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_fefo">Enable FEFO (First Expired, First Out)</Label>
            <p className="text-sm text-muted-foreground">
              Suggest LPs by expiry date (overrides FIFO if both enabled)
            </p>
          </div>
          <Switch
            id="enable_fefo"
            data-testid="enable_fefo"
            checked={settings.enable_fefo ?? false}
            onCheckedChange={(checked) => onChange('enable_fefo', checked)}
            disabled={isReadOnly}
          />
        </div>

        {settings.enable_fifo && settings.enable_fefo && (
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              FEFO takes precedence when both are enabled. Sort order: expiry_date ASC, then created_at ASC
            </AlertDescription>
          </Alert>
        )}

        {!settings.enable_fifo && !settings.enable_fefo && (
          <Alert variant="destructive">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              Warning: No pick enforcement enabled. Users can select any LP without system suggestions.
              This may impact inventory rotation and compliance.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Batch Tracking */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Batch Tracking
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_batch_tracking">Enable Batch Tracking</Label>
            <p className="text-sm text-muted-foreground">
              Track batch/lot numbers for inventory items
            </p>
          </div>
          <Switch
            id="enable_batch_tracking"
            data-testid="enable_batch_tracking"
            checked={settings.enable_batch_tracking ?? true}
            onCheckedChange={(checked) => onChange('enable_batch_tracking', checked)}
            disabled={isReadOnly}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="require_batch_on_receipt">Require Batch on Receipt</Label>
            <p className="text-sm text-muted-foreground">
              Block receipts without batch number
            </p>
            {!settings.enable_batch_tracking && (
              <p className="text-sm text-yellow-600">ⓘ Enable batch tracking first</p>
            )}
          </div>
          <Switch
            id="require_batch_on_receipt"
            data-testid="require_batch_on_receipt"
            checked={settings.require_batch_on_receipt ?? false}
            onCheckedChange={(checked) => onChange('require_batch_on_receipt', checked)}
            disabled={isReadOnly || !settings.enable_batch_tracking}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_supplier_batch">Enable Supplier Batch</Label>
            <p className="text-sm text-muted-foreground">
              Track separate supplier batch number
            </p>
            {!settings.enable_batch_tracking && (
              <p className="text-sm text-yellow-600">ⓘ Enable batch tracking first</p>
            )}
          </div>
          <Switch
            id="enable_supplier_batch"
            data-testid="enable_supplier_batch"
            checked={settings.enable_supplier_batch ?? true}
            onCheckedChange={(checked) => onChange('enable_supplier_batch', checked)}
            disabled={isReadOnly || !settings.enable_batch_tracking}
          />
        </div>
      </div>

      {/* Expiry Tracking */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Expiry Tracking
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_expiry_tracking">Enable Expiry Tracking</Label>
            <p className="text-sm text-muted-foreground">
              Track expiration dates for inventory items
            </p>
          </div>
          <Switch
            id="enable_expiry_tracking"
            data-testid="enable_expiry_tracking"
            checked={settings.enable_expiry_tracking ?? true}
            onCheckedChange={(checked) => onChange('enable_expiry_tracking', checked)}
            disabled={isReadOnly}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="require_expiry_on_receipt">Require Expiry on Receipt</Label>
            <p className="text-sm text-muted-foreground">
              Block receipts without expiry date
            </p>
            {!settings.enable_expiry_tracking && (
              <p className="text-sm text-yellow-600">ⓘ Enable expiry tracking first</p>
            )}
          </div>
          <Switch
            id="require_expiry_on_receipt"
            data-testid="require_expiry_on_receipt"
            checked={settings.require_expiry_on_receipt ?? false}
            onCheckedChange={(checked) => onChange('require_expiry_on_receipt', checked)}
            disabled={isReadOnly || !settings.enable_expiry_tracking}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expiry_warning_days">Expiry Warning Days</Label>
          <Input
            id="expiry_warning_days"
            data-testid="expiry_warning_days"
            type="number"
            value={settings.expiry_warning_days ?? 30}
            onChange={(e) => onChange('expiry_warning_days', Number(e.target.value))}
            disabled={isReadOnly || !settings.enable_expiry_tracking}
            min={1}
            max={365}
            className={errors.expiry_warning_days ? 'border-red-500' : ''}
            aria-invalid={!!errors.expiry_warning_days}
            aria-describedby={errors.expiry_warning_days ? 'expiry_warning_days-error' : undefined}
          />
          <p className="text-xs text-muted-foreground">
            LPs expiring within this period show yellow warning (1-365 days)
          </p>
          {errors.expiry_warning_days && (
            <p id="expiry_warning_days-error" className="text-sm text-red-500" role="alert">
              ⚠ {errors.expiry_warning_days}
            </p>
          )}
        </div>
      </div>

      {/* Quality Assurance */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Quality Assurance
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="require_qa_on_receipt">Require QA on Receipt</Label>
            <p className="text-sm text-muted-foreground">
              Require QA approval before LP consumption
            </p>
          </div>
          <Switch
            id="require_qa_on_receipt"
            data-testid="require_qa_on_receipt"
            checked={settings.require_qa_on_receipt ?? true}
            onCheckedChange={(checked) => onChange('require_qa_on_receipt', checked)}
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="default_qa_status">Default QA Status</Label>
          <Select
            value={settings.default_qa_status ?? 'pending'}
            onValueChange={(value) => onChange('default_qa_status', value)}
            disabled={isReadOnly || !settings.require_qa_on_receipt}
          >
            <SelectTrigger id="default_qa_status" data-testid="default_qa_status">
              <SelectValue placeholder="Select default QA status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="quarantine">Quarantine</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Initial QA status for new LPs</p>
        </div>
      </div>

      {/* License Plate Operations */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          License Plate Operations
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_split_merge">Enable Split/Merge</Label>
            <p className="text-sm text-muted-foreground">
              Allow splitting LPs or merging LPs with same product/batch
            </p>
          </div>
          <Switch
            id="enable_split_merge"
            data-testid="enable_split_merge"
            checked={settings.enable_split_merge ?? true}
            onCheckedChange={(checked) => onChange('enable_split_merge', checked)}
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}
