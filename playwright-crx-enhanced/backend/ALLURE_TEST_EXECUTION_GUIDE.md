# Allure Reports During Test Execution

## ✅ YES - Real Allure Reports Are Generated Automatically!

When you run a test through the Playwright-CRX backend, a **complete Allure Framework 2 report** is automatically generated during and after test execution.

---

## 📋 What Happens During Test Execution

### Automatic Process Flow

```
1. Test Run Started
   ↓
2. Allure Test Tracking Initialized
   ├─ Test metadata captured (name, description, severity)
   ├─ Environment info recorded (browser, platform, versions)
   ├─ Categories configured (defects, broken tests, timeouts)
   └─ Console log capture enabled
   ↓
3. For Each Test Step:
   ├─ Step recorded in Allure with status
   ├─ Screenshots captured (for navigation, clicks, assertions)
   ├─ Parameters logged (selectors, values)
   └─ Errors captured with stack traces
   ↓
4. Test Completed
   ├─ Final status determined (passed/failed/broken)
   ├─ Console logs attached
   ├─ Browser info captured
   ├─ Error details attached (if failed)
   ├─ Failure screenshot captured (if failed)
   └─ Page HTML captured (if failed)
   ↓
5. Allure Report Generated
   ├─ HTML report created with all data
   ├─ Report saved to allure-reports/{testRunId}/
   ├─ Report URL saved to database
   └─ Report URL: /allure-reports/{testRunId}/index.html
```

---

## 🎯 What's Captured Automatically

### During Test Execution

#### 1. Test Metadata
- ✅ Test name (from script name)
- ✅ Description (from script description)
- ✅ Severity level (NORMAL by default)
- ✅ Epic: "Test Automation"
- ✅ Feature: "Playwright Test Execution"
- ✅ Story: Script name
- ✅ Tags: ['automated', 'playwright', browser, environment]

#### 2. Test Parameters
- ✅ Test Run ID
- ✅ Script ID
- ✅ Browser (firefox, chrome, etc.)
- ✅ Environment (development, staging, production)
- ✅ Programming language (TypeScript, JavaScript, etc.)

#### 3. Environment Information
- ✅ Test Run ID
- ✅ Script ID
- ✅ Browser name and version
- ✅ Platform (OS)
- ✅ Node.js version
- ✅ Playwright version
- ✅ Execution timestamp

#### 4. Test Steps (Automatically Recorded)
- ✅ Step number
- ✅ Action type (navigate, click, fill, assert, etc.)
- ✅ Element selector
- ✅ Input value
- ✅ Step status (passed/failed)
- ✅ Step duration
- ✅ Error message (if failed)

#### 5. Attachments (Automatically Captured)

**Screenshots:**
- ✅ After navigation steps
- ✅ After click actions
- ✅ After assertions
- ✅ On test failure (failure screenshot)

**Console Logs:**
- ✅ All console.log() messages
- ✅ Console errors
- ✅ Page errors
- ✅ Network errors

**Error Details (on failure):**
- ✅ Error name
- ✅ Error message
- ✅ Full stack trace
- ✅ Timestamp

**Page State (on failure):**
- ✅ Page HTML source
- ✅ Page URL
- ✅ Failure screenshot

**Browser Information:**
- ✅ Browser version
- ✅ Browser type
- ✅ Connection status

#### 6. Test Categories (Pre-configured)
- ✅ Product Defects (assertion failures)
- ✅ Broken Tests (connection/timeout errors)
- ✅ Locator Issues (element not found)
- ✅ Timeout Issues (operation timeouts)

---

## 🚀 How to View Reports

### Method 1: After Test Execution

The report URL is automatically saved in the database:

```sql
SELECT execution_report_url FROM test_runs WHERE id = 'your-test-run-id';
```

### Method 2: Via API

```bash
# Get report URL for specific test run
curl http://localhost:3001/api/allure/v2/report/YOUR_TEST_RUN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get all reports
curl http://localhost:3001/api/allure/v2/reports \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Method 3: Direct Browser Access

```
http://localhost:3001/allure-reports/YOUR_TEST_RUN_ID/index.html
```

### Method 4: From Frontend

The frontend can display the report URL:
```typescript
const testRun = await fetchTestRun(testRunId);
const reportUrl = testRun.execution_report_url;

