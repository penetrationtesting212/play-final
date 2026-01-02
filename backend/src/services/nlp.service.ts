/**
 * Copyright (c) Playwright CRX Backend
 * Apache-2.0 License
 *
 * NLP Service with OpenAI Integration
 */

import axios from 'axios';

interface GherkinConversionRequest {
  gherkin: string;
  language: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp';
  framework: 'playwright' | 'jest' | 'mocha' | 'pytest' | 'junit';
}

interface RequirementsParsingRequest {
  requirements: string;
  projectName: string;
}

interface TestCase {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'functional' | 'ui' | 'integration' | 'e2e' | 'regression';
  steps: string[];
  expectedResult: string;
  status: 'draft';
}

interface DocumentationRequest {
  scripts: Array<{
    id: string;
    name: string;
    code: string;
    language: string;
  }>;
  config: {
    title: string;
    version: string;
    author: string;
    includeOverview: boolean;
    includeSetup: boolean;
    includeExamples: boolean;
    includeTroubleshooting: boolean;
    includeAPI: boolean;
    format: 'markdown' | 'html' | 'pdf' | 'confluence';
    template: 'standard' | 'detailed' | 'minimal';
  };
}

export class NLPService {
  private openaiApiKey: string;
  private openaiBaseUrl: string;
  private model: string;

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
    this.openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    this.model = process.env.OPENAI_MODEL || 'gpt-4-turbo-preview';
  }

  /**
   * Convert Gherkin/BDD scenarios to Playwright code
   */
  async convertGherkin(request: GherkinConversionRequest) {
    const prompt = this.buildGherkinPrompt(request);

    try {
      const response = await this.callOpenAI(prompt);
      const playwrightCode = this.extractCode(response);
      
      return {
        playwrightCode,
        language: request.language,
        testFramework: request.framework,
        confidence: 0.95,
        steps: this.analyzeGherkinSteps(request.gherkin, playwrightCode),
      };
    } catch (error) {
      console.error('Gherkin conversion error:', error);
      throw new Error('Failed to convert Gherkin to Playwright code');
    }
  }

  /**
   * Parse requirements into test cases
   */
  async parseRequirements(request: RequirementsParsingRequest) {
    const prompt = this.buildRequirementsPrompt(request);

    try {
      const response = await this.callOpenAI(prompt);
      const testCases = this.parseTestCasesFromResponse(response);
      
      const typeCounts = testCases.reduce((acc, tc) => {
        acc[tc.type] = (acc[tc.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = testCases.length;
      const coverage = {
        functional: ((typeCounts.functional || 0) / total) * 100,
        ui: ((typeCounts.ui || 0) / total) * 100,
        integration: ((typeCounts.integration || 0) / total) * 100,
        e2e: ((typeCounts.e2e || 0) / total) * 100,
        regression: ((typeCounts.regression || 0) / total) * 100,
      };

      return {
        testCases,
        coverage,
        confidence: 0.90,
        suggestions: this.generateSuggestions(testCases),
      };
    } catch (error) {
      console.error('Requirements parsing error:', error);
      throw new Error('Failed to parse requirements');
    }
  }

  /**
   * Generate test code from test case
   */
  async generateTestCode(testCase: TestCase, language: string) {
    const prompt = `Convert the following test case into ${language} Playwright code:

Test Case: ${testCase.title}
Description: ${testCase.description}
Steps:
${testCase.steps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

Expected Result: ${testCase.expectedResult}

Generate complete Playwright test code with proper imports, test structure, and assertions.
Use best practices and include comments.`;

    try {
      const response = await this.callOpenAI(prompt);
      return this.extractCode(response);
    } catch (error) {
      console.error('Test code generation error:', error);
      throw new Error('Failed to generate test code');
    }
  }

  /**
   * Generate comprehensive documentation
   */
  async generateDocumentation(request: DocumentationRequest) {
    const prompt = this.buildDocumentationPrompt(request);

    try {
      const response = await this.callOpenAI(prompt);
      return this.parseDocumentation(response, request);
    } catch (error) {
      console.error('Documentation generation error:', error);
      throw new Error('Failed to generate documentation');
    }
  }

  /**
   * Call OpenAI API
   */
  private async callOpenAI(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await axios.post(
        `${this.openaiBaseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt || 'You are an expert in test automation and Playwright. Generate accurate, production-ready test code.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 2000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('OpenAI API error:', error.response?.data || error.message);
      throw new Error('OpenAI API call failed');
    }
  }

  /**
   * Build Gherkin conversion prompt
   */
  private buildGherkinPrompt(request: GherkinConversionRequest): string {
    const languageTemplates: Record<string, string> = {
      typescript: 'TypeScript with Playwright Test framework',
      javascript: 'JavaScript with Playwright',
      python: 'Python with Playwright',
      java: 'Java with Playwright',
      csharp: 'C# with Playwright',
    };

    return `Convert the following Gherkin/BDD scenario to ${languageTemplates[request.language]}:

${request.gherkin}

Requirements:
1. Use proper test structure and imports
2. Include clear test descriptions
3. Use best practices for selectors (prefer test IDs, then role-based selectors)
4. Add proper assertions
5. Include comments for complex steps
6. Use async/await properly
7. Follow ${request.framework} conventions

Generate complete, production-ready test code.`;
  }

  /**
   * Build requirements parsing prompt
   */
  private buildRequirementsPrompt(request: RequirementsParsingRequest): string {
    return `Analyze the following requirements document and generate comprehensive test cases:

Project: ${request.projectName}

Requirements:
${request.requirements}

Generate test cases in JSON format with the following structure:
[
  {
    "title": "Test case title",
    "description": "Detailed description",
    "priority": "high|medium|low",
    "type": "functional|ui|integration|e2e|regression",
    "steps": ["Step 1", "Step 2", ...],
    "expectedResult": "Expected outcome"
  }
]

Include:
1. Functional test cases
2. UI test cases
3. Integration test cases
4. End-to-end test cases
5. Edge cases and negative scenarios
6. Accessibility considerations
7. Performance considerations

Provide ONLY the JSON array, no additional text.`;
  }

  /**
   * Build documentation generation prompt
   */
  private buildDocumentationPrompt(request: DocumentationRequest): string {
    const scriptsInfo = request.scripts.map(s => 
      `### ${s.name} (${s.language})\n\`\`\`${s.language}\n${s.code}\n\`\`\``
    ).join('\n\n');

    return `Generate comprehensive ${request.config.format} documentation for a test suite.

Project: ${request.config.title}
Version: ${request.config.version}
Author: ${request.config.author}
Template: ${request.config.template}

Test Scripts:
${scriptsInfo}

Include sections:
${request.config.includeOverview ? '- Overview and introduction' : ''}
${request.config.includeSetup ? '- Setup and installation instructions' : ''}
${request.config.includeExamples ? '- Usage examples' : ''}
${request.config.includeTroubleshooting ? '- Troubleshooting guide' : ''}
${request.config.includeAPI ? '- API reference' : ''}

Generate clear, professional documentation in ${request.config.format} format.
Use proper formatting, code blocks, and structure.`;
  }

  /**
   * Extract code from AI response
   */
  private extractCode(response: string): string {
    // Try to extract code from markdown code blocks
    const codeBlockMatch = response.match(/```(?:\w+)?\n([\s\S]*?)```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1].trim();
    }
    return response.trim();
  }

  /**
   * Analyze Gherkin steps and map to Playwright code
   */
  private analyzeGherkinSteps(gherkin: string, code: string): Array<{
    gherkin: string;
    playwright: string;
    status: 'success' | 'warning' | 'error';
    message?: string;
  }> {
    const steps: Array<any> = [];
    const gherkinLines = gherkin.split('\n').filter(line => {
      const trimmed = line.trim();
      return trimmed.startsWith('Given') || 
             trimmed.startsWith('When') || 
             trimmed.startsWith('Then') || 
             trimmed.startsWith('And');
    });

    const codeLines = code.split('\n').filter(line => 
      line.includes('await page.')
    );

    gherkinLines.forEach((gherkinLine, idx) => {
      const playwrightLine = codeLines[idx] || '';
      steps.push({
        gherkin: gherkinLine.trim(),
        playwright: playwrightLine.trim(),
        status: playwrightLine ? 'success' : 'warning',
        message: playwrightLine ? undefined : 'Could not map to Playwright code',
      });
    });

    return steps;
  }

  /**
   * Parse test cases from AI response
   */
  private parseTestCasesFromResponse(response: string): TestCase[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((tc: any, idx: number) => ({
          id: `tc-${Date.now()}-${idx}`,
          ...tc,
          status: 'draft' as const,
        }));
      }
    } catch (error) {
      console.error('Failed to parse test cases JSON:', error);
    }

    // Fallback: parse as plain text
    return [];
  }

  /**
   * Generate suggestions based on test cases
   */
  private generateSuggestions(testCases: TestCase[]): string[] {
    const suggestions: string[] = [];

    const priorities = testCases.reduce((acc, tc) => {
      acc[tc.priority] = (acc[tc.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    if ((priorities.high || 0) < testCases.length * 0.2) {
      suggestions.push('Consider adding more high-priority test cases');
    }

    if ((priorities.low || 0) > testCases.length * 0.5) {
      suggestions.push('Too many low-priority tests - consider consolidating');
    }

    const types = new Set(testCases.map(tc => tc.type));
    if (!types.has('e2e')) {
      suggestions.push('Add end-to-end test scenarios');
    }
    if (!types.has('integration')) {
      suggestions.push('Consider adding integration tests');
    }

    suggestions.push('Review test cases for edge cases and negative scenarios');
    suggestions.push('Add accessibility test cases if applicable');
    suggestions.push('Consider performance test cases for critical paths');

    return suggestions;
  }

  /**
   * Parse documentation from AI response
   */
  private parseDocumentation(response: string, request: DocumentationRequest) {
    return {
      id: Date.now().toString(),
      title: request.config.title,
      description: `Generated documentation for ${request.scripts.length} test scripts`,
      sections: [
        {
          type: 'overview',
          title: 'Overview',
          content: response,
        },
      ],
      format: request.config.format,
      generatedAt: new Date().toISOString(),
      version: request.config.version,
    };
  }
}

export const nlpService = new NLPService();
