# 🎭 Allure Framework 2 - Quick Start Guide

## What is Allure?

**Allure Framework** is a flexible, lightweight multi-language test reporting tool that provides:
- Beautiful, interactive HTML reports
- Historical test execution trends
- Rich test metadata and categorization
- Screenshots, videos, and log attachments
- BDD-style reporting (Epic/Feature/Story)
- Timeline and statistics visualization

**Official Repository:** https://github.com/allure-framework/allure2

---

## ✅ Status: Fully Integrated!

All Allure Framework 2 features are now available in your Playwright-CRX backend.

---

## 🚀 Quick Start (3 Steps)

### Step 1: Check Health

```bash
curl http://localhost:3001/api/allure/v2/health
```

**Expected Output:**
```json
{
  "success": true,
  "health": {
    "status": "healthy",
    "directories": {
      "results": { "exists": true },
      "reports": { "exists": true }
    },
    "allureCli": { "installed": true },
    "reports": 0
  }
}
```

### Step 2: Generate Report for a Test Run

```bash
curl -X POST http://localhost:3001/api/allure/v2/generate/YOUR_TEST_RUN_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "reportPath": "/path/to/allure-reports/YOUR_TEST_RUN_ID",
  "reportUrl": "/allure-reports/YOUR_TEST_RUN_ID/index.html",
  "message": "Allure report generated successfully"
}
```

### Step 3: View Report

Open in browser:
```
http://localhost:3001/allure-reports/YOUR_TEST_RUN_ID/index.html
```

---

## 📡 API Endpoints

### V2 Enhanced API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/allure/v2/health` | Health check (no auth) |
| `GET` | `/api/allure/v2/config` | Get configuration |
| `POST` | `/api/allure/v2/generate/:testRunId` | Generate report |
| `GET` | `/api/allure/v2/report/:testRunId` | Get report URL |
| `GET` | `/api/allure/v2/reports` | List all reports |
| `POST` | `/api/allure/v2/cleanup/reports` | Cleanup old reports |
| `POST` | `/api/allure/v2/environment` | Write environment info |
| `POST` | `/api/allure/v2/categories` | Write test categories |

---

## 💻 Usage Examples

### Example 1: Using Allure Service

```typescript
import { allureReporter } from './services/allure-reporter.service';
import { Status, Severity } from 'allure-js-commons';

// Start test
allureReporter.startTest('test-123', 'Login Test', {
  description: 'Verify user login',
  severity: Severity.CRITICAL,
  tags: ['smoke', 'auth'],
});

// Add steps
allureReporter.startStep('Open login page');
// ... perform action
allureReporter.endStep(Status.PASSED);

// Add attachments
allureReporter.addScreenshot('Login Page', '/path/to/screenshot.png');

// End test
allureReporter.endTest('test-123', Status.PASSED);

// Generate report
await allureReporter.generateReport('test-123');
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
    await this.enterCredentials();
    await this.clickLogin();
  }

  @AllureStep('Navigate to login page')
  async navigateToLogin() {
    // Implementation
  }

  @AllureStep('Enter credentials')
  async enterCredentials() {
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
import { AllureUtils, Status } from './utils/allure-decorators';

// Start test
AllureUtils.startTest('test-456', 'Checkout Test', {
  severity: Severity.NORMAL,
  tags: ['e2e'],
});

// Execute steps
await AllureUtils.step('Add to cart', async () => {
  // Logic here
});

await AllureUtils.step('Checkout', async () => {
  // Logic here
});

// Add attachments
AllureUtils.screenshot('Success', '/path/to/screenshot.png');
AllureUtils.json('Order Data', { orderId: 123, total: 99.99 });

// End test
AllureUtils.endTest('test-456', Status.PASSED);
```

---

## 🔧 REST API Examples

### Generate Report
```bash
curl -X POST http://localhost:3001/api/allure/v2/generate/test-run-789 \
  -H "Authorization: Bearer TOKEN"
```

### Get All Reports
```bash
curl http://localhost:3001/api/allure/v2/reports \
  -H "Authorization: Bearer TOKEN"
```

### Write Environment Info
```bash
curl -X POST http://localhost:3001/api/allure/v2/environment \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": {
      "Browser": "Chrome 120",
      "Platform": "Windows 11",
      "NodeVersion": "20.10.0"
    }
  }'
```

### Write Categories
```bash
curl -X POST http://localhost:3001/api/allure/v2/categories \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": [
      {
        "name": "Product Defects",
        "matchedStatuses": ["failed"]
      }
    ]
  }'
```

