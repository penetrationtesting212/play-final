/**
 * Copyright (c) Playwright CRX
 * Apache-2.0 License
 *
 * Automatic Test Documentation Generator Component
 */

import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Tabs } from './Tabs';
import { Toast, showToast } from './Toast';
import { Badge } from './Badge';
import { Input } from './Input';

interface Documentation {
  id: string;
  title: string;
  description: string;
  sections: DocumentationSection[];
  format: 'markdown' | 'html' | 'pdf' | 'confluence';
  generatedAt: string;
  version: string;
}

interface DocumentationSection {
  type: 'overview' | 'test-cases' | 'api' | 'setup' | 'examples' | 'troubleshooting';
  title: string;
  content: string;
  subsections?: DocumentationSection[];
}

interface Script {
  id: string;
  name: string;
  code: string;
  language: string;
}

interface DocumentationGeneratorProps {
  scripts?: Script[];
  onClose?: () => void;
}

export const DocumentationGenerator: React.FC<DocumentationGeneratorProps> = ({
  scripts = [],
  onClose,
}) => {
  const [selectedScripts, setSelectedScripts] = useState<Set<string>>(new Set());
  const [documentation, setDocumentation] = useState<Documentation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'history'>('config');
  const [config, setConfig] = useState({
    title: 'Test Documentation',
    version: '1.0.0',
    author: '',
    includeOverview: true,
    includeSetup: true,
    includeExamples: true,
    includeTroubleshooting: true,
    includeAPI: false,
    format: 'markdown' as 'markdown' | 'html' | 'pdf' | 'confluence',
    template: 'standard' as 'standard' | 'detailed' | 'minimal',
  });
  const [history, setHistory] = useState<Documentation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('documentation_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const toggleScript = (id: string) => {
    const newSelected = new Set(selectedScripts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedScripts(newSelected);
  };

  const selectAll = () => {
    setSelectedScripts(new Set(scripts.map(s => s.id)));
  };

  const deselectAll = () => {
    setSelectedScripts(new Set());
  };

  const generateDocumentation = async () => {
    if (selectedScripts.size === 0 && scripts.length > 0) {
      showToast('Please select at least one script', 'error');
      return;
    }

    setIsGenerating(true);

    try {
      const selectedScriptData = scripts.filter(s => selectedScripts.has(s.id));

      const response = await fetch('http://localhost:3001/api/nlp/generate-documentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          scripts: selectedScriptData,
          config,
        }),
      });

      if (!response.ok) {
        throw new Error('Documentation generation failed');
      }

      const data = await response.json();
      setDocumentation(data.documentation);
      
      // Save to history
      const updatedHistory = [data.documentation, ...history].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem('documentation_history', JSON.stringify(updatedHistory));

      setActiveTab('preview');
      showToast('Documentation generated successfully!', 'success');
    } catch (error) {
      console.error('Documentation generation error:', error);
      
      // Fallback to client-side generation
      const fallbackDoc = generateClientSideDocumentation();
      setDocumentation(fallbackDoc);
      setActiveTab('preview');
      showToast('Using client-side generation', 'warning');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateClientSideDocumentation = (): Documentation => {
    const sections: DocumentationSection[] = [];

    if (config.includeOverview) {
      sections.push({
        type: 'overview',
        title: 'Overview',
        content: `# ${config.title}

This documentation provides comprehensive information about the test suite.

**Version:** ${config.version}
**Author:** ${config.author || 'Not specified'}
**Generated:** ${new Date().toLocaleString()}
**Test Scripts:** ${selectedScripts.size}

## Purpose

This test suite ensures the quality and reliability of the application through automated testing.`,
      });
    }

    if (config.includeSetup) {
      sections.push({
        type: 'setup',
        title: 'Setup & Installation',
        content: `## Prerequisites

- Node.js 16 or higher
- npm or yarn
- Playwright installed

## Installation

\`\`\`bash
npm install
npx playwright install
\`\`\`

## Configuration

Create a \`.env\` file:

\`\`\`env
BASE_URL=https://example.com
TIMEOUT=30000
\`\`\``,
      });
    }

    const selectedScriptData = scripts.filter(s => selectedScripts.has(s.id));
    if (selectedScriptData.length > 0) {
      const testCaseContent = selectedScriptData.map((script, idx) => `
### Test Case ${idx + 1}: ${script.name}

**Language:** ${script.language}

\`\`\`${script.language}
${script.code}
\`\`\`

**Purpose:** Automated test for ${script.name}
**Status:** Active
`).join('\n\n');

      sections.push({
        type: 'test-cases',
        title: 'Test Cases',
        content: `## Test Cases\n\n${testCaseContent}`,
      });
    }

    if (config.includeExamples) {
      sections.push({
        type: 'examples',
        title: 'Examples',
        content: `## Usage Examples

### Running Tests

\`\`\`bash
# Run all tests
npx playwright test

# Run specific test
npx playwright test ${selectedScriptData[0]?.name || 'test.spec.ts'}

# Run in headed mode
npx playwright test --headed

# Run with debugging
npx playwright test --debug
\`\`\`

### Viewing Reports

\`\`\`bash
npx playwright show-report
\`\`\``,
      });
    }

    if (config.includeTroubleshooting) {
      sections.push({
        type: 'troubleshooting',
        title: 'Troubleshooting',
        content: `## Troubleshooting

### Common Issues

**Issue: Tests timing out**
- Increase timeout in configuration
- Check network connectivity
- Verify selectors are correct

**Issue: Element not found**
- Wait for element to be visible
- Use correct locator strategies
- Check for dynamic content

**Issue: Flaky tests**
- Add explicit waits
- Use stable selectors
- Avoid hardcoded delays`,
      });
    }

    return {
      id: Date.now().toString(),
      title: config.title,
      description: `Generated documentation for ${selectedScripts.size} test scripts`,
      sections,
      format: config.format,
      generatedAt: new Date().toISOString(),
      version: config.version,
    };
  };

  const exportDocumentation = () => {
    if (!documentation) return;

    const content = formatDocumentation(documentation);
    
    let blob: Blob;
    let filename: string;

    switch (documentation.format) {
      case 'markdown':
        blob = new Blob([content], { type: 'text/markdown' });
        filename = `${config.title.replace(/\s+/g, '-')}.md`;
        break;
      case 'html':
        const html = markdownToHTML(content);
        blob = new Blob([html], { type: 'text/html' });
        filename = `${config.title.replace(/\s+/g, '-')}.html`;
        break;
      case 'pdf':
        // For PDF, we'd need a backend service or library
        showToast('PDF export requires backend service', 'warning');
        return;
      case 'confluence':
        blob = new Blob([content], { type: 'text/plain' });
        filename = `${config.title.replace(/\s+/g, '-')}-confluence.txt`;
        break;
      default:
        blob = new Blob([content], { type: 'text/plain' });
        filename = 'documentation.txt';
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Documentation exported as ${filename}`, 'success');
  };

  const formatDocumentation = (doc: Documentation): string => {
    return doc.sections.map(section => section.content).join('\n\n---\n\n');
  };

  const markdownToHTML = (markdown: string): string => {
    // Simple markdown to HTML converter
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    h2 { color: #666; margin-top: 30px; }
    h3 { color: #888; }
  </style>
</head>
<body>
`;

    html += markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>');

    html += `
</body>
</html>`;

    return html;
  };

  const copyToClipboard = () => {
    if (documentation) {
      const content = formatDocumentation(documentation);
      navigator.clipboard.writeText(content);
      showToast('Documentation copied to clipboard', 'success');
    }
  };

  const loadFromHistory = (doc: Documentation) => {
    setDocumentation(doc);
    setActiveTab('preview');
    showToast('Documentation loaded from history', 'success');
  };

  const deleteFromHistory = (id: string) => {
    const updated = history.filter(doc => doc.id !== id);
    setHistory(updated);
    localStorage.setItem('documentation_history', JSON.stringify(updated));
    showToast('Documentation deleted', 'success');
  };

  return (
    <div className="documentation-generator">
      <div className="generator-header">
        <h2>📚 Documentation Generator</h2>
        {onClose && (
          <Button variant="ghost" size="small" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      <Tabs
        tabs={[
          { id: 'config', label: 'Configuration' },
          { id: 'preview', label: 'Preview' },
          { id: 'history', label: `History (${history.length})` },
        ]}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as any)}
      />

      {activeTab === 'config' && (
        <div className="config-content">
          <Card variant="outlined" className="config-section">
            <h3>General Settings</h3>
            <Input
              label="Document Title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Enter document title"
            />
            <Input
              label="Version"
              value={config.version}
              onChange={(e) => setConfig({ ...config, version: e.target.value })}
              placeholder="1.0.0"
            />
            <Input
              label="Author"
              value={config.author}
              onChange={(e) => setConfig({ ...config, author: e.target.value })}
              placeholder="Your name"
            />
          </Card>

          <Card variant="outlined" className="config-section">
            <h3>Format & Template</h3>
            <div className="config-group">
              <label>Output Format:</label>
              <select
                value={config.format}
                onChange={(e) => setConfig({ ...config, format: e.target.value as any })}
                className="config-select"
              >
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
                <option value="pdf">PDF</option>
                <option value="confluence">Confluence</option>
              </select>
            </div>
            <div className="config-group">
              <label>Template:</label>
              <select
                value={config.template}
                onChange={(e) => setConfig({ ...config, template: e.target.value as any })}
                className="config-select"
              >
                <option value="standard">Standard</option>
                <option value="detailed">Detailed</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
          </Card>

          <Card variant="outlined" className="config-section">
            <h3>Include Sections</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.includeOverview}
                onChange={(e) => setConfig({ ...config, includeOverview: e.target.checked })}
              />
              Overview
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.includeSetup}
                onChange={(e) => setConfig({ ...config, includeSetup: e.target.checked })}
              />
              Setup & Installation
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.includeExamples}
                onChange={(e) => setConfig({ ...config, includeExamples: e.target.checked })}
              />
              Usage Examples
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.includeTroubleshooting}
                onChange={(e) => setConfig({ ...config, includeTroubleshooting: e.target.checked })}
              />
              Troubleshooting
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.includeAPI}
                onChange={(e) => setConfig({ ...config, includeAPI: e.target.checked })}
              />
              API Reference
            </label>
          </Card>

          {scripts.length > 0 && (
            <Card variant="outlined" className="config-section">
              <div className="section-header">
                <h3>Select Test Scripts ({selectedScripts.size}/{scripts.length})</h3>
                <div>
                  <Button variant="ghost" size="small" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="small" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="scripts-list">
                {scripts.map((script) => (
                  <label key={script.id} className="script-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedScripts.has(script.id)}
                      onChange={() => toggleScript(script.id)}
                    />
                    <span>{script.name}</span>
                    <Badge variant="info">{script.language}</Badge>
                  </label>
                ))}
              </div>
            </Card>
          )}

          <div className="generator-actions">
            <Button
              variant="primary"
              onClick={generateDocumentation}
              loading={isGenerating}
            >
              📝 Generate Documentation
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'preview' && (
        <div className="preview-content">
          {!documentation ? (
            <Card variant="outlined" className="empty-state">
              <p>No documentation generated yet</p>
              <Button
                variant="primary"
                size="small"
                onClick={() => setActiveTab('config')}
              >
                Configure & Generate
              </Button>
            </Card>
          ) : (
            <>
              <div className="preview-header">
                <div>
                  <h3>{documentation.title}</h3>
                  <div className="preview-meta">
                    <Badge variant="info">v{documentation.version}</Badge>
                    <Badge variant="info">{documentation.format}</Badge>
                    <span>{new Date(documentation.generatedAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="preview-actions">
                  <Button variant="ghost" size="small" onClick={copyToClipboard}>
                    📋 Copy
                  </Button>
                  <Button variant="primary" size="small" onClick={exportDocumentation}>
                    💾 Export
                  </Button>
                </div>
              </div>

              <Card variant="outlined" className="documentation-preview">
                {documentation.sections.map((section, idx) => (
                  <div key={idx} className="doc-section">
                    <pre>{section.content}</pre>
                  </div>
                ))}
              </Card>
            </>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-content">
          {history.length === 0 ? (
            <Card variant="outlined" className="empty-state">
              <p>No documentation history</p>
              <Button
                variant="primary"
                size="small"
                onClick={() => setActiveTab('config')}
              >
                Generate First Document
              </Button>
            </Card>
          ) : (
            <div className="history-list">
              {history.map((doc) => (
                <Card key={doc.id} variant="elevated" className="history-card">
                  <div className="history-header">
                    <div>
                      <h4>{doc.title}</h4>
                      <div className="history-meta">
                        <Badge variant="info">v{doc.version}</Badge>
                        <Badge variant="info">{doc.format}</Badge>
                        <span>{new Date(doc.generatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="history-actions">
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => loadFromHistory(doc)}
                      >
                        👁️ View
                      </Button>
                      <Button
                        variant="ghost"
                        size="small"
                        onClick={() => deleteFromHistory(doc.id)}
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                  <p>{doc.description}</p>
                  <div className="sections-summary">
                    {doc.sections.length} sections
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
