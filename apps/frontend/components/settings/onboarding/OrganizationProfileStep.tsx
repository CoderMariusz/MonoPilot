/**
 * Story 01.4: Organization Profile Step (Wizard Step 1) - TD-001 Complete
 * Epic: 01-settings
 *
 * Main wizard step 1 component for organization profile setup.
 * Features:
 * - Form with 12 fields organized in 3 sections
 * - Section 1: Organization Details (name, timezone, language, currency, date_format)
 * - Section 2: Address (address_line1, address_line2, city, postal_code, country)
 * - Section 3: Contact Information (contact_email, contact_phone)
 * - Auto-detect timezone and language from browser
 * - Pre-fill org name if already set during registration
 * - Validation with Zod schema
 * - Error display inline under fields
 * - Skip Step button to bypass validation with defaults
 *
 * Related Wireframes: SET-002, SET-007
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Info } from 'lucide-react';
import {
  organizationProfileStepSchema,
  organizationProfileStepDefaults,
  type OrganizationProfileStepData,
} from '@/lib/validation/organization-profile-step';
import { getBrowserTimezone, getBrowserLanguage } from '@/lib/utils/browser-detection';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TimezoneSelect } from './TimezoneSelect';

// =============================================================================
// CONSTANTS & HELPERS
// =============================================================================

/** Default organization name when skipping the step */
const DEFAULT_ORG_NAME = 'My Organization';

/**
 * Creates default organization profile data with browser-detected values.
 * Used for Skip Step functionality.
 */
function createSkipDefaults(): OrganizationProfileStepData {
  return {
    name: DEFAULT_ORG_NAME,
    timezone: getBrowserTimezone(),
    language: getBrowserLanguage(),
    currency: organizationProfileStepDefaults.currency || 'EUR',
    date_format: organizationProfileStepDefaults.date_format || 'YYYY-MM-DD',
    address_line1: organizationProfileStepDefaults.address_line1 || '',
    address_line2: organizationProfileStepDefaults.address_line2 || '',
    city: organizationProfileStepDefaults.city || '',
    postal_code: organizationProfileStepDefaults.postal_code || '',
    country: organizationProfileStepDefaults.country || '',
    contact_email: organizationProfileStepDefaults.contact_email || '',
    contact_phone: organizationProfileStepDefaults.contact_phone || '',
  };
}

/**
 * Checks if a value is valid (non-empty and meets minimum length if applicable).
 * For name field, requires at least 2 characters to be considered valid.
 */
function isValidValue(value: string | undefined, minLength = 0): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  return trimmed.length >= minLength;
}

/**
 * Merges current form values with defaults.
 * Current valid values take precedence over defaults.
 * Invalid values (e.g., name with less than 2 chars) are replaced with defaults.
 */
function mergeWithDefaults(
  currentValues: OrganizationProfileStepData,
  defaults: OrganizationProfileStepData
): OrganizationProfileStepData {
  return {
    // Name requires minimum 2 characters to be valid
    name: isValidValue(currentValues.name, 2) ? currentValues.name : defaults.name,
    timezone: currentValues.timezone || defaults.timezone,
    language: currentValues.language || defaults.language,
    currency: currentValues.currency || defaults.currency,
    date_format: currentValues.date_format || defaults.date_format,
    address_line1: currentValues.address_line1 || defaults.address_line1,
    address_line2: currentValues.address_line2 || defaults.address_line2,
    city: currentValues.city || defaults.city,
    postal_code: currentValues.postal_code || defaults.postal_code,
    country: currentValues.country || defaults.country,
    contact_email: currentValues.contact_email || defaults.contact_email,
    contact_phone: currentValues.contact_phone || defaults.contact_phone,
  };
}

/**
 * Shared styling for native select elements.
 * Matches ShadCN UI form control styling.
 */
const SELECT_CLASSNAME =
  'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Common countries for dropdown
 */
const COUNTRIES = [
  { code: '', label: 'Select country...' },
  { code: 'PL', label: 'Poland' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'US', label: 'United States' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'BE', label: 'Belgium' },
  { code: 'AT', label: 'Austria' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'CZ', label: 'Czech Republic' },
  { code: 'DK', label: 'Denmark' },
  { code: 'FI', label: 'Finland' },
  { code: 'NO', label: 'Norway' },
  { code: 'SE', label: 'Sweden' },
];

interface OrganizationProfileStepProps {
  initialData?: Partial<OrganizationProfileStepData>;
  onComplete: (data: OrganizationProfileStepData) => void | Promise<void>;
}

