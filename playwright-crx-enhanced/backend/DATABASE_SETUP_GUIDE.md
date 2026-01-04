# Database Setup Guide - Complete Instructions

## 📋 Overview

This guide will help you set up the complete database for Playwright-CRX Enhanced, including all NLP features.

---

## 🎯 What Gets Created

### **Core Tables** (Already Exist)
- ✅ User
- ✅ RefreshToken
- ✅ Project
- ✅ Script
- ✅ TestRun
- ✅ TestStep
- ✅ ExtensionScript
- ✅ Variable
- ✅ Breakpoint
- ✅ TestSuite
- ✅ TestData
- ✅ ApiRequest

### **NLP Feature Tables** (NEW)
- 🆕 GherkinScenario
- 🆕 RequirementDocument
- 🆕 GeneratedTestCase
- 🆕 TestCoverage
- 🆕 DocumentationHistory
- 🆕 VoiceCommandHistory
- 🆕 NLPUsageStats

### **Analytics Views** (NEW)
- 🆕 UserNLPActivitySummary
- 🆕 TestCaseCoverageByUser
- 🆕 NLPFeatureUsageStats

---

## 🚀 Quick Setup (5 Steps)

### **Step 1: Install PostgreSQL**

#### On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### On macOS (using Homebrew):
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### On Windows:
Download from: https://www.postgresql.org/download/windows/

### **Step 2: Create Database**

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE playwright_crx;
CREATE USER playwright_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE playwright_crx TO playwright_user;
\q
```

### **Step 3: Configure Backend**

Create `.env` file in `playwright-crx-enhanced/backend/`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=playwright_crx
DB_USER=playwright_user
DB_PASSWORD=your_secure_password
DB_SCHEMA=public

# Database URL (auto-generated)
DATABASE_URL="postgresql://playwright_user:your_secure_password@localhost:5432/playwright_crx?schema=public"

# JWT Secrets
JWT_ACCESS_SECRET="your-super-secret-access-key-change-this"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this"

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenAI Configuration (for NLP features)
OPENAI_API_KEY=sk-your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4-turbo-preview
```

### **Step 4: Run Migrations**

```bash
cd playwright-crx-enhanced/backend

# Install dependencies (if not done)
npm install

# Run complete schema migration (creates core tables)
node migrations/run-complete-migration.js

# Run NLP features migration (creates NLP tables)
node migrations/run-nlp-migration.js
```

### **Step 5: Verify Setup**

```bash
# Connect to database
psql -h localhost -U playwright_user -d playwright_crx

# List all tables
\dt

# Should see all tables including:
# - User, Project, Script, TestRun, etc. (core tables)
# - GherkinScenario, RequirementDocument, etc. (NLP tables)

# List all views
\dv

# Should see:
# - UserNLPActivitySummary
# - TestCaseCoverageByUser
# - NLPFeatureUsageStats

# Exit
\q
```

---

## 📊 Database Schema Details

### **1. GherkinScenario Table**

**Purpose:** Store saved Gherkin/BDD scenarios

**Fields:**
- `id` - Primary key (UUID)
- `userId` - Foreign key to User
- `name` - Scenario name
- `content` - Gherkin scenario content
- `language` - Programming language (typescript, javascript, python, etc.)
- `framework` - Test framework (playwright, jest, mocha, etc.)
- `tags` - Array of tags for categorization
- `generatedCode` - Last generated Playwright code
- `confidence` - AI confidence score (0.00-1.00)
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- userId, createdAt, language, framework

---

### **2. RequirementDocument Table**

**Purpose:** Store requirements documents

**Fields:**
- `id` - Primary key (UUID)
- `userId` - Foreign key to User
- `projectName` - Project name
- `content` - Requirements document content
- `format` - Document format (markdown, plain, structured)
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- userId, createdAt, projectName

---

### **3. GeneratedTestCase Table**

**Purpose:** Store AI-generated test cases

