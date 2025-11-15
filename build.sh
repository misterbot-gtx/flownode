#!/bin/bash
echo "Building flow..."

(
  cd packages/flow || exit 1
  pnpm build
)

echo "✓ Build completo!"
