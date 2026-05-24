#!/usr/bin/env bash
set -euo pipefail

rm -rf dist
mkdir -p dist

rsync -a ./ dist/ \
  --exclude='.git/' \
  --exclude='dist/' \
  --exclude='scripts/' \
  --exclude='node_modules/' \
  --exclude='AGENTS.md' \
  --exclude='README.md' \
  --exclude='wrangler.toml' \
  --exclude='.DS_Store' \
  --exclude='**/.DS_Store'
