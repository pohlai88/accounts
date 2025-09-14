// Run attachment table migration
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    try {
        console.log('Running attachment table migration...');

        // Read the SQL file
        const sql = fs.readFileSync('create-attachments-table.sql', 'utf8');

        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql });

        if (error) {
            console.error('Migration failed:', error);
            process.exit(1);
        }

        console.log('Migration completed successfully!');

        // Verify the table was created
        const { data: tables, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .eq('table_name', 'attachments');

        if (tableError) {
            console.error('Error verifying table creation:', tableError);
        } else if (tables && tables.length > 0) {
            console.log('✅ Attachments table created successfully!');
        } else {
            console.log('❌ Attachments table not found');
        }

    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

runMigration();
