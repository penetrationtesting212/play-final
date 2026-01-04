# Database Schema Documentation

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PLAYWRIGHT-CRX DATABASE SCHEMA                       │
│                              (PostgreSQL 15+)                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│      users           │         │   refresh_tokens     │
├──────────────────────┤         ├──────────────────────┤
│ • id (PK)            │◄───────┐│ • id (PK)            │
│ • email (UNIQUE)     │        ││ • token (UNIQUE)     │
│ • password           │        ││ • user_id (FK)       │
│ • name               │        ││ • expires_at         │
│ • created_at         │        ││ • revoked_at         │
│ • updated_at         │        │└──────────────────────┘
└──────────────────────┘        │
         │                      │
         │                      │
         │  ┌───────────────────┼─────────────────────┐
         │  │                   │                     │
         ▼  ▼                   ▼                     ▼
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│     projects         │ │      scripts         │ │  extension_scripts   │
├──────────────────────┤ ├──────────────────────┤ ├──────────────────────┤
│ • id (PK)            │ │ • id (PK)            │ │ • id (PK)            │
│ • name               │ │ • name               │ │ • name               │
│ • description        │ │ • description        │ │ • description        │
│ • user_id (FK)       │ │ • language           │ │ • code               │
│ • created_at         │ │ • code               │ │ • script_type        │
│ • updated_at         │ │ • project_id (FK)    │ │ • user_id (FK)       │
└──────────────────────┘ │ • user_id (FK)       │ │ • enabled            │
         │               │ • browser_type       │ │ • created_at         │
         │               │ • viewport           │ │ • updated_at         │
         │               │ • test_id_attribute  │ └──────────────────────┘
         │               │ • workflow_status    │
         │               │ • created_at         │
         │               │ • updated_at         │         ┌──────────────────────┐
         │               └──────────────────────┘         │    test_suites       │
         │                        │                       ├──────────────────────┤
         │                        │                       │ • id (PK)            │
         │                ┌───────┴────────┬─────────┐    │ • name               │
         │                │                │         │    │ • description        │
         │                ▼                ▼         │    │ • user_id (FK)       │
         │       ┌──────────────────┐ ┌─────────────┴──┐ │ • created_at         │
         │       │    test_runs     │ │   variables    │ │ • updated_at         │
         │       ├──────────────────┤ ├────────────────┤ └──────────────────────┘
         │       │ • id (PK)        │ │ • id (PK)      │         │
         │       │ • script_id (FK) │ │ • script_id(FK)│         │
         │       │ • user_id (FK)   │ │ • name         │         ▼
         │       │ • status         │ │ • value        │ ┌──────────────────────┐
         │       │ • duration       │ │ • type         │ │     test_data        │
         │       │ • error_message  │ │ • created_at   │ ├──────────────────────┤
         │       │ • trace_url      │ │ • updated_at   │ │ • id (PK)            │
         │       │ • screenshot_urls│ └────────────────┘ │ • suite_id (FK)      │
         │       │ • video_url      │                    │ • name               │
         │       │ • environment    │ ┌────────────────┐ │ • environment        │
         │       │ • browser        │ │  breakpoints   │ │ • type               │
         │       │ • viewport       │ ├────────────────┤ │ • data (JSON)        │
         │       │ • started_at     │ │ • id (PK)      │ │ • created_at         │
         │       │ • completed_at   │ │ • script_id(FK)│ │ • updated_at         │
         │       │ • report_url     │ │ • line_number  │ └──────────────────────┘
         │       └──────────────────┘ │ • enabled      │
         │                │           │ • condition    │
         │                │           │ • created_at   │
         │                ▼           └────────────────┘
         │       ┌──────────────────┐
         │       │   test_steps     │
         │       ├──────────────────┤
         │       │ • id (PK)        │
         │       │ • test_run_id(FK)│         ┌──────────────────────┐
         │       │ • step_number    │         │   api_requests       │
         │       │ • action         │         ├──────────────────────┤
         │       │ • selector       │         │ • id (PK)            │
         │       │ • value          │         │ • user_id (FK)       │
         │       │ • status         │         │ • name               │
         │       │ • duration       │         │ • method             │
         │       │ • error_message  │         │ • url                │
         │       │ • timestamp      │         │ • headers (JSON)     │
         │       └──────────────────┘         │ • body (JSON)        │
         │                                    │ • environment        │
         └────────────────────────────────────┤ • created_at         │
                                              │ • updated_at         │
                                              └──────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           NLP FEATURE TABLES                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────┐
