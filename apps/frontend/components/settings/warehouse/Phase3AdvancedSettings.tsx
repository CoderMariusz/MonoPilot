/**
 * Phase 3: Advanced Features Settings
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * Contains 5 settings organized into 4 subsections
 */

'use client';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { WarehouseSettings } from '@/lib/validation/warehouse-settings';

interface Phase3AdvancedSettingsProps {
  settings: Partial<WarehouseSettings>;
  onChange: (field: keyof WarehouseSettings, value: any) => void;
  isReadOnly?: boolean;
}

export function Phase3AdvancedSettings({ settings, onChange, isReadOnly = false }: Phase3AdvancedSettingsProps) {
  return (
    <div className="space-y-6">
      {/* Pallet Management */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Pallet Management
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_pallets">Enable Pallets</Label>
            <p className="text-sm text-muted-foreground">
              Enable pallet management with SSCC-18 codes
            </p>
          </div>
          <Switch
            id="enable_pallets"
            data-testid="enable_pallets"
            checked={settings.enable_pallets ?? false}
            onCheckedChange={(checked) => onChange('enable_pallets', checked)}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* GS1 Compliance */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          GS1 Compliance
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_gs1_barcodes">Enable GS1 Barcodes</Label>
            <p className="text-sm text-muted-foreground">
              Parse GS1 GTIN-14 and SSCC-18 barcodes
            </p>
          </div>
          <Switch
            id="enable_gs1_barcodes"
            data-testid="enable_gs1_barcodes"
            checked={settings.enable_gs1_barcodes ?? false}
            onCheckedChange={(checked) => onChange('enable_gs1_barcodes', checked)}
            disabled={isReadOnly}
          />
        </div>

        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            ⓘ Requires GS1 company prefix configuration
          </AlertDescription>
        </Alert>
      </div>

      {/* Catch Weight */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Catch Weight
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_catch_weight">Enable Catch Weight</Label>
            <p className="text-sm text-muted-foreground">
              Support variable weight products (e.g., meat, cheese)
            </p>
          </div>
          <Switch
            id="enable_catch_weight"
            data-testid="enable_catch_weight"
            checked={settings.enable_catch_weight ?? false}
            onCheckedChange={(checked) => onChange('enable_catch_weight', checked)}
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Location Management */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground border-b pb-2">
          Location Management
        </h3>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_location_zones">Enable Location Zones</Label>
            <p className="text-sm text-muted-foreground">
              Organize locations into zones (receiving, storage, shipping, etc.)
            </p>
          </div>
          <Switch
            id="enable_location_zones"
            data-testid="enable_location_zones"
            checked={settings.enable_location_zones ?? false}
            onCheckedChange={(checked) => onChange('enable_location_zones', checked)}
            disabled={isReadOnly}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="enable_location_capacity">Enable Location Capacity</Label>
            <p className="text-sm text-muted-foreground">
              Track and validate location capacity limits
            </p>
          </div>
          <Switch
            id="enable_location_capacity"
            data-testid="enable_location_capacity"
            checked={settings.enable_location_capacity ?? false}
            onCheckedChange={(checked) => onChange('enable_location_capacity', checked)}
            disabled={isReadOnly}
          />
        </div>
      </div>
    </div>
  );
}
