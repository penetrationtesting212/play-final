/**
 * Allure Integration Service for Test Runs
 * Bridges test execution with Allure reporting
 */

import { allureReporter } from '../allure-reporter.service';
import { Status, Severity, ContentType } from 'allure-js-commons';
import { Page, Browser } from 'playwright-core';
import { logger } from '../../utils/logger';
import * as path from 'path';
import * as fs from 'fs';
import pool from '../../db';

interface TestRunMetadata {
  testRunId: string;
  scriptId: string;
  scriptName: string;
  userId: string;
  browser: string;
  environment: string;
}

export class AllureIntegrationService {
  private screenshotDir = path.join(process.cwd(), 'test-screenshots');
  private videoDir = path.join(process.cwd(), 'test-videos');

  constructor() {
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
    if (!fs.existsSync(this.videoDir)) {
      fs.mkdirSync(this.videoDir, { recursive: true });
    }
  }

  /**
   * Start Allure test tracking for a test run
   */
  async startTest(metadata: TestRunMetadata): Promise<void> {
    try {
      logger.info(`🎭 Starting Allure test: ${metadata.testRunId}`);

      // Fetch script details
      const { rows } = await pool.query(
        'SELECT name, description, language FROM scripts WHERE id = $1',
        [metadata.scriptId]
      );

      const script = rows[0] || { name: 'Unknown Test', description: '' };

      // Start Allure test with rich metadata
      allureReporter.startTest(metadata.testRunId, script.name || metadata.scriptName, {
        description: script.description || 'Automated test execution',
        severity: Severity.NORMAL,
        epic: 'Test Automation',
        feature: 'Playwright Test Execution',
        story: script.name || metadata.scriptName,
        tags: ['automated', 'playwright', metadata.browser, metadata.environment],
        parameters: {
          testRunId: metadata.testRunId,
          scriptId: metadata.scriptId,
          browser: metadata.browser,
          environment: metadata.environment,
          language: script.language || 'typescript',
        },
        links: [
          {
            name: 'View in Dashboard',
            url: `http://localhost:3001/test-runs/${metadata.testRunId}`,
          },
        ],
      });

      // Write environment info
      allureReporter.writeEnvironmentInfo({
        'Test Run ID': metadata.testRunId,
        'Script ID': metadata.scriptId,
        'Browser': metadata.browser,
        'Environment': metadata.environment,
        'Platform': process.platform,
        'Node Version': process.version,
        'Playwright Version': require('playwright-core/package.json').version,
        'Execution Time': new Date().toISOString(),
      });

      logger.info(`✅ Allure test started: ${metadata.testRunId}`);
    } catch (error) {
      logger.error('Failed to start Allure test:', error);
      throw error;
    }
  }

  /**
   * Record a test step in Allure
   */
  recordStep(
    testRunId: string,
    stepNumber: number,
    action: string,
    selector: string,
    value: string,
    status: 'passed' | 'failed',
    errorMsg?: string
  ): void {
    try {
      const stepName = this.formatStepName(stepNumber, action, selector, value);
      const allureStatus = status === 'passed' ? Status.PASSED : Status.FAILED;

      allureReporter.recordStep(
        stepName,
        allureStatus,
        errorMsg ? { message: errorMsg } : undefined
      );

      // Add step parameters
      if (selector) {
        allureReporter.addParameter('selector', selector);
      }
      if (value) {
        allureReporter.addParameter('value', value);
      }

      logger.debug(`📝 Allure step recorded: ${stepName} - ${status}`);
    } catch (error) {
      logger.error('Failed to record Allure step:', error);
    }
  }

