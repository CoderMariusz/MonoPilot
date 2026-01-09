/**
 * POApprovalSettings Component
 * Story: 03.5a - PO Approval Setup
 *
 * Standalone PO approval settings component with:
 * - Toggle for require_approval
 * - Currency input for approval_threshold (disabled when toggle off)
 * - Multi-select dropdown for approval_roles
 * - Tooltips on all fields
 * - Validation error messages
 * - Save button with loading state
 *
 * Props:
 * - settings: Current PlanningSettings
 * - onSave: Callback with PlanningSettingsUpdate
 * - isLoading: Loading state for save button
 */

'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Info, X, ChevronDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { useRoles } from '@/lib/hooks/use-roles';
import type { PlanningSettings, PlanningSettingsUpdate } from '@/lib/types/planning-settings';
import { hasMaxFourDecimalPlaces } from '@/lib/validation/planning-settings-schema';

/**
 * Tooltip text constants
 */
const TOOLTIPS = {
  require_approval: 'When enabled, POs must be approved before confirmation',
  approval_threshold:
    'If set, only POs above this amount require approval. Leave empty to require approval for all POs.',
  approval_roles: 'Users with these roles can approve purchase orders',
};

/**
 * Form validation schema
 * Uses shared validation helpers from planning-settings-schema
 */
const formSchema = z.object({
  po_require_approval: z.boolean(),
  po_approval_threshold: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val === '') return null;
      return parseFloat(val);
    })
    .pipe(
      z
        .number()
        .positive('Threshold must be a positive number')
        .gt(0, 'Threshold must be greater than zero')
        .refine(hasMaxFourDecimalPlaces, 'Threshold can have at most 4 decimal places')
        .nullable()
    ),
  po_approval_roles: z
    .array(z.string().min(1))
    .min(1, 'At least one approval role must be selected'),
});

type FormValues = z.infer<typeof formSchema>;

interface POApprovalSettingsProps {
  settings: PlanningSettings;
  onSave: (updates: PlanningSettingsUpdate) => void;
  isLoading?: boolean;
}

/**
 * Format number as currency string
 */
function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

/**
 * Parse currency string to number
 * Allows negative sign for validation purposes
 */
function parseCurrencyInput(value: string): string {
  // Remove commas and other non-numeric characters except decimal point and negative sign
  return value.replace(/[^0-9.\-]/g, '');
}

