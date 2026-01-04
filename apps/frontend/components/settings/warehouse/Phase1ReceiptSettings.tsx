/**
 * Phase 1: Receipt & Inventory Settings
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * Contains 4 settings organized into 3 subsections
 */

'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { WarehouseSettings } from '@/lib/validation/warehouse-settings';

interface Phase1ReceiptSettingsProps {
  settings: Partial<WarehouseSettings>;
  onChange: (field: keyof WarehouseSettings, value: any) => void;
  isReadOnly?: boolean;
  errors?: Record<string, string>;
}

export function Phase1ReceiptSettings({ settings, onChange, isReadOnly = false, errors = {} }: Phase1ReceiptSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Advanced Shipping Notices */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Advanced Shipping Notices (ASN)
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_asn">Enable ASN</Label>
            <p className="text-sm text-muted-foreground">
              Advanced Shipping Notices - Pre-notification from suppliers
            </p>
          </div>
          <Switch
            id="enable_asn"
            data-testid="enable_asn"
            checked={settings.enable_asn ?? false}
            onCheckedChange={(checked) => onChange('enable_asn', checked)}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Over-Receipt Control */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Over-Receipt Control
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="allow_over_receipt">Allow Over-Receipt</Label>
            <p className="text-sm text-muted-foreground">
              Allow receiving more than ordered quantity
            </p>
          </div>
          <Switch
            id="allow_over_receipt"
            data-testid="allow_over_receipt"
            checked={settings.allow_over_receipt ?? false}
            onCheckedChange={(checked) => onChange('allow_over_receipt', checked)}
            disabled={isReadOnly}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="over_receipt_tolerance_pct">Over-Receipt Tolerance (%)</Label>
          <Input
            id="over_receipt_tolerance_pct"
            data-testid="over_receipt_tolerance_pct"
            type="number"
            value={settings.over_receipt_tolerance_pct ?? 0}
            onChange={(e) => onChange('over_receipt_tolerance_pct', Number(e.target.value))}
            disabled={isReadOnly || !settings.allow_over_receipt}
            min={0}
            max={100}
            step={0.01}
            className={errors.over_receipt_tolerance_pct ? 'border-red-500' : ''}
            aria-invalid={!!errors.over_receipt_tolerance_pct}
            aria-describedby={errors.over_receipt_tolerance_pct ? 'over_receipt_tolerance_pct-error' : undefined}
          />
          <p className="text-xs text-muted-foreground">
            Receipts up to {100 + (settings.over_receipt_tolerance_pct ?? 0)}% of ordered quantity allowed (0-100%, 2 decimals)
          </p>
          {errors.over_receipt_tolerance_pct && (
            <p id="over_receipt_tolerance_pct-error" className="text-sm text-red-500" role="alert">
              ⚠ {errors.over_receipt_tolerance_pct}
            </p>
          )}
          {!settings.allow_over_receipt && (
            <p className="text-sm text-yellow-600">Receipts blocked if qty &gt; ordered quantity</p>
          )}
        </div>
      </div>

      {/* Transit Location */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Transit Location
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_transit_location">Enable Transit Location</Label>
            <p className="text-sm text-muted-foreground">
              Create virtual transit location for in-flight transfer orders
            </p>
          </div>
          <Switch
            id="enable_transit_location"
            data-testid="enable_transit_location"
            checked={settings.enable_transit_location ?? true}
            onCheckedChange={(checked) => onChange('enable_transit_location', checked)}
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}
