#!/usr/bin/env node

/**
 * Database Setup Script for Playwright-CRX Backend
 * Alternative to bash script - uses Node.js and pg library
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
};

async function setupDatabase() {
  console.log('\n' + '='.repeat(50));
  console.log('Playwright-CRX Database Setup');
  console.log('='.repeat(50) + '\n');

  // Database configuration
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'playwright_crx',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
  };

  if (!config.password) {
    log.error('DB_PASSWORD not set in .env file!');
    log.warning('Please create .env file from .env.example and set your password');
    process.exit(1);
  }

  log.info(`Configuration:`);
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}\n`);

  // Connect to postgres database to create our database
  const adminPool = new Pool({
    ...config,
    database: 'postgres',
  });

  try {
    // Test connection
    log.info('Testing PostgreSQL connection...');
    await adminPool.query('SELECT 1');
    log.success('PostgreSQL connection successful');

    // Check if database exists
    log.info(`Checking if database '${config.database}' exists...`);
    const dbCheck = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database]
    );

    if (dbCheck.rows.length === 0) {
      log.info(`Creating database '${config.database}'...`);
      await adminPool.query(`CREATE DATABASE ${config.database}`);
      log.success('Database created');
    } else {
      log.success('Database already exists');
    }

    await adminPool.end();

    // Connect to the actual database
    const pool = new Pool(config);

    // Enable pgcrypto extension
    log.info('Enabling pgcrypto extension...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
    log.success('Extension enabled');

    // Run base schema migration
    const baseSchemaPath = path.join(__dirname, '../migrations/008_complete_schema_latest.sql');
    if (fs.existsSync(baseSchemaPath)) {
      log.info('Running base schema migration...');
      const baseSql = fs.readFileSync(baseSchemaPath, 'utf8');
      
      // Split by transaction boundaries and execute
      const statements = baseSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        try {
          await pool.query(statements[i]);
          if ((i + 1) % 10 === 0) {
            log.info(`  Processed ${i + 1}/${statements.length} statements...`);
          }
        } catch (err) {
          // Ignore errors for DROP statements (table might not exist)
          if (!statements[i].toUpperCase().includes('DROP')) {
            log.warning(`Statement ${i + 1} warning: ${err.message}`);
          }
        }
      }
      log.success('Base schema applied');
    } else {
      log.warning('Base schema migration file not found');
    }

    // Run NLP features migration
    const nlpSchemaPath = path.join(__dirname, '../migrations/009_nlp_features_tables.sql');
    if (fs.existsSync(nlpSchemaPath)) {
      log.info('Running NLP features migration...');
      const nlpSql = fs.readFileSync(nlpSchemaPath, 'utf8');
      
      const statements = nlpSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        try {
          await pool.query(statements[i]);
        } catch (err) {
          if (!statements[i].toUpperCase().includes('DROP')) {
            log.warning(`NLP statement ${i + 1} warning: ${err.message}`);
          }
        }
      }
      log.success('NLP features schema applied');
    } else {
      log.warning('NLP features migration file not found');
    }

    // Verify tables
    log.info('Verifying database tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows.map(r => r.table_name);
    log.success(`Found ${tables.length} tables`);

    // Check core tables
    console.log('\n' + colors.blue + 'Core Tables:' + colors.reset);
    const coreTables = ['users', 'projects', 'scripts', 'test_runs', 'test_steps'];
    coreTables.forEach(table => {
      const exists = tables.includes(table);
      console.log(`  ${exists ? colors.green + '✓' : colors.red + '✗'} ${table}${colors.reset}`);
    });

    // Check NLP tables
    console.log('\n' + colors.blue + 'NLP Feature Tables:' + colors.reset);
    const nlpTables = [
      'nlp_gherkin_scenarios',
      'nlp_parsed_requirements',
      'nlp_test_cases',
      'nlp_documentation_history',
      'nlp_voice_commands'
    ];
    nlpTables.forEach(table => {
      const exists = tables.includes(table);
      console.log(`  ${exists ? colors.green + '✓' : colors.red + '✗'} ${table}${colors.reset}`);
    });

    // Test query
    log.info('\nTesting database query...');
    const testResult = await pool.query('SELECT NOW() as current_time');
    log.success('Query successful');
    console.log(`  Current time: ${testResult.rows[0].current_time}`);

    await pool.end();

    console.log('\n' + colors.green + '='.repeat(50));
    console.log('Database setup complete!');
    console.log('='.repeat(50) + colors.reset + '\n');

    console.log(colors.blue + 'Next Steps:' + colors.reset);
    console.log('  1. Update .env with your OpenAI API key');
    console.log('  2. Start backend: ' + colors.yellow + 'npm run dev' + colors.reset);
    console.log('  3. Test NLP API: ' + colors.yellow + 'curl http://localhost:3001/api/nlp/health' + colors.reset);
    console.log('\n' + colors.blue + 'Documentation:' + colors.reset);
    console.log('  • ' + colors.yellow + 'DATABASE_SETUP_GUIDE.md' + colors.reset);
    console.log('  • ' + colors.yellow + 'NLP_BACKEND_INTEGRATION.md' + colors.reset);
    console.log('  • ' + colors.yellow + '../COMPLETE_NLP_INTEGRATION_SUMMARY.md' + colors.reset + '\n');

  } catch (error) {
    log.error('Database setup failed!');
    console.error(error);
    process.exit(1);
  }
}

// Run setup
setupDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});
