#!/usr/bin/env bash
set -e

echo "📦 Safely staging files in optimized batches..."

# 1. Stage top-level matching files via stdin
find resources/open-georgian/ -maxdepth 1 \( -name "*.html" -o -name "*.js" -o -name "*.json" -o -name "*.css" \) -print0 | git update-index --add -z --stdin

# 2. Find actual files within subdirectories and feed them to git update-index
find resources/open-georgian/ -mindepth 2 -type f -print0 | xargs -0 -n 1000 git update-index --add -z

echo "📊 Checking staged file count..."
STAGED_COUNT=$(git diff --cached --name-only | wc -l)
echo "Done! $STAGED_COUNT items currently staged."
