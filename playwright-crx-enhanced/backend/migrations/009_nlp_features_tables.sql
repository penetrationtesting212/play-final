-- =====================================================
-- NLP Features Database Schema Migration
-- Description: Tables for storing NLP-generated content
-- Date: 2024-01-15
-- Features: Gherkin scenarios, Requirements, Test Cases, Documentation
-- =====================================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TABLE: GherkinScenario
-- Description: Store saved Gherkin/BDD scenarios
-- =====================================================
CREATE TABLE IF NOT EXISTS "GherkinScenario" (
    id VARCHAR(200) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" VARCHAR(200) NOT NULL,
    name VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'typescript',
    framework VARCHAR(50) NOT NULL DEFAULT 'playwright',
    tags TEXT[], -- Array of tags for categorization
    "generatedCode" TEXT, -- Last generated Playwright code
    confidence DECIMAL(3,2), -- AI confidence score (0.00-1.00)
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_gherkin_user FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE
);

-- Indexes for GherkinScenario
CREATE INDEX IF NOT EXISTS idx_gherkin_user_id ON "GherkinScenario"("userId");
CREATE INDEX IF NOT EXISTS idx_gherkin_created_at ON "GherkinScenario"("createdAt");
CREATE INDEX IF NOT EXISTS idx_gherkin_language ON "GherkinScenario"(language);
CREATE INDEX IF NOT EXISTS idx_gherkin_framework ON "GherkinScenario"(framework);

-- Trigger for updatedAt
CREATE OR REPLACE FUNCTION update_gherkin_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_gherkin_updated_at
    BEFORE UPDATE ON "GherkinScenario"
    FOR EACH ROW
    EXECUTE FUNCTION update_gherkin_updated_at();

-- =====================================================
-- TABLE: RequirementDocument
-- Description: Store requirements documents
-- =====================================================
CREATE TABLE IF NOT EXISTS "RequirementDocument" (
    id VARCHAR(200) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" VARCHAR(200) NOT NULL,
    "projectName" VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    format VARCHAR(50) DEFAULT 'markdown', -- markdown, plain, structured
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_requirement_user FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE
);

-- Indexes for RequirementDocument
CREATE INDEX IF NOT EXISTS idx_requirement_user_id ON "RequirementDocument"("userId");
CREATE INDEX IF NOT EXISTS idx_requirement_created_at ON "RequirementDocument"("createdAt");
CREATE INDEX IF NOT EXISTS idx_requirement_project ON "RequirementDocument"("projectName");

-- Trigger for updatedAt
CREATE OR REPLACE FUNCTION update_requirement_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_requirement_updated_at
    BEFORE UPDATE ON "RequirementDocument"
    FOR EACH ROW
    EXECUTE FUNCTION update_requirement_updated_at();

-- =====================================================
-- TABLE: GeneratedTestCase
-- Description: Store AI-generated test cases
-- =====================================================
CREATE TABLE IF NOT EXISTS "GeneratedTestCase" (
    id VARCHAR(200) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" VARCHAR(200) NOT NULL,
    "requirementId" VARCHAR(200), -- Link to requirement document
    title VARCHAR(1000) NOT NULL,
    description TEXT,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium', -- high, medium, low
    type VARCHAR(50) NOT NULL DEFAULT 'functional', -- functional, ui, integration, e2e, regression
    steps JSONB NOT NULL, -- Array of test steps
    "expectedResult" TEXT NOT NULL,
    "playwrightCode" TEXT, -- Generated Playwright code
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, generated, approved, archived
    confidence DECIMAL(3,2), -- AI confidence score
    tags TEXT[], -- Array of tags
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_testcase_user FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT fk_testcase_requirement FOREIGN KEY ("requirementId") 
        REFERENCES "RequirementDocument"(id) ON DELETE SET NULL
);

-- Indexes for GeneratedTestCase
CREATE INDEX IF NOT EXISTS idx_testcase_user_id ON "GeneratedTestCase"("userId");
CREATE INDEX IF NOT EXISTS idx_testcase_requirement_id ON "GeneratedTestCase"("requirementId");
CREATE INDEX IF NOT EXISTS idx_testcase_priority ON "GeneratedTestCase"(priority);
CREATE INDEX IF NOT EXISTS idx_testcase_type ON "GeneratedTestCase"(type);
CREATE INDEX IF NOT EXISTS idx_testcase_status ON "GeneratedTestCase"(status);
CREATE INDEX IF NOT EXISTS idx_testcase_created_at ON "GeneratedTestCase"("createdAt");

-- Trigger for updatedAt
CREATE OR REPLACE FUNCTION update_testcase_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_testcase_updated_at
    BEFORE UPDATE ON "GeneratedTestCase"
    FOR EACH ROW
    EXECUTE FUNCTION update_testcase_updated_at();

