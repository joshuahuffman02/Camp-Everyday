#!/bin/sh
# Don't use set -e so we can handle failures gracefully

echo "=== CAMPRESERV API STARTUP SCRIPT ==="
echo "Date: $(date)"
echo "Working dir: $(pwd)"

echo "=== Schema check (Site model) ==="
grep -A 10 "model Site {" prisma/schema.prisma | head -15

# Skip database wait - let the app handle connection lazily
# The app has built-in connection retry logic via Prisma
echo "=== Skipping database wait (app will connect lazily) ==="
echo "DATABASE_URL host: $(echo $DATABASE_URL | sed 's/.*@\([^:]*\).*/\1/')"

echo "=== Checking Prisma client ==="
# Check if Prisma client was already generated at build time
PRISMA_CLIENT_PATH=$(find /app/node_modules/.pnpm -name ".prisma" -type d 2>/dev/null | grep "@prisma+client" | head -1)

if [ -n "$PRISMA_CLIENT_PATH" ] && [ -f "$PRISMA_CLIENT_PATH/client/default.js" ]; then
    echo "Prisma client found at: $PRISMA_CLIENT_PATH"
    echo "Skipping regeneration - using pre-built client"
else
    echo "Prisma client not found, generating..."
    cd /app/platform/apps/api && npx prisma generate
    cd /app/platform/apps/api
fi

echo "=== Linking Prisma client for pnpm ==="
node /app/scripts/link-prisma-client.js || echo "Link script not found, skipping"

echo "=== Running database migrations ==="
echo "DIRECT_URL set: $([ -n "$DIRECT_URL" ] && echo 'yes' || echo 'NO - migrations may hang!')"

cd /app/platform/apps/api

# Get the latest migration name for potential rollback
LAST_MIGRATION=$(ls -1 prisma/migrations/ 2>/dev/null | grep -E '^[0-9]+' | sort | tail -1)
echo "Latest migration: ${LAST_MIGRATION:-none}"

# ONE-TIME FIX: Delete the SEO migration record that was killed by timeout
# This migration was marked as "applied" but didn't complete, causing P2022 errors
# The migration is idempotent (uses ADD COLUMN IF NOT EXISTS), so safe to re-run
# Remove this block after staging is fixed (around Jan 15, 2026)
SEO_MIGRATION="20251231083410_add_seo_claims_infrastructure"
echo "Deleting $SEO_MIGRATION record from _prisma_migrations to force re-apply..."

# Use node with pg driver to delete the record directly (faster than prisma db execute)
timeout 15 node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });
client.connect()
  .then(() => client.query('DELETE FROM \"_prisma_migrations\" WHERE migration_name = \$1', ['$SEO_MIGRATION']))
  .then(r => { console.log('Deleted', r.rowCount, 'migration record(s)'); return client.end(); })
  .catch(e => { console.error('Failed to delete migration record:', e.message); process.exit(0); });
" 2>&1 || echo "Migration record deletion timed out or failed (continuing anyway)"

# Run migrations with 10-minute timeout (large SEO migration needs time)
if timeout 600 npx prisma migrate deploy; then
    echo "Migrations completed successfully"
else
    MIGRATE_EXIT=$?
    echo "Migrations exited with code $MIGRATE_EXIT"

    # Exit codes: 124 = timeout killed it, 143 = SIGTERM (128+15)
    if [ $MIGRATE_EXIT -eq 124 ] || [ $MIGRATE_EXIT -eq 143 ]; then
        echo "Migration was killed (timeout or SIGTERM). This may leave DB in inconsistent state."
        echo "Marking last migration as rolled-back so it can be re-applied..."

        if [ -n "$LAST_MIGRATION" ]; then
            # Mark the migration as rolled back so Prisma will try again
            if npx prisma migrate resolve --rolled-back "$LAST_MIGRATION" 2>&1; then
                echo "Marked $LAST_MIGRATION as rolled back. Retrying migration..."
                if timeout 600 npx prisma migrate deploy; then
                    echo "Migration retry succeeded!"
                else
                    echo "FATAL: Migration retry also failed. Cannot start app."
                    exit 1
                fi
            else
                echo "WARNING: Could not mark migration as rolled back (may not have been applied yet)"
            fi
        fi
    else
        # Non-timeout failure - check pending status
        echo "Checking migration status..."
        if timeout 30 npx prisma migrate status 2>&1 | grep -q "have not yet been applied"; then
            echo "FATAL: There are pending migrations that failed to apply. Cannot start app."
            echo "Schema mismatch will cause P2022 errors. Exiting."
            exit 1
        fi
        echo "No pending migrations - safe to start app"
    fi
fi

echo "=== Starting app ==="
cd /app/platform/apps/api
exec node dist/main.js
