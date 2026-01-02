/**
 * Database Migration Script
 * Runs SQL migrations on PostgreSQL database
 */

import { pool } from '../config/database.config';
import * as fs from 'fs';
import * as path from 'path';

async function runMigrations() {
  console.log('🔄 Starting database migrations...\n');
  
  const migrationsDir = path.join(__dirname, '../migrations');
  
  try {
    // Create migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Migrations" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        "executedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get all migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${files.length} migration file(s)\n`);
    
    for (const file of files) {
      // Check if migration already executed
      const { rows } = await pool.query(
        'SELECT * FROM "Migrations" WHERE name = $1',
        [file]
      );
      
      if (rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }
      
      console.log(`📝 Executing ${file}...`);
      
      // Read and execute migration
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      await pool.query('BEGIN');
      
      try {
        await pool.query(sql);
        await pool.query(
          'INSERT INTO "Migrations" (name) VALUES ($1)',
          [file]
        );
        await pool.query('COMMIT');
        console.log(`✅ ${file} executed successfully\n`);
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }
    
    console.log('✅ All migrations completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
