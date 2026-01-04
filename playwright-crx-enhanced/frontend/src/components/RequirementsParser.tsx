/**
 * Copyright (c) Playwright CRX
 * Apache-2.0 License
 *
 * Requirements to Test Cases Parser Component
 */

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Tabs } from './Tabs';
import { Toast, showToast } from './Toast';
import { Badge } from './Badge';
import { Input } from './Input';

interface TestCase {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'functional' | 'ui' | 'integration' | 'e2e' | 'regression';
  steps: string[];
  expectedResult: string;
  playwrightCode?: string;
  status: 'draft' | 'generated' | 'approved';
}

interface ParseResult {
  testCases: TestCase[];
  coverage: {
    functional: number;
    ui: number;
    integration: number;
    e2e: number;
    regression: number;
  };
  confidence: number;
  suggestions: string[];
}

interface RequirementsParserProps {
  onTestCasesGenerated?: (testCases: TestCase[]) => void;
  onClose?: () => void;
}

export const RequirementsParser: React.FC<RequirementsParserProps> = ({
  onTestCasesGenerated,
  onClose,
}) => {
  const [requirements, setRequirements] = useState<string>('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [selectedTestCases, setSelectedTestCases] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'parser' | 'testcases' | 'code'>('parser');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [projectName, setProjectName] = useState<string>('');

  const sampleRequirements = [
    {
      name: 'E-commerce Checkout',
      content: `# E-commerce Checkout Flow Requirements

## Functional Requirements
1. User must be able to add items to cart
2. Cart should display total price with tax
3. User can apply discount codes
4. Multiple payment methods supported (Credit Card, PayPal, Apple Pay)
5. Order confirmation email sent after successful purchase

## Non-Functional Requirements
1. Checkout process should complete within 3 seconds
2. Support 1000 concurrent users
3. PCI DSS compliant payment processing
4. Mobile responsive design

## User Stories
- As a customer, I want to see my cart total update in real-time
- As a customer, I want to save items for later
- As a customer, I want to receive order tracking information`,
    },
    {
      name: 'User Authentication',
      content: `# User Authentication Requirements

## Features
1. Email/Password login
2. Social login (Google, Facebook, GitHub)
3. Two-factor authentication (2FA)
4. Password reset via email
5. Remember me functionality

## Security Requirements
1. Passwords must be hashed using bcrypt
2. Session timeout after 30 minutes of inactivity
3. Account lockout after 5 failed login attempts
4. HTTPS required for all authentication endpoints

## User Experience
1. Login should complete within 2 seconds
2. Clear error messages for failed login
3. Loading indicators during authentication`,
    },
    {
      name: 'Dashboard Analytics',
      content: `# Analytics Dashboard Requirements

## Data Visualization
1. Display key metrics (users, revenue, conversions)
2. Interactive charts (line, bar, pie)
3. Date range selector
4. Export data to CSV/PDF
5. Real-time updates

## Filters
1. Filter by date range
2. Filter by user segments
3. Filter by product categories
4. Compare time periods

## Performance
1. Dashboard should load within 2 seconds
2. Support up to 1 million data points
3. Smooth animations and transitions`,
    },
  ];

  const loadSample = (sample: typeof sampleRequirements[0]) => {
    setRequirements(sample.content);
    setProjectName(sample.name);
    showToast('Sample requirements loaded', 'success');
  };

  const parseRequirements = async () => {
    if (!requirements.trim()) {
      showToast('Please enter requirements', 'error');
      return;
    }

    setIsParsing(true);
    setResult(null);

    try {
      // Call backend NLP service
      const response = await fetch('http://localhost:3001/api/nlp/parse-requirements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          requirements,
          projectName,
        }),
      });

      if (!response.ok) {
        throw new Error('Parsing failed');
      }

      const data = await response.json();
      setResult(data.result);
      setActiveTab('testcases');
      showToast(`Generated ${data.result.testCases.length} test cases!`, 'success');

      if (onTestCasesGenerated) {
        onTestCasesGenerated(data.result.testCases);
      }
    } catch (error) {
      console.error('Parsing error:', error);
      
      // Fallback to client-side parsing
      const fallbackResult = clientSideParsing();
      setResult(fallbackResult);
      setActiveTab('testcases');
      showToast('Using client-side parsing', 'warning');
    } finally {
      setIsParsing(false);
    }
  };

  const clientSideParsing = (): ParseResult => {
    const lines = requirements.split('\n');
    const testCases: TestCase[] = [];
    let currentSection = '';

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('##')) {
        currentSection = trimmed.replace('##', '').trim();
      }

      // Detect requirements
      if (/^\d+\./.test(trimmed) || trimmed.startsWith('-')) {
        const requirement = trimmed.replace(/^\d+\.|-/, '').trim();
        
        if (requirement.length > 10) {
          const testCase: TestCase = {
            id: `tc-${Date.now()}-${idx}`,
            title: `Test: ${requirement}`,
            description: `Verify that ${requirement.toLowerCase()}`,
            priority: determinePriority(requirement),
            type: determineType(currentSection, requirement),
            steps: generateSteps(requirement),
            expectedResult: `The system should ${requirement.toLowerCase()}`,
            status: 'draft',
          };
          testCases.push(testCase);
        }
      }
    });

    // Calculate coverage
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
      confidence: 0.75,
      suggestions: [
        'Consider adding edge case scenarios',
        'Add negative test cases',
        'Include performance test cases',
      ],
    };
  };

  const determinePriority = (text: string): 'high' | 'medium' | 'low' => {
    const lower = text.toLowerCase();
    if (lower.includes('must') || lower.includes('critical') || lower.includes('security')) {
      return 'high';
    }
    if (lower.includes('should') || lower.includes('important')) {
      return 'medium';
    }
    return 'low';
  };

  const determineType = (section: string, text: string): TestCase['type'] => {
    const lower = (section + ' ' + text).toLowerCase();
    if (lower.includes('ui') || lower.includes('display') || lower.includes('show')) {
      return 'ui';
    }
    if (lower.includes('integration') || lower.includes('api')) {
      return 'integration';
    }
    if (lower.includes('end-to-end') || lower.includes('e2e') || lower.includes('flow')) {
      return 'e2e';
    }
    if (lower.includes('regression')) {
      return 'regression';
    }
    return 'functional';
  };

  const generateSteps = (requirement: string): string[] => {
    return [
      'Navigate to the relevant page',
      'Perform the required action',
      'Verify the expected outcome',
    ];
  };

  const toggleTestCase = (id: string) => {
    const newSelected = new Set(selectedTestCases);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTestCases(newSelected);
  };

  const selectAll = () => {
    if (result) {
      setSelectedTestCases(new Set(result.testCases.map(tc => tc.id)));
    }
  };

  const deselectAll = () => {
    setSelectedTestCases(new Set());
  };

  const generatePlaywrightCode = async (testCase: TestCase) => {
    try {
      const response = await fetch('http://localhost:3001/api/nlp/generate-test-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          testCase,
          language: 'typescript',
        }),
      });

      if (!response.ok) {
        throw new Error('Code generation failed');
      }

      const data = await response.json();
      
      // Update test case with generated code
      if (result) {
        const updatedTestCases = result.testCases.map(tc =>
          tc.id === testCase.id
            ? { ...tc, playwrightCode: data.code, status: 'generated' as const }
            : tc
        );
        setResult({ ...result, testCases: updatedTestCases });
        showToast('Code generated successfully', 'success');
      }
    } catch (error) {
      console.error('Code generation error:', error);
      showToast('Failed to generate code', 'error');
    }
  };

  const exportTestCases = () => {
    if (!result) return;

    const selected = result.testCases.filter(tc => selectedTestCases.has(tc.id));
    const data = {
      project: projectName,
      generatedAt: new Date().toISOString(),
      testCases: selected,
      coverage: result.coverage,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-cases-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Test cases exported', 'success');
  };

  const filteredTestCases = result?.testCases.filter(tc => {
    const typeMatch = filterType === 'all' || tc.type === filterType;
    const priorityMatch = filterPriority === 'all' || tc.priority === filterPriority;
    return typeMatch && priorityMatch;
  }) || [];

  return (
    <div className="requirements-parser">
      <div className="parser-header">
        <h2>📋 Requirements Parser</h2>
        {onClose && (
          <Button variant="ghost" size="small" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      <Tabs
        tabs={[
          { id: 'parser', label: 'Parser' },
          { id: 'testcases', label: `Test Cases (${result?.testCases.length || 0})` },
          { id: 'code', label: 'Generated Code' },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {activeTab === 'parser' && (
        <div className="parser-content">
          <div className="parser-config">
            <Input
              label="Project Name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
            />
          </div>

          <div className="parser-samples">
            <label>Sample Requirements:</label>
            <div className="sample-buttons">
              {sampleRequirements.map((sample, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="small"
                  onClick={() => loadSample(sample)}
                >
                  {sample.name}
                </Button>
              ))}
            </div>
          </div>

          <div className="requirements-input-section">
            <label>Requirements Document:</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Paste your requirements document here (Markdown, plain text, or user stories)..."
              rows={20}
              className="requirements-textarea"
            />
          </div>

          <div className="parser-actions">
            <Button
              variant="primary"
              onClick={parseRequirements}
              loading={isParsing}
              disabled={!requirements.trim()}
            >
              🔍 Parse & Generate Test Cases
            </Button>
            <Button
              variant="outline"
              onClick={() => setRequirements('')}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'testcases' && result && (
        <div className="testcases-content">
          <div className="testcases-header">
            <div className="coverage-summary">
              <h3>Test Coverage Analysis</h3>
              <div className="coverage-bars">
                <div className="coverage-item">
                  <label>Functional:</label>
                  <div className="coverage-bar">
                    <div
                      className="coverage-fill"
                      style={{ width: `${result.coverage.functional}%` }}
                    />
                  </div>
                  <span>{result.coverage.functional.toFixed(0)}%</span>
                </div>
                <div className="coverage-item">
                  <label>UI:</label>
                  <div className="coverage-bar">
                    <div
                      className="coverage-fill"
                      style={{ width: `${result.coverage.ui}%` }}
                    />
                  </div>
                  <span>{result.coverage.ui.toFixed(0)}%</span>
                </div>
                <div className="coverage-item">
                  <label>Integration:</label>
                  <div className="coverage-bar">
                    <div
                      className="coverage-fill"
                      style={{ width: `${result.coverage.integration}%` }}
                    />
                  </div>
                  <span>{result.coverage.integration.toFixed(0)}%</span>
                </div>
                <div className="coverage-item">
                  <label>E2E:</label>
                  <div className="coverage-bar">
                    <div
                      className="coverage-fill"
                      style={{ width: `${result.coverage.e2e}%` }}
                    />
                  </div>
                  <span>{result.coverage.e2e.toFixed(0)}%</span>
                </div>
              </div>
              <Badge variant="success">
                {Math.round(result.confidence * 100)}% Confidence
              </Badge>
            </div>

            <div className="testcases-actions">
              <Button variant="ghost" size="small" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="small" onClick={deselectAll}>
                Deselect All
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={exportTestCases}
                disabled={selectedTestCases.size === 0}
              >
                💾 Export Selected ({selectedTestCases.size})
              </Button>
            </div>
          </div>

          <div className="testcases-filters">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="functional">Functional</option>
              <option value="ui">UI</option>
              <option value="integration">Integration</option>
              <option value="e2e">E2E</option>
              <option value="regression">Regression</option>
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="testcases-list">
            {filteredTestCases.map((testCase) => (
              <Card key={testCase.id} variant="elevated" className="testcase-card">
                <div className="testcase-header">
                  <input
                    type="checkbox"
                    checked={selectedTestCases.has(testCase.id)}
                    onChange={() => toggleTestCase(testCase.id)}
                  />
                  <div className="testcase-title">
                    <h4>{testCase.title}</h4>
                    <div className="testcase-badges">
                      <Badge
                        variant={
                          testCase.priority === 'high'
                            ? 'error'
                            : testCase.priority === 'medium'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {testCase.priority}
                      </Badge>
                      <Badge variant="info">{testCase.type}</Badge>
                      <Badge
                        variant={
                          testCase.status === 'approved'
                            ? 'success'
                            : testCase.status === 'generated'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {testCase.status}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => generatePlaywrightCode(testCase)}
                    disabled={!!testCase.playwrightCode}
                  >
                    {testCase.playwrightCode ? '✅ Generated' : '⚡ Generate Code'}
                  </Button>
                </div>
                <p className="testcase-description">{testCase.description}</p>
                <div className="testcase-steps">
                  <strong>Steps:</strong>
                  <ol>
                    {testCase.steps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div className="testcase-expected">
                  <strong>Expected Result:</strong>
                  <p>{testCase.expectedResult}</p>
                </div>
              </Card>
            ))}
          </div>

          {result.suggestions.length > 0 && (
            <Card variant="outlined" className="suggestions-card">
              <h4>💡 Suggestions</h4>
              <ul>
                {result.suggestions.map((suggestion, idx) => (
                  <li key={idx}>{suggestion}</li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'code' && result && (
        <div className="code-content">
          {result.testCases.filter(tc => tc.playwrightCode).length === 0 ? (
            <Card variant="outlined" className="empty-state">
              <p>No code generated yet. Generate code from the Test Cases tab.</p>
              <Button
                variant="primary"
                size="small"
                onClick={() => setActiveTab('testcases')}
              >
                Go to Test Cases
              </Button>
            </Card>
          ) : (
            <div className="generated-code-list">
              {result.testCases
                .filter(tc => tc.playwrightCode)
                .map((testCase) => (
                  <Card key={testCase.id} variant="elevated" className="code-card">
                    <h4>{testCase.title}</h4>
                    <pre className="code-output">{testCase.playwrightCode}</pre>
                    <div className="code-actions">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => {
                          navigator.clipboard.writeText(testCase.playwrightCode!);
                          showToast('Code copied', 'success');
                        }}
                      >
                        📋 Copy
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </div>
      )}

      <Toast />
    </div>
  );
};
