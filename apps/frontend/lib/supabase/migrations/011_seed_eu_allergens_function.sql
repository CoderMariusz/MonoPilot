-- Migration 011: Create function to seed 14 EU major allergens
-- Story: 1.9 - Allergen Management
-- Date: 2025-11-22
-- Description: Creates reusable function to seed 14 EU major allergens for an organization
--              Based on EU Regulation 1169/2011 on food allergen labeling
--              Idempotent - safe to run multiple times

-- Create function to seed allergens for an organization
CREATE OR REPLACE FUNCTION seed_eu_allergens(p_org_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Insert 14 EU major allergens
    -- Using ON CONFLICT DO NOTHING for idempotency
    INSERT INTO allergens (org_id, code, name, is_major, is_custom)
    VALUES
        -- 1. Milk and dairy products
        (p_org_id, 'MILK', 'Milk', true, false),

        -- 2. Eggs
        (p_org_id, 'EGGS', 'Eggs', true, false),

        -- 3. Fish
        (p_org_id, 'FISH', 'Fish', true, false),

        -- 4. Crustaceans (shellfish)
        (p_org_id, 'SHELLFISH', 'Crustaceans', true, false),

        -- 5. Tree nuts
        (p_org_id, 'TREENUTS', 'Tree Nuts', true, false),

        -- 6. Peanuts
        (p_org_id, 'PEANUTS', 'Peanuts', true, false),

        -- 7. Cereals containing gluten (wheat)
        (p_org_id, 'WHEAT', 'Gluten (Wheat)', true, false),

        -- 8. Soybeans
        (p_org_id, 'SOYBEANS', 'Soybeans', true, false),

        -- 9. Sesame seeds
        (p_org_id, 'SESAME', 'Sesame Seeds', true, false),

        -- 10. Mustard
        (p_org_id, 'MUSTARD', 'Mustard', true, false),

        -- 11. Celery
        (p_org_id, 'CELERY', 'Celery', true, false),

        -- 12. Lupin
        (p_org_id, 'LUPIN', 'Lupin', true, false),

        -- 13. Sulphur dioxide and sulphites
        (p_org_id, 'SULPHITES', 'Sulphur Dioxide/Sulphites', true, false),

        -- 14. Molluscs
        (p_org_id, 'MOLLUSCS', 'Molluscs', true, false)
    ON CONFLICT (org_id, code) DO NOTHING;

    RAISE NOTICE 'Seeded 14 EU major allergens for organization %', p_org_id;
END;
$$;

-- Add helpful comment
COMMENT ON FUNCTION seed_eu_allergens IS 'Seeds 14 EU major allergens (Regulation EU 1169/2011) for an organization. Idempotent - safe to run multiple times.';

-- Grant execute permission to authenticated users (admin only in practice)
GRANT EXECUTE ON FUNCTION seed_eu_allergens TO authenticated;
