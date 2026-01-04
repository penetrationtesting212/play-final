# Allure 2 Integration Guide

## Overview

Complete integration of **Allure Framework 2** for comprehensive test reporting in the Playwright-CRX backend. This integration provides enterprise-grade test reporting with rich visualizations, historical trends, and detailed test analytics.

**Official Allure Repository:** https://github.com/allure-framework/allure2

---

## 📋 Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [API Endpoints](#api-endpoints)
5. [Usage Examples](#usage-examples)
6. [Decorators](#decorators)
7. [Advanced Features](#advanced-features)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Core Features
- ✅ **Complete Allure 2 Integration** - Full support for allure-js-commons
- ✅ **Automatic Report Generation** - Generate HTML reports from test runs
- ✅ **Rich Test Metadata** - Severity, Epic, Feature, Story, Tags
- ✅ **Attachments** - Screenshots, Videos, Logs, JSON data
- ✅ **Step-by-Step Tracking** - Detailed test step execution
- ✅ **Historical Trends** - Track test execution over time
- ✅ **Categorization** - Custom test categories and classifications
- ✅ **Environment Info** - Capture execution environment details
- ✅ **Links Integration** - Issue tracker and test management links

### Advanced Features
- ✅ **Decorators** - Easy-to-use TypeScript decorators
- ✅ **Multi-Browser Support** - Chrome, Firefox, Safari, Edge
- ✅ **Parallel Execution** - Support for concurrent test runs
- ✅ **Retry Tracking** - Track flaky tests and retries
- ✅ **Timeline View** - Visual test execution timeline
- ✅ **Behavior View** - BDD-style reporting (Epic/Feature/Story)
- ✅ **Graphs & Statistics** - Success rate, duration, trends
- ✅ **RESTful API** - Complete API for programmatic access

---

## 📦 Installation

### Prerequisites
- Node.js 20+
- npm 10+
- Java 8+ (for Allure CLI)

### Install Dependencies

Already installed in `package.json`:
```json
{
  "dependencies": {
    "allure-commandline": "^2.34.1",
    "allure-js-commons": "^3.4.2"
  }
}
```

If needed:
```bash
npm install allure-commandline allure-js-commons
```

### Verify Installation

```bash
# Check Allure CLI
./node_modules/.bin/allure --version

# Check Java (required for Allure)
java -version
```

---

## 🚀 Quick Start

### 1. Health Check

```bash
curl http://localhost:3001/api/allure/v2/health
```

**Response:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "directories": {
      "results": { "exists": true, "path": "/path/to/allure-results" },
      "reports": { "exists": true, "path": "/path/to/allure-reports" }
    },
    "allureCli": { "installed": true },
    "reports": 5
  }
}
```

### 2. Generate Report for Test Run

```bash
curl -X POST http://localhost:3001/api/allure/v2/generate/test-run-123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "reportPath": "/path/to/allure-reports/test-run-123",
  "reportUrl": "/allure-reports/test-run-123/index.html",
  "message": "Allure report generated successfully"
}
```

### 3. View Report

Open in browser:
```
http://localhost:3001/allure-reports/test-run-123/index.html
```

---

## 🔌 API Endpoints

### V2 Enhanced API (Recommended)

Base URL: `/api/allure/v2`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/config` | Get Allure configuration |
| `POST` | `/generate/:testRunId` | Generate report for test run |
| `GET` | `/report/:testRunId` | Get report URL |
| `GET` | `/reports` | Get all reports |
| `POST` | `/cleanup/reports` | Clean up old reports |
| `POST` | `/cleanup/results` | Clean up old results |
| `POST` | `/clear` | Clear all results |
| `POST` | `/environment` | Write environment info |
| `POST` | `/categories` | Write test categories |

### Legacy API (Still supported)

Base URL: `/api/allure`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/generate/:testRunId` | Generate report |
| `GET` | `/report/:testRunId` | Get report URL |
| `GET` | `/reports` | Get all reports |
| `POST` | `/cleanup` | Clean up old reports |

---

## 💡 Usage Examples

### Example 1: Basic Test Reporting

```typescript
import { allureReporter } from './services/allure-reporter.service';
import { Status, Severity } from 'allure-js-commons';

// Start a test
allureReporter.startTest('test-123', 'Login Test', {
  description: 'Test user login functionality',
  severity: Severity.CRITICAL,
  epic: 'Authentication',
  feature: 'Login',
  story: 'User Login',
  tags: ['smoke', 'regression'],
});

