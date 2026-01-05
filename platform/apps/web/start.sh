#!/bin/sh
set -e

cd /app/platform/apps/web

echo "Starting Next.js production server..."

# Try multiple methods to start Next.js
if [ -x "node_modules/.bin/next" ]; then
  echo "Using local next binary"
  node_modules/.bin/next start -p 3000
elif [ -x "/app/node_modules/.bin/next" ]; then
  echo "Using root next binary"
  /app/node_modules/.bin/next start -p 3000
else
  echo "Using npx next"
  npx next start -p 3000
fi
