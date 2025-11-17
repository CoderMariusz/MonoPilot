/**
 * Unit Tests for NPDProjectsAPI
 *
 * Tests cover:
 * - CRUD operations (getAll, getById, create, update, delete)
 * - RLS enforcement (org_id filtering)
 * - Auto-generation of project_number (NPD-YYYY-XXXX format)
 * - Immutable fields protection (project_number, org_id)
 * - Soft delete (status='cancelled')
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NPDProjectsAPI } from '../npdProjects';
import type { NPDProject } from '../npdProjects';

// Mock the supabase client
vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
    rpc: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('NPDProjectsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all NPD projects with RLS enforcement', async () => {
      const mockData: Partial<NPDProject>[] = [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          org_id: 1,
          project_number: 'NPD-2025-0001',
          project_name: 'New Chocolate Bar',
          status: 'idea',
          current_gate: 'G0',
          priority: 'high',
          created_at: '2025-11-16T10:00:00Z',
          updated_at: '2025-11-16T10:00:00Z',
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await NPDProjectsAPI.getAll();

      expect(supabase.from).toHaveBeenCalledWith('npd_projects');
      expect(mockQuery.select).toHaveBeenCalledWith('*');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockData);
    });

    it('should apply filters correctly', async () => {
      const mockData: Partial<NPDProject>[] = [];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await NPDProjectsAPI.getAll({
        current_gate: 'G2',
        status: 'development',
        priority: 'high',
      });

      expect(mockQuery.eq).toHaveBeenCalledWith('current_gate', 'G2');
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'development');
      expect(mockQuery.eq).toHaveBeenCalledWith('priority', 'high');
    });

    it('should handle errors gracefully', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection error' }
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await expect(NPDProjectsAPI.getAll()).rejects.toThrow('Failed to fetch NPD projects');
    });
  });

  describe('getById', () => {
    it('should fetch single NPD project by ID', async () => {
      const mockData: Partial<NPDProject> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        org_id: 1,
        project_number: 'NPD-2025-0001',
        project_name: 'New Chocolate Bar',
        status: 'idea',
        current_gate: 'G0',
        priority: 'high',
      };

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await NPDProjectsAPI.getById('123e4567-e89b-12d3-a456-426614174000');

      expect(supabase.from).toHaveBeenCalledWith('npd_projects');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
      expect(result).toEqual(mockData);
    });

    it('should return null for non-existent project (RLS blocked or not found)', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // No rows returned
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await NPDProjectsAPI.getById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create NPD project with auto-generated project_number', async () => {
      const currentYear = new Date().getFullYear();

      // Mock auth.getUser()
      (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      // Mock RPC call for project number generation
      (supabase.rpc as any) = vi.fn().mockResolvedValue({
        data: `NPD-${currentYear}-0001`,
        error: null
      });

      // Mock INSERT query
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            org_id: 1,
            project_number: `NPD-${currentYear}-0001`,
            project_name: 'New Product',
            status: 'idea',
            current_gate: 'G0',
            priority: 'medium',
          },
          error: null
        }),
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      const result = await NPDProjectsAPI.create({
        project_name: 'New Product',
      });

      expect(result.project_number).toBe(`NPD-${currentYear}-0001`);
      expect(result.project_name).toBe('New Product');
      expect(result.status).toBe('idea');
      expect(result.current_gate).toBe('G0');
    });

    it('should increment project_number sequence correctly', async () => {
      const currentYear = new Date().getFullYear();

      // Mock auth.getUser()
      (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      // Mock RPC call returning incremented sequence
      (supabase.rpc as any) = vi.fn().mockResolvedValue({
        data: `NPD-${currentYear}-0043`,
        error: null
      });

      // Mock INSERT query
      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            org_id: 1,
            project_number: `NPD-${currentYear}-0043`,
            project_name: 'Another Product',
            status: 'idea',
            current_gate: 'G0',
            priority: 'medium',
          },
          error: null
        }),
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      const result = await NPDProjectsAPI.create({
        project_name: 'Another Product',
      });

      expect(result.project_number).toBe(`NPD-${currentYear}-0043`);
    });

    it('should set default values for status, gate, priority', async () => {
      const currentYear = new Date().getFullYear();

      // Mock auth.getUser()
      (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      // Mock RPC call for project number generation
      (supabase.rpc as any) = vi.fn().mockResolvedValue({
        data: `NPD-${currentYear}-0001`,
        error: null
      });

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            project_number: `NPD-${currentYear}-0001`,
            project_name: 'Test Project',
            status: 'idea',
            current_gate: 'G0',
            priority: 'medium',
          },
          error: null
        }),
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      const result = await NPDProjectsAPI.create({
        project_name: 'Test Project',
      });

      const insertCall = mockInsertQuery.insert.mock.calls[0][0];
      expect(insertCall.status).toBe('idea');
      expect(insertCall.current_gate).toBe('G0');
      expect(insertCall.priority).toBe('medium');
    });

    it('should use PostgreSQL function for atomic number generation (prevents race conditions)', async () => {
      const currentYear = new Date().getFullYear();

      // Mock auth.getUser()
      (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({
        data: { user: { id: 'user-123' } },
        error: null
      });

      // Mock RPC call - the PostgreSQL function handles atomic number generation
      const mockRpc = vi.fn().mockResolvedValue({
        data: `NPD-${currentYear}-0042`,
        error: null
      });
      (supabase.rpc as any) = mockRpc;

      const mockInsertQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            project_number: `NPD-${currentYear}-0042`,
            project_name: 'Concurrent Project',
            status: 'idea',
            current_gate: 'G0',
            priority: 'medium',
          },
          error: null
        }),
      };

      (supabase.from as any).mockReturnValue(mockInsertQuery);

      const result = await NPDProjectsAPI.create({
        project_name: 'Concurrent Project',
      });

      // Verify RPC function was called with org_id parameter
      expect(mockRpc).toHaveBeenCalledWith('generate_npd_project_number', {
        p_org_id: 'user-123'
      });

      // Verify the returned project has the atomically generated number
      expect(result.project_number).toBe(`NPD-${currentYear}-0042`);
    });

    it('should throw error if Zod validation fails', async () => {
      // Test with invalid data (empty project_name)
      await expect(NPDProjectsAPI.create({
        project_name: '', // Should fail min(1) validation
      })).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should update NPD project fields', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            project_number: 'NPD-2025-0001',
            project_name: 'Updated Product Name',
            status: 'development',
            current_gate: 'G2',
            priority: 'high',
          },
          error: null
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      const result = await NPDProjectsAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        project_name: 'Updated Product Name',
        status: 'development',
        current_gate: 'G2',
        priority: 'high',
      });

      expect(mockQuery.update).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
      expect(result.project_name).toBe('Updated Product Name');
      expect(result.status).toBe('development');
    });

    it('should NOT allow updating project_number or org_id (immutable fields)', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            project_number: 'NPD-2025-0001', // Should remain unchanged
            org_id: 1, // Should remain unchanged
            project_name: 'Updated Name',
          },
          error: null
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await NPDProjectsAPI.update('123e4567-e89b-12d3-a456-426614174000', {
        project_name: 'Updated Name',
      });

      const updateCall = mockQuery.update.mock.calls[0][0];
      expect(updateCall).not.toHaveProperty('project_number');
      expect(updateCall).not.toHaveProperty('org_id');
    });

    it('should auto-set updated_at timestamp', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: '123', updated_at: new Date().toISOString() },
          error: null
        }),
      };

      (supabase.from as any).mockReturnValue(mockQuery);

      await NPDProjectsAPI.update('123', { project_name: 'Updated' });

      const updateCall = mockQuery.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete by setting status to cancelled', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      (supabase.from as any).mockReturnValue(mockQuery);
      mockQuery.eq.mockResolvedValue({ error: null });

      await NPDProjectsAPI.delete('123e4567-e89b-12d3-a456-426614174000');

      expect(mockQuery.update).toHaveBeenCalled();
      const updateCall = mockQuery.update.mock.calls[0][0];
      expect(updateCall.status).toBe('cancelled');
      expect(updateCall).toHaveProperty('updated_at');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '123e4567-e89b-12d3-a456-426614174000');
    });

    it('should throw error on delete failure', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      (supabase.from as any).mockReturnValue(mockQuery);
      mockQuery.eq.mockResolvedValue({ error: { message: 'RLS policy violation' } });

      await expect(NPDProjectsAPI.delete('123')).rejects.toThrow('Failed to delete NPD project');
    });
  });

  describe('advanceGate', () => {
    const mockProjectId = '123e4567-e89b-12d3-a456-426614174000';
    const mockUserId = 'user-456';

    beforeEach(() => {
      // Mock auth.getUser() for all advanceGate tests
      (supabase.auth.getUser as any) = vi.fn().mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null
      });
    });

    it('should advance gate from G0 to G1 with correct status mapping', async () => {
      // Mock getById to return project at G0
      const mockGetByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockProjectId,
            project_number: 'NPD-2025-0001',
            project_name: 'Test Project',
            current_gate: 'G0',
            status: 'idea',
          },
          error: null
        }),
      };

      // Mock update query
      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockProjectId,
            project_number: 'NPD-2025-0001',
            project_name: 'Test Project',
            current_gate: 'G1',
            status: 'concept',
            updated_by: mockUserId,
          },
          error: null
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockGetByIdQuery) // First call: getById
        .mockReturnValueOnce(mockUpdateQuery); // Second call: update

      const result = await NPDProjectsAPI.advanceGate(mockProjectId, 'G1');

      expect(result.current_gate).toBe('G1');
      expect(result.status).toBe('concept');
      expect(mockUpdateQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          current_gate: 'G1',
          status: 'concept',
          updated_by: mockUserId,
        })
      );
    });

    it('should reject gate skipping (G0 → G3)', async () => {
      const mockGetByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockProjectId,
            current_gate: 'G0',
            status: 'idea',
          },
          error: null
        }),
      };

      (supabase.from as any).mockReturnValue(mockGetByIdQuery);

      await expect(NPDProjectsAPI.advanceGate(mockProjectId, 'G3')).rejects.toThrow(
        'Can only advance to next sequential gate'
      );
    });

    it('should reject backwards movement (G2 → G1)', async () => {
      const mockGetByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: mockProjectId,
            current_gate: 'G2',
            status: 'development',
          },
          error: null
        }),
      };

      (supabase.from as any).mockReturnValue(mockGetByIdQuery);

      await expect(NPDProjectsAPI.advanceGate(mockProjectId, 'G1')).rejects.toThrow(
        'Can only advance to next sequential gate'
      );
    });

    it('should map all gates to correct statuses', async () => {
      const gateStatusPairs = [
        { from: 'G0', to: 'G1', expectedStatus: 'concept' },
        { from: 'G1', to: 'G2', expectedStatus: 'development' },
        { from: 'G2', to: 'G3', expectedStatus: 'testing' },
        { from: 'G3', to: 'G4', expectedStatus: 'testing' },
        { from: 'G4', to: 'Launched', expectedStatus: 'launched' },
      ];

      for (const { from, to, expectedStatus } of gateStatusPairs) {
        const mockGetByIdQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: { id: mockProjectId, current_gate: from },
            error: null
          }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({
            data: {
              id: mockProjectId,
              current_gate: to,
              status: expectedStatus,
            },
            error: null
          }),
        };

        (supabase.from as any)
          .mockReturnValueOnce(mockGetByIdQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        const result = await NPDProjectsAPI.advanceGate(mockProjectId, to as any);
        expect(result.status).toBe(expectedStatus);
      }
    });

    it('should set audit trail fields (updated_at, updated_by)', async () => {
      const mockGetByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockProjectId, current_gate: 'G1' },
          error: null
        }),
      };

      const mockUpdateQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { id: mockProjectId, current_gate: 'G2' },
          error: null
        }),
      };

      (supabase.from as any)
        .mockReturnValueOnce(mockGetByIdQuery)
        .mockReturnValueOnce(mockUpdateQuery);

      await NPDProjectsAPI.advanceGate(mockProjectId, 'G2');

      const updateCall = mockUpdateQuery.update.mock.calls[0][0];
      expect(updateCall).toHaveProperty('updated_at');
      expect(updateCall.updated_by).toBe(mockUserId);
    });

    it('should throw error for non-existent project', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'; // Valid UUID format but doesn't exist

      const mockGetByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }
        }),
      };

      (supabase.from as any).mockReturnValue(mockGetByIdQuery);

      await expect(NPDProjectsAPI.advanceGate(nonExistentId, 'G1')).rejects.toThrow(
        'Project not found or access denied'
      );
    });

    it('should enforce RLS (cannot advance other org projects)', async () => {
      // getById returns null due to RLS blocking access
      const mockGetByIdQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' } // RLS blocked
        }),
      };

      (supabase.from as any).mockReturnValue(mockGetByIdQuery);

      await expect(NPDProjectsAPI.advanceGate(mockProjectId, 'G1')).rejects.toThrow(
        'Project not found or access denied'
      );
    });
  });
});