// Add steps
allureReporter.startStep('Navigate to login page');
// ... perform action
allureReporter.endStep(Status.PASSED);

allureReporter.startStep('Enter credentials');
// ... perform action
allureReporter.endStep(Status.PASSED);

allureReporter.startStep('Click login button');
// ... perform action
allureReporter.endStep(Status.PASSED);

// Add screenshot
allureReporter.addScreenshot('Login Success', '/path/to/screenshot.png');

// End test
allureReporter.endTest('test-123', Status.PASSED);

// Generate report
const reportPath = await allureReporter.generateReport('test-123');
```

### Example 2: Using Decorators

```typescript
import { AllureTest, AllureStep, Severity } from './utils/allure-decorators';
import { Severity as AllureSeverity } from 'allure-js-commons';

class LoginTests {
  @AllureTest('Login Test', 'Test user login')
  @Severity(AllureSeverity.CRITICAL)
  async testLogin() {
    await this.navigateToLogin();
    await this.enterCredentials('user@example.com', 'password');
    await this.clickLogin();
  }

  @AllureStep('Navigate to login page')
  async navigateToLogin() {
    // Implementation
  }

  @AllureStep('Enter credentials')
  async enterCredentials(email: string, password: string) {
    // Implementation
  }

  @AllureStep('Click login button')
  async clickLogin() {
    // Implementation
  }
}
```

### Example 3: Using Utility Functions

```typescript
import { AllureUtils, Status, Severity } from './utils/allure-decorators';

// Start test
AllureUtils.startTest('test-456', 'Checkout Test', {
  description: 'Test checkout flow',
  severity: Severity.NORMAL,
  tags: ['e2e', 'checkout'],
});

// Execute steps with automatic error handling
await AllureUtils.step('Add item to cart', async () => {
  // ... add item logic
});

await AllureUtils.step('Proceed to checkout', async () => {
  // ... checkout logic
});

// Add attachments
AllureUtils.screenshot('Checkout Page', '/path/to/screenshot.png');
AllureUtils.json('Cart Data', { items: [...], total: 99.99 });
AllureUtils.log('Debug Log', 'Checkout process completed successfully');

// Add metadata
AllureUtils.parameter('Browser', 'Chrome 120');
AllureUtils.parameter('Environment', 'Staging');
AllureUtils.link('https://jira.example.com/ISSUE-123', 'Related Issue');

// End test
AllureUtils.endTest('test-456', Status.PASSED);
```

### Example 4: REST API Usage

#### Generate Report
```bash
curl -X POST http://localhost:3001/api/allure/v2/generate/test-run-789 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

#### Get All Reports
```bash
curl http://localhost:3001/api/allure/v2/reports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "reports": [
    {
      "id": "test-run-789",
      "path": "/path/to/allure-reports/test-run-789",
      "url": "/allure-reports/test-run-789/index.html",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "size": 2048576
    }
  ],
  "total": 1
}
```

#### Write Environment Info
```bash
curl -X POST http://localhost:3001/api/allure/v2/environment \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": {
      "Browser": "Chrome 120.0.6099.109",
      "Platform": "Windows 11",
      "NodeVersion": "20.10.0",
      "Environment": "Production"
    }
  }'
```

#### Write Categories
```bash
curl -X POST http://localhost:3001/api/allure/v2/categories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": [
      {
        "name": "Product Defects",
        "matchedStatuses": ["failed"],
        "messageRegex": ".*AssertionError.*"
      },
      {
        "name": "Test Defects",
        "matchedStatuses": ["broken"],
        "messageRegex": ".*Error.*"
      }
    ]
  }'
```

