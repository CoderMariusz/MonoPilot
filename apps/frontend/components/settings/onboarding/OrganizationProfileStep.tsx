/**
 * Story 01.4: Organization Profile Step (Wizard Step 1)
 * Epic: 01-settings
 *
 * Main wizard step 1 component for organization profile setup.
 * Features:
 * - Form with 4 fields: name, timezone, language, currency
 * - Auto-detect timezone and language from browser
 * - Pre-fill org name if already set during registration
 * - Validation with Zod schema
 * - Error display inline under fields
 *
 * Related Wireframes: SET-002, SET-007
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  organizationProfileStepSchema,
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

/**
 * Shared styling for native select elements.
 * Matches ShadCN UI form control styling.
 */
const SELECT_CLASSNAME =
  'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

interface OrganizationProfileStepProps {
  initialData?: Partial<OrganizationProfileStepData>;
  onComplete: (data: OrganizationProfileStepData) => void | Promise<void>;
}

/**
 * OrganizationProfileStep Component
 *
 * First step of the 6-step onboarding wizard.
 * Collects basic organization information and regional settings.
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

  const form = useForm<OrganizationProfileStepData>({
    resolver: zodResolver(organizationProfileStepSchema),
    defaultValues: {
      name: initialData?.name || '',
      timezone: initialData?.timezone || getBrowserTimezone(),
      language: initialData?.language || getBrowserLanguage(),
      currency: initialData?.currency || 'EUR',
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

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="space-y-6"
        aria-label="Organization Profile Form"
      >
        {/* Basic Information Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Basic Information</h3>

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
        </div>

        {/* Regional Settings Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Regional Settings</h3>

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
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
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
