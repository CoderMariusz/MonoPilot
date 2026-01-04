/**
 * Warehouse Settings Form
 * Story: 05.0 - Warehouse Settings
 * Phase: P3 - Frontend Implementation
 *
 * Main container component with all 4 phase sections
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDownIcon, ChevronUpIcon, InfoIcon, AlertCircleIcon } from 'lucide-react';
import { useWarehouseSettings } from '@/hooks/use-warehouse-settings';
import { WarehouseSettings, warehouseSettingsSchema } from '@/lib/validation/warehouse-settings';
import { Phase0CoreSettings } from './Phase0CoreSettings';
import { Phase1ReceiptSettings } from './Phase1ReceiptSettings';
import { Phase2ScannerSettings } from './Phase2ScannerSettings';
import { Phase3AdvancedSettings } from './Phase3AdvancedSettings';
import { PhaseBadge } from './PhaseBadge';
import { SettingsHistoryModal } from './SettingsHistoryModal';
import { SettingsResetDialog } from './SettingsResetDialog';

interface WarehouseSettingsFormProps {
  isReadOnly?: boolean;
}

export function WarehouseSettingsForm({ isReadOnly = false }: WarehouseSettingsFormProps) {
  const { settings: fetchedSettings, isLoading, error, updateSettings, resetSettings, refetch } = useWarehouseSettings();
  const { toast } = useToast();

  const [settings, setSettings] = useState<Partial<WarehouseSettings>>({});
  const [originalSettings, setOriginalSettings] = useState<Partial<WarehouseSettings>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Section collapse state (persisted in localStorage)
  const [expandedSections, setExpandedSections] = useState({
    phase0: true,
    phase1: true,
    phase2: true,
    phase3: true,
  });

  // Modal states
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Load settings
  useEffect(() => {
    if (fetchedSettings) {
      setSettings(fetchedSettings);
      setOriginalSettings(fetchedSettings);
    }
  }, [fetchedSettings]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('warehouse-settings-collapsed');
    if (saved) {
      try {
        setExpandedSections(JSON.parse(saved));
      } catch (err) {
        console.error('Failed to parse collapsed state:', err);
      }
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleSection = (section: keyof typeof expandedSections) => {
    const newState = {
      ...expandedSections,
      [section]: !expandedSections[section],
    };
    setExpandedSections(newState);
    localStorage.setItem('warehouse-settings-collapsed', JSON.stringify(newState));
  };

  // Handle field change
  const handleChange = (field: keyof WarehouseSettings, value: any) => {
    const newSettings = { ...settings, [field]: value };
    setSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  // Validate settings
  const validateSettings = () => {
    try {
      warehouseSettingsSchema.parse(settings);
      setValidationErrors({});
      return true;
    } catch (err: any) {
      const errors: Record<string, string> = {};
      err.errors?.forEach((error: any) => {
        const path = error.path.join('.');
        errors[path] = error.message;
      });
      setValidationErrors(errors);
      return false;
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!validateSettings()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the validation errors before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSaving(true);
      await updateSettings(settings);
      setOriginalSettings(settings);
      setHasUnsavedChanges(false);
      toast({
        title: 'Success',
        description: 'Warehouse settings saved successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setSettings(originalSettings);
    setHasUnsavedChanges(false);
    setValidationErrors({});
  };

  // Handle reset
  const handleReset = async () => {
    try {
      await resetSettings();
      await refetch();
      toast({
        title: 'Success',
        description: 'Settings reset to defaults',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive',
      });
    }
  };

  // Warn on navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="warehouse-settings-form" aria-busy="true">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure warehouse module behavior including license plates, inventory tracking, pick strategies, and advanced features.
          </p>
        </div>

        <div className="flex gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>

        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />

        <p className="text-center text-muted-foreground" aria-live="polite">
          Loading warehouse settings...
        </p>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="space-y-6" data-testid="warehouse-settings-form">
        <div className="text-center py-16">
          <AlertCircleIcon className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h2 className="text-2xl font-semibold mb-2">Failed to Load Warehouse Settings</h2>
          <p className="text-muted-foreground mb-6">
            Unable to retrieve warehouse configuration. Please check your connection and try again.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={refetch}>Try Again</Button>
            <Button variant="outline">Contact Support</Button>
          </div>
          <div className="mt-8 text-sm text-muted-foreground">
            <p>Error Details: {error.message}</p>
            <p>Timestamp: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty State (should not happen with auto-init, but fallback)
  if (!settings || Object.keys(settings).length === 0) {
    return (
      <div className="space-y-6" data-testid="warehouse-settings-form">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-2xl font-semibold mb-2">No Warehouse Settings Found</h2>
          <p className="text-muted-foreground mb-6">
            Warehouse settings have not been configured for your organization yet.
          </p>
          <p className="text-muted-foreground mb-6">
            Initializing with default recommended settings...
          </p>
          <Button onClick={refetch}>Initialize Default Settings</Button>
          <p className="text-sm text-muted-foreground mt-8">
            Note: Default settings are optimized for food manufacturing best practices.
            You can customize them after initialization.
          </p>
        </div>
      </div>
    );
  }

  // Success State
  return (
    <div className="space-y-6" data-testid="warehouse-settings-form">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Warehouse Settings</h1>
          {isReadOnly && (
            <span className="text-sm font-medium text-muted-foreground">Read-Only</span>
          )}
          {hasUnsavedChanges && !isReadOnly && (
            <span className="text-sm font-medium text-yellow-600">Unsaved *</span>
          )}
        </div>
        <p className="text-muted-foreground mt-2">
          Configure warehouse module behavior including license plates, inventory tracking, pick strategies, and advanced features.
        </p>
      </div>

      {/* Read-only warning */}
      {isReadOnly && (
        <Alert>
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            You have read-only access. Contact your administrator to modify settings.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={() => setShowHistoryModal(true)}>
          View Change History
        </Button>
        {!isReadOnly && (
          <Button variant="outline" onClick={() => setShowResetDialog(true)}>
            Reset to Defaults
          </Button>
        )}
      </div>

      {/* Phase 0: Core Configuration */}
      <Collapsible
        open={expandedSections.phase0}
        onOpenChange={() => toggleSection('phase0')}
        data-testid="phase0-settings"
      >
        <div className="border rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <h2 className="text-lg font-semibold">PHASE 0: CORE CONFIGURATION</h2>
              <PhaseBadge phase={0} />
            </div>
            {expandedSections.phase0 ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <div className="p-6">
              <Phase0CoreSettings
                settings={settings}
                onChange={handleChange}
                isReadOnly={isReadOnly}
                errors={validationErrors}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Phase 1: Receipt & Inventory */}
      <Collapsible
        open={expandedSections.phase1}
        onOpenChange={() => toggleSection('phase1')}
        data-testid="phase1-settings"
      >
        <div className="border rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📥</span>
              <h2 className="text-lg font-semibold">PHASE 1: RECEIPT & INVENTORY</h2>
              <PhaseBadge phase={1} />
            </div>
            {expandedSections.phase1 ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <div className="p-6">
              <Phase1ReceiptSettings
                settings={settings}
                onChange={handleChange}
                isReadOnly={isReadOnly}
                errors={validationErrors}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Phase 2: Scanner & Labels */}
      <Collapsible
        open={expandedSections.phase2}
        onOpenChange={() => toggleSection('phase2')}
        data-testid="phase2-settings"
      >
        <div className="border rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <h2 className="text-lg font-semibold">PHASE 2: SCANNER & LABELS</h2>
              <PhaseBadge phase={2} />
            </div>
            {expandedSections.phase2 ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <div className="p-6">
              <Phase2ScannerSettings
                settings={settings}
                onChange={handleChange}
                isReadOnly={isReadOnly}
                errors={validationErrors}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Phase 3: Advanced Features */}
      <Collapsible
        open={expandedSections.phase3}
        onOpenChange={() => toggleSection('phase3')}
        data-testid="phase3-settings"
      >
        <div className="border rounded-lg">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚙</span>
              <h2 className="text-lg font-semibold">PHASE 3: ADVANCED FEATURES</h2>
              <PhaseBadge phase={3} />
            </div>
            {expandedSections.phase3 ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <Separator />
            <div className="p-6">
              <Phase3AdvancedSettings
                settings={settings}
                onChange={handleChange}
                isReadOnly={isReadOnly}
              />
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {/* Footer Notice */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Changes to these settings affect all users in your organization.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex justify-end gap-4 sticky bottom-0 bg-background py-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={!hasUnsavedChanges || isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving || Object.keys(validationErrors).length > 0}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Modals */}
      <SettingsHistoryModal
        open={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />

      <SettingsResetDialog
        open={showResetDialog}
        onClose={() => setShowResetDialog(false)}
        onConfirm={handleReset}
      />
    </div>
  );
}
