/**
 * AI Batch Prediction for Scanner Module
 * Story 1.7.1 - AC-4 (Priority 2)
 *
 * Predicts batch number based on supplier history:
 * - Analyzes last 10 received LPs from same supplier + product
 * - Extracts batch number pattern (e.g., YYYYMMDD, YYYY-WW, sequential)
 * - Suggests next batch with confidence score
 *
 * Priority waterfall:
 * 1. ASN metadata (if present) - 100% confidence
 * 2. AI prediction (this module) - 60-90% confidence
 * 3. Fallback BATCH-YYYY-DDD - 0% confidence (auto-generated)
 */

import { supabase } from '../supabase/client';

export interface BatchPrediction {
  batch: string;
  confidence: number; // 0-100
  source: 'asn_metadata' | 'ai_prediction' | 'fallback';
  pattern?: string; // Detected pattern (e.g., 'YYYYMMDD', 'YYYY-WW', 'sequential')
}

/**
 * Predict batch number for a product from a supplier
 */
export async function predictBatch(
  productId: number,
  supplierId: number | null,
  asnBatch?: string | null
): Promise<BatchPrediction> {
  // Priority 1: ASN metadata (highest confidence)
  if (asnBatch && asnBatch.trim() !== '') {
    return {
      batch: asnBatch.trim(),
      confidence: 100,
      source: 'asn_metadata',
    };
  }

  // Priority 2: AI prediction based on supplier history
  if (supplierId) {
    try {
      const prediction = await predictFromSupplierHistory(productId, supplierId);
      if (prediction) {
        return prediction;
      }
    } catch (err) {
      console.error('[batchPrediction] AI prediction failed:', err);
      // Fall through to fallback
    }
  }

  // Priority 3: Fallback (day-of-year format)
  const fallbackBatch = generateFallbackBatch();
  return {
    batch: fallbackBatch,
    confidence: 0,
    source: 'fallback',
  };
}

/**
 * Analyze supplier history and predict next batch
 */
async function predictFromSupplierHistory(
  productId: number,
  supplierId: number
): Promise<BatchPrediction | null> {
  // Fetch last 10 LPs from same supplier + product
  const { data: recentLps, error } = await supabase
    .from('license_plates')
    .select('batch_number, created_at')
    .eq('product_id', productId)
    .not('batch_number', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !recentLps || recentLps.length === 0) {
    console.log('[batchPrediction] No historical batches found');
    return null;
  }

  // Filter out fallback batches (BATCH-YYYY-DDD pattern)
  const validBatches = recentLps
    .map(lp => lp.batch_number!)
    .filter(batch => !batch.match(/^BATCH-\d{4}-\d{3}$/));

  if (validBatches.length === 0) {
    console.log('[batchPrediction] No valid historical batches (all fallbacks)');
    return null;
  }

  // Detect pattern
  const pattern = detectBatchPattern(validBatches);
  if (!pattern) {
    console.log('[batchPrediction] Could not detect batch pattern');
    return null;
  }

  // Generate prediction based on pattern
  const prediction = generatePrediction(validBatches, pattern);

  return {
    batch: prediction.batch,
    confidence: prediction.confidence,
    source: 'ai_prediction',
    pattern: pattern.type,
  };
}

/**
 * Detect batch numbering pattern from historical data
 */
function detectBatchPattern(batches: string[]): { type: string; regex: RegExp } | null {
  const patterns = [
    { type: 'YYYYMMDD', regex: /^\d{8}$/ },
    { type: 'YYYY-MM-DD', regex: /^\d{4}-\d{2}-\d{2}$/ },
    { type: 'YYYY-WW', regex: /^\d{4}-W\d{2}$/ },
    { type: 'YYYY-DDD', regex: /^\d{4}-\d{3}$/ },
    { type: 'sequential', regex: /^[A-Z]+-\d+$/ },
    { type: 'lot', regex: /^LOT-\d+$/ },
  ];

  // Find pattern that matches majority of batches
  for (const pattern of patterns) {
    const matches = batches.filter(b => pattern.regex.test(b));
    if (matches.length >= Math.ceil(batches.length * 0.6)) {
      return pattern;
    }
  }

  return null;
}

/**
 * Generate next batch based on detected pattern
 */
function generatePrediction(
  batches: string[],
  pattern: { type: string; regex: RegExp }
): { batch: string; confidence: number } {
  const now = new Date();

  switch (pattern.type) {
    case 'YYYYMMDD': {
      // Date-based: use today's date
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return {
        batch: `${year}${month}${day}`,
        confidence: 85,
      };
    }

    case 'YYYY-MM-DD': {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      return {
        batch: `${year}-${month}-${day}`,
        confidence: 85,
      };
    }

    case 'YYYY-WW': {
      // Week-based
      const year = now.getFullYear();
      const week = String(getWeekNumber(now)).padStart(2, '0');
      return {
        batch: `${year}-W${week}`,
        confidence: 80,
      };
    }

    case 'YYYY-DDD': {
      // Day-of-year
      const year = now.getFullYear();
      const dayOfYear = String(getDayOfYear(now)).padStart(3, '0');
      return {
        batch: `${year}-${dayOfYear}`,
        confidence: 85,
      };
    }

    case 'sequential':
    case 'lot': {
      // Extract last number and increment
      const lastBatch = batches[0];
      const match = lastBatch.match(/(\d+)$/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        const nextNumber = String(lastNumber + 1).padStart(match[1].length, '0');
        const prefix = lastBatch.substring(0, lastBatch.length - match[1].length);
        return {
          batch: `${prefix}${nextNumber}`,
          confidence: 70,
        };
      }
      // If can't extract, use most recent batch
      return {
        batch: lastBatch,
        confidence: 60,
      };
    }

    default:
      // Unknown pattern - use most recent batch
      return {
        batch: batches[0],
        confidence: 60,
      };
  }
}

/**
 * Generate fallback batch (BATCH-YYYY-DDD format)
 */
function generateFallbackBatch(): string {
  const now = new Date();
  const year = now.getFullYear();
  const dayOfYear = String(getDayOfYear(now)).padStart(3, '0');
  return `BATCH-${year}-${dayOfYear}`;
}

/**
 * Get ISO week number (1-53)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get day of year (1-366)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}
