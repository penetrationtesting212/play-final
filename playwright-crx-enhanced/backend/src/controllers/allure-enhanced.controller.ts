/**
 * Enhanced Allure Controller
 * Comprehensive API for Allure reporting
 */

import { Request, Response } from 'express';
import { allureReporter } from '../services/allure-reporter.service';
import { Status, Severity } from 'allure-js-commons';
import { logger } from '../utils/logger';
import pool from '../db';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Generate Allure report for a test run
 */
export const generateReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testRunId } = req.params;

    if (!testRunId) {
      res.status(400).json({ 
        success: false, 
        error: 'Test run ID is required' 
      });
      return;
    }

    logger.info(`Generating Allure report for test run: ${testRunId}`);

    // Fetch test run data from database
    const testRunQuery = await pool.query(
      'SELECT * FROM test_runs WHERE id = $1',
      [testRunId]
    );

    if (testRunQuery.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Test run not found'
      });
      return;
    }

    const testRun = testRunQuery.rows[0];

    // Fetch test steps
    const stepsQuery = await pool.query(
      'SELECT * FROM test_steps WHERE test_run_id = $1 ORDER BY step_number',
      [testRunId]
    );

    const steps = stepsQuery.rows;

    // Create Allure test with metadata
    allureReporter.startTest(testRunId, testRun.script_name || 'Test', {
      description: testRun.description,
      severity: Severity.NORMAL,
      parameters: {
        browser: testRun.browser,
        environment: testRun.environment,
        viewport: testRun.viewport,
      },
    });

    // Add steps to Allure
    for (const step of steps) {
      const stepStatus = step.status === 'passed' 
        ? Status.PASSED 
        : step.status === 'failed' 
        ? Status.FAILED 
        : Status.BROKEN;

      allureReporter.recordStep(
        step.action,
        stepStatus,
        step.error_message ? { message: step.error_message } : undefined
      );
    }

    // Add screenshots if available
    if (testRun.screenshot_urls && Array.isArray(testRun.screenshot_urls)) {
      testRun.screenshot_urls.forEach((url: string, index: number) => {
        if (fs.existsSync(url)) {
          allureReporter.addScreenshot(`Screenshot ${index + 1}`, url);
        }
      });
    }

    // Add video if available
    if (testRun.video_url && fs.existsSync(testRun.video_url)) {
      allureReporter.addVideo('Test Execution Video', testRun.video_url);
    }

    // Add trace if available
    if (testRun.trace_url) {
      allureReporter.addTextAttachment('Playwright Trace', testRun.trace_url);
    }

    // End test with final status
    const finalStatus = testRun.status === 'passed' 
      ? Status.PASSED 
      : testRun.status === 'failed' 
      ? Status.FAILED 
      : Status.BROKEN;

    allureReporter.endTest(
      testRunId,
      finalStatus,
      testRun.error_message ? { message: testRun.error_message } : undefined
    );

    // Generate HTML report
    const reportPath = await allureReporter.generateReport(testRunId);
    const reportUrl = allureReporter.getReportUrl(testRunId);

    // Update database with report URL
    await pool.query(
      'UPDATE test_runs SET execution_report_url = $1 WHERE id = $2',
      [reportUrl, testRunId]
    );

    logger.info(`✅ Allure report generated successfully for: ${testRunId}`);

    res.json({
      success: true,
      reportPath,
      reportUrl,
      message: 'Allure report generated successfully',
    });
  } catch (error: any) {
    logger.error('Error generating Allure report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate Allure report',
    });
  }
};

/**
 * Get report URL for a test run
 */
export const getReportUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    const { testRunId } = req.params;

    const reportUrl = allureReporter.getReportUrl(testRunId);

    if (!reportUrl) {
      res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
      return;
    }

    res.json({ 
      success: true, 
      reportUrl 
    });
  } catch (error: any) {
    logger.error('Error getting report URL:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get report URL' 
    });
  }
};

/**
 * Get all Allure reports
 */
