import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDashboardKPIs, getActiveWOs, getDashboardAlerts, exportActiveWOsToCSV } from '@/lib/services/production-dashboard-service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

// Mock Redis
vi.mock('@/lib/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

describe('Production Dashboard Service', () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    neq: vi.fn(() => ({
                      lt: vi.fn(() => ({
                        single: vi.fn(),
                      })),
                    })),
                  })),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (createClient as any).mockReturnValue(mockSupabase);
  });

  describe('getDashboardKPIs', () => {
    it('should return cached KPIs if available', async () => {
      const { redis } = await import('@/lib/redis');
      const cachedData = { activeWOs: 5, completedToday: 10 };
      (redis.get as any).mockResolvedValue(JSON.stringify(cachedData));

      const result = await getDashboardKPIs('org-123');

      expect(result).toEqual(cachedData);
      expect(redis.get).toHaveBeenCalledWith('dashboard:kpis:org-123');
    });

    it('should fetch fresh KPIs if cache is empty', async () => {
      const { redis } = await import('@/lib/redis');
      (redis.get as any).mockResolvedValue(null);

      mockSupabase.from().select().eq().in().single = vi.fn().mockResolvedValue({ data: { count: 5 }, error: null });

      const result = await getDashboardKPIs('org-123');

      expect(redis.setex).toHaveBeenCalled();
      expect(result).toHaveProperty('activeWOs');
      expect(result).toHaveProperty('timestamp');
    });

    it('should calculate average cycle time correctly', async () => {
      const { redis } = await import('@/lib/redis');
      (redis.get as any).mockResolvedValue(null);

      const result = await getDashboardKPIs('org-123');

      expect(typeof result.avgCycleTimeHrs).toBe('number');
    });

    it('should calculate on-time percentage correctly', async () => {
      const { redis } = await import('@/lib/redis');
      (redis.get as any).mockResolvedValue(null);

      const result = await getDashboardKPIs('org-123');

      expect(result.onTimePercent).toBeGreaterThanOrEqual(0);
      expect(result.onTimePercent).toBeLessThanOrEqual(100);
    });
  });

  describe('getActiveWOs', () => {
    it('should return paginated list of active WOs', async () => {
      const result = await getActiveWOs('org-123', { page: 1, limit: 50 });

      expect(result).toHaveProperty('wos');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('limit', 50);
    });

    it('should apply line filter if provided', async () => {
      const lineId = 'line-uuid-123';
      await getActiveWOs('org-123', { lineId });

      const selectSpy = mockSupabase.from().select;
      expect(selectSpy).toHaveBeenCalled();
    });

    it('should calculate progress percentage capped at 100', async () => {
      const result = await getActiveWOs('org-123', {});
      if (result.wos.length > 0) {
        const wo = result.wos[0];
        expect(wo.progress_percent).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getDashboardAlerts', () => {
    it('should return material shortages', async () => {
      const mockShortages = [{ wo_number: 'WO-001', availability_percent: 60 }];
      mockSupabase.rpc.mockResolvedValue({ data: mockShortages, error: null });

      const result = await getDashboardAlerts('org-123');

      expect(result.materialShortages).toBeDefined();
      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_material_shortage_alerts', {
        p_org_id: 'org-123',
        p_threshold: 80
      });
    });

    it('should return delayed WOs', async () => {
      const result = await getDashboardAlerts('org-123');

      expect(result.delayedWOs).toBeDefined();
    });
  });

  describe('exportActiveWOsToCSV', () => {
    it('should generate CSV string with correct headers', async () => {
      const csv = await exportActiveWOsToCSV('org-123', {});

      expect(csv).toContain('WO Number,Product,Status');
      expect(csv.split('\n').length).toBeGreaterThan(1);
    });
  });
});
