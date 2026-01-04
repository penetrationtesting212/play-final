/**
 * Enhanced Allure Routes
 * Comprehensive API endpoints for Allure reporting
 */

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  generateReport,
  getReportUrl,
  getAllReports,
  cleanupOldReports,
  cleanupOldResults,
  clearAllResults,
  writeEnvironmentInfo,
  writeCategories,
  getAllureConfig,
  healthCheck,
} from '../controllers/allure-enhanced.controller';

const router = Router();

/**
 * @swagger
 * /api/allure/health:
 *   get:
 *     summary: Check Allure service health
 *     tags: [Allure]
 *     responses:
 *       200:
 *         description: Health check result
 */
router.get('/health', healthCheck);

/**
 * @swagger
 * /api/allure/config:
 *   get:
 *     summary: Get Allure configuration
 *     tags: [Allure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Allure configuration
 */
router.get('/config', authMiddleware, getAllureConfig);

/**
 * @swagger
 * /api/allure/generate/{testRunId}:
 *   post:
 *     summary: Generate Allure report for a test run
 *     tags: [Allure]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testRunId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test run ID
 *     responses:
 *       200:
 *         description: Report generated successfully
 *       404:
 *         description: Test run not found
 *       500:
 *         description: Server error
 */
router.post('/generate/:testRunId', authMiddleware, generateReport);

/**
 * @swagger
 * /api/allure/report/{testRunId}:
 *   get:
 *     summary: Get report URL for a test run
 *     tags: [Allure]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: testRunId
 *         required: true
 *         schema:
 *           type: string
 *         description: Test run ID
 *     responses:
 *       200:
 *         description: Report URL
 *       404:
 *         description: Report not found
 */
router.get('/report/:testRunId', authMiddleware, getReportUrl);

/**
 * @swagger
 * /api/allure/reports:
 *   get:
 *     summary: Get all Allure reports
 *     tags: [Allure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all reports
 */
router.get('/reports', authMiddleware, getAllReports);

/**
 * @swagger
 * /api/allure/cleanup/reports:
 *   post:
 *     summary: Clean up old reports
 *     tags: [Allure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: number
 *                 default: 7
 *     responses:
 *       200:
 *         description: Cleanup successful
 */
router.post('/cleanup/reports', authMiddleware, cleanupOldReports);

/**
 * @swagger
 * /api/allure/cleanup/results:
 *   post:
 *     summary: Clean up old result files
 *     tags: [Allure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               days:
 *                 type: number
 *                 default: 7
 *     responses:
 *       200:
 *         description: Cleanup successful
 */
router.post('/cleanup/results', authMiddleware, cleanupOldResults);

/**
 * @swagger
 * /api/allure/clear:
 *   post:
 *     summary: Clear all Allure results
 *     tags: [Allure]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Results cleared
 */
router.post('/clear', authMiddleware, clearAllResults);

/**
 * @swagger
 * /api/allure/environment:
 *   post:
 *     summary: Write environment information
 *     tags: [Allure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               environment:
 *                 type: object
 *                 example:
 *                   Browser: "Chrome 120"
 *                   Platform: "Windows 11"
 *                   NodeVersion: "20.10.0"
 *     responses:
 *       200:
 *         description: Environment info written
 */
router.post('/environment', authMiddleware, writeEnvironmentInfo);

/**
 * @swagger
 * /api/allure/categories:
 *   post:
 *     summary: Write test categories
 *     tags: [Allure]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               categories:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     matchedStatuses:
 *                       type: array
 *                       items:
 *                         type: string
 *                     messageRegex:
 *                       type: string
 *     responses:
 *       200:
 *         description: Categories written
 */
router.post('/categories', authMiddleware, writeCategories);

export default router;