│  nlp_gherkin_scenarios         │
├────────────────────────────────┤
│ • id (PK)                      │
│ • user_id (FK → users)         │
│ • project_id (FK → projects)   │
│ • name                         │
│ • gherkin_content (TEXT)       │
│ • converted_code (TEXT)        │
│ • target_language              │
│ • target_framework             │
│ • conversion_metadata (JSON)   │
│ • confidence_score             │
│ • status                       │
│ • created_at                   │
│ • updated_at                   │
└────────────────────────────────┘
         │
         │
         ▼
┌────────────────────────────────┐
│  nlp_parsed_requirements       │
├────────────────────────────────┤
│ • id (PK)                      │
│ • user_id (FK → users)         │
│ • project_id (FK → projects)   │
│ • source_format                │
│ • raw_requirements (TEXT)      │
│ • parsed_data (JSON)           │         ┌─────────────────────────┐
│ • total_requirements           │         │ nlp_documentation_history│
│ • analysis_metadata (JSON)     │         ├─────────────────────────┤
│ • created_at                   │         │ • id (PK)               │
│ • updated_at                   │         │ • user_id (FK → users)  │
└────────────────────────────────┘         │ • project_id (FK)       │
         │                                 │ • title                 │
         │                                 │ • content (TEXT)        │
         ▼                                 │ • format                │
┌────────────────────────────────┐         │ • template              │
│       nlp_test_cases           │         │ • version               │
├────────────────────────────────┤         │ • metadata (JSON)       │
│ • id (PK)                      │         │ • created_at            │
│ • requirement_id (FK)          │         │ • updated_at            │
│ • user_id (FK → users)         │         └─────────────────────────┘
│ • project_id (FK → projects)   │
│ • title                        │
│ • description (TEXT)           │         ┌─────────────────────────┐
│ • test_type                    │         │   nlp_voice_commands    │
│ • priority                     │         ├─────────────────────────┤
│ • steps (JSON)                 │         │ • id (PK)               │
│ • expected_result (TEXT)       │         │ • user_id (FK → users)  │
│ • playwright_code (TEXT)       │         │ • project_id (FK)       │
│ • status                       │         │ • transcript (TEXT)     │
│ • created_at                   │         │ • command_type          │
│ • updated_at                   │         │ • language              │
└────────────────────────────────┘         │ • generated_code (TEXT) │
                                           │ • confidence            │
                                           │ • audio_duration        │
                                           │ • metadata (JSON)       │
                                           │ • created_at            │
                                           │ • updated_at            │
                                           └─────────────────────────┘

Legend:
  • PK  = Primary Key
  • FK  = Foreign Key
  ──►  = One-to-Many Relationship
  ◄──  = Foreign Key Reference
```

## Table Details

### Core Tables

#### 1. users
**Purpose:** User authentication and management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password | VARCHAR(255) | NOT NULL | Hashed password |
| name | VARCHAR(255) | NULL | User display name |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on (email)

---

#### 2. refresh_tokens
**Purpose:** JWT refresh token management

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Token identifier |
| token | TEXT | UNIQUE, NOT NULL | Refresh token string |
| user_id | CUID | FK → users.id | Owner user |
| expires_at | TIMESTAMP | NOT NULL | Token expiration |
| revoked_at | TIMESTAMP | NULL | Token revocation time |
| created_at | TIMESTAMP | DEFAULT NOW() | Token creation |

**Indexes:**
- `idx_refresh_tokens_user_id` on (user_id)
- `idx_refresh_tokens_token` on (token)

---

#### 3. projects
**Purpose:** Test project organization

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Project identifier |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | NULL | Project description |
| user_id | CUID | FK → users.id | Project owner |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_projects_user_id` on (user_id)
- `idx_projects_created_at` on (created_at)

