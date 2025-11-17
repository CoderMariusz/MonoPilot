import { supabase } from '@/lib/supabase/client-browser';

// Template Types
export interface WOTemplate {
  id: number;
  org_id: number;
  template_name: string;
  description: string | null;
  product_id: number;
  config_json: WOTemplateConfig;
  is_default: boolean;
  usage_count: number;
  last_used_at: string | null;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  product?: {
    id: number;
    part_number: string;
    description: string;
  };
  line?: {
    id: number;
    name: string;
  };
  created_by_user?: {
    id: number;
    name: string;
  };
}

export interface WOTemplateConfig {
  product_id: number;
  bom_id: number | null;
  line_id: number | null;
  shift: string | null;
  notes: string | null;
  priority: string | null;
  operations?: WOTemplateOperation[];
}

export interface WOTemplateOperation {
  seq: number;
  name: string;
  expected_yield_pct: number;
}

export interface CreateWOTemplateData {
  template_name: string;
  description?: string;
  product_id: number;
  config_json: WOTemplateConfig;
  is_default?: boolean;
}

export interface UpdateWOTemplateData {
  template_name?: string;
  description?: string | null;
  config_json?: WOTemplateConfig;
  is_default?: boolean;
}

export interface ApplyTemplateOverrides {
  quantity?: number;
  scheduled_date?: string;
  priority?: string;
}

export class WOTemplatesAPI {
  /**
   * Get all templates with optional filtering
   */
  static async getAll(filters?: {
    product_id?: number;
    line_id?: number;
    created_by?: number;
    search?: string;
  }): Promise<WOTemplate[]> {
    let query = supabase
      .from('wo_templates')
      .select(`
        *,
        product:products!wo_templates_product_id_fkey(
          id,
          part_number,
          description
        ),
        created_by_user:users!wo_templates_created_by_fkey(
          id,
          name
        )
      `)
      .order('usage_count', { ascending: false })
      .order('template_name');

    // Apply filters
    if (filters?.product_id) {
      query = query.eq('product_id', filters.product_id);
    }

    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    if (filters?.line_id) {
      // Filter by line_id in config_json
      query = query.contains('config_json', { line_id: filters.line_id });
    }

    if (filters?.search) {
      query = query.or(`template_name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching WO templates:', error);
      throw new Error('Failed to fetch WO templates');
    }

    return data || [];
  }

  /**
   * Get template by ID
   */
  static async getById(id: number): Promise<WOTemplate | null> {
    const { data, error } = await supabase
      .from('wo_templates')
      .select(`
        *,
        product:products!wo_templates_product_id_fkey(
          id,
          part_number,
          description
        ),
        created_by_user:users!wo_templates_created_by_fkey(
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching WO template:', error);
      throw new Error('Failed to fetch WO template');
    }

    return data;
  }

  /**
   * Get default template for a product
   */
  static async getDefaultForProduct(product_id: number): Promise<WOTemplate | null> {
    const { data, error } = await supabase
      .from('wo_templates')
      .select(`
        *,
        product:products!wo_templates_product_id_fkey(
          id,
          part_number,
          description
        )
      `)
      .eq('product_id', product_id)
      .eq('is_default', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No default template
      }
      console.error('Error fetching default template:', error);
      throw new Error('Failed to fetch default template');
    }

    return data;
  }

  /**
   * Get popular templates (top N by usage_count)
   */
  static async getPopular(limit: number = 5): Promise<WOTemplate[]> {
    const { data, error } = await supabase
      .from('wo_templates')
      .select(`
        *,
        product:products!wo_templates_product_id_fkey(
          id,
          part_number,
          description
        )
      `)
      .order('usage_count', { ascending: false })
      .order('last_used_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching popular templates:', error);
      throw new Error('Failed to fetch popular templates');
    }

    return data || [];
  }

