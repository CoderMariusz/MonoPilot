import type {
  WorkOrder,
  PurchaseOrder,
  TransferOrder,
  CreateWorkOrderData,
  UpdateWorkOrderData,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  CreateTransferOrderData,
  UpdateTransferOrderData,
  YieldReport,
  ConsumeReport,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
  
  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`API error: ${res.statusText}`);
    }

    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return null as T;
    }

    return res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
}

export const api = {
  workOrders: {
    list: () => fetchAPI<WorkOrder[]>('/work-orders'),
    get: (id: number) => fetchAPI<WorkOrder>(`/work-orders/${id}`),
    create: (data: CreateWorkOrderData) => fetchAPI<WorkOrder>('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: UpdateWorkOrderData) => fetchAPI<WorkOrder>(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<null>(`/work-orders/${id}`, { method: 'DELETE' }),
  },
  purchaseOrders: {
    list: () => fetchAPI<PurchaseOrder[]>('/purchase-orders'),
    get: (id: number) => fetchAPI<PurchaseOrder>(`/purchase-orders/${id}`),
    create: (data: CreatePurchaseOrderData) => fetchAPI<PurchaseOrder>('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: UpdatePurchaseOrderData) => fetchAPI<PurchaseOrder>(`/purchase-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<null>(`/purchase-orders/${id}`, { method: 'DELETE' }),
  },
  transferOrders: {
    list: () => fetchAPI<TransferOrder[]>('/transfer-orders'),
    get: (id: number) => fetchAPI<TransferOrder>(`/transfer-orders/${id}`),
    create: (data: CreateTransferOrderData) => fetchAPI<TransferOrder>('/transfer-orders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: UpdateTransferOrderData) => fetchAPI<TransferOrder>(`/transfer-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<null>(`/transfer-orders/${id}`, { method: 'DELETE' }),
  },
  production: {
    yieldReport: (dateFrom?: string, dateTo?: string) => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const query = params.toString() ? `?${params.toString()}` : '';
      return fetchAPI<YieldReport>(`/production/yield-report${query}`);
    },
    consumeReport: (dateFrom?: string, dateTo?: string) => {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const query = params.toString() ? `?${params.toString()}` : '';
      return fetchAPI<ConsumeReport>(`/production/consume-report${query}`);
    },
  },
};
