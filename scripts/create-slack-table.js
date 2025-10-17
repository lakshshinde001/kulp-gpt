const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createSlackTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
  });

  try {
    console.log('Creating slack_users table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS slack_users (
        id SERIAL PRIMARY KEY,
        userid INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slack_user_id VARCHAR(255) NOT NULL UNIQUE,
        access_token TEXT NOT NULL,
        team_id VARCHAR(255),
        user_name VARCHAR(255),
        real_name VARCHAR(255),
        email VARCHAR(255),
        avatar TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log('✅ slack_users table created successfully!');
  } catch (error) {
    console.error('❌ Error creating table:', error);
  } finally {
    await pool.end();
  }
}

createSlackTable();
