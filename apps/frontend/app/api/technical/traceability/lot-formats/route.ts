/**
 * API Route: /api/technical/traceability/lot-formats
 * Story: 02.10a - Traceability Configuration
 *
 * Endpoints:
 * - GET - List available lot number format placeholders and examples
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { generateSampleLotNumber } from '@/lib/services/traceability-config-service'

/**
 * Lot format placeholder definitions
 * Used for UI display and format builder
 */
export interface LotFormatPlaceholder {
  code: string
  description: string
  example: string
  length: 'fixed' | 'variable'
  digits?: number
}

/**
 * Predefined lot format templates
 */
export interface LotFormatTemplate {
  name: string
  format: string
  description: string
  example: string
}

// Available placeholders for lot number formats
const LOT_FORMAT_PLACEHOLDERS: LotFormatPlaceholder[] = [
  {
    code: '{YYYY}',
    description: '4-digit year',
    example: '2025',
    length: 'fixed',
    digits: 4
  },
  {
    code: '{YY}',
    description: '2-digit year',
    example: '25',
    length: 'fixed',
    digits: 2
  },
  {
    code: '{MM}',
    description: '2-digit month (01-12)',
    example: '01',
    length: 'fixed',
    digits: 2
  },
  {
    code: '{DD}',
    description: '2-digit day (01-31)',
    example: '15',
    length: 'fixed',
    digits: 2
  },
  {
    code: '{YYMMDD}',
    description: 'Compact date (YYMMDD)',
    example: '250115',
    length: 'fixed',
    digits: 6
  },
  {
    code: '{JULIAN}',
    description: 'Julian day (001-366)',
    example: '015',
    length: 'fixed',
    digits: 3
  },
  {
    code: '{SEQ:N}',
    description: 'Sequence number (N digits, 4-10)',
    example: '000001',
    length: 'variable'
  },
  {
    code: '{PROD}',
    description: 'Product code prefix',
    example: 'BRD',
    length: 'variable'
  },
  {
    code: '{LINE}',
    description: 'Production line code',
    example: 'L01',
    length: 'variable'
  }
]

// Predefined templates for common lot number formats
const LOT_FORMAT_TEMPLATES: LotFormatTemplate[] = [
  {
    name: 'Standard',
    format: 'LOT-{YYYY}-{SEQ:6}',
    description: 'Standard lot with year and 6-digit sequence',
    example: 'LOT-2025-000001'
  },
  {
    name: 'Compact Date',
    format: '{YYMMDD}-{SEQ:4}',
    description: 'Date-based with 4-digit sequence',
    example: '250115-0001'
  },
  {
    name: 'Product Prefix',
    format: '{PROD}-{YYYY}{MM}-{SEQ:5}',
    description: 'Product code with year-month and sequence',
    example: 'BRD-202501-00001'
  },
  {
    name: 'Julian Date',
    format: '{JULIAN}{YY}-{SEQ:5}',
    description: 'Julian day with year and sequence',
    example: '01525-00001'
  },
  {
    name: 'Line Based',
    format: '{LINE}-{YYMMDD}-{SEQ:4}',
    description: 'Production line with date and sequence',
    example: 'L01-250115-0001'
  },
  {
    name: 'Full Date',
    format: 'L{YYYY}{MM}{DD}-{SEQ:4}',
    description: 'Full date prefix with sequence',
    example: 'L20250115-0001'
  }
]

/**
 * GET /api/technical/traceability/lot-formats
 * List available lot number format placeholders and templates
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate live examples for templates using current date
    const templatesWithLiveExamples = LOT_FORMAT_TEMPLATES.map(template => ({
      ...template,
      liveExample: generateSampleLotNumber(template.format)
    }))

    return NextResponse.json({
      placeholders: LOT_FORMAT_PLACEHOLDERS,
      templates: templatesWithLiveExamples,
      notes: {
        maxLength: 20,
        maxLengthNote: 'GS1-128 AI 10 allows max 20 alphanumeric characters for lot numbers',
        sequenceRange: '4-10 digits for {SEQ:N}',
        caseRule: 'Placeholders must be uppercase (e.g., {YYYY} not {yyyy})'
      }
    })

  } catch (error) {
    console.error('Error in GET /api/technical/traceability/lot-formats:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
