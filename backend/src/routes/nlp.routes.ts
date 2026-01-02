/**
 * Copyright (c) Playwright CRX Backend
 * Apache-2.0 License
 *
 * NLP Routes - Natural Language Processing API endpoints
 */

import { Router, Request, Response } from 'express';
import { nlpService } from '../services/nlp.service';

const router = Router();

/**
 * POST /api/nlp/convert-gherkin
 * Convert Gherkin/BDD scenarios to Playwright code
 */
router.post('/convert-gherkin', async (req: Request, res: Response) => {
  try {
    const { gherkin, language, framework } = req.body;

    if (!gherkin) {
      return res.status(400).json({
        success: false,
        error: 'Gherkin scenario is required',
      });
    }

    const result = await nlpService.convertGherkin({
      gherkin,
      language: language || 'typescript',
      framework: framework || 'playwright',
    });

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Gherkin conversion error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert Gherkin',
    });
  }
});

/**
 * POST /api/nlp/parse-requirements
 * Parse requirements document into test cases
 */
router.post('/parse-requirements', async (req: Request, res: Response) => {
  try {
    const { requirements, projectName } = req.body;

    if (!requirements) {
      return res.status(400).json({
        success: false,
        error: 'Requirements document is required',
      });
    }

    const result = await nlpService.parseRequirements({
      requirements,
      projectName: projectName || 'Untitled Project',
    });

    res.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error('Requirements parsing error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse requirements',
    });
  }
});

/**
 * POST /api/nlp/generate-test-code
 * Generate Playwright code from test case
 */
router.post('/generate-test-code', async (req: Request, res: Response) => {
  try {
    const { testCase, language } = req.body;

    if (!testCase) {
      return res.status(400).json({
        success: false,
        error: 'Test case is required',
      });
    }

    const code = await nlpService.generateTestCode(
      testCase,
      language || 'typescript'
    );

    res.json({
      success: true,
      code,
    });
  } catch (error: any) {
    console.error('Test code generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate test code',
    });
  }
});

/**
 * POST /api/nlp/generate-documentation
 * Generate comprehensive test documentation
 */
router.post('/generate-documentation', async (req: Request, res: Response) => {
  try {
    const { scripts, config } = req.body;

    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Configuration is required',
      });
    }

    const documentation = await nlpService.generateDocumentation({
      scripts: scripts || [],
      config: {
        title: config.title || 'Test Documentation',
        version: config.version || '1.0.0',
        author: config.author || '',
        includeOverview: config.includeOverview !== false,
        includeSetup: config.includeSetup !== false,
        includeExamples: config.includeExamples !== false,
        includeTroubleshooting: config.includeTroubleshooting !== false,
        includeAPI: config.includeAPI || false,
        format: config.format || 'markdown',
        template: config.template || 'standard',
      },
    });

    res.json({
      success: true,
      documentation,
    });
  } catch (error: any) {
    console.error('Documentation generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate documentation',
    });
  }
});

/**
 * GET /api/nlp/health
 * Check NLP service health
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'NLP',
    status: 'operational',
    features: [
      'Gherkin/BDD to Playwright conversion',
      'Requirements parsing to test cases',
      'Test code generation',
      'Automatic documentation generation',
    ],
    openaiConfigured: !!process.env.OPENAI_API_KEY,
  });
});

export default router;
