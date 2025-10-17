import { NextRequest } from 'next/server';
import { POST } from '@/app/api/scanner/process/[woId]/operations/[seq]/stage/route';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 1,
              seq_no: 1,
              status: 'PENDING',
              wo_id: 1
            },
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: { id: 1 },
            error: null
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null
        }))
      })),
      rpc: jest.fn(() => ({
        data: 100,
        error: null
      }))
    }))
  }
}));

describe('Scanner Staging API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should stage an LP successfully', async () => {
    const request = new NextRequest('http://localhost:3000/api/scanner/process/1/operations/1/stage', {
      method: 'POST',
      body: JSON.stringify({
        lp_id: 1,
        quantity: 100
      })
    });

    const response = await POST(request, { params: { woId: '1', seq: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lp_number).toBeDefined();
    expect(data.quantity_staged).toBe(100);
  });

  it('should reject staging with invalid LP ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/scanner/process/1/operations/1/stage', {
      method: 'POST',
      body: JSON.stringify({
        lp_id: null,
        quantity: 100
      })
    });

    const response = await POST(request, { params: { woId: '1', seq: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('LP ID and positive quantity are required');
  });

  it('should reject staging with negative quantity', async () => {
    const request = new NextRequest('http://localhost:3000/api/scanner/process/1/operations/1/stage', {
      method: 'POST',
      body: JSON.stringify({
        lp_id: 1,
        quantity: -100
      })
    });

    const response = await POST(request, { params: { woId: '1', seq: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('LP ID and positive quantity are required');
  });

  it('should reject staging for non-actionable operation', async () => {
    // Mock operation with COMPLETED status
    const mockSupabase = require('@/lib/supabase/client').supabase;
    mockSupabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: {
              id: 1,
              seq_no: 1,
              status: 'COMPLETED', // Not actionable
              wo_id: 1
            },
            error: null
          }))
        }))
      }))
    });

    const request = new NextRequest('http://localhost:3000/api/scanner/process/1/operations/1/stage', {
      method: 'POST',
      body: JSON.stringify({
        lp_id: 1,
        quantity: 100
      })
    });

    const response = await POST(request, { params: { woId: '1', seq: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('is not actionable');
  });

  it('should handle invalid work order ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/scanner/process/invalid/operations/1/stage', {
      method: 'POST',
      body: JSON.stringify({
        lp_id: 1,
        quantity: 100
      })
    });

    const response = await POST(request, { params: { woId: 'invalid', seq: '1' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid work order ID or operation sequence');
  });

  it('should handle invalid operation sequence', async () => {
    const request = new NextRequest('http://localhost:3000/api/scanner/process/1/operations/invalid/stage', {
      method: 'POST',
      body: JSON.stringify({
        lp_id: 1,
        quantity: 100
      })
    });

    const response = await POST(request, { params: { woId: '1', seq: 'invalid' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid work order ID or operation sequence');
  });
});
