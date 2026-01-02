/**
 * Copyright (c) Playwright CRX
 * Apache-2.0 License
 *
 * Gherkin/BDD to Playwright Code Converter Component
 */

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Tabs } from './Tabs';
import { Toast, showToast } from './Toast';
import { Badge } from './Badge';

interface ConversionResult {
  playwrightCode: string;
  language: 'typescript' | 'javascript' | 'python' | 'java' | 'csharp';
  testFramework: 'playwright' | 'jest' | 'mocha' | 'pytest' | 'junit';
  confidence: number;
  steps: Array<{
    gherkin: string;
    playwright: string;
    status: 'success' | 'warning' | 'error';
    message?: string;
  }>;
}

interface GherkinConverterProps {
  onCodeGenerated?: (code: string, language: string) => void;
  onClose?: () => void;
}

export const GherkinConverter: React.FC<GherkinConverterProps> = ({
  onCodeGenerated,
  onClose,
}) => {
  const [gherkinInput, setGherkinInput] = useState<string>('');
  const [result, setResult] = useState<ConversionResult | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'javascript' | 'python' | 'java' | 'csharp'>('typescript');
  const [selectedFramework, setSelectedFramework] = useState<'playwright' | 'jest' | 'mocha' | 'pytest' | 'junit'>('playwright');
  const [savedScenarios, setSavedScenarios] = useState<Array<{
    id: string;
    name: string;
    content: string;
    createdAt: string;
  }>>([]);
  const [activeTab, setActiveTab] = useState<'converter' | 'saved'>('converter');

  // Load saved scenarios from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gherkin_scenarios');
    if (saved) {
      setSavedScenarios(JSON.parse(saved));
    }
  }, []);

  // Sample Gherkin scenarios
  const sampleScenarios = [
    {
      name: 'Login Flow',
      content: `Feature: User Login
  As a user
  I want to login to the application
  So that I can access my account

Scenario: Successful login with valid credentials
  Given I am on the login page
  When I enter "user@example.com" in the email field
  And I enter "password123" in the password field
  And I click the "Login" button
  Then I should see the dashboard
  And I should see "Welcome back" message`,
    },
    {
      name: 'Shopping Cart',
      content: `Feature: Shopping Cart
  As a customer
  I want to manage my shopping cart
  So that I can purchase items

Scenario: Add product to cart
  Given I am on the products page
  When I click on "Product A"
  And I click the "Add to Cart" button
  Then the cart count should increase to 1
  And I should see "Product added" notification`,
    },
    {
      name: 'Form Validation',
      content: `Feature: Contact Form
  As a visitor
  I want to submit a contact form
  So that I can reach customer support

Scenario: Submit form with invalid email
  Given I am on the contact page
  When I enter "John Doe" in the name field
  And I enter "invalid-email" in the email field
  And I enter "Help needed" in the message field
  And I click the "Submit" button
  Then I should see "Invalid email address" error
  And the form should not be submitted`,
    },
  ];

  const loadSample = (sample: typeof sampleScenarios[0]) => {
    setGherkinInput(sample.content);
    showToast('Sample scenario loaded', 'success');
  };

  const convertGherkin = async () => {
    if (!gherkinInput.trim()) {
      showToast('Please enter Gherkin scenario', 'error');
      return;
    }

    setIsConverting(true);
    setResult(null);

    try {
      // Call backend NLP service
      const response = await fetch('http://localhost:3001/api/nlp/convert-gherkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          gherkin: gherkinInput,
          language: selectedLanguage,
          framework: selectedFramework,
        }),
      });

      if (!response.ok) {
        throw new Error('Conversion failed');
      }

      const data = await response.json();
      setResult(data.result);
      showToast('Conversion successful!', 'success');

      if (onCodeGenerated) {
        onCodeGenerated(data.result.playwrightCode, selectedLanguage);
      }
    } catch (error) {
      console.error('Conversion error:', error);
      
      // Fallback to client-side conversion
      const fallbackResult = clientSideConversion();
      setResult(fallbackResult);
      showToast('Using client-side conversion', 'warning');
    } finally {
      setIsConverting(false);
    }
  };

  const clientSideConversion = (): ConversionResult => {
    // Simple client-side conversion as fallback
    const lines = gherkinInput.split('\n');
    let playwrightCode = '';
    const steps: ConversionResult['steps'] = [];

    // TypeScript template
    if (selectedLanguage === 'typescript') {
      playwrightCode = `import { test, expect } from '@playwright/test';\n\n`;
      
      // Extract feature and scenario
      let featureName = 'Test';
      let scenarioName = 'Test Scenario';
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('Feature:')) {
          featureName = trimmed.replace('Feature:', '').trim();
        } else if (trimmed.startsWith('Scenario:')) {
          scenarioName = trimmed.replace('Scenario:', '').trim();
        }
      });

      playwrightCode += `test.describe('${featureName}', () => {\n`;
      playwrightCode += `  test('${scenarioName}', async ({ page }) => {\n`;

      lines.forEach(line => {
        const trimmed = line.trim();
        let stepCode = '';
        let status: 'success' | 'warning' | 'error' = 'success';

        if (trimmed.startsWith('Given I am on')) {
          const url = extractQuotedText(trimmed) || 'homepage';
          stepCode = `    await page.goto('https://example.com/${url}');`;
          steps.push({ gherkin: trimmed, playwright: stepCode, status });
        } else if (trimmed.startsWith('When I enter')) {
          const text = extractQuotedText(trimmed);
          const field = extractFieldName(trimmed);
          stepCode = `    await page.fill('[name="${field}"]', '${text}');`;
          steps.push({ gherkin: trimmed, playwright: stepCode, status });
        } else if (trimmed.startsWith('And I click')) {
          const button = extractQuotedText(trimmed);
          stepCode = `    await page.click('button:has-text("${button}")');`;
          steps.push({ gherkin: trimmed, playwright: stepCode, status });
        } else if (trimmed.startsWith('Then I should see')) {
          const text = extractQuotedText(trimmed);
          stepCode = `    await expect(page.locator('text=${text}')).toBeVisible();`;
          steps.push({ gherkin: trimmed, playwright: stepCode, status });
        }

        if (stepCode) {
          playwrightCode += stepCode + '\n';
        }
      });

      playwrightCode += `  });\n});\n`;
    }

    return {
      playwrightCode,
      language: selectedLanguage,
      testFramework: selectedFramework,
      confidence: 0.85,
      steps,
    };
  };

  const extractQuotedText = (line: string): string => {
    const match = line.match(/"([^"]*)"/);
    return match ? match[1] : '';
  };

  const extractFieldName = (line: string): string => {
    const lower = line.toLowerCase();
    if (lower.includes('email')) return 'email';
    if (lower.includes('password')) return 'password';
    if (lower.includes('name')) return 'name';
    if (lower.includes('message')) return 'message';
    return 'input';
  };

  const saveScenario = () => {
    if (!gherkinInput.trim()) {
      showToast('No scenario to save', 'error');
      return;
    }

    const name = prompt('Enter scenario name:');
    if (!name) return;

    const newScenario = {
      id: Date.now().toString(),
      name,
      content: gherkinInput,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedScenarios, newScenario];
    setSavedScenarios(updated);
    localStorage.setItem('gherkin_scenarios', JSON.stringify(updated));
    showToast('Scenario saved!', 'success');
  };

  const loadScenario = (scenario: typeof savedScenarios[0]) => {
    setGherkinInput(scenario.content);
    setActiveTab('converter');
    showToast('Scenario loaded', 'success');
  };

  const deleteScenario = (id: string) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem('gherkin_scenarios', JSON.stringify(updated));
    showToast('Scenario deleted', 'success');
  };

  const copyCode = () => {
    if (result) {
      navigator.clipboard.writeText(result.playwrightCode);
      showToast('Code copied to clipboard', 'success');
    }
  };

  const downloadCode = () => {
    if (result) {
      const extensions: Record<string, string> = {
        typescript: '.spec.ts',
        javascript: '.spec.js',
        python: '.py',
        java: '.java',
        csharp: '.cs',
      };
      const filename = `test${extensions[result.language]}`;
      const blob = new Blob([result.playwrightCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Code downloaded', 'success');
    }
  };

  return (
    <div className="gherkin-converter">
      <div className="gherkin-header">
        <h2>🥒 Gherkin/BDD Converter</h2>
        {onClose && (
          <Button variant="ghost" size="small" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      <Tabs
        tabs={[
          { id: 'converter', label: 'Converter' },
          { id: 'saved', label: `Saved (${savedScenarios.length})` },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as 'converter' | 'saved')}
      />

      {activeTab === 'converter' && (
        <div className="gherkin-converter-content">
          <div className="gherkin-config">
            <div className="config-group">
              <label>Language:</label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="config-select"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
              </select>
            </div>
            <div className="config-group">
              <label>Framework:</label>
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value as any)}
                className="config-select"
              >
                <option value="playwright">Playwright</option>
                <option value="jest">Jest</option>
                <option value="mocha">Mocha</option>
                <option value="pytest">Pytest</option>
                <option value="junit">JUnit</option>
              </select>
            </div>
          </div>

          <div className="gherkin-samples">
            <label>Sample Scenarios:</label>
            <div className="sample-buttons">
              {sampleScenarios.map((sample, idx) => (
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

          <div className="gherkin-input-section">
            <div className="section-header">
              <label>Gherkin/BDD Scenario:</label>
              <div className="input-actions">
                <Button variant="ghost" size="small" onClick={saveScenario}>
                  💾 Save
                </Button>
                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => setGherkinInput('')}
                >
                  🗑️ Clear
                </Button>
              </div>
            </div>
            <textarea
              value={gherkinInput}
              onChange={(e) => setGherkinInput(e.target.value)}
              placeholder="Feature: User Authentication&#10;  As a user&#10;  I want to login&#10;  So that I can access my account&#10;&#10;Scenario: Successful login&#10;  Given I am on the login page&#10;  When I enter 'user@example.com' in the email field&#10;  And I enter 'password123' in the password field&#10;  And I click the 'Login' button&#10;  Then I should see the dashboard"
              rows={15}
              className="gherkin-textarea"
            />
          </div>

          <div className="gherkin-actions">
            <Button
              variant="primary"
              onClick={convertGherkin}
              loading={isConverting}
              disabled={!gherkinInput.trim()}
            >
              🔄 Convert to Playwright
            </Button>
          </div>

          {result && (
            <div className="conversion-result">
              <div className="result-header">
                <div>
                  <h3>Generated Playwright Code</h3>
                  <div className="result-meta">
                    <Badge variant="success">
                      {Math.round(result.confidence * 100)}% Confidence
                    </Badge>
                    <Badge variant="info">{result.language}</Badge>
                    <Badge variant="info">{result.testFramework}</Badge>
                  </div>
                </div>
                <div className="result-actions">
                  <Button variant="ghost" size="small" onClick={copyCode}>
                    📋 Copy
                  </Button>
                  <Button variant="ghost" size="small" onClick={downloadCode}>
                    💾 Download
                  </Button>
                </div>
              </div>

              <pre className="code-output">{result.playwrightCode}</pre>

              {result.steps.length > 0 && (
                <div className="conversion-steps">
                  <h4>Conversion Steps:</h4>
                  {result.steps.map((step, idx) => (
                    <Card key={idx} variant="outlined" className="step-card">
                      <div className="step-status">
                        {step.status === 'success' && '✅'}
                        {step.status === 'warning' && '⚠️'}
                        {step.status === 'error' && '❌'}
                      </div>
                      <div className="step-content">
                        <div className="step-gherkin">{step.gherkin}</div>
                        <div className="step-arrow">→</div>
                        <div className="step-playwright">
                          <code>{step.playwright}</code>
                        </div>
                        {step.message && (
                          <div className="step-message">{step.message}</div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="saved-scenarios">
          {savedScenarios.length === 0 ? (
            <Card variant="outlined" className="empty-state">
              <p>No saved scenarios yet</p>
              <Button
                variant="primary"
                size="small"
                onClick={() => setActiveTab('converter')}
              >
                Create New Scenario
              </Button>
            </Card>
          ) : (
            <div className="scenarios-list">
              {savedScenarios.map((scenario) => (
                <Card key={scenario.id} variant="elevated" className="scenario-card">
                  <div className="scenario-header">
                    <h4>{scenario.name}</h4>
                    <div className="scenario-actions">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => loadScenario(scenario)}
                      >
                        📂 Load
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => deleteScenario(scenario.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                  <div className="scenario-meta">
                    {new Date(scenario.createdAt).toLocaleDateString()}
                  </div>
                  <pre className="scenario-preview">
                    {scenario.content.slice(0, 200)}
                    {scenario.content.length > 200 && '...'}
                  </pre>
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