---

#### 4. scripts
**Purpose:** Playwright test scripts storage

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Script identifier |
| name | VARCHAR(255) | NOT NULL | Script name |
| description | TEXT | NULL | Script description |
| language | VARCHAR(50) | DEFAULT 'typescript' | Programming language |
| code | TEXT | NOT NULL | Script code |
| project_id | CUID | FK → projects.id | Parent project |
| user_id | CUID | FK → users.id | Script author |
| browser_type | VARCHAR(50) | DEFAULT 'chromium' | Target browser |
| viewport | JSON | NULL | Viewport configuration |
| test_id_attribute | VARCHAR(100) | DEFAULT 'data-testid' | Test ID attribute |
| workflow_status | VARCHAR(50) | DEFAULT 'draft' | Workflow status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_scripts_user_id` on (user_id)
- `idx_scripts_project_id` on (project_id)
- `idx_scripts_created_at` on (created_at)
- `idx_scripts_workflow_status` on (workflow_status)

---

#### 5. test_runs
**Purpose:** Test execution history and results

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Test run identifier |
| script_id | CUID | FK → scripts.id | Executed script |
| user_id | CUID | FK → users.id | Test executor |
| status | VARCHAR(50) | NOT NULL | Execution status |
| duration | INTEGER | NULL | Duration in milliseconds |
| error_message | TEXT | NULL | Error details |
| trace_url | TEXT | NULL | Playwright trace URL |
| screenshot_urls | JSON | NULL | Screenshot URLs |
| video_url | TEXT | NULL | Test video URL |
| environment | VARCHAR(50) | DEFAULT 'dev' | Test environment |
| browser | VARCHAR(50) | DEFAULT 'chromium' | Browser used |
| viewport | JSON | NULL | Viewport settings |
| started_at | TIMESTAMP | DEFAULT NOW() | Start time |
| completed_at | TIMESTAMP | NULL | Completion time |
| execution_report_url | TEXT | NULL | Report URL |

**Indexes:**
- `idx_test_runs_script_id` on (script_id)
- `idx_test_runs_user_id` on (user_id)
- `idx_test_runs_status` on (status)
- `idx_test_runs_started_at` on (started_at)

---

#### 6. test_steps
**Purpose:** Individual test step details

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Step identifier |
| test_run_id | CUID | FK → test_runs.id | Parent test run |
| step_number | INTEGER | NOT NULL | Step sequence number |
| action | VARCHAR(255) | NOT NULL | Action performed |
| selector | TEXT | NULL | Element selector |
| value | TEXT | NULL | Input value |
| status | VARCHAR(50) | NOT NULL | Step status |
| duration | INTEGER | NULL | Duration in ms |
| error_message | TEXT | NULL | Error details |
| timestamp | TIMESTAMP | DEFAULT NOW() | Execution time |

**Indexes:**
- `idx_test_steps_test_run_id` on (test_run_id)
- `idx_test_steps_step_number` on (step_number)

---

### NLP Feature Tables

#### 7. nlp_gherkin_scenarios
**Purpose:** Gherkin/BDD scenario storage and conversion history

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Scenario identifier |
| user_id | CUID | FK → users.id | Scenario owner |
| project_id | CUID | FK → projects.id | Related project |
| name | VARCHAR(255) | NOT NULL | Scenario name |
| gherkin_content | TEXT | NOT NULL | Original Gherkin text |
| converted_code | TEXT | NULL | Generated Playwright code |
| target_language | VARCHAR(50) | DEFAULT 'typescript' | Target language |
| target_framework | VARCHAR(50) | DEFAULT 'playwright' | Target framework |
| conversion_metadata | JSON | NULL | Conversion details |
| confidence_score | DECIMAL(5,2) | NULL | AI confidence (0-100) |
| status | VARCHAR(50) | DEFAULT 'pending' | Conversion status |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_nlp_gherkin_user_id` on (user_id)
- `idx_nlp_gherkin_project_id` on (project_id)
- `idx_nlp_gherkin_status` on (status)

---