-- =====================================================
-- TABLE: TestCoverage
-- Description: Store test coverage analysis
-- =====================================================
CREATE TABLE IF NOT EXISTS "TestCoverage" (
    id VARCHAR(200) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" VARCHAR(200) NOT NULL,
    "requirementId" VARCHAR(200), -- Link to requirement document
    functional DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- Percentage (0-100)
    ui DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    integration DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    e2e DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    regression DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "totalTestCases" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_coverage_user FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE,
    CONSTRAINT fk_coverage_requirement FOREIGN KEY ("requirementId") 
        REFERENCES "RequirementDocument"(id) ON DELETE CASCADE
);

-- Indexes for TestCoverage
CREATE INDEX IF NOT EXISTS idx_coverage_user_id ON "TestCoverage"("userId");
CREATE INDEX IF NOT EXISTS idx_coverage_requirement_id ON "TestCoverage"("requirementId");
CREATE INDEX IF NOT EXISTS idx_coverage_created_at ON "TestCoverage"("createdAt");

-- Trigger for updatedAt
CREATE OR REPLACE FUNCTION update_coverage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_coverage_updated_at
    BEFORE UPDATE ON "TestCoverage"
    FOR EACH ROW
    EXECUTE FUNCTION update_coverage_updated_at();

-- =====================================================
-- TABLE: DocumentationHistory
-- Description: Store generated documentation versions
-- =====================================================
CREATE TABLE IF NOT EXISTS "DocumentationHistory" (
    id VARCHAR(200) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" VARCHAR(200) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    version VARCHAR(50) NOT NULL,
    author VARCHAR(200),
    format VARCHAR(50) NOT NULL DEFAULT 'markdown', -- markdown, html, pdf, confluence
    template VARCHAR(50) NOT NULL DEFAULT 'standard', -- standard, detailed, minimal
    content TEXT NOT NULL, -- Full documentation content
    sections JSONB, -- Array of documentation sections
    "scriptIds" TEXT[], -- Array of script IDs included
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_documentation_user FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE
);

-- Indexes for DocumentationHistory
CREATE INDEX IF NOT EXISTS idx_documentation_user_id ON "DocumentationHistory"("userId");
CREATE INDEX IF NOT EXISTS idx_documentation_created_at ON "DocumentationHistory"("createdAt");
CREATE INDEX IF NOT EXISTS idx_documentation_format ON "DocumentationHistory"(format);
CREATE INDEX IF NOT EXISTS idx_documentation_version ON "DocumentationHistory"(version);

-- Trigger for updatedAt
CREATE OR REPLACE FUNCTION update_documentation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documentation_updated_at
    BEFORE UPDATE ON "DocumentationHistory"
    FOR EACH ROW
    EXECUTE FUNCTION update_documentation_updated_at();

-- =====================================================
-- TABLE: VoiceCommandHistory
-- Description: Store voice command sessions and generated code
-- =====================================================
CREATE TABLE IF NOT EXISTS "VoiceCommandHistory" (
    id VARCHAR(200) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" VARCHAR(200) NOT NULL,
    transcript TEXT NOT NULL,
    action VARCHAR(500) NOT NULL,
    "playwrightCode" TEXT NOT NULL,
    language VARCHAR(50) NOT NULL DEFAULT 'en-US', -- Voice recognition language
    confidence DECIMAL(3,2), -- Voice recognition confidence
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, processed, error
    "executedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_voice_user FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE
);

-- Indexes for VoiceCommandHistory
CREATE INDEX IF NOT EXISTS idx_voice_user_id ON "VoiceCommandHistory"("userId");
CREATE INDEX IF NOT EXISTS idx_voice_created_at ON "VoiceCommandHistory"("createdAt");
CREATE INDEX IF NOT EXISTS idx_voice_status ON "VoiceCommandHistory"(status);
CREATE INDEX IF NOT EXISTS idx_voice_language ON "VoiceCommandHistory"(language);

-- =====================================================
-- TABLE: NLPUsageStats
-- Description: Track NLP feature usage for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS "NLPUsageStats" (
    id VARCHAR(200) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" VARCHAR(200) NOT NULL,
    feature VARCHAR(100) NOT NULL, -- gherkin, requirements, documentation, voice
    action VARCHAR(100) NOT NULL, -- convert, parse, generate, etc.
    "inputSize" INTEGER, -- Size of input in characters
    "outputSize" INTEGER, -- Size of output in characters
    "processingTime" INTEGER, -- Time in milliseconds
    success BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    metadata JSONB, -- Additional metadata
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    
    CONSTRAINT fk_stats_user FOREIGN KEY ("userId") 
        REFERENCES "User"(id) ON DELETE CASCADE
);

-- Indexes for NLPUsageStats
CREATE INDEX IF NOT EXISTS idx_stats_user_id ON "NLPUsageStats"("userId");
CREATE INDEX IF NOT EXISTS idx_stats_feature ON "NLPUsageStats"(feature);
CREATE INDEX IF NOT EXISTS idx_stats_created_at ON "NLPUsageStats"("createdAt");
CREATE INDEX IF NOT EXISTS idx_stats_success ON "NLPUsageStats"(success);

-- =====================================================
-- VIEWS FOR ANALYTICS
-- =====================================================

