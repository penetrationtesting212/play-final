/**
 * Run NLP Features Database Migration
 * Creates tables for storing NLP-generated content
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'playwright_crx',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting NLP Features Migration...\n');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '009_nlp_features_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded:', migrationPath);
    console.log('📊 SQL size:', migrationSQL.length, 'characters\n');
    
    // Execute migration
    console.log('⚡ Executing migration...');
    await client.query(migrationSQL);
    
    console.log('✅ Migration executed successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    const verifyQuery = `
      SELECT 
        tablename,
        schemaname
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND (
        tablename LIKE '%herkin%' 
        OR tablename LIKE '%equirement%'
        OR tablename LIKE '%estCase%'
        OR tablename LIKE '%overage%'
        OR tablename LIKE '%ocumentation%'
        OR tablename LIKE '%oice%'
        OR tablename LIKE '%NLP%'
      )
      ORDER BY tablename;
    `;
    
    const result = await client.query(verifyQuery);
    
    console.log('\n📋 Tables created:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.tablename}`);
    });
    
    // Verify views
    console.log('\n🔍 Verifying views...');
    const viewsQuery = `
      SELECT 
        viewname
      FROM pg_views 
      WHERE schemaname = 'public' 
      AND viewname LIKE '%NLP%'
      ORDER BY viewname;
    `;
    
    const viewsResult = await client.query(viewsQuery);
    
    console.log('\n📊 Views created:');
    viewsResult.rows.forEach(row => {
      console.log(`   ✓ ${row.viewname}`);
    });
    
    // Get table counts
    console.log('\n📈 Table Statistics:');
    for (const row of result.rows) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${row.tablename}"`);
        console.log(`   ${row.tablename}: ${countResult.rows[0].count} rows`);
      } catch (err) {
        console.log(`   ${row.tablename}: Error counting rows`);
      }
    }
    
    console.log('\n✨ NLP Features Migration Complete!');
    console.log('\n📚 New Tables:');
    console.log('   • GherkinScenario       - Store Gherkin/BDD scenarios');
    console.log('   • RequirementDocument   - Store requirements documents');
    console.log('   • GeneratedTestCase     - Store AI-generated test cases');
    console.log('   • TestCoverage          - Store test coverage analysis');
    console.log('   • DocumentationHistory  - Store generated documentation');
    console.log('   • VoiceCommandHistory   - Store voice command sessions');
    console.log('   • NLPUsageStats         - Track NLP feature usage');
    
    console.log('\n📊 New Views:');
    console.log('   • UserNLPActivitySummary     - User activity overview');
    console.log('   • TestCaseCoverageByUser     - Coverage by user');
    console.log('   • NLPFeatureUsageStats       - Feature usage statistics');
    
    console.log('\n🎉 All NLP features are ready to use!');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
console.log('=====================================');
console.log('NLP Features Database Migration');
console.log('=====================================\n');

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