  /**
   * Create a new template
   */
  static async create(templateData: CreateWOTemplateData): Promise<WOTemplate> {
    // If is_default is true, we need to unset other default templates for this product first
    if (templateData.is_default) {
      await this.unsetDefaultForProduct(templateData.product_id);
    }

    const { data, error } = await supabase
      .from('wo_templates')
      .insert({
        template_name: templateData.template_name,
        description: templateData.description || null,
        product_id: templateData.product_id,
        config_json: templateData.config_json,
        is_default: templateData.is_default || false,
        usage_count: 0,
      })
      .select(`
        *,
        product:products!wo_templates_product_id_fkey(
          id,
          part_number,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Error creating WO template:', error);
      throw new Error('Failed to create WO template');
    }

    return data;
  }

  /**
   * Update a template
   */
  static async update(id: number, updates: UpdateWOTemplateData): Promise<WOTemplate> {
    // If setting as default, unset other defaults for this product
    if (updates.is_default === true) {
      const template = await this.getById(id);
      if (template) {
        await this.unsetDefaultForProduct(template.product_id, id);
      }
    }

    const { data, error } = await supabase
      .from('wo_templates')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        product:products!wo_templates_product_id_fkey(
          id,
          part_number,
          description
        )
      `)
      .single();

    if (error) {
      console.error('Error updating WO template:', error);
      throw new Error('Failed to update WO template');
    }

    return data;
  }

  /**
   * Delete a template
   */
  static async delete(id: number): Promise<void> {
    const { error } = await supabase.from('wo_templates').delete().eq('id', id);

    if (error) {
      console.error('Error deleting WO template:', error);
      throw new Error('Failed to delete WO template');
    }
  }

  /**
   * Duplicate a template
   */
  static async duplicate(id: number, newName: string): Promise<WOTemplate> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error('Template not found');
    }

    return this.create({
      template_name: newName,
      description: original.description || undefined,
      product_id: original.product_id,
      config_json: original.config_json,
      is_default: false, // Duplicates are never default
    });
  }

  /**
   * Apply template - returns config to pre-fill WO creation form
   */
  static async applyTemplate(
    templateId: number,
    overrides?: ApplyTemplateOverrides
  ): Promise<WOTemplateConfig & ApplyTemplateOverrides> {
    const template = await this.getById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Increment usage count and update last_used_at
    await supabase
      .from('wo_templates')
      .update({
        usage_count: template.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', templateId);

    // Process template variables in config
    const processedConfig = this.processTemplateVariables(template.config_json);

    // Merge with overrides
    return {
      ...processedConfig,
      ...overrides,
    };
  }

  /**
   * Process template variables like {TODAY}, {TOMORROW}, {NEXT_MONDAY}
   */
  private static processTemplateVariables(config: WOTemplateConfig): WOTemplateConfig {
    // For now, this is a placeholder - template variables would be processed here
    // Example: Replace {TODAY} with current date, {TOMORROW} with tomorrow, etc.
    return config;
  }

  /**
   * Unset default flag for all templates of a product (except optionally one)
   */
  private static async unsetDefaultForProduct(
    product_id: number,
    except_id?: number
  ): Promise<void> {
    let query = supabase
      .from('wo_templates')
      .update({ is_default: false })
      .eq('product_id', product_id)
      .eq('is_default', true);

    if (except_id) {
      query = query.neq('id', except_id);
    }

    const { error } = await query;

    if (error) {
      console.error('Error unsetting default templates:', error);
      // Don't throw - this is a cleanup operation
    }
  }

  /**
   * Validate template config before applying
   */
  static async validateTemplate(templateId: number): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const template = await this.getById(templateId);
    if (!template) {
      return { valid: false, errors: ['Template not found'] };
    }

    const errors: string[] = [];

    // Check if product still exists
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', template.config_json.product_id)
      .single();

    if (!product) {
      errors.push('Product no longer exists');
    }

    // Check if BOM still exists (if specified)
    if (template.config_json.bom_id) {
      const { data: bom } = await supabase
        .from('boms')
        .select('id, status')
        .eq('id', template.config_json.bom_id)
        .single();

      if (!bom) {
        errors.push('BOM no longer exists');
      } else if (bom.status !== 'ACTIVE') {
        errors.push('BOM is not active');
      }
    }

    // Check if production line still exists (if specified)
    if (template.config_json.line_id) {
      const { data: line } = await supabase
        .from('production_lines')
        .select('id')
        .eq('id', template.config_json.line_id)
        .single();

      if (!line) {
        errors.push('Production line no longer exists');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