// Show link to user
<a href={reportUrl} target="_blank">View Allure Report</a>
```

---

## 📊 Report Contents

### Overview Tab
- Success rate percentage
- Total tests executed
- Test duration
- Execution timeline

### Suites Tab
- Test hierarchy
- Individual test details
- Step-by-step execution
- Status distribution

### Graphs Tab
- Status pie chart (passed/failed/broken)
- Severity distribution
- Duration trends
- Retry history

### Timeline Tab
- Visual execution timeline
- Step durations
- Concurrent execution view

### Behaviors Tab
- Epic → Feature → Story hierarchy
- BDD-style organization

### Packages Tab
- Test organization
- Package structure

### Categories Tab
- Product Defects
- Broken Tests
- Locator Issues
- Timeout Issues

---

## 💡 Example: Complete Test Execution

### Test Script
```typescript
// Script in database
page.goto('https://example.com')
page.click('#login-button')
page.fill('#email', 'user@example.com')
page.fill('#password', 'password123')
page.click('button[type="submit"]')
expect(page.locator('.dashboard')).toBeVisible()
```

### What Gets Captured

**Allure Report Will Show:**

1. **Test Overview**
   - Name: "Login Test" (from script name)
   - Status: Passed ✅
   - Duration: 3.2s
   - Browser: Firefox
   - Environment: Development

2. **Test Steps** (6 steps)
   - Step 1: Navigate "https://example.com" ✅
     - Screenshot: navigation-step-1.png
   - Step 2: Click "#login-button" ✅
     - Screenshot: click-step-2.png
     - Parameter: selector = "#login-button"
   - Step 3: Fill "#email" with "user@example.com" ✅
     - Parameter: selector = "#email"
     - Parameter: value = "user@example.com"
   - Step 4: Fill "#password" with "password123" ✅
     - Parameter: selector = "#password"
     - Parameter: value = "password123"
   - Step 5: Click "button[type="submit"]" ✅
     - Screenshot: click-step-5.png
   - Step 6: Assert visible ".dashboard" ✅
     - Screenshot: assert_visible-step-6.png

3. **Attachments**
   - 4 Screenshots (navigation, clicks, assertion)
   - Console Logs (if any)
   - Browser Info (Firefox version, etc.)

4. **Environment**
   - Test Run ID: test-123
   - Script ID: script-456
   - Browser: Firefox 121.0
   - Platform: linux
   - Node Version: v20.10.0
   - Playwright Version: 1.40.1
   - Execution Time: 2024-01-15T10:30:00.000Z

---

## 🔧 Configuration

### Automatic (No Configuration Needed)

Everything is configured automatically when you start a test run:

```typescript
// In testRunner.service.ts - happens automatically
await allureIntegration.startTest({
  testRunId: 'test-123',
  scriptId: 'script-456',
  scriptName: 'Login Test',
  userId: 'user-789',
  browser: 'firefox',
  environment: 'development',
});
```

### Custom Configuration (Optional)

You can customize report generation programmatically:

```typescript
import { allureIntegration } from './services/testRuns/allure-integration.service';

// Custom metadata
await allureIntegration.startTest({
  testRunId: 'custom-001',
  scriptName: 'My Custom Test',
  // ... other fields
});

// Custom screenshots
await allureIntegration.captureScreenshot(
  testRunId,
  page,
  'Custom Screenshot Name'
);

// Custom test data
allureIntegration.attachTestData(testRunId, {
  userId: 123,
  testData: 'important data',
}, 'Custom Test Data');

// Custom error details
allureIntegration.attachErrorDetails(testRunId, error);
```

---

## 📁 File Structure

After test execution, files are organized as follows:

```
backend/
├── allure-results/              # Test execution results
│   ├── test-123-result.json    # Test run data
│   ├── environment.properties   # Environment info
│   └── categories.json          # Test categories
│
├── allure-reports/              # Generated HTML reports
│   ├── test-123/                # Report for test-123
│   │   ├── index.html          # Main report page
│   │   ├── data/               # Report data
│   │   └── plugins/            # Report plugins
│   └── test-456/                # Report for test-456
│       └── ...
│
└── test-screenshots/            # Screenshots captured during tests
    ├── test-123-1234567890-navigation-step-1.png
    ├── test-123-1234567891-click-step-2.png
    └── test-123-1234567892-Test-Failure.png
