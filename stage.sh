#!/usr/bin/env bash
set -e

echo "📦 Safely staging files in optimized batches..."

# 1. Stage top-level matching files via stdin
find resources/open-georgian/ -maxdepth 1 \( -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.css"\) -print0 | git update-index --add -z --stdin

# 2. Stage directories in 1,000-path batches to prevent memory spikes
find resources/open-georgian/ -mindepth 1 -maxdepth 1 -type d -print0 | xargs -0 -n 1000 sh -c '
  printf "%s\0" "$@" | git update-index --add -z --stdin
' _

echo "📊 Checking staged file count..."
STAGED_COUNT=$(git diff --cached --name-only | wc -l)
echo "Done! $STAGED_COUNT items currently staged."
