/**
 * Quality Settings Validation Schema
 * Story: 06.0 - Quality Settings (Module Configuration)
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Zod schema for quality module configuration including:
 * - Inspection settings (incoming/final requirements, auto-create on GRN)
 * - Hold settings (require reason, disposition on release)
 * - NCR settings (auto-numbering, response SLA, root cause requirement)
 * - CAPA settings (auto-numbering, effectiveness check requirements)
 * - CoA settings (auto-numbering, approval requirement)
 * - HACCP settings (CCP deviation escalation time, auto-NCR creation)
 * - Audit settings (change reason requirement, retention years)
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.0.quality-settings.md}
 */

import { z } from 'zod';

/**
 * AQL Sampling Level Enum
 * General inspection levels: I, II, III
 * Special inspection levels: S-1, S-2, S-3, S-4
 */
export const samplingLevelEnum = z.enum(['I', 'II', 'III', 'S-1', 'S-2', 'S-3', 'S-4']);

export type SamplingLevel = z.infer<typeof samplingLevelEnum>;

/**
 * Update Quality Settings Schema
 * All fields are optional for partial updates
 */
export const updateQualitySettingsSchema = z.object({
  // Inspection Settings
  require_incoming_inspection: z.boolean().optional(),
  require_final_inspection: z.boolean().optional(),
  auto_create_inspection_on_grn: z.boolean().optional(),
  default_sampling_level: samplingLevelEnum.optional(),

  // Hold Settings
  require_hold_reason: z.boolean().optional(),
  require_disposition_on_release: z.boolean().optional(),

  // NCR Settings
  ncr_auto_number_prefix: z
    .string()
    .min(1, 'Prefix must be at least 1 character')
    .max(10, 'Prefix must be at most 10 characters')
    .optional(),
  ncr_require_root_cause: z.boolean().optional(),
  ncr_critical_response_hours: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Must be at least 1 hour')
    .max(168, 'Must be at most 168 hours (1 week)')
    .optional(),
  ncr_major_response_hours: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Must be at least 1 hour')
    .max(336, 'Must be at most 336 hours (2 weeks)')
    .optional(),

  // CAPA Settings
  capa_auto_number_prefix: z
    .string()
    .min(1, 'Prefix must be at least 1 character')
    .max(10, 'Prefix must be at most 10 characters')
    .optional(),
  capa_require_effectiveness: z.boolean().optional(),
  capa_effectiveness_wait_days: z
    .number()
    .int('Must be a whole number')
    .min(0, 'Must be at least 0 days')
    .max(365, 'Must be at most 365 days (1 year)')
    .optional(),

  // CoA Settings
  coa_auto_number_prefix: z
    .string()
    .min(1, 'Prefix must be at least 1 character')
    .max(10, 'Prefix must be at most 10 characters')
    .optional(),
  coa_require_approval: z.boolean().optional(),

  // HACCP Settings
  ccp_deviation_escalation_minutes: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Must be at least 1 minute')
    .max(1440, 'Must be at most 1440 minutes (24 hours)')
    .optional(),
  ccp_auto_create_ncr: z.boolean().optional(),

  // Audit Settings
  require_change_reason: z.boolean().optional(),
  retention_years: z
    .number()
    .int('Must be a whole number')
    .min(1, 'Must be at least 1 year')
    .max(50, 'Maximum retention is 50 years')
    .optional(),
});

export type UpdateQualitySettingsInput = z.infer<typeof updateQualitySettingsSchema>;

/**
 * Quality Settings Type
 * Includes all fields plus database metadata
 */
export interface QualitySettings {
  id: string;
  org_id: string;

  // Inspection Settings
  require_incoming_inspection: boolean;
  require_final_inspection: boolean;
  auto_create_inspection_on_grn: boolean;
  default_sampling_level: SamplingLevel;

  // Hold Settings
  require_hold_reason: boolean;
  require_disposition_on_release: boolean;

  // NCR Settings
  ncr_auto_number_prefix: string;
  ncr_require_root_cause: boolean;
  ncr_critical_response_hours: number;
  ncr_major_response_hours: number;

  // CAPA Settings
  capa_auto_number_prefix: string;
  capa_require_effectiveness: boolean;
  capa_effectiveness_wait_days: number;

  // CoA Settings
  coa_auto_number_prefix: string;
  coa_require_approval: boolean;

  // HACCP Settings
  ccp_deviation_escalation_minutes: number;
  ccp_auto_create_ncr: boolean;

  // Audit Settings
  require_change_reason: boolean;
  retention_years: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Default Quality Settings
 * Applied when initializing settings for new organizations
 */
export const DEFAULT_QUALITY_SETTINGS: Omit<QualitySettings, 'id' | 'org_id' | 'created_at' | 'updated_at'> = {
  // Inspection Settings
  require_incoming_inspection: true,
  require_final_inspection: true,
  auto_create_inspection_on_grn: true,
  default_sampling_level: 'II',

  // Hold Settings
  require_hold_reason: true,
  require_disposition_on_release: true,

  // NCR Settings
  ncr_auto_number_prefix: 'NCR-',
  ncr_require_root_cause: true,
  ncr_critical_response_hours: 24,
  ncr_major_response_hours: 48,

  // CAPA Settings
  capa_auto_number_prefix: 'CAPA-',
  capa_require_effectiveness: true,
  capa_effectiveness_wait_days: 30,

  // CoA Settings
  coa_auto_number_prefix: 'COA-',
  coa_require_approval: false,

  // HACCP Settings
  ccp_deviation_escalation_minutes: 15,
  ccp_auto_create_ncr: true,

  // Audit Settings
  require_change_reason: true,
  retention_years: 7,
};