```

---

## 🎯 Best Practices

### 1. Always Check Report URL

After test execution, always retrieve the report URL:

```typescript
const testRun = await getTestRun(testRunId);
console.log('Allure Report:', testRun.execution_report_url);
```

### 2. View Reports Immediately

Open reports right after test completion to review:
- Test steps execution
- Screenshots at each step
- Console logs for debugging
- Error details for failures

### 3. Archive Important Reports

For important test runs, archive the reports:

```bash
# Archive report directory
tar -czf test-123-report.tar.gz allure-reports/test-123/

# Store in backup location
mv test-123-report.tar.gz /backups/
```

### 4. Monitor Report Generation

Check logs to ensure reports are generated:

```bash
tail -f logs/app.log | grep "Allure"
```

Expected log messages:
```
🎭 Starting Allure test: test-123
✅ Allure test started: test-123
📝 Allure step recorded: Step 1: navigate - passed
🎭 Allure report generated: /allure-reports/test-123/index.html
```

### 5. Cleanup Old Reports

Regularly clean up old reports to save disk space:

```bash
# Via API
curl -X POST http://localhost:3001/api/allure/v2/cleanup/reports \
  -H "Authorization: Bearer TOKEN" \
  -d '{"days": 30}'
```

---

## 🐛 Troubleshooting

### Issue 1: No Report Generated

**Check:**
1. Test execution completed successfully?
2. Check logs for Allure errors
3. Verify allure-commandline is installed
4. Check Java is installed (required for Allure CLI)

```bash
# Check Allure CLI
./node_modules/.bin/allure --version

# Check Java
java -version

# Check logs
tail -f logs/app.log | grep "Allure"
```

### Issue 2: Report URL is Null

**Cause:** Report generation failed

**Solution:**
```bash
# Manually generate report
curl -X POST http://localhost:3001/api/allure/v2/generate/TEST_RUN_ID \
  -H "Authorization: Bearer TOKEN"
```

### Issue 3: Screenshots Not Showing

**Check:**
1. Screenshot directory exists: `test-screenshots/`
2. Screenshots were captured (check logs)
3. File permissions are correct

```bash
ls -la test-screenshots/
```

### Issue 4: Console Logs Missing

**Cause:** Console capture not enabled

**Solution:** Console capture is automatic. If missing, check:
```typescript
// Should be called automatically in testRunner.service.ts
context.consoleLogs = allureIntegration.setupConsoleCapture(page, testRunId);
```

---

## 📊 Report Features Checklist

After test execution, your Allure report will have:

- ✅ Test overview with success/failure status
- ✅ Complete step-by-step execution log
- ✅ Screenshots at key steps (navigation, clicks, assertions)
- ✅ Console logs (all console output)
- ✅ Error details (for failed tests)
- ✅ Browser information
- ✅ Environment details
- ✅ Test parameters
- ✅ Execution timeline
- ✅ Test categories
- ✅ Historical trends (when multiple runs exist)

---

## 🎉 Summary

### What You Get Automatically:

1. **During Test Run:**
   - Real-time step tracking
   - Automatic screenshot capture
   - Console log recording
   - Error capture with stack traces

2. **After Test Run:**
   - Complete HTML report generated
   - Report saved to database
   - Report accessible via URL
   - All attachments included

3. **In the Report:**
   - Beautiful visualizations
   - Step-by-step execution details
   - Screenshots at each step
   - Console logs
   - Error details
   - Browser and environment info
   - Timeline and graphs

### To View Your Report:

```bash
# 1. Run a test
POST /api/test-runs

# 2. Test executes automatically with Allure tracking

# 3. Report is generated automatically

# 4. Get report URL
GET /api/allure/v2/report/{testRunId}

# 5. Open in browser
http://localhost:3001/allure-reports/{testRunId}/index.html
```

**Result:** Full Allure Framework 2 report with all features! 🎭

---

**Status:** ✅ Fully Automated  
**Allure Version:** 2.34.1  
**Integration:** Complete  
**Documentation:** This guide

For more details, see:
- [ALLURE_INTEGRATION_GUIDE.md](ALLURE_INTEGRATION_GUIDE.md) - Complete integration guide
- [ALLURE_QUICK_START.md](../ALLURE_QUICK_START.md) - Quick start guide
- [examples/allure-example.ts](examples/allure-example.ts) - Code examples
