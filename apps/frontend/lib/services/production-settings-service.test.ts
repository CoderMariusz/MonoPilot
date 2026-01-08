import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getProductionSettings,
  updateProductionSettings,
  isWoPauseAllowed,
  getDashboardRefreshInterval
} from './production-settings-service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

/**
 * RED PHASE TESTS
 * These tests verify the service layer logic for Production Settings.
 * They will fail because the service implementation does not exist.
 */

describe('Production Settings Service', () => {
  const mockSupabase = {
    from: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);
  });

  describe('getProductionSettings', () => {
    it('should fetch settings for the current org', async () => {
      const mockData = {
        id: '1',
        org_id: 'org-123',
        allow_pause_wo: true,
        dashboard_refresh_seconds: 30
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      } as any);

      const settings = await getProductionSettings();
      expect(settings).toEqual(mockData);
      expect(mockSupabase.from).toHaveBeenCalledWith('production_settings');
    });

    it('should upsert default settings if none exist', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        upsert: vi.fn().mockReturnThis(),
      } as any);

      const settings = await getProductionSettings();
      expect(settings).toBeDefined();
      expect(settings.dashboard_refresh_seconds).toBe(30);
    });
  });

  describe('updateProductionSettings', () => {
    it('should update specific settings and return full object', async () => {
      const updates = { allow_pause_wo: true };
      const updatedData = {
        id: '1',
        org_id: 'org-123',
        allow_pause_wo: true,
        dashboard_refresh_seconds: 30
      };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedData, error: null }),
      } as any);

      const result = await updateProductionSettings(updates);
      expect(result.allow_pause_wo).toBe(true);
    });

    it('should throw error if validation fails', async () => {
      await expect(updateProductionSettings({ dashboard_refresh_seconds: 1 }))
        .rejects.toThrow();
    });
  });

  describe('Helper Functions', () => {
    it('isWoPauseAllowed should return boolean based on settings', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { allow_pause_wo: true },
          error: null
        }),
      } as any);

      const result = await isWoPauseAllowed();
      expect(result).toBe(true);
    });

    it('getDashboardRefreshInterval should return number', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { dashboard_refresh_seconds: 15 },
          error: null
        }),
      } as any);

      const result = await getDashboardRefreshInterval();
      expect(result).toBe(15);
    });
  });
});
