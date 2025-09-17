#!/bin/bash
# Setup Local Supabase for Testing
# Run this script to set up local Supabase environment

echo "🚀 Setting up Local Supabase for AIBOS Accounts..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    echo "Please install Supabase CLI first:"
    echo "npm install -g supabase"
    echo "Or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo "✅ Supabase CLI found"

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"

# Initialize Supabase (if not already done)
if [ ! -d "supabase" ]; then
    echo "📁 Initializing Supabase project..."
    supabase init
fi

# Start Supabase
echo "🔄 Starting local Supabase..."
supabase start

# Apply database schema
echo "📊 Applying database schema..."
supabase db reset --debug

echo ""
echo "🎉 Local Supabase is ready!"
echo ""
echo "📋 Connection Details:"
echo "API URL: http://localhost:54321"
echo "Database URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo "Studio URL: http://localhost:54323"
echo ""
echo "🔑 Copy these keys to your .env.local file:"
supabase status

echo ""
echo "🧪 Now you can run tests with:"
echo "pnpm test:unit"
