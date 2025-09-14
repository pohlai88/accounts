#!/bin/bash

# Supabase Setup Script for AI-BOS Accounts
# This script sets up all Supabase services for the multi-tenant system

set -e

echo "🚀 Setting up Supabase for AI-BOS Accounts..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if user is logged in
if ! supabase projects list &> /dev/null; then
    echo "❌ Please login to Supabase first:"
    echo "   supabase login"
    exit 1
fi

echo "✅ Supabase CLI is ready"

# Link to existing project
echo "🔗 Linking to existing Supabase project..."
supabase link --project-ref dsjxvwhuvnefduvjbmgk

# Deploy database migrations
echo "📊 Deploying database migrations..."
supabase db push

# Deploy Edge Functions
echo "⚡ Deploying Edge Functions..."
supabase functions deploy auth-hook
supabase functions deploy tenant-management
supabase functions deploy file-upload

# Set up Auth Hook
echo "🔐 Setting up Auth Hook..."
supabase functions secrets set --project-ref dsjxvwhuvnefduvjbmgk \
  SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"

# Configure Auth providers (requires manual setup in dashboard)
echo "🔑 Auth providers need to be configured manually in the Supabase dashboard:"
echo "   1. Go to Authentication > Providers"
echo "   2. Enable Google OAuth and configure with your credentials"
echo "   3. Enable GitHub OAuth and configure with your credentials"
echo "   4. Set up email templates for invitations"

# Set up Storage buckets
echo "📁 Storage buckets will be created automatically via migrations"

# Set up Realtime
echo "🔄 Realtime is configured via database triggers"

echo "✅ Supabase setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Configure OAuth providers in Supabase dashboard"
echo "   2. Set up email templates for user invitations"
echo "   3. Configure SMS provider (optional)"
echo "   4. Test the multi-tenant functionality"
echo ""
echo "🔗 Supabase Dashboard: https://supabase.com/dashboard/project/dsjxvwhuvnefduvjbmgk"