#### Cleanup Old Reports
```bash
curl -X POST http://localhost:3001/api/allure/v2/cleanup/reports \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

---

## 🎨 Decorators

### Available Decorators

#### @AllureTest
Mark a method as an Allure test:
```typescript
@AllureTest('Test Name', 'Test Description')
async testMethod() { ... }
```

#### @AllureStep
Mark a method as a test step:
```typescript
@AllureStep('Step Name')
async stepMethod() { ... }
```

#### @Severity
Add severity label:
```typescript
@Severity(Severity.CRITICAL)
async testMethod() { ... }
```

#### @Epic, @Feature, @Story
Add BDD labels:
```typescript
@Epic('User Management')
@Feature('Login')
@Story('User Login')
async testLogin() { ... }
```

#### @Tag
Add tags:
```typescript
@Tag('smoke', 'regression', 'critical')
async testMethod() { ... }
```

#### @Link, @Issue, @TmsLink
Add links:
```typescript
@Issue('https://jira.example.com/ISSUE-123', 'ISSUE-123')
@TmsLink('https://tms.example.com/TC-456', 'TC-456')
async testMethod() { ... }
```

---

## 🔧 Advanced Features

### 1. Environment Information

Capture test execution environment:

```typescript
allureReporter.writeEnvironmentInfo({
  'Browser': 'Chrome 120.0.6099.109',
  'Browser Version': '120.0.6099.109',
  'Platform': 'Windows 11',
  'OS Version': '10.0.22631',
  'Node Version': '20.10.0',
  'Playwright Version': '1.40.1',
  'Environment': 'Staging',
  'API URL': 'https://api-staging.example.com',
  'Test User': 'test@example.com',
  'Execution Date': new Date().toISOString(),
});
```

### 2. Test Categories

Define custom test categories:

```typescript
allureReporter.writeCategories([
  {
    name: 'Product Defects',
    matchedStatuses: [Status.FAILED],
    messageRegex: '.*AssertionError.*',
  },
  {
    name: 'Test Infrastructure Issues',
    matchedStatuses: [Status.BROKEN],
    messageRegex: '.*(ConnectionError|TimeoutError).*',
  },
  {
    name: 'Known Issues',
    matchedStatuses: [Status.FAILED, Status.BROKEN],
    messageRegex: '.*KNOWN-ISSUE.*',
  },
]);
```

### 3. Attachments

Add various types of attachments:

```typescript
import { ContentType } from 'allure-js-commons';

// Screenshot
allureReporter.addScreenshot('Login Page', '/path/to/screenshot.png');

// Video
allureReporter.addVideo('Test Execution', '/path/to/video.webm');

// Text log
allureReporter.addTextAttachment('Console Log', consoleOutput, ContentType.TEXT);

// JSON data
allureReporter.addJsonAttachment('API Response', responseData);

// HTML
allureReporter.addTextAttachment('Page Source', htmlSource, ContentType.HTML);
```

### 4. Parameters and Labels

Add test metadata:

```typescript
// Parameters
allureReporter.addParameter('Browser', 'Chrome');
allureReporter.addParameter('Viewport', '1920x1080');
allureReporter.addParameter('Test Data', 'user-123');

// Labels
allureReporter.addLabel('layer', 'api');
allureReporter.addLabel('owner', 'qa-team');
allureReporter.addLabel('priority', 'P1');

// Links
allureReporter.addLink('https://docs.example.com/test-plan', 'Test Plan', LinkType.LINK);
allureReporter.addLink('https://jira.example.com/ISSUE-123', 'ISSUE-123', LinkType.ISSUE);
allureReporter.addLink('https://tms.example.com/TC-456', 'TC-456', LinkType.TMS);
```

---

## ⚙️ Configuration

### Environment Variables

Add to `.env`:

```env
# Allure Configuration
ALLURE_RESULTS_DIR=allure-results
ALLURE_REPORTS_DIR=allure-reports

# Optional: Custom Allure CLI path
ALLURE_CLI_PATH=/custom/path/to/allure

# Optional: Java Home (if not in PATH)
JAVA_HOME=/path/to/java
```

### Directory Structure

```
backend/
├── allure-results/          # Test execution results (JSON)
│   ├── test-123-result.json
│   ├── test-456-result.json
│   └── environment.properties
├── allure-reports/          # Generated HTML reports
│   ├── test-run-123/
│   │   ├── index.html
│   │   ├── data/
│   │   └── plugins/
│   └── test-run-456/
└── src/
    ├── services/
    │   ├── allure-reporter.service.ts  # Enhanced service
    │   └── allure.service.ts            # Legacy service
    ├── controllers/
    │   ├── allure-enhanced.controller.ts
    │   └── allure.controller.ts
    ├── routes/
    │   ├── allure-enhanced.routes.ts
    │   └── allure.routes.ts
    └── utils/
        └── allure-decorators.ts
```

---

## 🐛 Troubleshooting

### Issue 1: Allure CLI Not Found

**Error:** `allure: command not found`

**Solution:**
```bash
# Check if allure-commandline is installed
npm list allure-commandline

# Reinstall if missing
npm install allure-commandline

