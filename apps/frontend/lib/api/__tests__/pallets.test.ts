/**
 * Unit Tests for PalletsAPI
 * EPIC-002 Scanner & Warehouse v2 - Phase 3: Pallet Management
 *
 * Tests cover:
 * - Pallet creation with auto-generated numbers
 * - Adding/removing LPs to/from pallets
 * - Closing and reopening pallets
 * - Status transitions (open → closed → shipped)
 * - Business rule validations
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PalletsAPI } from '../pallets';

// Mock the supabase client
vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('PalletsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create()', () => {
    it('should create pallet with auto-generated pallet number', async () => {
      const mockLastPallet = {
        pallet_number: 'PALLET-2025-000005',
      };

      const mockNewPallet = {
        id: 10,
        pallet_number: 'PALLET-2025-000006',
        pallet_type: 'EURO',
        status: 'open',
      };

      // Mock the chain: from → select → like → order → limit → single
      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            like: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockLastPallet,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockNewPallet,
                error: null,
              }),
            }),
          }),
        } as any);

      const result = await PalletsAPI.create({
        pallet_type: 'EURO',
        userId: 'user-123',
      });

      expect(result.pallet_number).toBe('PALLET-2025-000006');
      expect(result.id).toBe(10);
    });

    it('should create pallet with custom pallet number', async () => {
      const mockNewPallet = {
        id: 11,
        pallet_number: 'CUSTOM-PALLET-001',
        pallet_type: 'CHEP',
        status: 'open',
      };

      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockNewPallet,
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await PalletsAPI.create({
        pallet_number: 'CUSTOM-PALLET-001',
        pallet_type: 'CHEP',
        userId: 'user-123',
      });

      expect(result.pallet_number).toBe('CUSTOM-PALLET-001');
    });

    it('should create pallet with work order and location', async () => {
      const mockNewPallet = {
        id: 12,
        pallet_number: 'PALLET-2025-000001',
        pallet_type: 'EURO',
        wo_id: 5,
        location_id: 10,
        status: 'open',
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            like: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: 'PGRST116' }, // No rows found
                  }),
                }),
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockNewPallet,
                error: null,
              }),
            }),
          }),
        } as any);

      const result = await PalletsAPI.create({
        pallet_type: 'EURO',
        wo_id: 5,
        location_id: 10,
        line: 'Line 1',
        target_boxes: 100,
        userId: 'user-123',
      });

      expect(result.id).toBe(12);
      expect(result.pallet_number).toBe('PALLET-2025-000001'); // First pallet of year
    });
  });

  describe('addLP()', () => {
    it('should add LP to open pallet', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      const mockLP = {
        id: 100,
        lp_number: 'LP-2025-001',
        quantity: '500',
        uom: 'kg',
        is_consumed: false,
        qa_status: 'Passed',
      };

      const mockItem = {
        id: 50,
        pallet_id: 1,
        lp_id: 100,
        quantity: 500,
      };

      vi.mocked(supabase.from)
        // Get pallet
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        // Get LP
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockLP,
                error: null,
              }),
            }),
          }),
        } as any)
        // Check if LP already on pallet
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: 'PGRST116' }, // Not found
                }),
              }),
            }),
          }),
        } as any)
        // Insert pallet item
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockItem,
                error: null,
              }),
            }),
          }),
        } as any);

      const result = await PalletsAPI.addLP({
        pallet_id: 1,
        lp_id: 100,
        userId: 'user-123',
      });

      expect(result.lp_number).toBe('LP-2025-001');
    });

    it('should fail if pallet is closed', async () => {
      const mockPallet = {
        id: 1,
        status: 'closed',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPallet,
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(
        PalletsAPI.addLP({
          pallet_id: 1,
          lp_id: 100,
          userId: 'user-123',
        })
      ).rejects.toThrow('Cannot add LP to closed pallet');
    });

    it('should fail if LP is consumed', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      const mockLP = {
        id: 100,
        lp_number: 'LP-2025-001',
        is_consumed: true,
        qa_status: 'Passed',
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockLP,
                error: null,
              }),
            }),
          }),
        } as any);

      await expect(
        PalletsAPI.addLP({
          pallet_id: 1,
          lp_id: 100,
          userId: 'user-123',
        })
      ).rejects.toThrow('Cannot add consumed LP to pallet');
    });

    it('should fail if LP QA status is not Passed', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      const mockLP = {
        id: 100,
        lp_number: 'LP-2025-001',
        is_consumed: false,
        qa_status: 'pending',
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockLP,
                error: null,
              }),
            }),
          }),
        } as any);

      await expect(
        PalletsAPI.addLP({
          pallet_id: 1,
          lp_id: 100,
          userId: 'user-123',
        })
      ).rejects.toThrow(
        "Cannot add LP with QA status Pending. Only 'Passed' LPs can be added"
      );
    });

    it('should fail if LP is already on pallet', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      const mockLP = {
        id: 100,
        lp_number: 'LP-2025-001',
        is_consumed: false,
        qa_status: 'Passed',
      };

      const mockExisting = {
        id: 1,
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockLP,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockExisting,
                  error: null,
                }),
              }),
            }),
          }),
        } as any);

      await expect(
        PalletsAPI.addLP({
          pallet_id: 1,
          lp_id: 100,
          userId: 'user-123',
        })
      ).rejects.toThrow('This LP is already on the pallet');
    });
  });

  describe('removeLP()', () => {
    it('should remove LP from open pallet', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
        } as any);

      await expect(
        PalletsAPI.removeLP({
          pallet_id: 1,
          lp_id: 100,
          userId: 'user-123',
        })
      ).resolves.toBeUndefined();
    });

    it('should fail if pallet is closed', async () => {
      const mockPallet = {
        id: 1,
        status: 'closed',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPallet,
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(
        PalletsAPI.removeLP({
          pallet_id: 1,
          lp_id: 100,
          userId: 'user-123',
        })
      ).rejects.toThrow('Cannot remove LP from closed pallet');
    });
  });

  describe('close()', () => {
    it('should close pallet with items', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      const mockItems = [{ id: 1 }, { id: 2 }];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockItems,
              error: null,
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        } as any);

      await expect(
        PalletsAPI.close({
          pallet_id: 1,
          actual_boxes: 100,
          userId: 'user-123',
        })
      ).resolves.toBeUndefined();
    });

    it('should fail if pallet is empty', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        } as any);

      await expect(
        PalletsAPI.close({
          pallet_id: 1,
          userId: 'user-123',
        })
      ).rejects.toThrow('Cannot close empty pallet');
    });

    it('should fail if pallet is already closed', async () => {
      const mockPallet = {
        id: 1,
        status: 'closed',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPallet,
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(
        PalletsAPI.close({
          pallet_id: 1,
          userId: 'user-123',
        })
      ).rejects.toThrow('Pallet is already closed');
    });
  });

  describe('reopen()', () => {
    it('should reopen closed pallet', async () => {
      const mockPallet = {
        id: 1,
        status: 'closed',
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        } as any);

      await expect(
        PalletsAPI.reopen({
          pallet_id: 1,
          userId: 'user-123',
        })
      ).resolves.toBeUndefined();
    });

    it('should fail if pallet is shipped', async () => {
      const mockPallet = {
        id: 1,
        status: 'shipped',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPallet,
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(
        PalletsAPI.reopen({
          pallet_id: 1,
          userId: 'user-123',
        })
      ).rejects.toThrow('Cannot reopen shipped pallet');
    });
  });

  describe('markShipped()', () => {
    it('should mark closed pallet as shipped', async () => {
      const mockPallet = {
        id: 1,
        status: 'closed',
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        } as any);

      await expect(
        PalletsAPI.markShipped({
          pallet_id: 1,
          userId: 'user-123',
        })
      ).resolves.toBeUndefined();
    });

    it('should fail if pallet is not closed', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPallet,
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(
        PalletsAPI.markShipped({
          pallet_id: 1,
          userId: 'user-123',
        })
      ).rejects.toThrow('Only closed pallets can be marked as shipped');
    });
  });

  describe('delete()', () => {
    it('should delete empty open pallet', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              error: null,
            }),
          }),
        } as any);

      await expect(PalletsAPI.delete(1)).resolves.toBeUndefined();
    });

    it('should fail if pallet is closed', async () => {
      const mockPallet = {
        id: 1,
        status: 'closed',
      };

      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockPallet,
              error: null,
            }),
          }),
        }),
      } as any);

      await expect(PalletsAPI.delete(1)).rejects.toThrow(
        'Cannot delete closed pallet'
      );
    });

    it('should fail if pallet has items', async () => {
      const mockPallet = {
        id: 1,
        status: 'open',
      };

      const mockItems = [{ id: 1 }];

      vi.mocked(supabase.from)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockPallet,
                error: null,
              }),
            }),
          }),
        } as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockItems,
              error: null,
            }),
          }),
        } as any);

      await expect(PalletsAPI.delete(1)).rejects.toThrow(
        'Cannot delete pallet with items'
      );
    });
  });
});
