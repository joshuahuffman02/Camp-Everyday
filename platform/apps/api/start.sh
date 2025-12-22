#!/bin/sh
set -e

echo "=== CAMPRESERV API STARTUP SCRIPT ==="
echo "Date: $(date)"
echo "Working dir: $(pwd)"

echo "=== Schema check (Site model) ==="
grep -A 10 "model Site {" prisma/schema.prisma | head -15

echo "=== Clearing generated Prisma client ==="
rm -rf ../../../node_modules/.prisma
rm -rf node_modules/.prisma
rm -rf /app/node_modules/.prisma

echo "=== Pushing schema to database ==="
npx prisma db push --accept-data-loss

echo "=== Regenerating Prisma client ==="
npx prisma generate

echo "=== Starting app ==="
exec node -r tsconfig-paths/register dist/main.js