# Verify
./node_modules/.bin/allure --version
```

### Issue 2: Java Not Found

**Error:** `Java not found` or `JAVA_HOME not set`

**Solution:**
```bash
# Check Java installation
java -version

# Install Java if missing (Ubuntu/Debian)
sudo apt install openjdk-11-jre

# Install Java (macOS)
brew install openjdk@11

# Set JAVA_HOME in .env
JAVA_HOME=/path/to/java
```

### Issue 3: Report Generation Fails

**Error:** `Failed to generate report`

**Solution:**
```bash
# Check if results directory exists
ls -la allure-results/

# Check if results files exist
ls -la allure-results/*.json

# Manually generate report
./node_modules/.bin/allure generate allure-results -o allure-reports/manual --clean

# Check logs
tail -f logs/app.log
```

### Issue 4: No Data in Report

**Problem:** Report generates but shows no tests

**Solution:**
1. Ensure `startTest()` is called before `endTest()`
2. Verify result JSON files are created in `allure-results/`
3. Check that steps are properly added
4. Ensure `writeResults()` is called

```bash
# Check result files
cat allure-results/test-123-result.json
```

### Issue 5: Attachments Not Showing

**Problem:** Screenshots/videos don't appear in report

**Solution:**
1. Verify file paths are correct and files exist
2. Check file permissions
3. Ensure `addAttachment()` is called before `endTest()`
4. Verify ContentType is correct

---

## 📊 Report Features

### Allure Report Sections

1. **Overview**
   - Success rate
   - Total tests
   - Duration
   - Trends

2. **Categories**
   - Product defects
   - Test defects
   - Known issues

3. **Suites**
   - Test suites hierarchy
   - Test cases
   - Status distribution

4. **Graphs**
   - Status pie chart
   - Severity distribution
   - Duration trends
   - Retry trends

5. **Timeline**
   - Test execution timeline
   - Concurrent execution
   - Duration visualization

6. **Behaviors**
   - Epic → Feature → Story hierarchy
   - BDD-style reporting

7. **Packages**
   - Test organization
   - Package structure

8. **Environment**
   - Execution environment details
   - Configuration parameters

---

## 🎯 Best Practices

### 1. Always Add Metadata
```typescript
allureReporter.startTest(testId, testName, {
  description: 'Clear test description',
  severity: Severity.CRITICAL,
  epic: 'Feature Area',
  feature: 'Specific Feature',
  story: 'User Story',
  tags: ['smoke', 'regression'],
});
```

### 2. Use Meaningful Step Names
```typescript
// ❌ Bad
allureReporter.startStep('Step 1');

// ✅ Good
allureReporter.startStep('Navigate to login page and wait for form to load');
```

### 3. Add Attachments for Failures
```typescript
try {
  // Test logic
} catch (error) {
  allureReporter.addScreenshot('Failure Screenshot', screenshotPath);
  allureReporter.addTextAttachment('Error Log', error.stack);
  throw error;
}
```

### 4. Use Categories for Classification
```typescript
allureReporter.writeCategories([
  { name: 'Product Bugs', matchedStatuses: [Status.FAILED] },
  { name: 'Infrastructure', matchedStatuses: [Status.BROKEN] },
]);
```

### 5. Regular Cleanup
```typescript
// Clean up reports older than 30 days
await allureReporter.cleanupOldReports(30);
await allureReporter.cleanupOldResults(30);
```

---

## 📚 Additional Resources

- **Allure Framework:** https://github.com/allure-framework/allure2
- **Allure Documentation:** https://docs.qameta.io/allure/
- **allure-js-commons:** https://www.npmjs.com/package/allure-js-commons
- **Playwright Integration:** https://playwright.dev/docs/test-reporters#allure-test-reporter

---

## 🎉 Summary

You now have a fully integrated Allure 2 reporting system with:

✅ **Complete API** - RESTful endpoints for all operations  
✅ **Decorators** - Easy-to-use TypeScript decorators  
✅ **Rich Reports** - Beautiful HTML reports with all Allure features  
✅ **Attachments** - Screenshots, videos, logs, JSON data  
✅ **Metadata** - Severity, Epic, Feature, Story, Tags  
✅ **History** - Track test execution trends  
✅ **Categories** - Custom test classifications  
✅ **Environment** - Capture execution context  

**Ready to use!** Start generating comprehensive test reports with Allure Framework 2.

---

**Version:** 2.0  
**Last Updated:** January 15, 2024  
**Status:** Production Ready
