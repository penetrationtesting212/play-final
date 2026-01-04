# Database Setup Guide for Playwright-CRX Backend

## Overview

This guide provides comprehensive instructions for setting up the PostgreSQL database for the Playwright-CRX backend, including all core features and NLP (Natural Language Processing) capabilities.

## Database Architecture

### Core Tables
- **users** - User authentication and profile management
- **projects** - Test project organization
- **scripts** - Playwright test scripts
- **test_runs** - Test execution history
- **test_steps** - Individual test step details
- **test_suites** - Test suite organization
- **test_data** - Test data management
- **api_requests** - API testing requests
- **extension_scripts** - Browser extension scripts
- **variables** - Script variables
- **breakpoints** - Debug breakpoints

### NLP Feature Tables
- **nlp_gherkin_scenarios** - Gherkin/BDD scenario storage and conversion history
- **nlp_parsed_requirements** - Parsed requirements from various formats
- **nlp_test_cases** - Auto-generated test cases from requirements
- **nlp_documentation_history** - Generated documentation versions
- **nlp_voice_commands** - Voice command recordings and transcripts

## Prerequisites

### 1. PostgreSQL Installation

#### macOS (using Homebrew)
```bash
brew install postgresql@15
brew services start postgresql@15
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Download and install from: https://www.postgresql.org/download/windows/

### 2. Node.js and npm
```bash
node --version  # Should be >= 20.0.0
npm --version   # Should be >= 10.0.0
```

### 3. Environment Setup
```bash
cd /home/user/webapp/playwright-crx-enhanced/backend

# Copy environment template
cp .env.example .env

# Edit .env and update the following:
# - DB_PASSWORD (your PostgreSQL password)
# - OPENAI_API_KEY (for NLP features)
```

## Quick Start (Recommended)

### Method 1: Using npm script (Easiest)

```bash
# Install dependencies
npm install

# Setup database (creates database, runs all migrations)
npm run db:setup

# Start the backend server
npm run dev
```

### Method 2: Using bash script

```bash
# Make sure .env is configured
cat .env | grep DB_PASSWORD

# Run the setup script
./scripts/init-database.sh

# Start the server
npm run dev
```

### Method 3: Manual psql commands

```bash
# Set password
export PGPASSWORD="your_password_here"

# Create database
psql -h localhost -U postgres -c "CREATE DATABASE playwright_crx;"

# Run migrations
psql -h localhost -U postgres -d playwright_crx -f migrations/008_complete_schema_latest.sql
psql -h localhost -U postgres -d playwright_crx -f migrations/009_nlp_features_tables.sql

# Verify
psql -h localhost -U postgres -d playwright_crx -c "\dt"
```

## Step-by-Step Setup

### Step 1: Configure PostgreSQL

```bash
# Login to PostgreSQL
sudo -u postgres psql

# In PostgreSQL shell:
CREATE USER playwright_user WITH PASSWORD 'secure_password_here';
CREATE DATABASE playwright_crx OWNER playwright_user;
GRANT ALL PRIVILEGES ON DATABASE playwright_crx TO playwright_user;
\q
```

### Step 2: Update .env File

Edit `/home/user/webapp/playwright-crx-enhanced/backend/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=playwright_crx
DB_USER=playwright_user
DB_PASSWORD=secure_password_here
DB_SCHEMA=public

# Constructed DATABASE_URL (no need to edit if above values are correct)
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}"

# OpenAI Configuration (for NLP features)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4
OPENAI_BASE_URL=https://api.openai.com/v1

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Step 3: Install Dependencies

```bash
cd /home/user/webapp/playwright-crx-enhanced/backend
npm install
```

### Step 4: Run Database Setup

Choose one of the methods:

**Option A: Automated Setup (Recommended)**
```bash
npm run db:setup
```

**Option B: Bash Script**
```bash
./scripts/init-database.sh
```

**Option C: Node.js Script**
```bash
node scripts/setup-database.js
```

### Step 5: Verify Database

```bash
# Method 1: Using psql
psql -h localhost -U playwright_user -d playwright_crx -c "\dt"

# Method 2: Using Node.js
node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \\'public\\'')
  .then(res => { console.log('Tables:', res.rows[0].count); pool.end(); })
  .catch(err => { console.error(err); process.exit(1); });
"
```

### Step 6: Generate Prisma Client

```bash
npm run prisma:generate
```

