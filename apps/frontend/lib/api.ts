import type {
  WorkOrder,
  PurchaseOrder,
  TransferOrder,
  Product,
  ProductLineSettings,
  Machine,
  CreateWorkOrderData,
  UpdateWorkOrderData,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
  CreateTransferOrderData,
  UpdateTransferOrderData,
  CreateProductData,
  UpdateProductData,
  BulkUpsertLineSettingsData,
  UpdateLineSettingData,
  YieldReport,
  ConsumeReport,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '/api';

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  console.log('fetchAPI called with endpoint:', endpoint);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const method = (options.method as string) || 'GET';
    xhr.open(method, `${API_URL}${endpoint}`);
    
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value as string);
        }
      });
    }
    
    xhr.onload = () => {
      console.log('XHR loaded, status:', xhr.status);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        if (xhr.status === 204 || xhr.responseText === '') {
          console.log('Empty response');
          resolve(null as T);
        } else {
          try {
            console.log('Parsing response, length:', xhr.responseText.length);
            const data = JSON.parse(xhr.responseText);
            console.log('Successfully parsed JSON');
            resolve(data as T);
          } catch (e) {
            console.error('JSON parse error:', e);
            reject(new Error('Failed to parse JSON'));
          }
        }
      } else {
        console.error('XHR error status:', xhr.status);
        reject(new Error(`API error: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => {
      console.error('XHR network error');
      reject(new Error('Network error'));
    };
    
    xhr.ontimeout = () => {
      console.error('XHR timeout');
      reject(new Error('Request timeout'));
    };
    
    xhr.timeout = 30000;
    
    if (options.body) {
      xhr.send(options.body as string);
    } else {
      xhr.send();
    }
  });
}

export const api = {
  workOrders: {
    list: () => fetchAPI<WorkOrder[]>('/work-orders'),
    get: (id: number) => fetchAPI<WorkOrder>(`/work-orders/${id}`),
    getDetails: (id: number) => fetchAPI<any>(`/work-orders/${id}/details`),
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
  products: {
    list: (params?: { category?: string; type?: string; search?: string; expiry_policy?: string; page?: number }) => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append('category', params.category);
      if (params?.type) searchParams.append('type', params.type);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.expiry_policy) searchParams.append('expiry_policy', params.expiry_policy);
      if (params?.page) searchParams.append('page', params.page.toString());
      const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return fetchAPI<{ data: Product[]; current_page: number; last_page: number; total: number }>(`/products${query}`);
    },
    get: (id: number) => fetchAPI<Product>(`/products/${id}`),
    create: (data: CreateProductData) => fetchAPI<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: UpdateProductData) => fetchAPI<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<null>(`/products/${id}`, { method: 'DELETE' }),
  },
  lineSettings: {
    getByProduct: (productId: number) => fetchAPI<ProductLineSettings[]>(`/products/${productId}/line-settings`),
    bulkUpsert: (productId: number, data: BulkUpsertLineSettingsData) => fetchAPI<ProductLineSettings[]>(`/products/${productId}/line-settings`, { method: 'POST', body: JSON.stringify(data) }),
    list: (productId: number) => {
      const params = new URLSearchParams();
      params.append('product_id', productId.toString());
      return fetchAPI<ProductLineSettings[]>(`/line-settings?${params.toString()}`);
    },
    update: (id: number, data: UpdateLineSettingData) => fetchAPI<ProductLineSettings>(`/line-settings/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: number) => fetchAPI<null>(`/line-settings/${id}`, { method: 'DELETE' }),
  },
  machines: {
    list: () => fetchAPI<Machine[]>('/machines'),
    get: (id: number) => fetchAPI<Machine>(`/machines/${id}`),
  },
};
