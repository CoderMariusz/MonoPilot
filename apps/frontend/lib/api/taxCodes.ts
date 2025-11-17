import type { TaxCode } from '@/lib/types';

export class TaxCodesAPI {
  static async getAll(): Promise<TaxCode[]> {
    const response = await fetch('/api/settings/tax-codes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error fetching tax codes:', error);
      throw new Error('Failed to fetch tax codes');
    }

    return response.json();
  }

  static async getById(id: number): Promise<TaxCode> {
    const allTaxCodes = await this.getAll();
    const taxCode = allTaxCodes.find(tc => tc.id === id);

    if (!taxCode) {
      throw new Error('Tax code not found');
    }

    return taxCode;
  }

  static async create(data: Omit<TaxCode, 'id' | 'created_at' | 'updated_at'>): Promise<TaxCode> {
    const response = await fetch('/api/settings/tax-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: data.code,
        description: data.description || null,
        rate: data.rate,
        is_active: data.is_active ?? true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error creating tax code:', error);
      throw new Error('Failed to create tax code');
    }

    return response.json();
  }

  static async update(id: number, data: Partial<Omit<TaxCode, 'id' | 'created_at' | 'updated_at'>>): Promise<TaxCode> {
    const response = await fetch(`/api/settings/tax-codes?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error updating tax code:', error);
      throw new Error('Failed to update tax code');
    }

    return response.json();
  }

  static async delete(id: number): Promise<void> {
    const response = await fetch(`/api/settings/tax-codes?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error deleting tax code:', error);
      throw new Error('Failed to delete tax code');
    }
  }
}