### Step 7: Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run build
npm start
```

## Verification Steps

### 1. Check Database Connection

```bash
curl http://localhost:3001/db/health
```

Expected response:
```json
{
  "status": "ok",
  "database": {
    "ok": "1"
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### 2. Check NLP Health

```bash
curl http://localhost:3001/api/nlp/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "openai": {
    "configured": true,
    "model": "gpt-4"
  },
  "database": {
    "connected": true
  },
  "features": [
    "gherkin-conversion",
    "requirements-parsing",
    "test-generation",
    "documentation-generation"
  ]
}
```

### 3. List All Tables

```bash
psql -h localhost -U playwright_user -d playwright_crx -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"
```

Expected tables (16+ total):
- api_requests
- breakpoints
- extension_scripts
- nlp_documentation_history
- nlp_gherkin_scenarios
- nlp_parsed_requirements
- nlp_test_cases
- nlp_voice_commands
- projects
- refresh_tokens
- scripts
- test_data
- test_runs
- test_steps
- test_suites
- users
- variables

### 4. Test NLP Endpoints

#### Convert Gherkin to Playwright
```bash
curl -X POST http://localhost:3001/api/nlp/convert-gherkin \
  -H "Content-Type: application/json" \
  -d '{
    "gherkin": "Feature: Login\nScenario: User logs in\nGiven I am on the login page\nWhen I enter valid credentials\nThen I should see the dashboard",
    "targetLanguage": "typescript",
    "framework": "playwright"
  }'
```

#### Parse Requirements
```bash
curl -X POST http://localhost:3001/api/nlp/parse-requirements \
  -H "Content-Type: application/json" \
  -d '{
    "requirements": "The system should allow users to login with email and password",
    "format": "plain"
  }'
```

## Troubleshooting

### Common Issues

#### 1. Cannot connect to PostgreSQL

**Problem:** `ECONNREFUSED` or connection timeout

**Solutions:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@15  # macOS

# Check port
netstat -an | grep 5432  # Should show LISTEN on port 5432
```

#### 2. Authentication failed

**Problem:** `password authentication failed for user`

**Solutions:**
```bash
# Reset PostgreSQL password
sudo -u postgres psql -c "ALTER USER playwright_user WITH PASSWORD 'new_password';"

# Update .env file with new password
nano .env  # or use your preferred editor

# Try connection again
npm run db:setup
```

#### 3. Database already exists

**Problem:** Database creation fails because it already exists

**Solutions:**
```bash
# Drop and recreate (WARNING: This deletes all data!)
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS playwright_crx;"
npm run db:setup

# Or just run migrations on existing database
psql -h localhost -U postgres -d playwright_crx -f migrations/009_nlp_features_tables.sql
```

#### 4. Permission denied on tables

**Problem:** User cannot access tables

**Solutions:**
```bash
sudo -u postgres psql -d playwright_crx << EOF
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO playwright_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO playwright_user;
GRANT ALL PRIVILEGES ON DATABASE playwright_crx TO playwright_user;
EOF
```

#### 5. NLP features not working

**Problem:** NLP endpoints return errors

**Solutions:**
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY  # Should not be empty

# Verify in .env
grep OPENAI_API_KEY .env

# Test OpenAI connection
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Check NLP tables exist
psql -h localhost -U playwright_user -d playwright_crx -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'nlp_%';
"
```

### Database Reset

If you need to completely reset the database:

```bash
# WARNING: This deletes ALL data!

# Method 1: Drop and recreate
psql -h localhost -U postgres << EOF
DROP DATABASE IF EXISTS playwright_crx;
CREATE DATABASE playwright_crx;
EOF
npm run db:setup

# Method 2: Truncate all tables
psql -h localhost -U postgres -d playwright_crx << EOF
TRUNCATE TABLE 
  nlp_voice_commands,
  nlp_documentation_history,
  nlp_test_cases,
  nlp_parsed_requirements,
  nlp_gherkin_scenarios,
  test_steps,
  test_runs,
  scripts,
  projects,
  api_requests,
  test_data,
  test_suites,
  extension_scripts,
  variables,
  breakpoints,
  refresh_tokens,
  users
CASCADE;
EOF
```

## Database Backup and Restore

### Backup

```bash
# Full database backup
pg_dump -h localhost -U playwright_user playwright_crx > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables (e.g., only NLP tables)
pg_dump -h localhost -U playwright_user -t nlp_* playwright_crx > nlp_backup.sql

# Compressed backup
pg_dump -h localhost -U playwright_user playwright_crx | gzip > backup.sql.gz
```

### Restore

```bash
# Restore from backup
psql -h localhost -U playwright_user -d playwright_crx < backup_20240115_103000.sql

# Restore from compressed backup
gunzip -c backup.sql.gz | psql -h localhost -U playwright_user -d playwright_crx
```

## Monitoring and Maintenance

### Database Size

```bash
psql -h localhost -U playwright_user -d playwright_crx -c "
SELECT 
  pg_size_pretty(pg_database_size('playwright_crx')) as database_size;
"
```

### Table Sizes

```bash
psql -h localhost -U playwright_user -d playwright_crx -c "
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY pg_total_relation_size(quote_ident(table_name)) DESC;
"
```

### Row Counts

```bash
psql -h localhost -U playwright_user -d playwright_crx << EOF
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
EOF
```

### Vacuum and Analyze

```bash
# Optimize database performance
psql -h localhost -U playwright_user -d playwright_crx -c "VACUUM ANALYZE;"
```

## Production Recommendations

1. **Security:**
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access by IP
   - Regularly update PostgreSQL

2. **Performance:**
   - Set up connection pooling
   - Configure appropriate indexes
   - Regular VACUUM operations
   - Monitor query performance

3. **Backup:**
   - Automate daily backups
   - Test restore procedures
   - Store backups off-site
   - Keep backup logs

4. **Monitoring:**
   - Set up database monitoring
   - Configure alerts for errors
   - Track query performance
   - Monitor disk usage

## Additional Resources

- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Prisma Documentation:** https://www.prisma.io/docs/
- **NLP Features Guide:** `NLP_BACKEND_INTEGRATION.md`
- **Complete Integration Summary:** `../COMPLETE_NLP_INTEGRATION_SUMMARY.md`
- **API Documentation:** http://localhost:3001/api-docs

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the NLP Backend Integration guide
3. Check backend logs: `tail -f logs/app.log`
4. Verify environment configuration: `cat .env`

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
**Author:** Playwright-CRX Team
