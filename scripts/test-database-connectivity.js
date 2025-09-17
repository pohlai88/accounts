#!/usr/bin/env node

/**
 * Nuclear Database Connectivity Test
 * Tests all database connection methods and configurations
 */

const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.test' });

console.log('🔍 NUCLEAR DATABASE CONNECTIVITY TEST');
console.log('=====================================\n');

// Test 1: Environment Variables
console.log('1️⃣ Testing Environment Variables...');
const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'SUPABASE_DB_URL'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    process.exit(1);
} else {
    console.log('✅ All required environment variables present');
}

// Test 2: Supabase Client Connection (REST API)
console.log('\n2️⃣ Testing Supabase REST API Connection...');
try {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.from('tenants').select('count').limit(1);
    if (error) {
        console.log('❌ Supabase REST API error:', error.message);
    } else {
        console.log('✅ Supabase REST API connection successful');
    }
} catch (err) {
    console.log('❌ Supabase REST API connection failed:', err.message);
}

// Test 3: Direct PostgreSQL Connection (DATABASE_URL)
console.log('\n3️⃣ Testing Direct PostgreSQL Connection (DATABASE_URL)...');
try {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 1,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 5000
    });

    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ Direct PostgreSQL connection successful');
    console.log('   Database version:', result.rows[0].version.split(' ')[0]);
    client.release();
    await pool.end();
} catch (err) {
    console.log('❌ Direct PostgreSQL connection failed:', err.message);
}

// Test 4: Direct PostgreSQL Connection (SUPABASE_DB_URL)
console.log('\n4️⃣ Testing Direct PostgreSQL Connection (SUPABASE_DB_URL)...');
try {
    const pool = new Pool({
        connectionString: process.env.SUPABASE_DB_URL,
        max: 1,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 5000
    });

    const client = await pool.connect();
    const result = await client.query('SELECT version()');
    console.log('✅ SUPABASE_DB_URL connection successful');
    console.log('   Database version:', result.rows[0].version.split(' ')[0]);
    client.release();
    await pool.end();
} catch (err) {
    console.log('❌ SUPABASE_DB_URL connection failed:', err.message);
}

// Test 5: Database Schema Check
console.log('\n5️⃣ Testing Database Schema...');
try {
    const pool = new Pool({
        connectionString: process.env.SUPABASE_DB_URL,
        max: 1,
        idleTimeoutMillis: 5000,
        connectionTimeoutMillis: 5000
    });

    const client = await pool.connect();

    // Check if key tables exist
    const tables = ['tenants', 'companies', 'accounts', 'customers', 'suppliers'];
    for (const table of tables) {
        const result = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = $1
      )
    `, [table]);

        if (result.rows[0].exists) {
            console.log(`✅ Table '${table}' exists`);
        } else {
            console.log(`❌ Table '${table}' missing`);
        }
    }

    client.release();
    await pool.end();
} catch (err) {
    console.log('❌ Database schema check failed:', err.message);
}

// Test 6: RPC Function Check
console.log('\n6️⃣ Testing RPC Functions...');
try {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test if exec_sql function exists
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'SELECT 1 as test'
    });

    if (error) {
        console.log('❌ exec_sql RPC function not available:', error.message);
        console.log('   This explains why integration tests were failing!');
    } else {
        console.log('✅ exec_sql RPC function available');
    }
} catch (err) {
    console.log('❌ RPC function test failed:', err.message);
}

console.log('\n🏁 Database connectivity test completed!');