export function POApprovalSettings({
  settings,
  onSave,
  isLoading = false,
}: POApprovalSettingsProps) {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const [rolesOpen, setRolesOpen] = React.useState(false);

  // Initialize form with default values
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      po_require_approval: settings.po_require_approval,
      po_approval_threshold: settings.po_approval_threshold?.toString() ?? '',
      po_approval_roles: settings.po_approval_roles || ['admin', 'manager'],
    },
    mode: 'onChange',
  });

  // Watch for require_approval changes
  const requireApproval = watch('po_require_approval');
  const selectedRoles = watch('po_approval_roles');

  // Update form when settings prop changes
  React.useEffect(() => {
    setValue('po_require_approval', settings.po_require_approval);
    setValue(
      'po_approval_threshold',
      settings.po_approval_threshold?.toString() ?? ''
    );
    setValue('po_approval_roles', settings.po_approval_roles || ['admin', 'manager']);
  }, [settings, setValue]);

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    const updates: PlanningSettingsUpdate = {
      po_require_approval: data.po_require_approval,
      po_approval_threshold: data.po_approval_threshold,
      po_approval_roles: data.po_approval_roles,
    };
    onSave(updates);
  };

  // Get role display name from code
  const getRoleName = (code: string): string => {
    const role = roles.find((r) => r.code === code);
    if (role?.name) return role.name;
    // Fallback: convert code to title case (e.g., 'finance_manager' -> 'Finance Manager')
    return code
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Toggle role selection
  const toggleRole = (code: string) => {
    const current = selectedRoles || [];
    const updated = current.includes(code)
      ? current.filter((r) => r !== code)
      : [...current, code];
    setValue('po_approval_roles', updated, { shouldValidate: true });
  };

  // Check if a role is selected
  const isRoleSelected = (code: string): boolean => {
    return (selectedRoles || []).includes(code);
  };

  // Has validation error for roles
  const hasRolesError = !!errors.po_approval_roles;

  return (
    <TooltipProvider delayDuration={0}>
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Approval</CardTitle>
          <CardDescription>
            Configure approval workflow for purchase orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Require Approval Toggle */}
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="require-approval"
                    className="text-base font-medium"
                  >
                    Require Approval
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={TOOLTIPS.require_approval}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{TOOLTIPS.require_approval}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <p className="text-sm text-muted-foreground">
                  Require approval before PO confirmation
                </p>
              </div>
              <Controller
                name="po_require_approval"
                control={control}
                render={({ field }) => (
                  <Switch
                    id="require-approval"
                    role="checkbox"
                    aria-label="Require Approval"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Approval Threshold */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="approval-threshold">Approval Threshold</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={TOOLTIPS.approval_threshold}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{TOOLTIPS.approval_threshold}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Controller
                name="po_approval_threshold"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2 max-w-xs">
                    <Input
                      id="approval-threshold"
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={field.value || ''}
                      onChange={(e) => {
                        const cleaned = parseCurrencyInput(e.target.value);
                        field.onChange(cleaned);
                      }}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) {
                          field.onChange(formatCurrency(val));
                        }
                        trigger('po_approval_threshold');
                      }}
                      disabled={!requireApproval}
                      aria-label="Approval Threshold"
                      aria-describedby="threshold-description"
                    />
                    <span className="text-sm text-muted-foreground">PLN</span>
                  </div>
                )}
              />
              <p id="threshold-description" className="text-sm text-muted-foreground">
                Leave empty to require approval for all POs
              </p>
              {errors.po_approval_threshold && (
                <p className="text-sm text-destructive" role="alert" aria-live="polite">
                  {errors.po_approval_threshold.message}
                </p>
              )}
            </div>

            {/* Approval Roles Multi-Select */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Approval Roles</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={TOOLTIPS.approval_roles}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{TOOLTIPS.approval_roles}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Selected roles as chips */}
              <div className="flex flex-wrap gap-2 mb-2">
                {(selectedRoles || []).map((code) => (
                  <Badge key={code} variant="secondary" className="gap-1">
                    {getRoleName(code)}
                    <button
                      type="button"
                      onClick={() => toggleRole(code)}
                      className="ml-1 hover:text-destructive"
                      aria-label={`Remove ${getRoleName(code)}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Dropdown trigger */}
              <Popover open={rolesOpen} onOpenChange={setRolesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="button"
                    aria-label="Approval Roles"
                    aria-expanded={rolesOpen}
                    aria-haspopup="listbox"
                    className="w-full max-w-xs justify-between"
                    disabled={rolesLoading}
                  >
                    {rolesLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading roles...
                      </>
                    ) : (
                      <>
                        Select roles...
                        <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                      </>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full max-w-xs p-2" align="start" data-testid="roles-dropdown">
                  <div className="space-y-2" role="listbox" aria-multiselectable="true">
                    {roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded-md"
                        data-testid={`role-option-${role.code}`}
                      >
                        <Checkbox
                          id={`role-${role.code}`}
                          data-testid={`role-checkbox-${role.code}`}
                          checked={isRoleSelected(role.code)}
                          onCheckedChange={() => toggleRole(role.code)}
                          aria-label={`Select ${role.name} role`}
                        />
                        <Label
                          htmlFor={`role-${role.code}`}
                          className="flex-1 cursor-pointer"
                        >
                          {role.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {hasRolesError && (
                <p className="text-sm text-destructive" role="alert" aria-live="polite">
                  {errors.po_approval_roles?.message}
                </p>
              )}
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isLoading || hasRolesError}
              >
                {isLoading && (
                  <Loader2
                    className="h-4 w-4 animate-spin mr-2"
                    role="progressbar"
                    aria-label="Loading"
                  />
                )}
                {isLoading ? 'Loading...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