export const getAllReports = async (_req: Request, res: Response): Promise<void> => {
  try {
    const reports = allureReporter.getAllReports();
    
    res.json({ 
      success: true, 
      reports,
      total: reports.length 
    });
  } catch (error: any) {
    logger.error('Error getting all reports:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get reports' 
    });
  }
};

/**
 * Clean up old reports
 */
export const cleanupOldReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days } = req.body;
    const daysToKeep = days || 7;

    const deletedCount = await allureReporter.cleanupOldReports(daysToKeep);

    res.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} reports older than ${daysToKeep} days`,
      deletedCount 
    });
  } catch (error: any) {
    logger.error('Error cleaning up reports:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to cleanup reports' 
    });
  }
};

/**
 * Clean up old results
 */
export const cleanupOldResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days } = req.body;
    const daysToKeep = days || 7;

    const deletedCount = await allureReporter.cleanupOldResults(daysToKeep);

    res.json({ 
      success: true, 
      message: `Cleaned up ${deletedCount} result files older than ${daysToKeep} days`,
      deletedCount 
    });
  } catch (error: any) {
    logger.error('Error cleaning up results:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to cleanup results' 
    });
  }
};

/**
 * Clear all Allure results
 */
export const clearAllResults = async (_req: Request, res: Response): Promise<void> => {
  try {
    allureReporter.clearResults();

    res.json({ 
      success: true, 
      message: 'All Allure results cleared' 
    });
  } catch (error: any) {
    logger.error('Error clearing results:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to clear results' 
    });
  }
};

/**
 * Write environment info
 */
export const writeEnvironmentInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { environment } = req.body;

    if (!environment || typeof environment !== 'object') {
      res.status(400).json({
        success: false,
        error: 'Environment info must be an object'
      });
      return;
    }

    allureReporter.writeEnvironmentInfo(environment);

    res.json({ 
      success: true, 
      message: 'Environment info written successfully' 
    });
  } catch (error: any) {
    logger.error('Error writing environment info:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to write environment info' 
    });
  }
};

/**
 * Write test categories
 */
export const writeCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      res.status(400).json({
        success: false,
        error: 'Categories must be an array'
      });
      return;
    }

    allureReporter.writeCategories(categories);

    res.json({ 
      success: true, 
      message: 'Categories written successfully' 
    });
  } catch (error: any) {
    logger.error('Error writing categories:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to write categories' 
    });
  }
};

/**
 * Get Allure configuration
 */
export const getAllureConfig = async (_req: Request, res: Response): Promise<void> => {
  try {
    const config = {
      resultsDir: path.join(process.cwd(), 'allure-results'),
      reportsDir: path.join(process.cwd(), 'allure-reports'),
      version: '2.34.1',
      features: [
        'Test execution history',
        'Categorization',
        'Attachments (screenshots, videos, logs)',
        'Environment info',
        'Retries tracking',
        'Behavior-driven approach',
        'Timeline view',
        'Graphs and statistics',
      ],
    };

    res.json({ 
      success: true, 
      config 
    });
  } catch (error: any) {
    logger.error('Error getting Allure config:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get config' 
    });
  }
};

/**
 * Health check for Allure service
 */
export const healthCheck = async (_req: Request, res: Response): Promise<void> => {
  try {
    const resultsDir = path.join(process.cwd(), 'allure-results');
    const reportsDir = path.join(process.cwd(), 'allure-reports');
    const allureBin = path.join(process.cwd(), 'node_modules', '.bin', 'allure');
    
    const isWindows = process.platform === 'win32';
    const allureCmdExists = fs.existsSync(
      isWindows ? `${allureBin}.cmd` : allureBin
    );

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      directories: {
        results: {
          exists: fs.existsSync(resultsDir),
          path: resultsDir,
        },
        reports: {
          exists: fs.existsSync(reportsDir),
          path: reportsDir,
        },
      },
      allureCli: {
        installed: allureCmdExists,
        path: allureCmdExists ? allureBin : null,
      },
      reports: allureReporter.getAllReports().length,
    };

    res.json({ 
      success: true, 
      health 
    });
  } catch (error: any) {
    logger.error('Error checking Allure health:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Health check failed' 
    });
  }
};
