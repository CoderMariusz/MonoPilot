#!/bin/bash
# Script to run migrations 081-084
# Date: 2025-12-23

echo "================================="
echo "Running migrations 081-084"
echo "================================="

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "ERROR: Docker is not running!"
    echo "Please start Docker Desktop first"
    exit 1
fi

# Check if Supabase is running
if ! npx supabase status &> /dev/null; then
    echo "Starting Supabase..."
    npx supabase start
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to start Supabase"
        exit 1
    fi
fi

echo ""
echo "Supabase is running. Applying migrations..."
echo ""

# Option 1: Reset database (recommended - runs ALL migrations)
echo "Option 1: Reset database (runs all migrations 001-084)"
echo "Command: npx supabase db reset"
echo ""
read -p "Do you want to reset database? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx supabase db reset
    exit 0
fi

# Option 2: Run only migrations 081-084
echo ""
echo "Option 2: Run only migrations 081-084"
echo ""
read -p "Do you want to run only 081-084? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Running migration 081..."
    npx supabase db execute -f supabase/migrations/081_create_user_sessions.sql

    echo "Running migration 082..."
    npx supabase db execute -f supabase/migrations/082_create_password_history.sql

    echo "Running migration 083..."
    npx supabase db execute -f supabase/migrations/083_add_session_password_fields.sql

    echo "Running migration 084..."
    npx supabase db execute -f supabase/migrations/084_create_user_invitations.sql

    echo ""
    echo "✅ Migrations 081-084 completed!"
    exit 0
fi

echo "No action taken."
