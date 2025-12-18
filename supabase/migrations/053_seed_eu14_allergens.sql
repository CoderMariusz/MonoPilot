-- 053_seed_eu14_allergens.sql
-- Seeds EU 14 allergens (A01-A14) for all existing organizations.
-- For orgs created after this migration, call seed_allergens_for_org(org_id, seed_user_id)
-- during organization onboarding or initial setup.

BEGIN;

CREATE OR REPLACE FUNCTION seed_allergens_for_org(target_org_id UUID, seed_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO allergens (org_id, code, name_en, name_pl, icon, created_by, updated_by)
  VALUES
    (target_org_id, 'A01', 'Cereals containing gluten', 'Zboża zawierające gluten', 'wheat',   seed_user_id, seed_user_id),
    (target_org_id, 'A02', 'Crustaceans',               'Skorupiaki',               'shrimp',  seed_user_id, seed_user_id),
    (target_org_id, 'A03', 'Eggs',                      'Jaja',                     'egg',     seed_user_id, seed_user_id),
    (target_org_id, 'A04', 'Fish',                      'Ryby',                     'fish',    seed_user_id, seed_user_id),
    (target_org_id, 'A05', 'Peanuts',                   'Orzeszki ziemne',          'peanut',  seed_user_id, seed_user_id),
    (target_org_id, 'A06', 'Soybeans',                  'Soja',                     'soy',     seed_user_id, seed_user_id),
    (target_org_id, 'A07', 'Milk',                      'Mleko',                    'milk',    seed_user_id, seed_user_id),
    (target_org_id, 'A08', 'Nuts',                      'Orzechy',                  'tree-nut',seed_user_id, seed_user_id),
    (target_org_id, 'A09', 'Celery',                    'Seler',                    'celery',  seed_user_id, seed_user_id),
    (target_org_id, 'A10', 'Mustard',                   'Gorczyca',                 'mustard', seed_user_id, seed_user_id),
    (target_org_id, 'A11', 'Sesame seeds',              'Nasiona sezamu',           'sesame',  seed_user_id, seed_user_id),
    (target_org_id, 'A12', 'Sulphur dioxide and sulphites','Dwutlenek siarki i siarczyny','sulfite',seed_user_id, seed_user_id),
    (target_org_id, 'A13', 'Lupin',                     'Łubin',                    'lupin',   seed_user_id, seed_user_id),
    (target_org_id, 'A14', 'Molluscs',                  'Mięczaki',                 'mollusk', seed_user_id, seed_user_id)
  ON CONFLICT (org_id, code) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Seed for all existing orgs (best-effort: skip orgs with no users yet)
DO $$
DECLARE
  org_row RECORD;
  seed_user_id UUID;
BEGIN
  FOR org_row IN SELECT id FROM organizations LOOP
    SELECT u.id INTO seed_user_id
    FROM users u
    WHERE u.org_id = org_row.id
    ORDER BY u.created_at ASC
    LIMIT 1;

    IF seed_user_id IS NOT NULL THEN
      PERFORM seed_allergens_for_org(org_row.id, seed_user_id);
    END IF;
  END LOOP;
END $$;

COMMIT;


