#!/usr/bin/env bash
#
# Pre-commit hook: verify package-lock.json is in sync with package.json
# whenever either is staged. CI and the production Docker build both use
# `npm ci`, which fails hard on any drift - catching it here, before it's
# committed, is much cheaper than discovering it mid-deploy.

if git diff --cached --name-only | grep -qE '^package(-lock)?\.json$'; then
  echo "package.json or package-lock.json changed - verifying lockfile sync..."

  if ! LOCKFILE_CHECK_OUTPUT=$(npm ci --dry-run 2>&1); then
    echo ""
    echo -e "\033[1;31m ERROR: package-lock.json is out of sync with package.json.\033[0m"
    echo ""
    echo "$LOCKFILE_CHECK_OUTPUT" | tail -20
    echo ""
    echo "  Run 'npm install' to resync the lockfile, then 'git add package-lock.json'"
    echo "  and commit again."
    echo ""
    exit 1
  fi

  echo "Lockfile is in sync."
fi
