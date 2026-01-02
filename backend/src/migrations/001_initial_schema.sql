-- Initial Database Schema for Playwright CRX
-- PostgreSQL Migration Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- Projects table
CREATE TABLE IF NOT EXISTS "Project" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_user ON "Project"("userId");
CREATE INDEX IF NOT EXISTS idx_project_created ON "Project"("createdAt");

-- Scripts table
CREATE TABLE IF NOT EXISTS "Script" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language VARCHAR(50) DEFAULT 'playwright-test',
    "browserType" VARCHAR(50) DEFAULT 'chromium',
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "projectId" UUID REFERENCES "Project"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_script_user ON "Script"("userId");
CREATE INDEX IF NOT EXISTS idx_script_project ON "Script"("projectId");
CREATE INDEX IF NOT EXISTS idx_script_created ON "Script"("createdAt");
CREATE INDEX IF NOT EXISTS idx_script_language ON "Script"(language);

-- Test Runs table
CREATE TABLE IF NOT EXISTS "TestRun" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "scriptId" UUID NOT NULL REFERENCES "Script"(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    "startTime" TIMESTAMP WITH TIME ZONE,
    "endTime" TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in milliseconds
    result JSONB,
    logs TEXT,
    "errorMessage" TEXT,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_testrun_script ON "TestRun"("scriptId");
CREATE INDEX IF NOT EXISTS idx_testrun_user ON "TestRun"("userId");
CREATE INDEX IF NOT EXISTS idx_testrun_status ON "TestRun"(status);
CREATE INDEX IF NOT EXISTS idx_testrun_created ON "TestRun"("createdAt");

-- Database Snapshots table (for testing features)
CREATE TABLE IF NOT EXISTS "DatabaseSnapshot" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "databaseType" VARCHAR(50) NOT NULL,
    "connectionId" VARCHAR(255) NOT NULL,
    metadata JSONB,
    data JSONB NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_snapshot_user ON "DatabaseSnapshot"("userId");
CREATE INDEX IF NOT EXISTS idx_snapshot_name ON "DatabaseSnapshot"(name);
CREATE INDEX IF NOT EXISTS idx_snapshot_connection ON "DatabaseSnapshot"("connectionId");

-- Seed Data table (for testing)
CREATE TABLE IF NOT EXISTS "SeedData" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "tableName" VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_seeddata_user ON "SeedData"("userId");
CREATE INDEX IF NOT EXISTS idx_seeddata_table ON "SeedData"("tableName");

-- API Test Requests table
CREATE TABLE IF NOT EXISTS "ApiRequest" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    url TEXT NOT NULL,
    headers JSONB,
    body JSONB,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "projectId" UUID REFERENCES "Project"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_apirequest_user ON "ApiRequest"("userId");
CREATE INDEX IF NOT EXISTS idx_apirequest_project ON "ApiRequest"("projectId");

-- Test Data Management table
CREATE TABLE IF NOT EXISTS "TestData" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'json', 'csv', 'sql', etc.
    data JSONB NOT NULL,
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "projectId" UUID REFERENCES "Project"(id) ON DELETE SET NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_testdata_user ON "TestData"("userId");
CREATE INDEX IF NOT EXISTS idx_testdata_project ON "TestData"("projectId");
CREATE INDEX IF NOT EXISTS idx_testdata_type ON "TestData"(type);

-- Sessions table (for auth)
CREATE TABLE IF NOT EXISTS "Session" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_user ON "Session"("userId");
CREATE INDEX IF NOT EXISTS idx_session_token ON "Session"(token);
CREATE INDEX IF NOT EXISTS idx_session_expires ON "Session"("expiresAt");

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_updated_at BEFORE UPDATE ON "Project"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_script_updated_at BEFORE UPDATE ON "Script"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testrun_updated_at BEFORE UPDATE ON "TestRun"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seeddata_updated_at BEFORE UPDATE ON "SeedData"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apirequest_updated_at BEFORE UPDATE ON "ApiRequest"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_testdata_updated_at BEFORE UPDATE ON "TestData"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo user (password: demo123)
INSERT INTO "User" (email, password, name)
VALUES ('demo@example.com', '$2a$10$YourHashedPasswordHere', 'Demo User')
ON CONFLICT (email) DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '📝 Demo user: demo@example.com / demo123';
END $$;
