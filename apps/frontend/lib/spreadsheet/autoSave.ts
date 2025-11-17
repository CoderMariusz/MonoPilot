/**
 * Auto-save functionality for Spreadsheet Mode
 *
 * Features:
 * - localStorage persistence for draft recovery
 * - Session recovery on page reload
 * - Auto-clear after successful submission
 * - TTL-based expiration (24 hours)
 */

import type { SpreadsheetRow } from '@/components/SpreadsheetTable';

// ============================================================================
// Types
// ============================================================================

export interface DraftSession<T extends SpreadsheetRow> {
  entityType: 'po' | 'wo';
  rows: T[];
  lastSaved: number; // timestamp
  expiresAt: number; // timestamp
}

export interface AutoSaveOptions {
  /**
   * TTL for draft sessions (milliseconds)
   * Default: 24 hours
   */
  ttl?: number;

  /**
   * localStorage key prefix
   * Default: 'spreadsheet_draft_'
   */
  keyPrefix?: string;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_KEY_PREFIX = 'spreadsheet_draft_';

// ============================================================================
// Auto-save Manager
// ============================================================================

export class AutoSaveManager<T extends SpreadsheetRow> {
  private entityType: 'po' | 'wo';
  private ttl: number;
  private keyPrefix: string;
  private storageKey: string;

  constructor(entityType: 'po' | 'wo', options: AutoSaveOptions = {}) {
    this.entityType = entityType;
    this.ttl = options.ttl || DEFAULT_TTL;
    this.keyPrefix = options.keyPrefix || DEFAULT_KEY_PREFIX;
    this.storageKey = `${this.keyPrefix}${entityType}`;
  }

  /**
   * Save draft to localStorage
   */
  saveDraft(rows: T[]): void {
    if (typeof window === 'undefined') return; // SSR guard

    const now = Date.now();

    const session: DraftSession<T> = {
      entityType: this.entityType,
      rows,
      lastSaved: now,
      expiresAt: now + this.ttl,
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(session));
      console.log(`[AutoSave] Draft saved: ${rows.length} rows`);
    } catch (error) {
      console.error('[AutoSave] Failed to save draft:', error);

      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        // Clear expired drafts and retry
        this.clearExpiredDrafts();
        try {
          localStorage.setItem(this.storageKey, JSON.stringify(session));
          console.log('[AutoSave] Draft saved after cleanup');
        } catch (retryError) {
          console.error('[AutoSave] Still failed after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Load draft from localStorage
   * Returns null if no draft exists or if expired
   */
  loadDraft(): DraftSession<T> | null {
    if (typeof window === 'undefined') return null; // SSR guard

    try {
      const stored = localStorage.getItem(this.storageKey);

      if (!stored) {
        return null;
      }

      const session: DraftSession<T> = JSON.parse(stored);

      // Check expiration
      if (Date.now() > session.expiresAt) {
        console.log('[AutoSave] Draft expired, clearing...');
        this.clearDraft();
        return null;
      }

      console.log(`[AutoSave] Draft loaded: ${session.rows.length} rows (saved ${this.getTimeSince(session.lastSaved)} ago)`);

      return session;
    } catch (error) {
      console.error('[AutoSave] Failed to load draft:', error);
      return null;
    }
  }

  /**
   * Clear draft from localStorage
   */
  clearDraft(): void {
    if (typeof window === 'undefined') return; // SSR guard

    try {
      localStorage.removeItem(this.storageKey);
      console.log('[AutoSave] Draft cleared');
    } catch (error) {
      console.error('[AutoSave] Failed to clear draft:', error);
    }
  }

  /**
   * Check if a draft exists (without loading it)
   */
  hasDraft(): boolean {
    if (typeof window === 'undefined') return false; // SSR guard

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return false;

    try {
      const session: DraftSession<T> = JSON.parse(stored);
      return Date.now() <= session.expiresAt;
    } catch {
      return false;
    }
  }

  /**
   * Get draft age (time since last save)
   */
  getDraftAge(): number | null {
    if (typeof window === 'undefined') return null; // SSR guard

    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return null;

    try {
      const session: DraftSession<T> = JSON.parse(stored);
      return Date.now() - session.lastSaved;
    } catch {
      return null;
    }
  }

  /**
   * Get human-readable time since last save
   */
  private getTimeSince(timestamp: number): string {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days !== 1 ? 's' : ''}`;
    if (hours > 0) return `${hours} hour${hours !== 1 ? 's' : ''}`;
    if (minutes > 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    return 'just now';
  }

  /**
   * Clear all expired drafts from localStorage
   */
  private clearExpiredDrafts(): void {
    if (typeof window === 'undefined') return; // SSR guard

    const now = Date.now();
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.startsWith(this.keyPrefix)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const session = JSON.parse(stored);
            if (session.expiresAt && now > session.expiresAt) {
              localStorage.removeItem(key);
              console.log(`[AutoSave] Cleared expired draft: ${key}`);
            }
          }
        } catch {
          // Invalid JSON, remove it
          localStorage.removeItem(key);
        }
      }
    });
  }
}

// ============================================================================
// Hooks-style API (for React components)
// ============================================================================

/**
 * Create auto-save manager instance
 * Use this in React components with useMemo
 */
export function createAutoSaveManager<T extends SpreadsheetRow>(
  entityType: 'po' | 'wo',
  options?: AutoSaveOptions
): AutoSaveManager<T> {
  return new AutoSaveManager<T>(entityType, options);
}

/**
 * Utility: Clear all spreadsheet drafts
 */
export function clearAllDrafts(): void {
  if (typeof window === 'undefined') return; // SSR guard

  const keys = Object.keys(localStorage);
  let clearedCount = 0;

  keys.forEach((key) => {
    if (key.startsWith(DEFAULT_KEY_PREFIX)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  console.log(`[AutoSave] Cleared ${clearedCount} draft(s)`);
}

/**
 * Utility: Get all active drafts
 */
export function getAllDrafts(): Array<{ entityType: 'po' | 'wo'; rowCount: number; lastSaved: Date }> {
  if (typeof window === 'undefined') return []; // SSR guard

  const keys = Object.keys(localStorage);
  const drafts: Array<{ entityType: 'po' | 'wo'; rowCount: number; lastSaved: Date }> = [];

  keys.forEach((key) => {
    if (key.startsWith(DEFAULT_KEY_PREFIX)) {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const session: DraftSession<any> = JSON.parse(stored);

          // Only include non-expired drafts
          if (Date.now() <= session.expiresAt) {
            drafts.push({
              entityType: session.entityType,
              rowCount: session.rows.length,
              lastSaved: new Date(session.lastSaved),
            });
          }
        }
      } catch {
        // Invalid JSON, skip
      }
    }
  });

  return drafts;
}
