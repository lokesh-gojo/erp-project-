const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config();

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
  }

  console.log('🔌 Connecting to Supabase database...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to Supabase PostgreSQL!');

    const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
    console.log('📖 Reading migration script from:', schemaPath);
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('🚀 Executing Supabase schema and seed data...');
    await client.query(sql);

    console.log('🎉 Supabase Schema & Seed Data successfully migrated!');

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    console.log('📋 Verified Tables in public schema:');
    console.table(res.rows);

    // Verify user count and questions count
    const userCount = await client.query('SELECT count(*) FROM users;');
    const questionCount = await client.query('SELECT count(*) FROM questions;');
    const testCount = await client.query('SELECT count(*) FROM tests;');

    console.log(`✅ Users in DB: ${userCount.rows[0].count}`);
    console.log(`✅ Questions in DB: ${questionCount.rows[0].count}`);
    console.log(`✅ Tests in DB: ${testCount.rows[0].count}`);

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();

