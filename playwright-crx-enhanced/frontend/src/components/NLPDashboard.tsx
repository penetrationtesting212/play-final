/**
 * NLP Features Dashboard
 * Central hub for all Natural Language Processing features
 */

import React, { useState } from 'react';
import { GherkinConverter } from './GherkinConverter';
import { RequirementsParser } from './RequirementsParser';
import { DocumentationGenerator } from './DocumentationGenerator';
import { VoiceCommands } from './VoiceCommands';
import { Tabs } from './Tabs';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

interface NLPDashboardProps {
  scripts?: Array<{
    id: string;
    name: string;
    code: string;
    language: string;
  }>;
  onClose?: () => void;
}

export const NLPDashboard: React.FC<NLPDashboardProps> = ({ scripts = [], onClose }) => {
  const [activeFeature, setActiveFeature] = useState<'overview' | 'gherkin' | 'requirements' | 'documentation' | 'voice'>('overview');
  const [generatedCode, setGeneratedCode] = useState<string[]>([]);
  const [testCases, setTestCases] = useState<any[]>([]);

  const handleCodeGenerated = (code: string, language?: string) => {
    setGeneratedCode(prev => [...prev, code]);
    console.log('Code generated:', code);
  };

  const handleTestCasesGenerated = (cases: any[]) => {
    setTestCases(cases);
    console.log('Test cases generated:', cases);
  };

  const features = [
    {
      id: 'gherkin',
      name: 'Gherkin Converter',
      icon: '🥒',
      description: 'Convert BDD scenarios to Playwright code',
      badge: 'AI-Powered',
      features: [
        '5 languages',
        '5 frameworks',
        'Step tracking',
        'Save scenarios',
      ],
    },
    {
      id: 'requirements',
      name: 'Requirements Parser',
      icon: '📋',
      description: 'Generate test cases from requirements',
      badge: 'Smart Analysis',
      features: [
        'Auto-generate tests',
        'Coverage analysis',
        'Priority assignment',
        'Export cases',
      ],
    },
    {
      id: 'documentation',
      name: 'Doc Generator',
      icon: '📚',
      description: 'Auto-create comprehensive documentation',
      badge: 'Multi-Format',
      features: [
        '4 output formats',
        '3 templates',
        'Version control',
        'History tracking',
      ],
    },
    {
      id: 'voice',
      name: 'Voice Commands',
      icon: '🎤',
      description: 'Record tests with voice',
      badge: 'Hands-Free',
      features: [
        '6 languages',
        'Real-time',
        'Auto-execute',
        'Command history',
      ],
    },
  ];

  const stats = {
    codeGenerated: generatedCode.length,
    testCases: testCases.length,
    scriptsAvailable: scripts.length,
  };

  return (
    <div className="nlp-dashboard">
      <div className="nlp-dashboard-header">
        <div>
          <h1>🤖 NLP Features Dashboard</h1>
          <p className="subtitle">AI-Powered Test Automation Tools</p>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {activeFeature === 'overview' && (
        <div className="nlp-overview">
          {/* Stats Cards */}
          <div className="stats-grid">
            <Card variant="elevated" className="stat-card">
              <div className="stat-icon">💻</div>
              <div className="stat-value">{stats.codeGenerated}</div>
              <div className="stat-label">Code Generated</div>
            </Card>
            <Card variant="elevated" className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{stats.testCases}</div>
              <div className="stat-label">Test Cases</div>
            </Card>
            <Card variant="elevated" className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-value">{stats.scriptsAvailable}</div>
              <div className="stat-label">Scripts Available</div>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="features-section">
            <h2>Available Features</h2>
            <div className="features-grid">
              {features.map((feature) => (
                <Card
                  key={feature.id}
                  variant="elevated"
                  className="feature-card"
                  onClick={() => setActiveFeature(feature.id as any)}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-header">
                    <h3>{feature.name}</h3>
                    <Badge variant="info">{feature.badge}</Badge>
                  </div>
                  <p className="feature-description">{feature.description}</p>
                  <ul className="feature-list">
                    {feature.features.map((item, idx) => (
                      <li key={idx}>✓ {item}</li>
                    ))}
                  </ul>
                  <Button variant="primary" fullWidth>
                    Open {feature.name}
                  </Button>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Start Guide */}
          <Card variant="outlined" className="quick-start">
            <h3>🚀 Quick Start Guide</h3>
            <div className="quick-start-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>Gherkin Converter</strong>
                  <p>Write BDD scenarios and convert to Playwright code</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>Requirements Parser</strong>
                  <p>Paste requirements and get comprehensive test cases</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>Documentation Generator</strong>
                  <p>Select scripts and generate professional docs</p>
                </div>
              </div>
              <div className="step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <strong>Voice Commands</strong>
                  <p>Speak your test steps naturally</p>
                </div>
              </div>
            </div>
          </Card>

          {/* API Status */}
          <Card variant="outlined" className="api-status">
            <h3>🔌 Backend API Status</h3>
            <div className="status-row">
              <span>Backend URL:</span>
              <code>http://localhost:3001</code>
              <Badge variant="success">Connected</Badge>
            </div>
            <div className="status-row">
              <span>OpenAI Integration:</span>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="endpoints-list">
              <strong>Available Endpoints:</strong>
              <ul>
                <li>POST /api/nlp/convert-gherkin</li>
                <li>POST /api/nlp/parse-requirements</li>
                <li>POST /api/nlp/generate-test-code</li>
                <li>POST /api/nlp/generate-documentation</li>
              </ul>
            </div>
          </Card>
        </div>
      )}

      {activeFeature === 'gherkin' && (
        <div className="feature-container">
          <Button
            variant="ghost"
            onClick={() => setActiveFeature('overview')}
            className="back-button"
          >
            ← Back to Overview
          </Button>
          <GherkinConverter onCodeGenerated={handleCodeGenerated} />
        </div>
      )}

      {activeFeature === 'requirements' && (
        <div className="feature-container">
          <Button
            variant="ghost"
            onClick={() => setActiveFeature('overview')}
            className="back-button"
          >
            ← Back to Overview
          </Button>
          <RequirementsParser onTestCasesGenerated={handleTestCasesGenerated} />
        </div>
      )}

      {activeFeature === 'documentation' && (
        <div className="feature-container">
          <Button
            variant="ghost"
            onClick={() => setActiveFeature('overview')}
            className="back-button"
          >
            ← Back to Overview
          </Button>
          <DocumentationGenerator scripts={scripts} />
        </div>
      )}

      {activeFeature === 'voice' && (
        <div className="feature-container">
          <Button
            variant="ghost"
            onClick={() => setActiveFeature('overview')}
            className="back-button"
          >
            ← Back to Overview
          </Button>
          <VoiceCommands
            onCommandExecuted={(cmd) => console.log(cmd)}
            onCodeGenerated={handleCodeGenerated}
          />
        </div>
      )}

      <style>{`
        .nlp-dashboard {
          padding: 24px;
          background: var(--vscode-editor-background);
          color: var(--vscode-editor-foreground);
          min-height: 100vh;
        }

        .nlp-dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 32px;
          padding-bottom: 16px;
          border-bottom: 2px solid var(--vscode-panel-border);
        }

        .nlp-dashboard-header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }

        .subtitle {
          font-size: 16px;
          color: var(--vscode-descriptionForeground);
          margin: 0;
        }

        .nlp-overview {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .stat-card {
          padding: 24px;
          text-align: center;
          cursor: default;
        }

        .stat-icon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .stat-value {
          font-size: 36px;
          font-weight: 700;
          color: var(--vscode-textLink-activeForeground);
          margin-bottom: 8px;
        }

        .stat-label {
          font-size: 14px;
          color: var(--vscode-descriptionForeground);
          font-weight: 500;
        }

        .features-section h2 {
          font-size: 24px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .feature-card {
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }

        .feature-icon {
          font-size: 48px;
          text-align: center;
        }

        .feature-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .feature-header h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .feature-description {
          font-size: 14px;
          color: var(--vscode-descriptionForeground);
          margin: 0;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          flex: 1;
        }

        .feature-list li {
          font-size: 13px;
          padding: 6px 0;
          color: var(--vscode-foreground);
        }

        .quick-start {
          padding: 24px;
        }

        .quick-start h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 20px 0;
        }

        .quick-start-steps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .step {
          display: flex;
          gap: 16px;
        }

        .step-number {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-content strong {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .step-content p {
          font-size: 13px;
          color: var(--vscode-descriptionForeground);
          margin: 0;
        }

        .api-status {
          padding: 24px;
        }

        .api-status h3 {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px 0;
        }

        .status-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid var(--vscode-panel-border);
        }

        .status-row:last-child {
          border-bottom: none;
        }

        .status-row span {
          font-size: 14px;
          font-weight: 500;
        }

        .status-row code {
          background: var(--vscode-textCodeBlock-background);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 12px;
          flex: 1;
        }

        .endpoints-list {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--vscode-panel-border);
        }

        .endpoints-list strong {
          display: block;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
        }

        .endpoints-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .endpoints-list li {
          font-size: 12px;
          font-family: 'Consolas', 'Monaco', monospace;
          padding: 6px 0;
          color: var(--vscode-textLink-foreground);
        }

        .feature-container {
          position: relative;
        }

        .back-button {
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .stats-grid,
          .features-grid,
          .quick-start-steps {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default NLPDashboard;