#### 8. nlp_parsed_requirements
**Purpose:** Parsed requirements from various formats

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Requirement set ID |
| user_id | CUID | FK → users.id | Owner |
| project_id | CUID | FK → projects.id | Related project |
| source_format | VARCHAR(50) | NOT NULL | Format (md, txt, user_story) |
| raw_requirements | TEXT | NOT NULL | Original requirements text |
| parsed_data | JSON | NOT NULL | Parsed requirements array |
| total_requirements | INTEGER | DEFAULT 0 | Count of requirements |
| analysis_metadata | JSON | NULL | Analysis details |
| created_at | TIMESTAMP | DEFAULT NOW() | Parse timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_nlp_parsed_user_id` on (user_id)
- `idx_nlp_parsed_project_id` on (project_id)
- `idx_nlp_parsed_format` on (source_format)

---

#### 9. nlp_test_cases
**Purpose:** Auto-generated test cases from requirements

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Test case ID |
| requirement_id | CUID | FK → nlp_parsed_requirements.id | Source requirement |
| user_id | CUID | FK → users.id | Owner |
| project_id | CUID | FK → projects.id | Related project |
| title | VARCHAR(255) | NOT NULL | Test case title |
| description | TEXT | NOT NULL | Test description |
| test_type | VARCHAR(50) | NOT NULL | Type (functional, ui, etc) |
| priority | VARCHAR(20) | DEFAULT 'medium' | Priority level |
| steps | JSON | NOT NULL | Test steps array |
| expected_result | TEXT | NOT NULL | Expected outcome |
| playwright_code | TEXT | NULL | Generated Playwright code |
| status | VARCHAR(50) | DEFAULT 'generated' | Test case status |
| created_at | TIMESTAMP | DEFAULT NOW() | Generation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_nlp_test_cases_requirement_id` on (requirement_id)
- `idx_nlp_test_cases_user_id` on (user_id)
- `idx_nlp_test_cases_project_id` on (project_id)
- `idx_nlp_test_cases_test_type` on (test_type)
- `idx_nlp_test_cases_priority` on (priority)

---

