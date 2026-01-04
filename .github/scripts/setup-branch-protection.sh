#!/bin/bash

# Script to setup branch protection rules using GitHub CLI
# Usage: ./setup-branch-protection.sh <owner> <repo>
# Example: ./setup-branch-protection.sh robsonmaia magico-de-oz-nestjs

set -e

OWNER=${1:-$(gh repo view --json owner -q '.owner.login')}
REPO=${2:-$(gh repo view --json name -q '.name')}

echo "Setting up branch protection for $OWNER/$REPO"

# Function to create branch protection
setup_protection() {
    local branch=$1
    local contexts=$2
    local enforce_admins=$3
    local linear_history=$4

    echo "Configuring protection for branch: $branch"

    gh api "repos/$OWNER/$REPO/branches/$branch/protection" \
        -X PUT \
        -H "Accept: application/vnd.github+json" \
        --input - << EOF
{
    "required_status_checks": {
        "strict": true,
        "contexts": $contexts
    },
    "enforce_admins": $enforce_admins,
    "required_pull_request_reviews": null,
    "restrictions": null,
    "allow_force_pushes": false,
    "allow_deletions": false,
    "required_linear_history": $linear_history,
    "required_conversation_resolution": true
}
EOF

    echo "Branch $branch protected successfully"
}

# Create branches if they don't exist
echo "Creating branches if they don't exist..."

for branch in develop homolog stage; do
    if ! git show-ref --verify --quiet "refs/heads/$branch"; then
        echo "Creating branch: $branch"
        git checkout -b "$branch" 2>/dev/null || git checkout "$branch"
        git push -u origin "$branch" 2>/dev/null || true
    fi
done

git checkout develop

# Apply protection rules
echo ""
echo "Applying branch protection rules..."

setup_protection "develop" '["Lint", "Test", "Build"]' false false
setup_protection "homolog" '["Lint", "Test", "Build"]' false false
setup_protection "stage" '["Lint", "Test", "Build"]' false false
setup_protection "main" '["Lint", "Test", "Build", "Security Audit"]' true true

echo ""
echo "All branch protection rules applied successfully!"
echo ""
echo "Summary:"
echo "  - develop: CI checks required, no force push, no delete"
echo "  - homolog: CI checks required, no force push, no delete"
echo "  - stage: CI checks required, no force push, no delete"
echo "  - main: CI + Security checks, enforce admins, linear history"
