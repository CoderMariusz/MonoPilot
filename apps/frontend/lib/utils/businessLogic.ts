/**
 * Business Logic Utilities for Production Module
 * Implements the core business rules for the production system
 */

import { supabase } from '../supabase/client';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface OneToOneValidation {
  isOneToOne: boolean;
  inputLPs: string[];
  outputLPs: string[];
  isValid: boolean;
  error?: string;
}

export interface CrossWOValidation {
  isValid: boolean;
  error?: string;
  expectedProductId: number;
  expectedStageSuffix: string;
  actualProductId: number;
  actualStageSuffix: string;
}

export interface ReservationCheck {
  availableQty: number;
  reservedQty: number;
  totalQty: number;
  canReserve: boolean;
  error?: string;
}

/**
 * Sequential Routing Enforcement
 * Ensures operations are completed in sequence
 */
export class SequentialRoutingValidator {
  static async validateOperationSequence(
    woId: number, 
    operationSeq: number, 
    action: 'start' | 'complete' | 'record_weights'
  ): Promise<ValidationResult> {
    try {
      // Get current work order state
      const { data: wo, error: woError } = await supabase
        .from('work_orders')
        .select('current_operation_seq, status')
        .eq('id', woId)
        .single();

      if (woError) throw woError;

      // Check if work order is in progress
      if (wo.status !== 'in_progress') {
        return {
          isValid: false,
          error: 'Work order must be in progress to perform operations'
        };
      }

      // Get all operations for this WO
      const { data: operations, error: opsError } = await supabase
        .from('wo_operations')
        .select('sequence, status, actual_input_weight, actual_output_weight')
        .eq('wo_id', woId)
        .order('sequence');

      if (opsError) throw opsError;

      const currentSeq = wo.current_operation_seq || 1;
      const targetOperation = operations.find(op => op.sequence === operationSeq);

      if (!targetOperation) {
        return {
          isValid: false,
          error: `Operation ${operationSeq} not found for work order ${woId}`
        };
      }

      // Validate sequence based on action
      switch (action) {
        case 'start':
          if (operationSeq !== currentSeq) {
            return {
              isValid: false,
              error: `Cannot start operation ${operationSeq}. Current operation is ${currentSeq}`
            };
          }
          break;

        case 'record_weights':
          if (operationSeq !== currentSeq) {
            return {
              isValid: false,
              error: `Cannot record weights for operation ${operationSeq}. Current operation is ${currentSeq}`
            };
          }
          break;

        case 'complete':
          if (operationSeq !== currentSeq) {
            return {
              isValid: false,
              error: `Cannot complete operation ${operationSeq}. Current operation is ${currentSeq}`
            };
          }
          
          // Check if weights are recorded
          if (!targetOperation.actual_input_weight || !targetOperation.actual_output_weight) {
            return {
              isValid: false,
              error: 'Cannot complete operation without recording input and output weights'
            };
          }
          break;
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async getNextOperation(woId: number): Promise<number | null> {
    try {
      const { data: wo, error } = await supabase
        .from('work_orders')
        .select('current_operation_seq')
        .eq('id', woId)
        .single();

      if (error) throw error;
      return wo.current_operation_seq ? wo.current_operation_seq + 1 : 1;
    } catch {
      return null;
    }
  }
}

/**
 * Hard 1:1 Component Rule Validation
 * Enforces one-to-one relationships for specific materials
 */
export class OneToOneValidator {
  static async validateOneToOneRule(
    woId: number,
    operationSeq: number,
    inputLPs: string[],
    outputLPs: string[]
  ): Promise<OneToOneValidation> {
    try {
      // Get materials for this operation
      const { data: materials, error } = await supabase
        .from('wo_materials')
        .select('material_id, one_to_one, quantity')
        .eq('wo_id', woId)
        .eq('sequence', operationSeq);

      if (error) throw error;

      const oneToOneMaterials = materials.filter(m => m.one_to_one);
      
      if (oneToOneMaterials.length === 0) {
        return {
          isOneToOne: false,
          inputLPs,
          outputLPs,
          isValid: true
        };
      }

      // For 1:1 components, validate exact 1:1 relationship
      if (inputLPs.length !== outputLPs.length) {
        return {
          isOneToOne: true,
          inputLPs,
          outputLPs,
          isValid: false,
          error: `One-to-one components require exactly one input LP per output LP. Found ${inputLPs.length} inputs and ${outputLPs.length} outputs`
        };
      }

      // Validate that each input LP has exactly one corresponding output LP
      if (inputLPs.length !== new Set(inputLPs).size) {
        return {
          isOneToOne: true,
          inputLPs,
          outputLPs,
          isValid: false,
          error: 'Duplicate input LPs found. One-to-one components require unique input LPs'
        };
      }

      if (outputLPs.length !== new Set(outputLPs).size) {
        return {
          isOneToOne: true,
          inputLPs,
          outputLPs,
          isValid: false,
          error: 'Duplicate output LPs found. One-to-one components require unique output LPs'
        };
      }

      return {
        isOneToOne: true,
        inputLPs,
        outputLPs,
        isValid: true
      };
    } catch (error) {
      return {
        isOneToOne: false,
        inputLPs,
        outputLPs,
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async getOneToOneMaterials(woId: number, operationSeq: number): Promise<number[]> {
    try {
      const { data: materials, error } = await supabase
        .from('wo_materials')
        .select('material_id')
        .eq('wo_id', woId)
        .eq('sequence', operationSeq)
        .eq('one_to_one', true);

      if (error) throw error;
      return materials.map(m => m.material_id);
    } catch {
      return [];
    }
  }
}

/**
 * Cross-WO PR Intake Validation
 * Validates that PR materials match exactly across work orders
 */
export class CrossWOValidator {
  static async validateCrossWOPRIntake(
    inputLPNumber: string,
    expectedWOId: number,
    expectedOperationSeq: number
  ): Promise<CrossWOValidation> {
    try {
      // Get input LP details
      const { data: inputLP, error: lpError } = await supabase
        .from('license_plates')
        .select('product_id, stage_suffix, qa_status')
        .eq('lp_number', inputLPNumber)
        .single();

      if (lpError) throw lpError;

      // Get expected material details from WO materials
      const { data: expectedMaterial, error: matError } = await supabase
        .from('wo_materials')
        .select('material_id, sequence')
        .eq('wo_id', expectedWOId)
        .eq('sequence', expectedOperationSeq)
        .single();

      if (matError) throw matError;

      // Validate product match
      if (inputLP.product_id !== expectedMaterial.material_id) {
        return {
          isValid: false,
          error: `Product mismatch. Expected product ${expectedMaterial.material_id}, got ${inputLP.product_id}`,
          expectedProductId: expectedMaterial.material_id,
          expectedStageSuffix: '', // Will be determined by operation
          actualProductId: inputLP.product_id,
          actualStageSuffix: inputLP.stage_suffix || ''
        };
      }

      // Validate QA status
      if (inputLP.qa_status !== 'Passed') {
        return {
          isValid: false,
          error: `QA gate blocked. LP ${inputLPNumber} has status ${inputLP.qa_status}, must be Passed`,
          expectedProductId: expectedMaterial.material_id,
          expectedStageSuffix: '',
          actualProductId: inputLP.product_id,
          actualStageSuffix: inputLP.stage_suffix || ''
        };
      }

      return {
        isValid: true,
        expectedProductId: expectedMaterial.material_id,
        expectedStageSuffix: '', // Stage suffix validation would be operation-specific
        actualProductId: inputLP.product_id,
        actualStageSuffix: inputLP.stage_suffix || ''
      };
    } catch (error) {
      return {
        isValid: false,
        error: `Cross-WO validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        expectedProductId: 0,
        expectedStageSuffix: '',
        actualProductId: 0,
        actualStageSuffix: ''
      };
    }
  }
}

/**
 * Reservation-Safe Operations
 * Ensures operations don't exceed available quantities
 */
export class ReservationValidator {
  static async checkAvailableQuantity(lpId: number): Promise<ReservationCheck> {
    try {
      // Get LP total quantity
      const { data: lp, error: lpError } = await supabase
        .from('license_plates')
        .select('quantity')
        .eq('id', lpId)
        .single();

      if (lpError) throw lpError;

      // Get active reservations
      const { data: reservations, error: resError } = await supabase
        .from('lp_reservations')
        .select('quantity_reserved')
        .eq('lp_id', lpId)
        .eq('status', 'active');

      if (resError) throw resError;

      const totalQty = parseFloat(lp.quantity);
      const reservedQty = reservations.reduce((sum, r) => sum + parseFloat(r.quantity_reserved), 0);
      const availableQty = totalQty - reservedQty;

      return {
        availableQty,
        reservedQty,
        totalQty,
        canReserve: availableQty > 0
      };
    } catch (error) {
      return {
        availableQty: 0,
        reservedQty: 0,
        totalQty: 0,
        canReserve: false,
        error: `Reservation check error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async validateReservation(
    lpId: number, 
    requestedQty: number
  ): Promise<ValidationResult> {
    const check = await this.checkAvailableQuantity(lpId);
    
    if (!check.canReserve) {
      return {
        isValid: false,
        error: `No available quantity. Total: ${check.totalQty}, Reserved: ${check.reservedQty}, Available: ${check.availableQty}`
      };
    }

    if (requestedQty > check.availableQty) {
      return {
        isValid: false,
        error: `Requested quantity ${requestedQty} exceeds available quantity ${check.availableQty}`
      };
    }

    return { isValid: true };
  }
}

/**
 * QA Gate Enforcement
 * Validates QA status before allowing operations
 */
export class QAGateValidator {
  static async validateQAStatus(
    lpId: number, 
    operation: 'WO_ISSUE' | 'WO_OUTPUT'
  ): Promise<ValidationResult> {
    try {
      const { data: lp, error } = await supabase
        .from('license_plates')
        .select('qa_status, lp_number')
        .eq('id', lpId)
        .single();

      if (error) throw error;

      if (lp.qa_status !== 'Passed') {
        return {
          isValid: false,
          error: `QA gate blocked for ${operation}. LP ${lp.lp_number} has status ${lp.qa_status}, must be Passed`
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `QA validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async validateQAOverride(
    lpId: number,
    newStatus: string,
    reason: string,
    supervisorPin: string
  ): Promise<ValidationResult> {
    // Validate PIN format (4-6 digits)
    if (!/^\d{4,6}$/.test(supervisorPin)) {
      return {
        isValid: false,
        error: 'Invalid supervisor PIN format. Must be 4-6 digits'
      };
    }

    // Validate reason
    if (!reason.trim()) {
      return {
        isValid: false,
        error: 'Override reason is required'
      };
    }

    // Validate status
    const validStatuses = ['Passed', 'Failed', 'Quarantine', 'Pending'];
    if (!validStatuses.includes(newStatus)) {
      return {
        isValid: false,
        error: `Invalid QA status. Must be one of: ${validStatuses.join(', ')}`
      };
    }

    return { isValid: true };
  }
}

/**
 * Business Logic Orchestrator
 * Combines all validation rules for complex operations
 */
export class BusinessLogicOrchestrator {
  static async validateStagingOperation(
    woId: number,
    operationSeq: number,
    lpNumber: string,
    quantity: number
  ): Promise<ValidationResult> {
    try {
      // 1. Sequential routing check
      const seqValidation = await SequentialRoutingValidator.validateOperationSequence(
        woId, operationSeq, 'start'
      );
      if (!seqValidation.isValid) return seqValidation;

      // 2. Get LP ID
      const { data: lp, error: lpError } = await supabase
        .from('license_plates')
        .select('id, product_id, stage_suffix')
        .eq('lp_number', lpNumber)
        .single();

      if (lpError) throw lpError;

      // 3. Cross-WO PR validation
      const crossWOValidation = await CrossWOValidator.validateCrossWOPRIntake(
        lpNumber, woId, operationSeq
      );
      if (!crossWOValidation.isValid) return { isValid: false, error: crossWOValidation.error };

      // 4. QA gate check
      const qaValidation = await QAGateValidator.validateQAStatus(lp.id, 'WO_ISSUE');
      if (!qaValidation.isValid) return qaValidation;

      // 5. Reservation check
      const resValidation = await ReservationValidator.validateReservation(lp.id, quantity);
      if (!resValidation.isValid) return resValidation;

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Staging validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async validateWeightRecording(
    woId: number,
    operationSeq: number,
    inputLPs: string[],
    outputLPs: string[]
  ): Promise<ValidationResult> {
    try {
      // 1. Sequential routing check
      const seqValidation = await SequentialRoutingValidator.validateOperationSequence(
        woId, operationSeq, 'record_weights'
      );
      if (!seqValidation.isValid) return seqValidation;

      // 2. One-to-one validation
      const oneToOneValidation = await OneToOneValidator.validateOneToOneRule(
        woId, operationSeq, inputLPs, outputLPs
      );
      if (!oneToOneValidation.isValid) return { isValid: false, error: oneToOneValidation.error };

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Weight recording validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  static async validateOperationCompletion(
    woId: number,
    operationSeq: number
  ): Promise<ValidationResult> {
    try {
      // 1. Sequential routing check
      const seqValidation = await SequentialRoutingValidator.validateOperationSequence(
        woId, operationSeq, 'complete'
      );
      if (!seqValidation.isValid) return seqValidation;

      // 2. Check if weights are recorded
      const { data: operation, error } = await supabase
        .from('wo_operations')
        .select('actual_input_weight, actual_output_weight')
        .eq('wo_id', woId)
        .eq('sequence', operationSeq)
        .single();

      if (error) throw error;

      if (!operation.actual_input_weight || !operation.actual_output_weight) {
        return {
          isValid: false,
          error: 'Cannot complete operation without recording input and output weights'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: `Operation completion validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

