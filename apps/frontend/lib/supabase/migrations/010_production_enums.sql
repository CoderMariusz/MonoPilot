-- Phase 10: Production Enums Migration
-- This migration creates production-specific enums for move types, sources, statuses, and KPI scopes

-- Create move_type_enum for stock move classification
CREATE TYPE move_type_enum AS ENUM (
    'GRN_IN',      -- Goods receipt into warehouse
    'WO_ISSUE',    -- Material issued to work order
    'TRANSFER',    -- Transfer between locations
    'ADJUST',      -- Inventory adjustment
    'WO_OUTPUT'    -- Work order output
);

-- Create move_source_enum for tracking move origin
CREATE TYPE move_source_enum AS ENUM (
    'scanner',     -- Scanner terminal
    'portal',      -- Web portal
    'system'       -- System generated
);

-- Create move_status_enum for move lifecycle
CREATE TYPE move_status_enum AS ENUM (
    'draft',       -- Draft move
    'completed',   -- Completed move
    'void'         -- Voided move
);

-- Create kpi_scope_enum for KPI calculation scope
CREATE TYPE kpi_scope_enum AS ENUM (
    'PR',          -- Process (raw materials to work-in-progress)
    'FG'           -- Finished Goods (work-in-progress to finished goods)
);

-- Add comments for documentation
COMMENT ON TYPE move_type_enum IS 'Classification of stock move types for production tracking';
COMMENT ON TYPE move_source_enum IS 'Source of stock move for audit trail';
COMMENT ON TYPE move_status_enum IS 'Status lifecycle for stock moves';
COMMENT ON TYPE kpi_scope_enum IS 'Scope for KPI calculations (Process vs Finished Goods)';
