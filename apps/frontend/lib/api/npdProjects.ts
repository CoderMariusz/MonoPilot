import { supabase } from '../supabase/client-browser';
import { createNPDProjectSchema, updateNPDProjectSchema, advanceGateSchema } from '../../../../packages/shared/schemas';

/**
 * NPD Projects API - CRUD operations for New Product Development projects
 * Implements Stage-Gate workflow tracking (G0 → G1 → G2 → G3 → G4 → Launched)
 *
 * @module NPDProjectsAPI
 * @since Epic NPD-1, Story NPD-1.1
 */

export interface NPDProject {
  id: string;
  org_id: number;
  project_number: string;
  project_name: string;
  description?: string | null;
  status: 'idea' | 'concept' | 'development' | 'testing' | 'on_hold' | 'launched' | 'cancelled';
  current_gate: 'G0' | 'G1' | 'G2' | 'G3' | 'G4' | 'Launched';
  priority: 'high' | 'medium' | 'low';
  portfolio_category?: string | null;
  owner_id?: string | null;
  target_launch_date?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface CreateNPDProjectInput {
  project_name: string;
  description?: string;
  status?: NPDProject['status'];
  current_gate?: NPDProject['current_gate'];
  priority?: NPDProject['priority'];
  portfolio_category?: string;
  owner_id?: string;
  target_launch_date?: string;
}

export interface UpdateNPDProjectInput {
  project_name?: string;
  description?: string;
  status?: NPDProject['status'];
  current_gate?: NPDProject['current_gate'];
  priority?: NPDProject['priority'];
  portfolio_category?: string;
  owner_id?: string;
  target_launch_date?: string;
}

export interface NPDProjectFilters {
  current_gate?: NPDProject['current_gate'];
  status?: NPDProject['status'];
  owner_id?: string;
  priority?: NPDProject['priority'];
}

// Type aliases for Stage-Gate workflow (Story NPD-1.2)
export type NPDProjectGate = NPDProject['current_gate'];
export type NPDProjectStatus = NPDProject['status'];

// Gate sequence for validation (Story NPD-1.2)
const GATE_SEQUENCE: NPDProjectGate[] = ['G0', 'G1', 'G2', 'G3', 'G4', 'Launched'];

// Gate-to-Status mapping for automatic status updates (Story NPD-1.2)
const GATE_STATUS_MAP: Record<NPDProjectGate, NPDProjectStatus> = {
  'G0': 'idea',
  'G1': 'concept',
  'G2': 'development',
  'G3': 'testing',
  'G4': 'testing',
  'Launched': 'launched'
};

/**
 * NPD Projects API Class
 * All methods enforce Row Level Security (RLS) via org_id session variable
 */
export class NPDProjectsAPI {
  /**
   * Get all NPD projects with optional filters
   * RLS: Automatically filtered by org_id
   *
   * @param filters - Optional filters for current_gate, status, owner_id, priority
   * @returns Promise<NPDProject[]>
   */
  static async getAll(filters?: NPDProjectFilters): Promise<NPDProject[]> {
    try {
      let query = supabase
        .from('npd_projects')
        .select('*');

      // Apply filters
      if (filters?.current_gate) {
        query = query.eq('current_gate', filters.current_gate);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching NPD projects:', error);
        throw new Error(`Failed to fetch NPD projects: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error in NPDProjectsAPI.getAll:', error);
      throw error;
    }
  }

  /**
   * Get NPD project by ID
   * RLS: Only returns project if it belongs to user's org
   *
   * @param id - Project UUID
   * @returns Promise<NPDProject | null>
   */
  static async getById(id: string): Promise<NPDProject | null> {
    try {
      const { data, error } = await supabase
        .from('npd_projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - either doesn't exist or RLS blocked
          return null;
        }
        console.error('Error fetching NPD project:', error);
        throw new Error(`Failed to fetch NPD project: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error in NPDProjectsAPI.getById:', error);
      throw error;
    }
  }

  /**
   * Create new NPD project
   * Auto-generates project_number in format: NPD-YYYY-XXXX
   * RLS: Automatically sets org_id from session context
   *
   * @param data - Project creation data
   * @returns Promise<NPDProject>
   */
  static async create(data: CreateNPDProjectInput): Promise<NPDProject> {
    try {
      // Validate input data with Zod schema
      const validated = createNPDProjectSchema.parse(data);

      // Get current user's org_id from session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get org_id from user metadata (assumes org_id is stored in user metadata or profile)
      // Note: This should be fetched from user's organization membership
      // For now, we'll let the database function handle it via RLS context
      // The function will use the session's org_id automatically via RLS

      // Generate project number atomically using PostgreSQL function
      // This prevents race conditions when multiple users create projects simultaneously
      const { data: numberData, error: numberError } = await supabase
        .rpc('generate_npd_project_number', {
          p_org_id: user.id // Note: Replace with actual org_id from user profile
        });

      if (numberError) {
        console.error('Error generating project number:', numberError);
        throw new Error(`Failed to generate project number: ${numberError.message}`);
      }

      const project_number = numberData as string;

      // Insert project with auto-generated number
      const { data: project, error } = await supabase
        .from('npd_projects')
        .insert({
          project_number,
          project_name: validated.project_name,
          description: validated.description || null,
          status: validated.status || 'idea',
          current_gate: validated.current_gate || 'G0',
          priority: validated.priority || 'medium',
          portfolio_category: validated.portfolio_category || null,
          owner_id: validated.owner_id || null,
          target_launch_date: validated.target_launch_date || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating NPD project:', error);
        throw new Error(`Failed to create NPD project: ${error.message}`);
      }

      return project;
    } catch (error) {
      console.error('Error in NPDProjectsAPI.create:', error);
      throw error;
    }
  }

  /**
   * Update NPD project
   * Immutable fields: project_number, org_id
   * RLS: Only updates if project belongs to user's org
   *
   * @param id - Project UUID
   * @param data - Project update data
   * @returns Promise<NPDProject>
   */
  static async update(id: string, data: UpdateNPDProjectInput): Promise<NPDProject> {
    try {
      // Validate input data with Zod schema
      const validated = updateNPDProjectSchema.parse(data);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Only include provided fields (prevent updating project_number, org_id)
      if (validated.project_name !== undefined) updateData.project_name = validated.project_name;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.status !== undefined) updateData.status = validated.status;
      if (validated.current_gate !== undefined) updateData.current_gate = validated.current_gate;
      if (validated.priority !== undefined) updateData.priority = validated.priority;
      if (validated.portfolio_category !== undefined) updateData.portfolio_category = validated.portfolio_category;
      if (validated.owner_id !== undefined) updateData.owner_id = validated.owner_id;
      if (validated.target_launch_date !== undefined) updateData.target_launch_date = validated.target_launch_date;

      const { data: project, error } = await supabase
        .from('npd_projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating NPD project:', error);
        throw new Error(`Failed to update NPD project: ${error.message}`);
      }

      return project;
    } catch (error) {
      console.error('Error in NPDProjectsAPI.update:', error);
      throw error;
    }
  }

  /**
   * Delete NPD project (soft delete)
   * Sets status to 'cancelled' instead of hard delete for audit trail
   * RLS: Only deletes if project belongs to user's org
   *
   * @param id - Project UUID
   * @returns Promise<void>
   */
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('npd_projects')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting NPD project:', error);
        throw new Error(`Failed to delete NPD project: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in NPDProjectsAPI.delete:', error);
      throw error;
    }
  }

  /**
   * Advance NPD project through Stage-Gate workflow
   * Validates sequential gate progression and automatically updates status
   * RLS: Only advances projects belonging to user's org
   *
   * @param id - Project UUID
   * @param toGate - Target gate (must be next sequential gate)
   * @returns Promise<NPDProject> - Updated project with new gate and status
   *
   * @throws {Error} If validation fails (invalid gate, non-sequential progression)
   * @throws {Error} If project not found or RLS blocks access
   *
   * @example
   * ```typescript
   * // Advance project from G0 to G1
   * const project = await NPDProjectsAPI.advanceGate(
   *   '123e4567-e89b-12d3-a456-426614174000',
   *   'G1'
   * );
   * // Returns: { id: '...', current_gate: 'G1', status: 'concept', ... }
   * ```
   *
   * @since Epic NPD-1, Story NPD-1.2
   */
  static async advanceGate(id: string, toGate: NPDProjectGate): Promise<NPDProject> {
    try {
      // Validate input with Zod schema
      const validated = advanceGateSchema.parse({ id, toGate });

      // Get current project to check current gate
      const currentProject = await this.getById(validated.id);

      if (!currentProject) {
        throw new Error(`Project not found or access denied: ${validated.id}`);
      }

      const currentGate = currentProject.current_gate;

      // Validate sequential gate progression
      const currentIndex = GATE_SEQUENCE.indexOf(currentGate);
      const targetIndex = GATE_SEQUENCE.indexOf(validated.toGate);

      if (currentIndex === -1) {
        throw new Error(`Invalid current gate: ${currentGate}`);
      }

      if (targetIndex === -1) {
        throw new Error(`Invalid target gate: ${validated.toGate}`);
      }

      // Check if advancing to next sequential gate
      const expectedNextIndex = currentIndex + 1;

      if (targetIndex !== expectedNextIndex) {
        const expectedNext = GATE_SEQUENCE[expectedNextIndex] || 'none (already at final gate)';
        throw new Error(
          `Can only advance to next sequential gate. Current: ${currentGate}, Expected: ${expectedNext}, Attempted: ${validated.toGate}`
        );
      }

      // Map gate to status
      const newStatus = GATE_STATUS_MAP[validated.toGate];

      if (!newStatus) {
        throw new Error(`No status mapping for gate: ${validated.toGate}`);
      }

      // Get current user for audit trail
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // TODO: Implement gate entry criteria check in Story NPD-1.4
      // Gate checklists validation will be added when npd_gate_checklists table is created

      // Update project atomically (current_gate + status + audit fields)
      const { data: updatedProject, error } = await supabase
        .from('npd_projects')
        .update({
          current_gate: validated.toGate,
          status: newStatus,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        })
        .eq('id', validated.id)
        .select()
        .single();

      if (error) {
        console.error('Error advancing gate:', error);
        throw new Error(`Failed to advance gate: ${error.message}`);
      }

      return updatedProject;
    } catch (error) {
      console.error('Error in NPDProjectsAPI.advanceGate:', error);
      throw error;
    }
  }
}