**Fields:**
- `id` - Primary key (UUID)
- `userId` - Foreign key to User
- `requirementId` - Foreign key to RequirementDocument (optional)
- `title` - Test case title
- `description` - Test case description
- `priority` - Priority level (high, medium, low)
- `type` - Test type (functional, ui, integration, e2e, regression)
- `steps` - JSON array of test steps
- `expectedResult` - Expected result description
- `playwrightCode` - Generated Playwright code
- `status` - Status (draft, generated, approved, archived)
- `confidence` - AI confidence score
- `tags` - Array of tags
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- userId, requirementId, priority, type, status, createdAt

---

### **4. TestCoverage Table**

**Purpose:** Store test coverage analysis

**Fields:**
- `id` - Primary key (UUID)
- `userId` - Foreign key to User
- `requirementId` - Foreign key to RequirementDocument
- `functional` - Functional test coverage percentage
- `ui` - UI test coverage percentage
- `integration` - Integration test coverage percentage
- `e2e` - E2E test coverage percentage
- `regression` - Regression test coverage percentage
- `totalTestCases` - Total number of test cases
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- userId, requirementId, createdAt

---

### **5. DocumentationHistory Table**

**Purpose:** Store generated documentation versions

**Fields:**
- `id` - Primary key (UUID)
- `userId` - Foreign key to User
- `title` - Documentation title
- `description` - Documentation description
- `version` - Version number
- `author` - Author name
- `format` - Output format (markdown, html, pdf, confluence)
- `template` - Template type (standard, detailed, minimal)
- `content` - Full documentation content
- `sections` - JSON array of sections
- `scriptIds` - Array of script IDs included
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- userId, createdAt, format, version

---

### **6. VoiceCommandHistory Table**

**Purpose:** Store voice command sessions

**Fields:**
- `id` - Primary key (UUID)
- `userId` - Foreign key to User
- `transcript` - Voice command transcript
- `action` - Interpreted action
- `playwrightCode` - Generated Playwright code
- `language` - Voice recognition language (en-US, es-ES, etc.)
- `confidence` - Voice recognition confidence score
- `status` - Status (pending, processed, error)
- `executedAt` - Execution timestamp
- `createdAt` - Creation timestamp

**Indexes:**
- userId, createdAt, status, language

---

### **7. NLPUsageStats Table**

**Purpose:** Track NLP feature usage for analytics

**Fields:**
- `id` - Primary key (UUID)
- `userId` - Foreign key to User
- `feature` - Feature name (gherkin, requirements, documentation, voice)
- `action` - Action performed (convert, parse, generate, etc.)
- `inputSize` - Input size in characters
- `outputSize` - Output size in characters
- `processingTime` - Processing time in milliseconds
- `success` - Success flag
- `errorMessage` - Error message (if failed)
- `metadata` - Additional JSON metadata
- `createdAt` - Creation timestamp

**Indexes:**
- userId, feature, createdAt, success

---

## 📈 Analytics Views

### **1. UserNLPActivitySummary**

Shows overall NLP activity per user:
- Total Gherkin scenarios
- Total requirements
- Total test cases
- Total documentation
- Total voice commands
- Total usage records
- Last activity timestamp

**Query:**
```sql
SELECT * FROM "UserNLPActivitySummary" WHERE "userId" = 'user-id';
```

---

### **2. TestCaseCoverageByUser**

Shows test case distribution per user:
- Total test cases
- High/Medium/Low priority counts
- Functional/UI/Integration/E2E/Regression counts

**Query:**
```sql
SELECT * FROM "TestCaseCoverageByUser" WHERE "userId" = 'user-id';
```

---

### **3. NLPFeatureUsageStats**

Shows feature usage statistics:
- Total usage per feature/action
- Success/failure counts
- Average processing time
- Average input/output size
- Usage trends by date

**Query:**
```sql
SELECT * FROM "NLPFeatureUsageStats" 
WHERE feature = 'gherkin' 
ORDER BY "usageDate" DESC 
LIMIT 30;
```