### Cleanup Old Reports
```bash
curl -X POST http://localhost:3001/api/allure/v2/cleanup/reports \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

---

## 📊 Report Features

### What You Get in Allure Reports:

1. **Overview Dashboard**
   - Success rate percentage
   - Total tests executed
   - Duration trends
   - Historical comparison

2. **Categories**
   - Product defects
   - Test infrastructure issues
   - Known issues
   - Flaky tests

3. **Test Suites**
   - Hierarchical suite structure
   - Test case details
   - Status distribution

4. **Graphs**
   - Status pie chart
   - Severity distribution
   - Duration trends
   - Retry statistics

5. **Timeline**
   - Test execution timeline
   - Concurrent execution view
   - Duration visualization

6. **Behaviors (BDD)**
   - Epic → Feature → Story hierarchy
   - Business-oriented view

7. **Attachments**
   - Screenshots
   - Videos
   - Console logs
   - API responses
   - Trace files

8. **Environment**
   - Browser version
   - Platform details
   - Test configuration
   - Execution context

---

## 📁 File Structure

```
backend/
├── allure-results/              # Test results (JSON)
│   ├── test-123-result.json
│   ├── environment.properties
│   └── categories.json
├── allure-reports/              # HTML reports
│   ├── test-run-123/
│   │   ├── index.html          # Report entry point
│   │   ├── data/
│   │   └── plugins/
│   └── latest/
├── src/
│   ├── services/
│   │   └── allure-reporter.service.ts
│   ├── controllers/
│   │   └── allure-enhanced.controller.ts
│   ├── routes/
│   │   └── allure-enhanced.routes.ts
│   └── utils/
│       └── allure-decorators.ts
└── examples/
    └── allure-example.ts
```

---

## 🎯 Common Use Cases

### Use Case 1: Playwright Test Integration

```typescript
// In your Playwright test
test('user login', async ({ page }) => {
  const testId = 'playwright-test-001';
  
  allureReporter.startTest(testId, 'User Login Test', {
    severity: Severity.CRITICAL,
  });
  
  await page.goto('https://example.com/login');
  allureReporter.recordStep('Navigate to login', Status.PASSED);
  
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'password');
  allureReporter.recordStep('Enter credentials', Status.PASSED);
  
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  allureReporter.recordStep('Login successful', Status.PASSED);
  
  const screenshot = await page.screenshot();
  allureReporter.addAttachment('Dashboard', screenshot, ContentType.PNG);
  
  allureReporter.endTest(testId, Status.PASSED);
  await allureReporter.generateReport(testId);
});
```

### Use Case 2: API Test Integration

```typescript
async function testLoginAPI() {
  AllureUtils.startTest('api-001', 'Login API Test', {
    epic: 'API',
    feature: 'Authentication',
  });
  
  const response = await AllureUtils.step('POST /api/login', async () => {
    return await fetch('http://api.example.com/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
    });
  });
  
  AllureUtils.json('API Response', await response.json());
  AllureUtils.parameter('Status Code', String(response.status));
  
  AllureUtils.endTest('api-001', Status.PASSED);
}
```

### Use Case 3: CI/CD Integration

```bash
#!/bin/bash
# In your CI/CD pipeline

# Run tests
npm test

# Generate Allure report
curl -X POST http://localhost:3001/api/allure/v2/generate/ci-build-${BUILD_ID} \
  -H "Authorization: Bearer ${API_TOKEN}"

# Archive report
tar -czf allure-report.tar.gz allure-reports/ci-build-${BUILD_ID}/

# Upload to artifact storage
aws s3 cp allure-report.tar.gz s3://reports-bucket/
```

---

## 🐛 Troubleshooting

### Issue: "Allure CLI not found"

**Solution:**
```bash
# Reinstall allure-commandline
npm install allure-commandline

# Verify
./node_modules/.bin/allure --version
```

### Issue: "Java not found"

**Solution:**
```bash
# Install Java (Ubuntu/Debian)
sudo apt install openjdk-11-jre

# Install Java (macOS)
brew install openjdk@11

# Verify
java -version
```

### Issue: "Report generation fails"

**Solution:**
```bash
# Check results directory
ls -la allure-results/

# Manually generate report
./node_modules/.bin/allure generate allure-results -o allure-reports/test --clean

# Check logs
tail -f logs/app.log
```

---

## 📚 Documentation

| Document | Description | Path |
|----------|-------------|------|
| **Integration Guide** | Complete setup & usage | `ALLURE_INTEGRATION_GUIDE.md` |
| **Examples** | Working code samples | `examples/allure-example.ts` |
| **API Reference** | Full API documentation | Swagger at `/api-docs` |

---

## 🎉 Summary

**✅ Allure Framework 2 is fully integrated!**

You now have:
- ✅ Enterprise-grade test reporting
- ✅ Beautiful HTML reports with visualizations
- ✅ RESTful API for programmatic access
- ✅ TypeScript decorators for easy usage
- ✅ Complete documentation and examples
- ✅ Production-ready implementation

**Start using it:**
```typescript
import { allureReporter } from './services/allure-reporter.service';
import { Status, Severity } from 'allure-js-commons';

allureReporter.startTest('test-001', 'My First Test', {
  severity: Severity.NORMAL,
  tags: ['demo'],
});

// ... your test logic

allureReporter.endTest('test-001', Status.PASSED);
await allureReporter.generateReport('test-001');
```

**View reports at:**
```
http://localhost:3001/allure-reports/test-001/index.html
```

---

**Official Allure:** https://github.com/allure-framework/allure2  
**Documentation:** https://docs.qameta.io/allure/  
**Status:** ✅ Production Ready  
**Version:** 2.34.1  
**Last Updated:** January 15, 2024