  /**
   * Capture and attach screenshot
   */
  async captureScreenshot(
    testRunId: string,
    page: Page,
    name: string
  ): Promise<string | null> {
    try {
      const filename = `${testRunId}-${Date.now()}-${name.replace(/\s+/g, '-')}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      const screenshot = await page.screenshot({
        path: filepath,
        fullPage: false,
      });

      // Attach to Allure
      allureReporter.addAttachment(name, screenshot, ContentType.PNG);

      logger.info(`📸 Screenshot captured: ${name}`);
      return filepath;
    } catch (error) {
      logger.error('Failed to capture screenshot:', error);
      return null;
    }
  }

  /**
   * Capture page HTML
   */
  async capturePageHTML(testRunId: string, page: Page, name: string): Promise<void> {
    try {
      const html = await page.content();
      allureReporter.addTextAttachment(name, html, ContentType.HTML);
      logger.debug(`📄 Page HTML captured: ${name}`);
    } catch (error) {
      logger.error('Failed to capture page HTML:', error);
    }
  }

  /**
   * Capture console logs
   */
  captureConsoleLogs(testRunId: string, logs: string[]): void {
    try {
      if (logs.length === 0) return;

      const logContent = logs.join('\n');
      allureReporter.addTextAttachment('Console Logs', logContent, ContentType.TEXT);
      logger.debug(`📋 Console logs captured (${logs.length} entries)`);
    } catch (error) {
      logger.error('Failed to capture console logs:', error);
    }
  }

  /**
   * Capture browser info
   */
  async captureBrowserInfo(browser: Browser): Promise<void> {
    try {
      const version = await browser.version();
      const browserInfo = {
        version,
        type: browser.browserType().name(),
        isConnected: browser.isConnected(),
      };

      allureReporter.addJsonAttachment('Browser Info', browserInfo);
      logger.debug(`🌐 Browser info captured`);
    } catch (error) {
      logger.error('Failed to capture browser info:', error);
    }
  }

  /**
   * End test and generate report
   */
  async endTest(
    testRunId: string,
    status: 'passed' | 'failed' | 'broken',
    errorMessage?: string,
    screenshotPath?: string
  ): Promise<string | null> {
    try {
      logger.info(`🎭 Ending Allure test: ${testRunId} (${status})`);

      // Convert status
      let allureStatus: Status;
      switch (status) {
        case 'passed':
          allureStatus = Status.PASSED;
          break;
        case 'failed':
          allureStatus = Status.FAILED;
          break;
        case 'broken':
          allureStatus = Status.BROKEN;
          break;
        default:
          allureStatus = Status.BROKEN;
      }

      // Add failure screenshot if available
      if (status === 'failed' && screenshotPath && fs.existsSync(screenshotPath)) {
        const screenshot = fs.readFileSync(screenshotPath);
        allureReporter.addAttachment('Failure Screenshot', screenshot, ContentType.PNG);
      }

      // End test
      allureReporter.endTest(
        testRunId,
        allureStatus,
        errorMessage ? { message: errorMessage } : undefined
      );

      logger.info(`✅ Allure test ended: ${testRunId}`);

      // Generate report
      logger.info(`📊 Generating Allure report for: ${testRunId}`);
      const reportPath = await allureReporter.generateReport(testRunId);
      const reportUrl = allureReporter.getReportUrl(testRunId);

      logger.info(`✅ Allure report generated: ${reportUrl}`);

      // Update database with report URL
      await pool.query(
        'UPDATE test_runs SET execution_report_url = $1 WHERE id = $2',
        [reportUrl, testRunId]
      );

      return reportUrl;
    } catch (error) {
      logger.error('Failed to end Allure test:', error);
      return null;
    }
  }

  /**
   * Attach test data
   */
  attachTestData(testRunId: string, data: any, name: string = 'Test Data'): void {
    try {
      allureReporter.addJsonAttachment(name, data);
      logger.debug(`📎 Test data attached: ${name}`);
    } catch (error) {
      logger.error('Failed to attach test data:', error);
    }
  }

  /**
   * Attach error details
   */
  attachErrorDetails(testRunId: string, error: Error): void {
    try {
      const errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      };

      allureReporter.addJsonAttachment('Error Details', errorDetails);
      allureReporter.addTextAttachment('Error Stack Trace', error.stack || '', ContentType.TEXT);
      
      logger.debug(`❌ Error details attached`);
    } catch (err) {
      logger.error('Failed to attach error details:', err);
    }
  }

  /**
   * Format step name for Allure
   */
  private formatStepName(
    stepNumber: number,
    action: string,
    selector: string,
    value: string
  ): string {
    let name = `Step ${stepNumber}: ${action}`;

    if (selector) {
      name += ` "${selector}"`;
    }

    if (value) {
      name += ` with "${value}"`;
    }

    return name;
  }

  /**
   * Add step with automatic screenshot
   */
  async recordStepWithScreenshot(
    testRunId: string,
    stepNumber: number,
    action: string,
    selector: string,
    value: string,
    status: 'passed' | 'failed',
    page: Page,
    errorMsg?: string
  ): Promise<void> {
    this.recordStep(testRunId, stepNumber, action, selector, value, status, errorMsg);

    // Capture screenshot for important actions
    const screenshotActions = ['navigate', 'click', 'assert_visible', 'assert_text'];
    if (screenshotActions.includes(action)) {
      await this.captureScreenshot(
        testRunId,
        page,
        `${action}-step-${stepNumber}`
      );
    }

    // Capture HTML on failure
    if (status === 'failed') {
      await this.capturePageHTML(testRunId, page, `failed-step-${stepNumber}`);
    }
  }

  /**
   * Setup console log capture for page
   */
  setupConsoleCapture(page: Page, testRunId: string): string[] {
    const logs: string[] = [];

    page.on('console', (msg) => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      logs.push(logEntry);
    });

    page.on('pageerror', (error) => {
      logs.push(`[ERROR] ${error.message}`);
    });

    return logs;
  }

  /**
   * Write test categories
   */
  writeCategories(): void {
    try {
      allureReporter.writeCategories([
        {
          name: 'Product Defects',
          matchedStatuses: [Status.FAILED],
          messageRegex: '.*AssertionError.*',
        },
        {
          name: 'Broken Tests',
          matchedStatuses: [Status.BROKEN],
          messageRegex: '.*(ConnectionError|TimeoutError|NetworkError).*',
        },
        {
          name: 'Locator Issues',
          matchedStatuses: [Status.FAILED, Status.BROKEN],
          messageRegex: '.*(locator|selector|element not found).*',
        },
        {
          name: 'Timeout Issues',
          matchedStatuses: [Status.BROKEN],
          messageRegex: '.*timeout.*',
        },
      ]);

      logger.debug(`📂 Allure categories configured`);
    } catch (error) {
      logger.error('Failed to write Allure categories:', error);
    }
  }
}

// Singleton instance
export const allureIntegration = new AllureIntegrationService();