/**
 * OrganizationProfileStep Component
 *
 * First step of the 6-step onboarding wizard.
 * Collects basic organization information, address, contact info, and regional settings.
 *
 * @param initialData - Optional initial data (e.g., org name from registration)
 * @param onComplete - Callback when user clicks Next (receives validated form data)
 *
 * @example
 * <OrganizationProfileStep
 *   initialData={{ name: 'Bakery Fresh Ltd' }}
 *   onComplete={(data) => console.log(data)}
 * />
 */
export function OrganizationProfileStep({
  initialData,
  onComplete,
}: OrganizationProfileStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skipAnnouncement, setSkipAnnouncement] = useState('');

  const form = useForm<OrganizationProfileStepData>({
    resolver: zodResolver(organizationProfileStepSchema),
    defaultValues: {
      name: initialData?.name || '',
      timezone: initialData?.timezone || getBrowserTimezone(),
      language: initialData?.language || getBrowserLanguage(),
      currency: initialData?.currency || 'EUR',
      date_format: initialData?.date_format || 'YYYY-MM-DD',
      address_line1: initialData?.address_line1 || '',
      address_line2: initialData?.address_line2 || '',
      city: initialData?.city || '',
      postal_code: initialData?.postal_code || '',
      country: initialData?.country || '',
      contact_email: initialData?.contact_email || '',
      contact_phone: initialData?.contact_phone || '',
    },
  });

  const onSubmit = form.handleSubmit(async (data: OrganizationProfileStepData) => {
    // Prevent rapid submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onComplete(data);
    } catch (error) {
      console.error('Error submitting organization profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  });

  /**
   * Handle Skip Step button click
   * Bypasses form validation and submits with default values merged with current form data
   */
  const handleSkip = async () => {
    // Prevent rapid submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Clear any existing validation errors
      form.clearErrors();

      // Create defaults and merge with current form values
      const defaults = createSkipDefaults();
      const currentValues = form.getValues();
      const mergedData = mergeWithDefaults(currentValues, defaults);

      // Announce skip action to screen readers
      setSkipAnnouncement('Step skipped, using default values');

      // Submit merged data
      await onComplete(mergedData);
    } catch (error) {
      console.error('Error skipping organization profile step:', error);
    } finally {
      setIsSubmitting(false);
      // Clear announcement after a delay
      setTimeout(() => setSkipAnnouncement(''), 3000);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="space-y-6"
        aria-label="Organization Profile Form"
      >
        {/* Section 1: Organization Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Organization Details</h3>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Bakery Fresh Ltd"
                    aria-label="Organization Name"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone *</FormLabel>
                <FormControl>
                  <TimezoneSelect
                    value={field.value}
                    onValueChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language *</FormLabel>
                  <FormControl>
                    <select
                      className={SELECT_CLASSNAME}
                      aria-label="Language"
                      {...field}
                    >
                      <option value="pl">Polski</option>
                      <option value="en">English</option>
                      <option value="de">Deutsch</option>
                      <option value="fr">Francais</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency *</FormLabel>
                  <FormControl>
                    <select
                      className={SELECT_CLASSNAME}
                      aria-label="Currency"
                      {...field}
                    >
                      <option value="PLN">PLN - Polish Zloty</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="date_format"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date Format *</FormLabel>
                <FormControl>
                  <select
                    className={SELECT_CLASSNAME}
                    aria-label="Date Format"
                    {...field}
                  >
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-23)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (23/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/23/2024)</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Section 2: Address */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Address</h3>

          <FormField
            control={form.control}
            name="address_line1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 1</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., 123 Main Street"
                    aria-label="Address Line 1"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address_line2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Suite 100"
                    aria-label="Address Line 2"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Warsaw"
                      aria-label="City"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
              </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 00-001"
                      aria-label="Postal Code"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country *</FormLabel>
                <FormControl>
                  <select
                    className={SELECT_CLASSNAME}
                    aria-label="Country"
                    {...field}
                  >
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Section 3: Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Contact Information</h3>

          <FormField
            control={form.control}
            name="contact_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="e.g., contact@company.com"
                    aria-label="Contact Email"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="e.g., +48 123 456 789"
                    aria-label="Contact Phone"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* ARIA live region for skip announcements */}
        <div
          role="status"
          aria-live="polite"
          aria-label="skip-announcement"
          className="sr-only"
        >
          {skipAnnouncement}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleSkip}
            disabled={isSubmitting}
            aria-label="Skip Step - use default values"
            className="variant-ghost"
          >
            <Info className="mr-2 h-4 w-4 lucide-info" />
            Skip Step
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            aria-label="Next"
          >
            {isSubmitting && (
              <Loader2
                className="mr-2 h-4 w-4 animate-spin"
                data-testid="loading-spinner"
              />
            )}
            {isSubmitting ? 'Saving...' : 'Next'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
