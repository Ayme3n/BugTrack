#!/bin/bash

# BugTrack Environment Setup Helper
# This script helps you create your .env file

echo "🚀 BugTrack Environment Setup"
echo "=============================="
echo ""

# Check if .env already exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted. Your existing .env file was not modified."
        exit 0
    fi
fi

echo "📋 I'll help you create your .env file."
echo ""
echo "You'll need:"
echo "  1. Supabase Project URL"
echo "  2. Supabase Anon Key"
echo "  3. Supabase Service Role Key"
echo "  4. Database Connection String"
echo ""
echo "Get these from: https://supabase.com → Your Project → Settings"
echo ""

# Collect information
read -p "Enter Supabase URL (e.g., https://xxxxx.supabase.co): " SUPABASE_URL
read -p "Enter Supabase Anon Key: " ANON_KEY
read -p "Enter Supabase Service Role Key: " SERVICE_KEY
read -p "Enter Database URL (postgresql://...): " DATABASE_URL

# Generate encryption key
echo ""
echo "🔐 Generating encryption key..."
ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null)

if [ -z "$ENCRYPTION_KEY" ]; then
    echo "⚠️  Could not generate encryption key automatically."
    echo "Please run: openssl rand -hex 32"
    read -p "Enter encryption key manually: " ENCRYPTION_KEY
fi

# Create .env file
cat > .env << EOF
# ============================================================================
# BugTrack Environment Configuration
# ============================================================================
# Generated on $(date)

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_KEY}

# Database Configuration
DATABASE_URL=${DATABASE_URL}
DIRECT_URL=${DATABASE_URL}

# Application Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Encryption Key
ENCRYPTION_KEY=${ENCRYPTION_KEY}
EOF

echo ""
echo "✅ .env file created successfully!"
echo ""
echo "Next steps:"
echo "  1. Run: npx prisma db push"
echo "  2. Run: npm run dev"
echo "  3. Visit: http://localhost:3000"
echo ""
echo "📚 For more help, see: QUICK_FIX.md"

