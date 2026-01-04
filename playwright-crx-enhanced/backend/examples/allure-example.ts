/**
 * Allure Integration Examples
 * Demonstrates various ways to use Allure reporting
 */

import { allureReporter } from '../src/services/allure-reporter.service';
import {
  AllureUtils,
  AllureTest,
  AllureStep,
  Severity,
  Epic,
  Feature,
  Story,
  Tag,
  Issue,
  Status,
  Severity as AllureSeverity,
  LinkType
} from '../src/utils/allure-decorators';

// ============================================
// Example 1: Basic Test with Service
// ============================================

async function exampleBasicTest() {
  const testId = 'test-basic-001';
  
  // Start test
  allureReporter.startTest(testId, 'Login Test', {
    description: 'Verify user can login with valid credentials',
    severity: AllureSeverity.CRITICAL,
    epic: 'Authentication',
    feature: 'Login',
    story: 'User Login',
    tags: ['smoke', 'regression', 'auth'],
    parameters: {
      environment: 'staging',
      browser: 'chrome',
    },
  });

  try {
    // Step 1
    allureReporter.startStep('Navigate to login page');
    // ... navigation logic
    allureReporter.endStep(Status.PASSED);

    // Step 2
    allureReporter.startStep('Enter credentials');
    allureReporter.addParameter('username', 'test@example.com');
    // ... enter credentials
    allureReporter.endStep(Status.PASSED);

    // Step 3
    allureReporter.startStep('Click login button');
    // ... click login
    allureReporter.addScreenshot('Login Success', '/path/to/screenshot.png');
    allureReporter.endStep(Status.PASSED);

    // Test passed
    allureReporter.endTest(testId, Status.PASSED);
  } catch (error: any) {
    // Test failed
    allureReporter.addScreenshot('Failure Screenshot', '/path/to/failure.png');
    allureReporter.addTextAttachment('Error Log', error.stack);
    allureReporter.endTest(testId, Status.FAILED, {
      message: error.message,
      trace: error.stack,
    });
    throw error;
  }

  // Generate report
  await allureReporter.generateReport(testId);
}

// ============================================
// Example 2: Using Utility Functions
// ============================================

async function exampleWithUtils() {
  const testId = 'test-utils-002';

  // Start test with metadata
  AllureUtils.startTest(testId, 'Checkout Flow Test', {
    description: 'Verify complete checkout process',
    severity: AllureSeverity.NORMAL,
    epic: 'E-Commerce',
    feature: 'Checkout',
    story: 'User Checkout',
    tags: ['e2e', 'checkout'],
  });

  try {
    // Execute steps with automatic error handling
    await AllureUtils.step('Add product to cart', async () => {
      // Product selection logic
      AllureUtils.parameter('product', 'Widget Pro');
      AllureUtils.parameter('quantity', '2');
    });

    await AllureUtils.step('Navigate to cart', async () => {
      // Navigation logic
    });

    await AllureUtils.step('Verify cart items', async () => {
      // Verification logic
      const cartData = { items: 2, total: 199.98 };
      AllureUtils.json('Cart State', cartData);
    });

    await AllureUtils.step('Proceed to checkout', async () => {
      // Checkout logic
      AllureUtils.screenshot('Checkout Page', '/path/to/checkout.png');
    });

    await AllureUtils.step('Complete purchase', async () => {
      // Payment logic
      AllureUtils.log('Payment Log', 'Payment processed successfully');
    });

    // Add metadata
    AllureUtils.link('https://docs.example.com/checkout', 'Checkout Documentation');
    AllureUtils.issue('https://jira.example.com/BUG-123', 'Related Bug');
    AllureUtils.tms('https://tms.example.com/TC-456', 'Test Case TC-456');

    // Test passed
    AllureUtils.endTest(testId, Status.PASSED);
  } catch (error: any) {
    AllureUtils.screenshot('Failure', '/path/to/failure.png');
    AllureUtils.log('Error Details', error.stack);
    AllureUtils.endTest(testId, Status.FAILED, error);
    throw error;
  }
}

// ============================================
// Example 3: Using Decorators
// ============================================

class LoginTestSuite {
  @AllureTest('Valid Login Test', 'Test login with valid credentials')
  @Severity(AllureSeverity.CRITICAL)
  @Epic('Authentication')
  @Feature('Login')
  @Story('User Login')
  @Tag('smoke', 'regression')
  @Issue('https://jira.example.com/AUTH-123', 'AUTH-123')
  async testValidLogin() {
    await this.openLoginPage();
    await this.enterCredentials('user@example.com', 'password123');
    await this.clickLoginButton();
    await this.verifyDashboard();
  }

  @AllureStep('Open login page')
  async openLoginPage() {
    console.log('Navigating to login page...');
    // Navigation logic
  }

  @AllureStep('Enter credentials')
  async enterCredentials(email: string, password: string) {
    console.log(`Entering credentials for ${email}`);
    // Input logic
  }

  @AllureStep('Click login button')
  async clickLoginButton() {
    console.log('Clicking login button...');
    // Click logic
  }

  @AllureStep('Verify dashboard is displayed')
  async verifyDashboard() {
    console.log('Verifying dashboard...');
    // Verification logic
  }
}

// ============================================
// Example 4: Advanced Features
// ============================================

