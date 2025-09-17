const { Pool } = require('pg');
require('dotenv').config({ path: '.env.test' });

async function checkSchema() {
    const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });

    try {
        const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        console.log('📋 Existing tables in database:');
        result.rows.forEach(row => console.log('  -', row.table_name));

        // Check for missing critical tables
        const expectedTables = ['accounts', 'tenants', 'companies', 'customers', 'suppliers'];
        const existingTables = result.rows.map(row => row.table_name);
        const missingTables = expectedTables.filter(table => !existingTables.includes(table));

        if (missingTables.length > 0) {
            console.log('\n❌ Missing critical tables:');
            missingTables.forEach(table => console.log('  -', table));
        } else {
            console.log('\n✅ All critical tables present');
        }

    } catch (error) {
        console.error('❌ Schema check failed:', error.message);
    } finally {
        await pool.end();
    }
}

checkSchema();