-- View: User NLP Activity Summary
CREATE OR REPLACE VIEW "UserNLPActivitySummary" AS
SELECT 
    u.id AS "userId",
    u.name AS "userName",
    u.email,
    COUNT(DISTINCT g.id) AS "totalGherkinScenarios",
    COUNT(DISTINCT r.id) AS "totalRequirements",
    COUNT(DISTINCT t.id) AS "totalTestCases",
    COUNT(DISTINCT d.id) AS "totalDocumentation",
    COUNT(DISTINCT v.id) AS "totalVoiceCommands",
    COUNT(DISTINCT s.id) AS "totalUsageRecords",
    MAX(s."createdAt") AS "lastActivityAt"
FROM "User" u
LEFT JOIN "GherkinScenario" g ON u.id = g."userId"
LEFT JOIN "RequirementDocument" r ON u.id = r."userId"
LEFT JOIN "GeneratedTestCase" t ON u.id = t."userId"
LEFT JOIN "DocumentationHistory" d ON u.id = d."userId"
LEFT JOIN "VoiceCommandHistory" v ON u.id = v."userId"
LEFT JOIN "NLPUsageStats" s ON u.id = s."userId"
GROUP BY u.id, u.name, u.email;

-- View: Test Case Coverage by User
CREATE OR REPLACE VIEW "TestCaseCoverageByUser" AS
SELECT 
    u.id AS "userId",
    u.name AS "userName",
    COUNT(DISTINCT tc.id) AS "totalTestCases",
    SUM(CASE WHEN tc.priority = 'high' THEN 1 ELSE 0 END) AS "highPriority",
    SUM(CASE WHEN tc.priority = 'medium' THEN 1 ELSE 0 END) AS "mediumPriority",
    SUM(CASE WHEN tc.priority = 'low' THEN 1 ELSE 0 END) AS "lowPriority",
    SUM(CASE WHEN tc.type = 'functional' THEN 1 ELSE 0 END) AS "functionalTests",
    SUM(CASE WHEN tc.type = 'ui' THEN 1 ELSE 0 END) AS "uiTests",
    SUM(CASE WHEN tc.type = 'integration' THEN 1 ELSE 0 END) AS "integrationTests",
    SUM(CASE WHEN tc.type = 'e2e' THEN 1 ELSE 0 END) AS "e2eTests",
    SUM(CASE WHEN tc.type = 'regression' THEN 1 ELSE 0 END) AS "regressionTests"
FROM "User" u
LEFT JOIN "GeneratedTestCase" tc ON u.id = tc."userId"
GROUP BY u.id, u.name;

-- View: NLP Feature Usage Statistics
CREATE OR REPLACE VIEW "NLPFeatureUsageStats" AS
SELECT 
    feature,
    action,
    COUNT(*) AS "totalUsage",
    SUM(CASE WHEN success = true THEN 1 ELSE 0 END) AS "successfulUsage",
    SUM(CASE WHEN success = false THEN 1 ELSE 0 END) AS "failedUsage",
    ROUND(AVG("processingTime"), 2) AS "avgProcessingTimeMs",
    ROUND(AVG("inputSize"), 2) AS "avgInputSize",
    ROUND(AVG("outputSize"), 2) AS "avgOutputSize",
    DATE_TRUNC('day', "createdAt") AS "usageDate"
FROM "NLPUsageStats"
GROUP BY feature, action, DATE_TRUNC('day', "createdAt")
ORDER BY "usageDate" DESC, feature, action;

-- =====================================================
-- GRANT PERMISSIONS (Adjust as needed)
-- =====================================================
-- Note: Adjust permissions based on your database user setup
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;

-- =====================================================
-- MIGRATION VERIFICATION QUERY
-- =====================================================
-- Run this to verify all tables were created successfully:
/*
SELECT 
    tablename,
    schemaname
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%herkin%' 
   OR tablename LIKE '%equirement%'
   OR tablename LIKE '%estCase%'
   OR tablename LIKE '%ocumentation%'
   OR tablename LIKE '%oice%'
   OR tablename LIKE '%NLP%'
ORDER BY tablename;
*/

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment to insert sample data for testing

/*
-- Insert sample Gherkin scenario
INSERT INTO "GherkinScenario" ("userId", name, content, language, framework)
SELECT 
    id,
    'Sample Login Scenario',
    'Feature: Login
Scenario: Successful login
  Given I am on the login page
  When I enter valid credentials
  Then I should see the dashboard',
    'typescript',
    'playwright'
FROM "User"
LIMIT 1;
*/

-- =====================================================
-- END OF NLP FEATURES MIGRATION
-- =====================================================

-- Migration completed successfully
DO $$
BEGIN
    RAISE NOTICE 'NLP Features tables created successfully!';
    RAISE NOTICE 'Tables created: GherkinScenario, RequirementDocument, GeneratedTestCase, TestCoverage, DocumentationHistory, VoiceCommandHistory, NLPUsageStats';
    RAISE NOTICE 'Views created: UserNLPActivitySummary, TestCaseCoverageByUser, NLPFeatureUsageStats';
END $$;
