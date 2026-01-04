/**
 * Enhanced Allure Reporter Service
 * Proper integration with Allure 2 Framework
 * https://github.com/allure-framework/allure2
 */

import { 
  AllureRuntime, 
  AllureConfig, 
  InMemoryAllureWriter,
  AllureGroup,
  AllureTest,
  AllureStep,
  Status,
  Stage,
  ContentType,
  Attachment,
  AttachmentOptions,
  Label,
  Link,
  LinkType,
  Parameter,
  StatusDetails,
  Severity
} from 'allure-js-commons';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { logger } from '../utils/logger';

const ALLURE_RESULTS_DIR = path.join(process.cwd(), 'allure-results');
const ALLURE_REPORTS_DIR = path.join(process.cwd(), 'allure-reports');

interface TestMetadata {
  description?: string;
  severity?: Severity;
  epic?: string;
  feature?: string;
  story?: string;
  tags?: string[];
  parameters?: Record<string, any>;
  links?: Array<{ name: string; url: string; type?: LinkType }>;
}

interface StepResult {
  name: string;
  status: Status;
  statusDetails?: StatusDetails;
  attachments?: Attachment[];
  parameters?: Parameter[];
  start?: number;
  stop?: number;
}

export class AllureReporterService {
  private runtime: AllureRuntime;
  private writer: InMemoryAllureWriter;
  private currentTest: AllureTest | null = null;
  private currentStep: AllureStep | null = null;
  private testResults: Map<string, any> = new Map();

