require('dotenv').config({ path: '.env.local' });

const { Pool } = require('pg');

async function testConnection() {
  console.log('Testing PostgreSQL connection...\n');

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  console.log('Attempting to connect...');
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    console.log('✓ Successfully connected to PostgreSQL');

    // Test a simple query
    const result = await client.query('SELECT NOW()');
    console.log('✓ Query executed successfully');
    console.log('  Current database time:', result.rows[0].now);

    client.release();
    await pool.end();

    console.log('\n✓ Database connection test passed!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify your DATABASE_URL in .env.local');
    console.error('2. Check that Supabase credentials are correct');
    console.error('3. Ensure your network allows connections to db.biphjalzrfugmmaebgrf.supabase.co:5432');
    process.exit(1);
  }
}

testConnection();
