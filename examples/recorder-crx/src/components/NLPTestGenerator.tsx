/**
 * Natural Language Processing Test Generator
 * Complete NLP interface for test generation with voice commands
 */

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';
import { Button } from './Button';
import { Tabs, TabPanel } from './Tabs';
import { Textarea, Select } from './Input';
import { Badge } from './Badge';
import { useToast } from './Toast';
import { Modal, ModalFooter } from './Modal';

interface GeneratedTest {
  id: string;
  input: string;
  output: string;
  language: string;
  type: 'gherkin' | 'requirement' | 'voice';
  timestamp: Date;
}

interface VoiceCommand {
  transcript: string;
  confidence: number;
  action: string;
}

export const NLPTestGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('gherkin');
  const { showToast } = useToast();

  // Gherkin state
  const [gherkinInput, setGherkinInput] = React.useState('');
  const [gherkinOutput, setGherkinOutput] = React.useState('');
  const [isConverting, setIsConverting] = React.useState(false);

  // Requirements state
  const [requirementInput, setRequirementInput] = React.useState('');
  const [requirementOutput, setRequirementOutput] = React.useState('');
  const [isParsing, setIsParsing] = React.useState(false);

  // Voice state
  const [isListening, setIsListening] = React.useState(false);
  const [voiceTranscript, setVoiceTranscript] = React.useState('');
  const [voiceCommands, setVoiceCommands] = React.useState<VoiceCommand[]>([]);
  const [voiceOutput, setVoiceOutput] = React.useState('');
  const recognitionRef = React.useRef<any>(null);

  // Documentation state
  const [docCode, setDocCode] = React.useState('');
  const [generatedDoc, setGeneratedDoc] = React.useState('');
  const [isGeneratingDoc, setIsGeneratingDoc] = React.useState(false);

  // History state
  const [testHistory, setTestHistory] = React.useState<GeneratedTest[]>([]);
  const [showHistory, setShowHistory] = React.useState(false);

  // Language selection
  const [targetLanguage, setTargetLanguage] = React.useState('playwright-test');

  const tabs = [
    { id: 'gherkin', label: 'Gherkin/BDD', icon: '🥒' },
    { id: 'requirements', label: 'Requirements', icon: '📋' },
    { id: 'voice', label: 'Voice Commands', icon: '🎤' },
    { id: 'documentation', label: 'Auto Docs', icon: '📝' },
  ];

  const languageOptions = [
    { value: 'playwright-test', label: 'Playwright Test (TypeScript)' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python-pytest', label: 'Python (Pytest)' },
    { value: 'java-junit', label: 'Java (JUnit)' },
    { value: 'csharp-nunit', label: 'C# (NUnit)' },
  ];

  // ===== Gherkin Conversion =====
  const handleConvertGherkin = async () => {
    if (!gherkinInput.trim()) {
      showToast({ type: 'warning', message: 'Please enter Gherkin scenario' });
      return;
    }

    setIsConverting(true);
    try {
      const response = await fetch('/api/nlp/convert-gherkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gherkin: gherkinInput,
          language: targetLanguage,
        }),
      });

      if (!response.ok) throw new Error('Conversion failed');

      const result = await response.json();
      setGherkinOutput(result.code);

      // Add to history
      addToHistory({
        id: Date.now().toString(),
        input: gherkinInput,
        output: result.code,
        language: targetLanguage,
        type: 'gherkin',
        timestamp: new Date(),
      });

      showToast({
        type: 'success',
        message: 'Gherkin converted successfully!',
        duration: 3000,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Conversion failed',
        description: error.message,
      });
    } finally {
      setIsConverting(false);
    }
  };

  // ===== Requirements Parsing =====
  const handleParseRequirements = async () => {
    if (!requirementInput.trim()) {
      showToast({ type: 'warning', message: 'Please enter requirements' });
      return;
    }

    setIsParsing(true);
    try {
      const response = await fetch('/api/nlp/parse-requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requirements: requirementInput,
          language: targetLanguage,
        }),
      });

      if (!response.ok) throw new Error('Parsing failed');

      const result = await response.json();
      setRequirementOutput(result.testCases);

      addToHistory({
        id: Date.now().toString(),
        input: requirementInput,
        output: result.testCases,
        language: targetLanguage,
        type: 'requirement',
        timestamp: new Date(),
      });

      showToast({
        type: 'success',
        message: 'Requirements parsed successfully!',
        duration: 3000,
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Parsing failed',
        description: error.message,
      });
    } finally {
      setIsParsing(false);
    }
  };

  // ===== Voice Commands =====
  const initializeVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast({
        type: 'error',
        message: 'Speech recognition not supported',
        description: 'Please use Chrome or Edge browser',
      });
      return false;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          
          // Add to commands
          const command: VoiceCommand = {
            transcript: transcript,
            confidence: event.results[i][0].confidence,
            action: detectAction(transcript),
          };
          setVoiceCommands(prev => [...prev, command]);
        } else {
          interimTranscript += transcript;
        }
      }

      setVoiceTranscript(finalTranscript || interimTranscript);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      showToast({
        type: 'error',
        message: 'Voice recognition error',
        description: event.error,
      });
    };

    recognitionRef.current.onend = () => {
      if (isListening) {
        recognitionRef.current.start();
      }
    };

    return true;
  };

  const toggleVoiceRecording = () => {
    if (!isListening) {
      if (!recognitionRef.current) {
        if (!initializeVoiceRecognition()) return;
      }
      recognitionRef.current.start();
      setIsListening(true);
      showToast({
        type: 'info',
        message: 'Listening...',
        description: 'Speak your test commands',
      });
    } else {
      recognitionRef.current.stop();
      setIsListening(false);
      showToast({
        type: 'info',
        message: 'Stopped listening',
      });
    }
  };

  const detectAction = (transcript: string): string => {
    const lower = transcript.toLowerCase();
    if (lower.includes('click') || lower.includes('tap')) return 'click';
    if (lower.includes('type') || lower.includes('enter')) return 'type';
    if (lower.includes('navigate') || lower.includes('go to')) return 'navigate';
    if (lower.includes('wait') || lower.includes('pause')) return 'wait';
    if (lower.includes('assert') || lower.includes('check') || lower.includes('verify')) return 'assert';
    return 'unknown';
  };

  const convertVoiceToCode = async () => {
    if (voiceCommands.length === 0) {
      showToast({ type: 'warning', message: 'No voice commands recorded' });
      return;
    }

    try {
      const response = await fetch('/api/nlp/voice-to-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commands: voiceCommands,
          language: targetLanguage,
        }),
      });

      if (!response.ok) throw new Error('Conversion failed');

      const result = await response.json();
      setVoiceOutput(result.code);

      addToHistory({
        id: Date.now().toString(),
        input: voiceCommands.map(c => c.transcript).join('\n'),
        output: result.code,
        language: targetLanguage,
        type: 'voice',
        timestamp: new Date(),
      });

      showToast({
        type: 'success',
        message: 'Voice commands converted!',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Conversion failed',
        description: error.message,
      });
    }
  };

  const clearVoiceCommands = () => {
    setVoiceCommands([]);
    setVoiceTranscript('');
    setVoiceOutput('');
  };

  // ===== Documentation Generation =====
  const handleGenerateDocumentation = async () => {
    if (!docCode.trim()) {
      showToast({ type: 'warning', message: 'Please enter test code' });
      return;
    }

    setIsGeneratingDoc(true);
    try {
      const response = await fetch('/api/nlp/generate-documentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: docCode,
          language: targetLanguage,
        }),
      });

      if (!response.ok) throw new Error('Generation failed');

      const result = await response.json();
      setGeneratedDoc(result.documentation);

      showToast({
        type: 'success',
        message: 'Documentation generated!',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        message: 'Generation failed',
        description: error.message,
      });
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  // ===== History Management =====
  const addToHistory = (test: GeneratedTest) => {
    setTestHistory(prev => [test, ...prev].slice(0, 20)); // Keep last 20
  };

  const loadFromHistory = (test: GeneratedTest) => {
    switch (test.type) {
      case 'gherkin':
        setActiveTab('gherkin');
        setGherkinInput(test.input);
        setGherkinOutput(test.output);
        break;
      case 'requirement':
        setActiveTab('requirements');
        setRequirementInput(test.input);
        setRequirementOutput(test.output);
        break;
      case 'voice':
        setActiveTab('voice');
        setVoiceOutput(test.output);
        break;
    }
    setShowHistory(false);
  };

  // ===== Sample Data =====
  const loadGherkinSample = () => {
    setGherkinInput(`Feature: User Login
  As a user
  I want to log into the application
  So that I can access my account

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter "user@example.com" in the email field
    And I enter "password123" in the password field
    And I click the "Login" button
    Then I should see the dashboard
    And I should see "Welcome back!" message`);
  };

  const loadRequirementsSample = () => {
    setRequirementInput(`User Story: As a customer, I want to add items to my shopping cart so that I can purchase them later.

Acceptance Criteria:
1. User can click "Add to Cart" button on product page
2. Cart icon shows updated item count
3. User can view cart contents
4. Cart persists across sessions
5. User can remove items from cart
6. Total price is calculated correctly`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>💬</span>
            Natural Language Test Generator
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Convert natural language, Gherkin, and voice commands to Playwright tests
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowHistory(true)}
          >
            📚 History ({testHistory.length})
          </Button>
          <Select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            options={languageOptions}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Gherkin/BDD Tab */}
      <TabPanel activeTab={activeTab} tabId="gherkin">
        <div className="grid grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gherkin Scenario</CardTitle>
                <Button size="sm" variant="ghost" onClick={loadGherkinSample}>
                  Load Sample
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={gherkinInput}
                onChange={(e) => setGherkinInput(e.target.value)}
                rows={20}
                placeholder="Enter Gherkin/BDD scenario..."
                isFullWidth
              />
              <Button
                onClick={handleConvertGherkin}
                isLoading={isConverting}
                isFullWidth
                className="mt-4"
              >
                Convert to {languageOptions.find(l => l.value === targetLanguage)?.label}
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Test Code</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-[var(--color-surface)] p-4 rounded-md overflow-auto text-sm h-[500px]">
                <code>{gherkinOutput || '// Converted code will appear here...'}</code>
              </pre>
              {gherkinOutput && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    navigator.clipboard.writeText(gherkinOutput);
                    showToast({ type: 'success', message: 'Copied to clipboard!' });
                  }}
                >
                  📋 Copy Code
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* Requirements Tab */}
      <TabPanel activeTab={activeTab} tabId="requirements">
        <div className="grid grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Requirements</CardTitle>
                <Button size="sm" variant="ghost" onClick={loadRequirementsSample}>
                  Load Sample
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                rows={20}
                placeholder="Enter user stories, acceptance criteria, or requirements..."
                isFullWidth
              />
              <Button
                onClick={handleParseRequirements}
                isLoading={isParsing}
                isFullWidth
                className="mt-4"
              >
                Generate Test Cases
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Test Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-[var(--color-surface)] p-4 rounded-md overflow-auto text-sm h-[500px]">
                <code>{requirementOutput || '// Test cases will appear here...'}</code>
              </pre>
              {requirementOutput && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    navigator.clipboard.writeText(requirementOutput);
                    showToast({ type: 'success', message: 'Copied to clipboard!' });
                  }}
                >
                  📋 Copy Code
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* Voice Commands Tab */}
      <TabPanel activeTab={activeTab} tabId="voice">
        <div className="space-y-6">
          {/* Voice Control */}
          <Card variant="elevated">
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={toggleVoiceRecording}
                    variant={isListening ? 'danger' : 'primary'}
                    size="lg"
                    leftIcon={<span className={isListening ? 'animate-pulse' : ''}>🎤</span>}
                  >
                    {isListening ? 'Stop Recording' : 'Start Voice Recording'}
                  </Button>
                  {isListening && (
                    <Badge variant="danger" dot pulse>
                      Recording...
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={clearVoiceCommands}>
                    Clear All
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={convertVoiceToCode}
                    disabled={voiceCommands.length === 0}
                  >
                    Convert to Code
                  </Button>
                </div>
              </div>

              {/* Live Transcript */}
              {voiceTranscript && (
                <div className="mt-4 p-4 bg-[var(--color-surface)] rounded-md">
                  <p className="text-sm font-medium mb-2">Live Transcript:</p>
                  <p className="text-[var(--color-text-secondary)]">{voiceTranscript}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-6">
            {/* Commands List */}
            <Card>
              <CardHeader>
                <CardTitle>Recorded Commands ({voiceCommands.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {voiceCommands.length === 0 ? (
                    <div className="text-center py-8 text-[var(--color-text-secondary)]">
                      <p>No commands recorded yet</p>
                      <p className="text-sm mt-2">Click "Start Voice Recording" and speak</p>
                    </div>
                  ) : (
                    voiceCommands.map((cmd, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-[var(--color-surface)] rounded-md border border-[var(--color-border)]"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="primary" size="sm">
                            {cmd.action}
                          </Badge>
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {Math.round(cmd.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm">{cmd.transcript}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generated Code */}
            <Card>
              <CardHeader>
                <CardTitle>Generated Code</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-[var(--color-surface)] p-4 rounded-md overflow-auto text-sm h-[400px]">
                  <code>{voiceOutput || '// Voice-generated code will appear here...'}</code>
                </pre>
                {voiceOutput && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-4"
                    onClick={() => {
                      navigator.clipboard.writeText(voiceOutput);
                      showToast({ type: 'success', message: 'Copied to clipboard!' });
                    }}
                  >
                    📋 Copy Code
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Voice Commands Help */}
          <Card variant="outlined">
            <CardHeader>
              <CardTitle>Voice Command Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="font-medium mb-2">Navigation:</p>
                  <ul className="space-y-1 text-[var(--color-text-secondary)]">
                    <li>• "Navigate to login page"</li>
                    <li>• "Go to dashboard"</li>
                    <li>• "Open settings"</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">Interactions:</p>
                  <ul className="space-y-1 text-[var(--color-text-secondary)]">
                    <li>• "Click login button"</li>
                    <li>• "Type email address"</li>
                    <li>• "Enter password"</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-2">Assertions:</p>
                  <ul className="space-y-1 text-[var(--color-text-secondary)]">
                    <li>• "Check page title"</li>
                    <li>• "Verify error message"</li>
                    <li>• "Assert button is visible"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* Documentation Tab */}
      <TabPanel activeTab={activeTab} tabId="documentation">
        <div className="grid grid-cols-2 gap-6">
          {/* Input */}
          <Card>
            <CardHeader>
              <CardTitle>Test Code</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={docCode}
                onChange={(e) => setDocCode(e.target.value)}
                rows={20}
                placeholder="Paste your test code here..."
                isFullWidth
              />
              <Button
                onClick={handleGenerateDocumentation}
                isLoading={isGeneratingDoc}
                isFullWidth
                className="mt-4"
              >
                Generate Documentation
              </Button>
            </CardContent>
          </Card>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle>Generated Documentation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-[var(--color-surface)] p-4 rounded-md overflow-auto h-[500px]">
                {generatedDoc ? (
                  <div dangerouslySetInnerHTML={{ __html: generatedDoc }} />
                ) : (
                  <p className="text-[var(--color-text-secondary)]">
                    Documentation will appear here...
                  </p>
                )}
              </div>
              {generatedDoc && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-4"
                  onClick={() => {
                    const temp = document.createElement('div');
                    temp.innerHTML = generatedDoc;
                    navigator.clipboard.writeText(temp.textContent || '');
                    showToast({ type: 'success', message: 'Copied to clipboard!' });
                  }}
                >
                  📋 Copy Documentation
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </TabPanel>

      {/* History Modal */}
      <Modal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        title="Generation History"
        size="lg"
      >
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {testHistory.length === 0 ? (
            <div className="text-center py-8 text-[var(--color-text-secondary)]">
              <p>No history yet</p>
            </div>
          ) : (
            testHistory.map((test) => (
              <Card
                key={test.id}
                variant="outlined"
                padding="sm"
                hoverable
                clickable
                onClick={() => loadFromHistory(test)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="primary" size="sm">
                        {test.type}
                      </Badge>
                      <Badge variant="default" size="sm">
                        {test.language}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)] truncate">
                      {test.input.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    {test.timestamp.toLocaleString()}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowHistory(false)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};
