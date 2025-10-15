-- Phase 9: Enhanced Routing Requirements Migration
-- This migration adds multi-choice routing requirements

-- Add requirements field to routing_operations
ALTER TABLE routing_operations
  ADD COLUMN requirements TEXT[] DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX idx_routing_operations_requirements ON routing_operations USING GIN(requirements);

-- Update existing routing operations with default requirements
UPDATE routing_operations 
SET requirements = ARRAY['Smoke', 'Roast', 'Dice', 'Mix'] 
WHERE requirements IS NULL OR array_length(requirements, 1) = 0;

-- Add RLS policies for routing_operations
ALTER TABLE routing_operations ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read routing operations
CREATE POLICY "Users can read routing operations" ON routing_operations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert routing operations
CREATE POLICY "Users can insert routing operations" ON routing_operations
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update routing operations
CREATE POLICY "Users can update routing operations" ON routing_operations
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete routing operations
CREATE POLICY "Users can delete routing operations" ON routing_operations
  FOR DELETE USING (auth.role() = 'authenticated');