  constructor() {
    this.ensureDirectories();
    this.initializeRuntime();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(ALLURE_RESULTS_DIR)) {
      fs.mkdirSync(ALLURE_RESULTS_DIR, { recursive: true });
      logger.info(`Created Allure results directory: ${ALLURE_RESULTS_DIR}`);
    }
    if (!fs.existsSync(ALLURE_REPORTS_DIR)) {
      fs.mkdirSync(ALLURE_REPORTS_DIR, { recursive: true });
      logger.info(`Created Allure reports directory: ${ALLURE_REPORTS_DIR}`);
    }
  }

  private initializeRuntime(): void {
    const config: AllureConfig = {
      resultsDir: ALLURE_RESULTS_DIR,
    };

    this.writer = new InMemoryAllureWriter();
    this.runtime = new AllureRuntime(config);
    
    logger.info('Allure Runtime initialized successfully');
  }

  /**
   * Start a new test case
   */
  startTest(testRunId: string, testName: string, metadata?: TestMetadata): AllureTest {
    try {
      const group = new AllureGroup(this.runtime);
      const test = group.startTest(testName);

      test.historyId = testRunId;
      test.testCaseId = testRunId;
      test.fullName = testName;

      // Add description
      if (metadata?.description) {
        test.description = metadata.description;
      }

      // Add severity
      if (metadata?.severity) {
        test.addLabel('severity', metadata.severity);
      }

      // Add epic, feature, story
      if (metadata?.epic) {
        test.addLabel('epic', metadata.epic);
      }
      if (metadata?.feature) {
        test.addLabel('feature', metadata.feature);
      }
      if (metadata?.story) {
        test.addLabel('story', metadata.story);
      }

      // Add tags
      if (metadata?.tags && metadata.tags.length > 0) {
        metadata.tags.forEach(tag => {
          test.addLabel('tag', tag);
        });
      }

      // Add parameters
      if (metadata?.parameters) {
        Object.entries(metadata.parameters).forEach(([name, value]) => {
          test.addParameter(name, String(value));
        });
      }

      // Add links
      if (metadata?.links && metadata.links.length > 0) {
        metadata.links.forEach(link => {
          test.addLink(link.url, link.name, link.type || LinkType.LINK);
        });
      }

      // Add default labels
      test.addLabel('framework', 'playwright');
      test.addLabel('language', 'typescript');
      test.addLabel('host', process.env.HOSTNAME || 'localhost');
      test.addLabel('thread', testRunId);

      this.currentTest = test;
      this.testResults.set(testRunId, {
        test,
        group,
        startTime: Date.now(),
        steps: []
      });

      logger.info(`Started Allure test: ${testName} (ID: ${testRunId})`);
      return test;
    } catch (error) {
      logger.error('Error starting Allure test:', error);
      throw error;
    }
  }

  /**
   * Start a test step
   */
  startStep(stepName: string): AllureStep {
    try {
      if (!this.currentTest) {
        throw new Error('No active test. Call startTest() first.');
      }

      const step = this.currentTest.startStep(stepName);
      this.currentStep = step;

      logger.debug(`Started step: ${stepName}`);
      return step;
    } catch (error) {
      logger.error('Error starting Allure step:', error);
      throw error;
    }
  }

  /**
   * End current test step
   */
  endStep(status: Status = Status.PASSED, statusDetails?: StatusDetails): void {
    try {
      if (!this.currentStep) {
        logger.warn('No active step to end');
        return;
      }

      this.currentStep.status = status;
      if (statusDetails) {
        this.currentStep.statusDetails = statusDetails;
      }
      this.currentStep.stage = Stage.FINISHED;
      this.currentStep.endStep();

      logger.debug(`Ended step with status: ${status}`);
      this.currentStep = null;
    } catch (error) {
      logger.error('Error ending Allure step:', error);
    }
  }

  /**
   * Record a complete step
   */
  recordStep(stepName: string, status: Status, statusDetails?: StatusDetails): void {
    const step = this.startStep(stepName);
    this.endStep(status, statusDetails);
  }

  /**
   * Add attachment to current step or test
   */
  addAttachment(
    name: string, 
    content: Buffer | string, 
    type: ContentType | string
  ): void {
    try {
      if (this.currentStep) {
        this.currentStep.addAttachment(name, type, content);
      } else if (this.currentTest) {
        this.currentTest.addAttachment(name, type, content);
      } else {
        logger.warn('No active test or step to add attachment');
      }

      logger.debug(`Added attachment: ${name} (${type})`);
    } catch (error) {
      logger.error('Error adding attachment:', error);
    }
  }

  /**
   * Add screenshot attachment
   */
  addScreenshot(name: string, screenshotPath: string): void {
    try {
      if (fs.existsSync(screenshotPath)) {
        const screenshot = fs.readFileSync(screenshotPath);
        this.addAttachment(name, screenshot, ContentType.PNG);
      } else {
        logger.warn(`Screenshot not found: ${screenshotPath}`);
      }
    } catch (error) {
      logger.error('Error adding screenshot:', error);
    }
  }

  /**
   * Add video attachment
   */
  addVideo(name: string, videoPath: string): void {
    try {
      if (fs.existsSync(videoPath)) {
        const video = fs.readFileSync(videoPath);
        this.addAttachment(name, video, ContentType.WEBM);
      } else {
        logger.warn(`Video not found: ${videoPath}`);
      }
    } catch (error) {
      logger.error('Error adding video:', error);
    }
  }

  /**
   * Add text attachment (logs, traces, etc.)
   */
  addTextAttachment(name: string, content: string, type: ContentType = ContentType.TEXT): void {
    this.addAttachment(name, content, type);
  }

  /**
   * Add JSON attachment
   */
  addJsonAttachment(name: string, data: any): void {
    const json = JSON.stringify(data, null, 2);
    this.addAttachment(name, json, ContentType.JSON);
  }

  /**
   * Add parameter to current test
   */
  addParameter(name: string, value: string): void {
    try {
      if (this.currentTest) {
        this.currentTest.addParameter(name, value);
      } else {
        logger.warn('No active test to add parameter');
      }
    } catch (error) {
      logger.error('Error adding parameter:', error);
    }
  }

  /**
   * Add label to current test
   */
  addLabel(name: string, value: string): void {
    try {
      if (this.currentTest) {
        this.currentTest.addLabel(name, value);
      } else {
        logger.warn('No active test to add label');
      }
    } catch (error) {
      logger.error('Error adding label:', error);
    }
  }

  /**
   * Add link to current test
   */
  addLink(url: string, name?: string, type: LinkType = LinkType.LINK): void {
    try {
      if (this.currentTest) {
        this.currentTest.addLink(url, name, type);
      } else {
        logger.warn('No active test to add link');
      }
    } catch (error) {
      logger.error('Error adding link:', error);
    }
  }

  /**
   * End current test
   */
  endTest(testRunId: string, status: Status, statusDetails?: StatusDetails): void {
    try {
      const testData = this.testResults.get(testRunId);
      if (!testData) {
        logger.warn(`Test data not found for ID: ${testRunId}`);
        return;
      }

      const { test, group } = testData;

      test.status = status;
      if (statusDetails) {
        test.statusDetails = statusDetails;
      }
      test.stage = Stage.FINISHED;
      test.endTest();

      // Write results to file
      this.writeResults(testRunId);

      logger.info(`Ended Allure test ${testRunId} with status: ${status}`);
      
      this.currentTest = null;
      this.testResults.delete(testRunId);
    } catch (error) {
      logger.error('Error ending Allure test:', error);
    }
  }

  /**
   * Write test results to JSON files
   */
  private writeResults(testRunId: string): void {
    try {
      const testData = this.testResults.get(testRunId);
      if (!testData) return;

      const { test } = testData;
      const resultPath = path.join(ALLURE_RESULTS_DIR, `${testRunId}-result.json`);

      // Convert test to Allure result format
      const result = {
        uuid: test.uuid,
        historyId: test.historyId,
        testCaseId: test.testCaseId,
        fullName: test.fullName,
        name: test.name,
        status: test.status,
        statusDetails: test.statusDetails,
        stage: test.stage,
        description: test.description,
        descriptionHtml: test.descriptionHtml,
        start: test.start || Date.now(),
        stop: test.stop || Date.now(),
        steps: test.steps,
        attachments: test.attachments,
        parameters: test.parameters,
        labels: test.labels,
        links: test.links,
      };

      fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
      logger.debug(`Test results written to: ${resultPath}`);
    } catch (error) {
      logger.error('Error writing test results:', error);
    }
  }

  /**
   * Generate Allure HTML report
   */
  async generateReport(testRunId?: string): Promise<string> {
    try {
      const reportPath = testRunId 
        ? path.join(ALLURE_REPORTS_DIR, testRunId)
        : path.join(ALLURE_REPORTS_DIR, 'latest');

      if (!fs.existsSync(reportPath)) {
        fs.mkdirSync(reportPath, { recursive: true });
      }

      // Check if allure-commandline is available
      const allureBin = path.join(process.cwd(), 'node_modules', '.bin', 'allure');
      const isWindows = process.platform === 'win32';
      const allureCmd = isWindows ? `"${allureBin}.cmd"` : allureBin;

      if (!fs.existsSync(isWindows ? `${allureBin}.cmd` : allureBin)) {
        throw new Error('Allure CLI not found. Run: npm install allure-commandline');
      }

      // Clean old report
      if (fs.existsSync(reportPath)) {
        fs.rmSync(reportPath, { recursive: true, force: true });
        fs.mkdirSync(reportPath, { recursive: true });
      }

      // Generate report
      const command = `${allureCmd} generate "${ALLURE_RESULTS_DIR}" -o "${reportPath}" --clean`;
      
      logger.info(`Generating Allure report: ${command}`);

      const output = execSync(command, {
        cwd: process.cwd(),
        stdio: 'pipe',
        encoding: 'utf-8',
        windowsHide: true,
      });

      logger.info(`Allure report generated: ${output}`);

      // Verify index.html exists
      const indexPath = path.join(reportPath, 'index.html');
      if (!fs.existsSync(indexPath)) {
        throw new Error('Report generation failed: index.html not created');
      }

      logger.info(`✅ Allure report generated successfully at: ${reportPath}`);
      return reportPath;
    } catch (error) {
      logger.error('Error generating Allure report:', error);
      throw error;
    }
  }

  /**
   * Get report URL
   */
  getReportUrl(testRunId: string): string | null {
    const reportPath = path.join(ALLURE_REPORTS_DIR, testRunId, 'index.html');
    if (fs.existsSync(reportPath)) {
      return `/allure-reports/${testRunId}/index.html`;
    }
    return null;
  }

  /**
   * Get all reports
   */
  getAllReports(): Array<{ id: string; path: string; url: string; createdAt: Date; size: number }> {
    try {
      const reports: Array<{ id: string; path: string; url: string; createdAt: Date; size: number }> = [];
      
      if (!fs.existsSync(ALLURE_REPORTS_DIR)) {
        return reports;
      }

      const entries = fs.readdirSync(ALLURE_REPORTS_DIR);
      
      for (const entry of entries) {
        const reportPath = path.join(ALLURE_REPORTS_DIR, entry);
        const indexPath = path.join(reportPath, 'index.html');
        
        if (fs.existsSync(indexPath)) {
          const stats = fs.statSync(reportPath);
          const size = this.getDirectorySize(reportPath);
          
          reports.push({
            id: entry,
            path: reportPath,
            url: `/allure-reports/${entry}/index.html`,
            createdAt: stats.birthtime,
            size,
          });
        }
      }

      return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      logger.error('Error getting all reports:', error);
      return [];
    }
  }

  /**
   * Get directory size
   */
  private getDirectorySize(dirPath: string): number {
    let size = 0;
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isDirectory()) {
        size += this.getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
    
    return size;
  }

  /**
   * Clean up old reports
   */
  async cleanupOldReports(daysToKeep: number = 7): Promise<number> {
    try {
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      if (!fs.existsSync(ALLURE_REPORTS_DIR)) {
        return 0;
      }

      const entries = fs.readdirSync(ALLURE_REPORTS_DIR);

      for (const entry of entries) {
        const reportPath = path.join(ALLURE_REPORTS_DIR, entry);
        const stats = fs.statSync(reportPath);

        if (now - stats.mtimeMs > maxAge) {
          fs.rmSync(reportPath, { recursive: true, force: true });
          deletedCount++;
          logger.info(`Cleaned up old report: ${entry}`);
        }
      }

      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old reports:', error);
      return 0;
    }
  }

  /**
   * Clean up old results
   */
  async cleanupOldResults(daysToKeep: number = 7): Promise<number> {
    try {
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      if (!fs.existsSync(ALLURE_RESULTS_DIR)) {
        return 0;
      }

      const files = fs.readdirSync(ALLURE_RESULTS_DIR);

      for (const file of files) {
        const filePath = path.join(ALLURE_RESULTS_DIR, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} old result files`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old results:', error);
      return 0;
    }
  }

  /**
   * Clear all results
   */
  clearResults(): void {
    try {
      if (fs.existsSync(ALLURE_RESULTS_DIR)) {
        fs.rmSync(ALLURE_RESULTS_DIR, { recursive: true, force: true });
        fs.mkdirSync(ALLURE_RESULTS_DIR, { recursive: true });
        logger.info('All Allure results cleared');
      }
    } catch (error) {
      logger.error('Error clearing results:', error);
    }
  }

  /**
   * Get environment information
   */
  writeEnvironmentInfo(info: Record<string, string>): void {
    try {
      const envPath = path.join(ALLURE_RESULTS_DIR, 'environment.properties');
      const content = Object.entries(info)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      
      fs.writeFileSync(envPath, content);
      logger.info('Environment info written to Allure results');
    } catch (error) {
      logger.error('Error writing environment info:', error);
    }
  }

  /**
   * Write categories (test classification)
   */
  writeCategories(categories: Array<{
    name: string;
    matchedStatuses?: Status[];
    messageRegex?: string;
    traceRegex?: string;
  }>): void {
    try {
      const categoriesPath = path.join(ALLURE_RESULTS_DIR, 'categories.json');
      fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
      logger.info('Categories written to Allure results');
    } catch (error) {
      logger.error('Error writing categories:', error);
    }
  }
}

// Singleton instance
export const allureReporter = new AllureReporterService();