---

## 🛠️ Manual Migration Steps

If you prefer to run migrations manually:

### **Step 1: Run Core Schema**
```bash
psql -h localhost -U playwright_user -d playwright_crx -f migrations/008_complete_schema_latest.sql
```

### **Step 2: Run NLP Schema**
```bash
psql -h localhost -U playwright_user -d playwright_crx -f migrations/009_nlp_features_tables.sql
```

---

## 🔍 Verification Queries

### **Check All Tables**
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
```

### **Check NLP Tables**
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND (
  tablename LIKE '%herkin%' OR 
  tablename LIKE '%equirement%' OR 
  tablename LIKE '%estCase%' OR 
  tablename LIKE '%overage%' OR 
  tablename LIKE '%ocumentation%' OR 
  tablename LIKE '%oice%' OR 
  tablename LIKE '%NLP%'
)
ORDER BY tablename;
```

### **Check Views**
```sql
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public' 
ORDER BY viewname;
```

### **Check Table Row Counts**
```sql
SELECT 
  schemaname,
  tablename,
  n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

---

## 🐛 Troubleshooting

### **Problem: Connection refused**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

### **Problem: Authentication failed**
```bash
# Edit pg_hba.conf (location varies by OS)
sudo nano /etc/postgresql/16/main/pg_hba.conf

# Add/modify:
local   all   all   md5
host    all   all   127.0.0.1/32   md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### **Problem: Database does not exist**
```bash
# Create database
sudo -u postgres createdb playwright_crx

# Or using psql
sudo -u postgres psql
CREATE DATABASE playwright_crx;
\q
```

### **Problem: Permission denied**
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE playwright_crx TO playwright_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO playwright_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO playwright_user;
```

### **Problem: Migration fails midway**
```sql
-- Rollback and retry
-- NLP tables have IF NOT EXISTS, so safe to re-run
-- Drop NLP tables if needed:
DROP TABLE IF EXISTS "VoiceCommandHistory" CASCADE;
DROP TABLE IF EXISTS "NLPUsageStats" CASCADE;
DROP TABLE IF EXISTS "DocumentationHistory" CASCADE;
DROP TABLE IF EXISTS "TestCoverage" CASCADE;
DROP TABLE IF EXISTS "GeneratedTestCase" CASCADE;
DROP TABLE IF EXISTS "RequirementDocument" CASCADE;
DROP TABLE IF EXISTS "GherkinScenario" CASCADE;

-- Then re-run migration
node migrations/run-nlp-migration.js
```

---

## 📦 Backup & Restore

### **Backup Database**
```bash
# Full backup
pg_dump -h localhost -U playwright_user playwright_crx > backup.sql

# Data only
pg_dump -h localhost -U playwright_user --data-only playwright_crx > data_backup.sql

# Schema only
pg_dump -h localhost -U playwright_user --schema-only playwright_crx > schema_backup.sql
```

### **Restore Database**
```bash
# Drop and recreate database
dropdb -h localhost -U playwright_user playwright_crx
createdb -h localhost -U playwright_user playwright_crx

# Restore from backup
psql -h localhost -U playwright_user playwright_crx < backup.sql
```

---

## 🎯 Next Steps

After database setup:

1. ✅ Start backend: `npm run dev`
2. ✅ Test database connection: `http://localhost:3001/db/health`
3. ✅ Create test user via signup
4. ✅ Test NLP endpoints
5. ✅ Start using NLP features!

---

## 📞 Support

**Documentation:**
- NLP Backend Integration: `NLP_BACKEND_INTEGRATION.md`
- Complete Integration: `COMPLETE_NLP_INTEGRATION_SUMMARY.md`

**PostgreSQL Resources:**
- Official Docs: https://www.postgresql.org/docs/
- Community: https://www.postgresql.org/community/

---

*Database Setup Guide v1.0.0*  
*Last Updated: 2024-01-15*  
*Status: ✅ Production-Ready*