#### 10. nlp_documentation_history
**Purpose:** Generated documentation versions

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Documentation ID |
| user_id | CUID | FK → users.id | Document owner |
| project_id | CUID | FK → projects.id | Related project |
| title | VARCHAR(255) | NOT NULL | Document title |
| content | TEXT | NOT NULL | Document content |
| format | VARCHAR(50) | NOT NULL | Format (markdown, html, pdf) |
| template | VARCHAR(100) | DEFAULT 'standard' | Template used |
| version | INTEGER | DEFAULT 1 | Version number |
| metadata | JSON | NULL | Generation metadata |
| created_at | TIMESTAMP | DEFAULT NOW() | Generation timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_nlp_docs_user_id` on (user_id)
- `idx_nlp_docs_project_id` on (project_id)
- `idx_nlp_docs_format` on (format)
- `idx_nlp_docs_version` on (version)

---

#### 11. nlp_voice_commands
**Purpose:** Voice command recordings and transcripts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Command ID |
| user_id | CUID | FK → users.id | Command owner |
| project_id | CUID | FK → projects.id | Related project |
| transcript | TEXT | NOT NULL | Transcribed text |
| command_type | VARCHAR(100) | NOT NULL | Command classification |
| language | VARCHAR(10) | DEFAULT 'en-US' | Spoken language |
| generated_code | TEXT | NULL | Generated Playwright code |
| confidence | DECIMAL(5,2) | NULL | Recognition confidence |
| audio_duration | INTEGER | NULL | Duration in milliseconds |
| metadata | JSON | NULL | Additional metadata |
| created_at | TIMESTAMP | DEFAULT NOW() | Recording timestamp |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |

**Indexes:**
- `idx_nlp_voice_user_id` on (user_id)
- `idx_nlp_voice_project_id` on (project_id)
- `idx_nlp_voice_command_type` on (command_type)
- `idx_nlp_voice_language` on (language)

---

## Relationships

### User → Projects (One-to-Many)
- One user can own multiple projects
- CASCADE DELETE: Deleting a user deletes all their projects

### User → Scripts (One-to-Many)
- One user can create multiple scripts
- CASCADE DELETE: Deleting a user deletes all their scripts

### Project → Scripts (One-to-Many)
- One project can contain multiple scripts
- CASCADE DELETE: Deleting a project deletes all its scripts

### Script → TestRuns (One-to-Many)
- One script can have multiple test runs
- CASCADE DELETE: Deleting a script deletes all its test runs

### TestRun → TestSteps (One-to-Many)
- One test run contains multiple test steps
- CASCADE DELETE: Deleting a test run deletes all its steps

### User → NLP Features (One-to-Many)
- One user can have multiple NLP scenarios, requirements, test cases, documentation, and voice commands
- CASCADE DELETE: Deleting a user deletes all their NLP data

### Project → NLP Features (One-to-Many)
- One project can have multiple NLP scenarios, requirements, test cases, documentation, and voice commands
- SET NULL: Deleting a project sets project_id to NULL in NLP records

### Requirement → TestCases (One-to-Many)
- One parsed requirement can generate multiple test cases
- CASCADE DELETE: Deleting a requirement deletes its generated test cases

---

## JSON Column Structures

### scripts.viewport
```json
{
  "width": 1920,
  "height": 1080
}
```

### test_runs.screenshot_urls
```json
[
  "https://storage.example.com/screenshots/abc123.png",
  "https://storage.example.com/screenshots/def456.png"
]
```

### nlp_gherkin_scenarios.conversion_metadata
```json
{
  "steps_count": 5,
  "conversion_time_ms": 1234,
  "model_version": "gpt-4",
  "warnings": []
}
```

### nlp_parsed_requirements.parsed_data
```json
[
  {
    "id": "req-001",
    "text": "User should be able to login",
    "priority": "high",
    "type": "functional"
  }
]
```

### nlp_test_cases.steps
```json
[
  {
    "step": 1,
    "action": "Navigate to login page",
    "expected": "Login form is visible"
  },
  {
    "step": 2,
    "action": "Enter credentials",
    "expected": "Fields are filled"
  }
]
```

### nlp_voice_commands.metadata
```json
{
  "audio_file_url": "https://storage.example.com/audio/cmd123.wav",
  "processing_time_ms": 567,
  "language_detected": "en-US",
  "intent": "navigate"
}
```

---

## Database Constraints

### Unique Constraints
- `users.email` - Prevents duplicate email addresses
- `refresh_tokens.token` - Ensures token uniqueness
- `scripts.script_id + breakpoints.line_number` - One breakpoint per line
- `scripts.script_id + variables.name` - Unique variable names per script

### Foreign Key Constraints (CASCADE DELETE)
All foreign keys use `ON DELETE CASCADE` to maintain referential integrity:
- Deleting a user cascades to all their projects, scripts, test runs, and NLP data
- Deleting a project cascades to all its scripts and NLP data
- Deleting a script cascades to all its test runs, variables, and breakpoints
- Deleting a test run cascades to all its test steps

### Check Constraints
- `nlp_gherkin_scenarios.confidence_score` BETWEEN 0 AND 100
- `nlp_voice_commands.confidence` BETWEEN 0 AND 100
- `test_runs.duration` >= 0
- `test_steps.duration` >= 0

---

## Performance Optimization

### Indexes
- All foreign keys are indexed for JOIN performance
- Email lookups are optimized with unique index
- Timestamp fields (created_at, started_at) are indexed for date range queries
- Status fields are indexed for filtering operations

### Partitioning Recommendations (for large datasets)
- Consider partitioning `test_runs` by `started_at` (monthly)
- Consider partitioning `test_steps` by `timestamp` (monthly)
- Consider partitioning `nlp_voice_commands` by `created_at` (quarterly)

### Query Optimization
- Use `EXPLAIN ANALYZE` for complex queries
- Regular `VACUUM ANALYZE` for statistics
- Monitor slow query log
- Use prepared statements for repeated queries

---

**Schema Version:** 2.0 (with NLP features)
**Last Updated:** 2024-01-15
**PostgreSQL Version:** 15+
**Prisma Version:** 6.18.0+
