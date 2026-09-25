#!/usr/bin/env bash
# Applies the migration to a throwaway database and runs the RLS tests.
# Usage: PGHOST=... PGUSER=... bash supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."
DB="vbc_rls_test_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB"' EXIT
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f tests/supabase_stub.sql
for f in migrations/*.sql; do psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f"; done
psql -q -v ON_ERROR_STOP=1 -d "$DB" -f tests/rls_test.sql