async function exampleAdvancedFeatures() {
  // Write environment information
  allureReporter.writeEnvironmentInfo({
    'Browser': 'Chrome 120.0.6099.109',
    'Browser Version': '120.0.6099.109',
    'Platform': 'Windows 11',
    'OS Version': '10.0.22631',
    'Node Version': '20.10.0',
    'Playwright Version': '1.40.1',
    'Environment': 'Staging',
    'API URL': 'https://api-staging.example.com',
    'Database': 'PostgreSQL 15',
    'Test Execution Date': new Date().toISOString(),
    'Test Executor': 'CI/CD Pipeline',
  });

  // Write test categories
  allureReporter.writeCategories([
    {
      name: 'Product Defects',
      matchedStatuses: [Status.FAILED],
      messageRegex: '.*AssertionError.*',
    },
    {
      name: 'Broken Tests',
      matchedStatuses: [Status.BROKEN],
      messageRegex: '.*(ConnectionError|TimeoutError).*',
    },
    {
      name: 'Known Issues',
      matchedStatuses: [Status.FAILED, Status.BROKEN],
      messageRegex: '.*KNOWN-ISSUE.*',
    },
    {
      name: 'Flaky Tests',
      matchedStatuses: [Status.PASSED, Status.FAILED],
      messageRegex: '.*Flaky.*',
    },
  ]);
}

// ============================================
// Example 5: Multiple Attachments
// ============================================

async function exampleAttachments(testId: string) {
  // Screenshot
  allureReporter.addScreenshot(
    'Login Page',
    '/path/to/screenshots/login.png'
  );

  // Video
  allureReporter.addVideo(
    'Test Execution Video',
    '/path/to/videos/test.webm'
  );

  // Console log
  const consoleLog = `
    [INFO] Test started
    [DEBUG] Navigating to page
    [INFO] Login successful
    [INFO] Test completed
  `;
  allureReporter.addTextAttachment('Console Output', consoleLog);

  // API Response
  const apiResponse = {
    status: 200,
    data: {
      user: { id: 123, name: 'Test User' },
      token: 'abc123...',
    },
  };
  allureReporter.addJsonAttachment('API Response', apiResponse);

  // Page Source
  const pageSource = '<html><body>...</body></html>';
  allureReporter.addTextAttachment('Page Source', pageSource);

  // Trace file
  allureReporter.addTextAttachment(
    'Playwright Trace',
    '/path/to/trace.zip'
  );
}

// ============================================
// Example 6: API Testing Integration
// ============================================

async function exampleApiTesting() {
  const testId = 'api-test-001';

  AllureUtils.startTest(testId, 'API Login Test', {
    description: 'Test login API endpoint',
    severity: AllureSeverity.CRITICAL,
    epic: 'API',
    feature: 'Authentication API',
    story: 'Login Endpoint',
    tags: ['api', 'smoke'],
  });

  try {
    // Step 1: Prepare request
    await AllureUtils.step('Prepare login request', async () => {
      const requestData = {
        email: 'test@example.com',
        password: 'password123',
      };
      AllureUtils.json('Request Payload', requestData);
      AllureUtils.parameter('Endpoint', 'POST /api/auth/login');
    });

    // Step 2: Send request
    await AllureUtils.step('Send API request', async () => {
      // Make API call
      const response = {
        status: 200,
        data: { token: 'abc123', user: { id: 1, email: 'test@example.com' } },
      };
      AllureUtils.json('Response', response);
    });

    // Step 3: Verify response
    await AllureUtils.step('Verify response', async () => {
      AllureUtils.parameter('Expected Status', '200');
      AllureUtils.parameter('Actual Status', '200');
      AllureUtils.log('Verification', 'Status code matches expected value');
    });

    AllureUtils.endTest(testId, Status.PASSED);
  } catch (error: any) {
    AllureUtils.log('API Error', error.message);
    AllureUtils.endTest(testId, Status.FAILED, error);
  }
}

// ============================================
// Example 7: Parallel Test Execution
// ============================================

async function exampleParallelTests() {
  const testIds = ['parallel-001', 'parallel-002', 'parallel-003'];

  await Promise.all(
    testIds.map(async (testId, index) => {
      AllureUtils.startTest(testId, `Parallel Test ${index + 1}`, {
        description: `Test running in parallel - worker ${index + 1}`,
        tags: ['parallel'],
      });

      try {
        await AllureUtils.step('Execute test logic', async () => {
          // Test logic
          await new Promise(resolve => setTimeout(resolve, 1000));
        });

        AllureUtils.endTest(testId, Status.PASSED);
      } catch (error: any) {
        AllureUtils.endTest(testId, Status.FAILED, error);
      }
    })
  );

  // Generate consolidated report
  await allureReporter.generateReport();
}

// ============================================
// Example 8: Complete Test Suite
// ============================================

class CompleteTestSuite {
  async runAllTests() {
    // Set up environment
    await exampleAdvancedFeatures();

    // Run tests
    await exampleBasicTest();
    await exampleWithUtils();

    const loginSuite = new LoginTestSuite();
    await loginSuite.testValidLogin();

    await exampleApiTesting();
    await exampleParallelTests();

    // Cleanup old reports
    await allureReporter.cleanupOldReports(30);
    await allureReporter.cleanupOldResults(30);

    console.log('✅ All tests completed!');
  }
}

// ============================================
// Export Examples
// ============================================

export {
  exampleBasicTest,
  exampleWithUtils,
  exampleAdvancedFeatures,
  exampleAttachments,
  exampleApiTesting,
  exampleParallelTests,
  LoginTestSuite,
  CompleteTestSuite,
};

// ============================================
// Run Examples (if executed directly)
// ============================================

if (require.main === module) {
  const suite = new CompleteTestSuite();
  suite.runAllTests().catch(console.error);
}
