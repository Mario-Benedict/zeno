#!/usr/bin/env bash
#
# Commit-msg hook: validate commit message format.

COMMIT_MSG_FILE=$1
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

COMMIT_REGEX="^(feature|feat|bugfix|fix|hotfix|chore|docs|refactor|test|ci|style|perf)(\(.+\))?: .+$"

if ! echo "$COMMIT_MSG" | grep -qE "$COMMIT_REGEX"; then
  echo ""
  echo -e "\033[1;31m ERROR: Invalid commit message format.\033[0m"
  echo ""
  echo "  Commit messages must match: type: description"
  echo ""
  echo "  Valid types: feature, feat, bugfix, fix, hotfix, chore, docs,"
  echo "                refactor, test, ci, style, perf"
  echo ""
  echo "  Examples:"
  echo "    feat: add user login functionality"
  echo "    fix: resolve database connection error"
  echo "    chore: update composer dependencies"
  echo ""
  exit 1
fi

exit 0
