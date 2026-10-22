#!/bin/bash
set -e
pnpm install --frozen-lockfile
pnpm --filter db cleanup-orphans
pnpm --filter db push
pnpm --filter db seed
