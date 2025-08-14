#!/bin/bash

# NPM Token Rotation Script
# This script helps with token rotation workflows

set -e

TOKEN_NAME="GitGenius-CI-CD-Token"
GITHUB_REPO="DharshanSR/gitgenius"

echo "🔄 NPM Token Rotation Helper"
echo "============================="

# Function to check token validity
check_token() {
    local token=$1
    if [ -z "$token" ]; then
        echo "❌ No token provided"
        return 1
    fi
    
    echo "🔍 Checking token validity..."
    
    # Test token by checking whoami
    if NPM_TOKEN=$token npm whoami --registry https://registry.npmjs.org >/dev/null 2>&1; then
        echo "✅ Token is valid"
        return 0
    else
        echo "❌ Token is invalid or expired"
        return 1
    fi
}

# Function to generate renewal instructions
show_renewal_instructions() {
    cat << EOF

🔑 TOKEN RENEWAL INSTRUCTIONS
============================

1. Generate New Token:
   - Go to: https://www.npmjs.com/settings/tokens
   - Click "Generate New Token"
   - Name: $TOKEN_NAME-$(date +%Y%m%d)
   - Type: Automation
   - Expiration: 1 year

2. Update GitHub Secret:
   - Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions
   - Edit NPM_TOKEN secret
   - Paste new token value
   - Save changes

3. Test the new token:
   - Trigger a workflow manually
   - Or run: npm whoami --registry https://registry.npmjs.org

4. Revoke old token:
   - Go back to npm tokens page
   - Delete the old token for security

EOF
}

# Function to estimate token expiration
check_expiration_estimate() {
    local creation_date=$1
    
    if [ -z "$creation_date" ]; then
        echo "⚠️  Token creation date not specified"
        echo "   Please update the creation date in this script"
        return 1
    fi
    
    # Calculate expiration (assuming 1 year)
    local expiration_date=$(date -d "$creation_date + 1 year" +%Y-%m-%d)
    local warning_date=$(date -d "$creation_date + 11 months" +%Y-%m-%d)
    local current_date=$(date +%Y-%m-%d)
    
    echo "📅 Token Timeline:"
    echo "   Created: $creation_date"
    echo "   Warning: $warning_date"
    echo "   Expires: $expiration_date"
    echo "   Current: $current_date"
    
    if [[ "$current_date" > "$warning_date" ]]; then
        echo "🚨 ACTION REQUIRED: Token renewal recommended!"
        show_renewal_instructions
        return 1
    elif [[ "$current_date" > "$(date -d "$creation_date + 9 months" +%Y-%m-%d)" ]]; then
        echo "⚠️  Token will expire in less than 3 months"
    else
        echo "✅ Token expiration is more than 3 months away"
    fi
    
    return 0
}

# Main execution
main() {
    echo "Current NPM user: $(npm whoami 2>/dev/null || echo 'Not logged in locally')"
    echo ""
    
    # Check current token if available
    if [ ! -z "$NPM_TOKEN" ]; then
        check_token "$NPM_TOKEN"
    else
        echo "ℹ️  No NPM_TOKEN environment variable found"
    fi
    
    echo ""
    
    # Check expiration estimate
    # UPDATE THIS DATE when you create your token!
    TOKEN_CREATION_DATE="2025-08-14"  # CHANGE THIS!
    check_expiration_estimate "$TOKEN_CREATION_DATE"
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
