#!/bin/bash

# Database Initialization Script for Playwright-CRX Backend
# This script sets up the PostgreSQL database and runs all migrations

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Playwright-CRX Database Initialization${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
    echo -e "${GREEN}✓ Loaded .env file${NC}"
else
    echo -e "${RED}✗ .env file not found!${NC}"
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}Please update .env with your configuration and run again.${NC}"
    exit 1
fi

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-playwright_crx}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${RED}✗ DB_PASSWORD not set in .env file!${NC}"
    exit 1
fi

# Set PGPASSWORD for psql commands
export PGPASSWORD="$DB_PASSWORD"

echo -e "\n${BLUE}Configuration:${NC}"
echo -e "  Host: ${DB_HOST}"
echo -e "  Port: ${DB_PORT}"
echo -e "  Database: ${DB_NAME}"
echo -e "  User: ${DB_USER}"

# Check if PostgreSQL is running
echo -e "\n${YELLOW}Checking PostgreSQL connection...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${RED}✗ Cannot connect to PostgreSQL!${NC}"
    echo -e "${YELLOW}Please ensure PostgreSQL is running and credentials are correct.${NC}"
    exit 1
fi

# Check if database exists
echo -e "\n${YELLOW}Checking if database exists...${NC}"
if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo -e "${GREEN}✓ Database '$DB_NAME' exists${NC}"
else
    echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -c "CREATE DATABASE $DB_NAME;"
    echo -e "${GREEN}✓ Database created${NC}"
fi

# Run base schema migration
echo -e "\n${YELLOW}Running base schema migration...${NC}"
if [ -f "migrations/008_complete_schema_latest.sql" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f migrations/008_complete_schema_latest.sql
    echo -e "${GREEN}✓ Base schema applied${NC}"
else
    echo -e "${RED}✗ Base schema migration file not found!${NC}"
    exit 1
fi

# Run NLP features migration
echo -e "\n${YELLOW}Running NLP features migration...${NC}"
if [ -f "migrations/009_nlp_features_tables.sql" ]; then
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f migrations/009_nlp_features_tables.sql
    echo -e "${GREEN}✓ NLP features schema applied${NC}"
else
    echo -e "${YELLOW}⚠ NLP features migration file not found, skipping...${NC}"
fi

# Verify tables
echo -e "\n${YELLOW}Verifying database tables...${NC}"
TABLE_COUNT=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';")
echo -e "${GREEN}✓ Found $TABLE_COUNT tables${NC}"

# List all tables
echo -e "\n${BLUE}Database Tables:${NC}"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "\dt"

# Check NLP tables specifically
echo -e "\n${YELLOW}Checking NLP feature tables...${NC}"
NLP_TABLES=("nlp_gherkin_scenarios" "nlp_parsed_requirements" "nlp_test_cases" "nlp_documentation_history" "nlp_voice_commands")

for table in "${NLP_TABLES[@]}"; do
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT to_regclass('public.$table');" | grep -q "$table"; then
        echo -e "  ${GREEN}✓ $table${NC}"
    else
        echo -e "  ${RED}✗ $table (missing)${NC}"
    fi
done

# Generate Prisma Client
echo -e "\n${YELLOW}Generating Prisma Client...${NC}"
if [ -f "prisma/schema.prisma" ]; then
    npx prisma generate
    echo -e "${GREEN}✓ Prisma Client generated${NC}"
else
    echo -e "${YELLOW}⚠ Prisma schema not found, skipping...${NC}"
fi

# Test database connection
echo -e "\n${YELLOW}Testing database connection from Node.js...${NC}"
node -e "
const { Pool } = require('pg');
const pool = new Pool({
    host: '$DB_HOST',
    port: $DB_PORT,
    database: '$DB_NAME',
    user: '$DB_USER',
    password: '$DB_PASSWORD'
});
pool.query('SELECT NOW() as current_time')
    .then(res => {
        console.log('\x1b[32m✓ Node.js connection successful\x1b[0m');
        console.log('  Current time:', res.rows[0].current_time);
        pool.end();
    })
    .catch(err => {
        console.error('\x1b[31m✗ Node.js connection failed\x1b[0m');
        console.error('  Error:', err.message);
        process.exit(1);
    });
"

echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Database initialization complete!${NC}"
echo -e "${GREEN}========================================${NC}\n"

echo -e "${BLUE}Next Steps:${NC}"
echo -e "  1. Update your .env file with OpenAI API key"
echo -e "  2. Start the backend server: ${YELLOW}npm run dev${NC}"
echo -e "  3. Test NLP endpoints: ${YELLOW}curl http://localhost:3001/api/nlp/health${NC}"
echo -e "\n${BLUE}Documentation:${NC}"
echo -e "  • Database Guide: ${YELLOW}DATABASE_SETUP_GUIDE.md${NC}"
echo -e "  • Backend Integration: ${YELLOW}NLP_BACKEND_INTEGRATION.md${NC}"
echo -e "  • Complete Summary: ${YELLOW}../COMPLETE_NLP_INTEGRATION_SUMMARY.md${NC}\n"
