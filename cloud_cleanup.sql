-- Clean up cloud database (safe for Supabase)
-- Skips system extensions and functions

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop only custom functions (not from extensions)
    FOR r IN (
        SELECT routine_name, routine_schema
        FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        AND routine_name NOT IN (
            SELECT p.proname::text
            FROM pg_proc p
            JOIN pg_depend d ON d.objid = p.oid
            JOIN pg_extension e ON d.refobjid = e.oid
        )
    ) LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;

    -- Drop only custom types (not from extensions)
    FOR r IN (
        SELECT typname
        FROM pg_type
        WHERE typnamespace = 'public'::regnamespace
        AND typtype = 'e'
        AND typname NOT IN (
            SELECT t.typname::text
            FROM pg_type t
            JOIN pg_depend d ON d.objid = t.oid
            JOIN pg_extension e ON d.refobjid = e.oid
        )
    ) LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;
