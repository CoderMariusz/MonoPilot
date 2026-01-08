import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from '@/app/api/production/settings/route';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// Mock NextAuth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

// Mock the service to isolate API logic
vi.mock('@/lib/services/production-settings-service', () => ({
  getProductionSettings: vi.fn(),
  updateProductionSettings: vi.fn(),
}));

import { getProductionSettings, updateProductionSettings } from '@/lib/services/production-settings-service';

/**
 * RED PHASE TESTS
 * These tests verify the API route handlers for Production Settings.
 * They will fail because the route file does not exist.
 */

describe('/api/production/settings Route', () => {
  const mockOrgId = 'org-123';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', org_id: mockOrgId },
    } as any);
  });

  describe('GET', () => {
    it('should return 200 and settings for authenticated user', async () => {
      const mockSettings = {
        id: '1',
        org_id: mockOrgId,
        allow_pause_wo: false,
        dashboard_refresh_seconds: 30,
      };
      vi.mocked(getProductionSettings).mockResolvedValue(mockSettings as any);

      const request = new NextRequest('http://localhost/api/production/settings');
      const response = await GET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(mockSettings);
    });

    it('should return 401 if not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/production/settings');
      const response = await GET(request);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT', () => {
    it('should update settings and return 200', async () => {
      const updates = { allow_pause_wo: true };
      const updatedSettings = {
        id: '1',
        org_id: mockOrgId,
        allow_pause_wo: true,
        dashboard_refresh_seconds: 30,
      };
      vi.mocked(updateProductionSettings).mockResolvedValue(updatedSettings as any);

      const request = new NextRequest('http://localhost/api/production/settings', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toEqual(updatedSettings);
      expect(updateProductionSettings).toHaveBeenCalledWith(updates);
    });

    it('should return 400 if validation fails', async () => {
      const invalidUpdates = { dashboard_refresh_seconds: 2 };

      vi.mocked(updateProductionSettings).mockRejectedValue(
        new Error('Validation failed')
      );

      const request = new NextRequest('http://localhost/api/production/settings', {
        method: 'PUT',
        body: JSON.stringify(invalidUpdates),
      });
      const response = await PUT(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('Validation failed');
    });

    it('should return 401 if not authenticated', async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/production/settings', {
        method: 'PUT',
        body: JSON.stringify({}),
      });
      const response = await PUT(request);

      expect(response.status).toBe(401);
    });
  });
});
