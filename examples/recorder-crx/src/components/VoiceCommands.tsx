/**
 * Copyright (c) Playwright CRX
 * Apache-2.0 License
 *
 * Voice Commands for Test Recording Component
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { Toast, showToast } from './Toast';

interface VoiceCommand {
  id: string;
  transcript: string;
  action: string;
  playwrightCode: string;
  confidence: number;
  timestamp: string;
  status: 'pending' | 'processed' | 'error';
}

interface VoiceCommandsProps {
  onCommandExecuted?: (command: VoiceCommand) => void;
  onCodeGenerated?: (code: string) => void;
  onClose?: () => void;
}

export const VoiceCommands: React.FC<VoiceCommandsProps> = ({
  onCommandExecuted,
  onCodeGenerated,
  onClose,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [commands, setCommands] = useState<VoiceCommand[]>([]);
  const [language, setLanguage] = useState<'en-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ja-JP' | 'zh-CN'>('en-US');
  const [autoExecute, setAutoExecute] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Initialize Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language;

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            processVoiceCommand(transcript, event.results[i][0].confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        showToast(`Voice recognition error: ${event.error}`, 'error');
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening && !isPaused) {
          recognitionRef.current.start();
        }
      };
    } else {
      showToast('Speech recognition not supported in this browser', 'error');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [language, isListening, isPaused]);

  const startListening = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
        setIsPaused(false);
        showToast('Voice recording started', 'success');
      }

      // Optional: Record audio for backup/analysis
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.start();
    } catch (error) {
      console.error('Microphone access error:', error);
      showToast('Failed to access microphone', 'error');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    setIsPaused(false);
    showToast('Voice recording stopped', 'success');
  };

  const pauseListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsPaused(true);
    showToast('Voice recording paused', 'info');
  };

  const resumeListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
    setIsPaused(false);
    showToast('Voice recording resumed', 'success');
  };

  const processVoiceCommand = async (transcript: string, confidence: number) => {
    const command = parseVoiceCommand(transcript);
    
    if (command) {
      const voiceCommand: VoiceCommand = {
        id: Date.now().toString(),
        transcript,
        action: command.action,
        playwrightCode: command.code,
        confidence,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };

      setCommands(prev => [voiceCommand, ...prev]);

      if (autoExecute) {
        executeCommand(voiceCommand);
      }
    }
  };

  const parseVoiceCommand = (transcript: string): { action: string; code: string } | null => {
    const lower = transcript.toLowerCase().trim();

    // Navigate commands
    if (lower.includes('go to') || lower.includes('navigate to')) {
      const url = extractURL(lower);
      return {
        action: `Navigate to ${url}`,
        code: `await page.goto('${url}');`,
      };
    }

    // Click commands
    if (lower.includes('click') || lower.includes('press')) {
      const element = extractElement(lower);
      return {
        action: `Click ${element}`,
        code: `await page.click('${generateSelector(element)}');`,
      };
    }

    // Type commands
    if (lower.includes('type') || lower.includes('enter') || lower.includes('fill')) {
      const text = extractText(lower);
      const field = extractField(lower);
      return {
        action: `Type "${text}" in ${field}`,
        code: `await page.fill('[name="${field}"]', '${text}');`,
      };
    }

    // Wait commands
    if (lower.includes('wait for')) {
      const element = extractElement(lower);
      return {
        action: `Wait for ${element}`,
        code: `await page.waitForSelector('${generateSelector(element)}', { state: 'visible' });`,
      };
    }

    // Assert/Verify commands
    if (lower.includes('verify') || lower.includes('check') || lower.includes('assert')) {
      const element = extractElement(lower);
      return {
        action: `Verify ${element} is visible`,
        code: `await expect(page.locator('${generateSelector(element)}')).toBeVisible();`,
      };
    }

    // Screenshot command
    if (lower.includes('take screenshot') || lower.includes('capture screen')) {
      return {
        action: 'Take screenshot',
        code: `await page.screenshot({ path: 'screenshot.png' });`,
      };
    }

    // Scroll commands
    if (lower.includes('scroll')) {
      if (lower.includes('down')) {
        return {
          action: 'Scroll down',
          code: `await page.evaluate(() => window.scrollBy(0, window.innerHeight));`,
        };
      } else if (lower.includes('up')) {
        return {
          action: 'Scroll up',
          code: `await page.evaluate(() => window.scrollBy(0, -window.innerHeight));`,
        };
      }
    }

    // Select dropdown
    if (lower.includes('select')) {
      const option = extractText(lower);
      const field = extractField(lower);
      return {
        action: `Select "${option}" from ${field}`,
        code: `await page.selectOption('[name="${field}"]', '${option}');`,
      };
    }

    return null;
  };

  const extractURL = (text: string): string => {
    const match = text.match(/(?:go to|navigate to)\s+(\S+)/);
    return match ? match[1] : 'https://example.com';
  };

  const extractElement = (text: string): string => {
    const words = text.split(' ');
    const clickIndex = words.findIndex(w => ['click', 'press', 'verify', 'check', 'wait'].includes(w));
    if (clickIndex >= 0 && words.length > clickIndex + 1) {
      return words.slice(clickIndex + 1).join(' ').replace(/button|link|field/g, '').trim();
    }
    return 'element';
  };

  const extractText = (text: string): string => {
    const match = text.match(/["']([^"']+)["']/) || text.match(/type\s+(\w+)/);
    return match ? match[1] : '';
  };

  const extractField = (text: string): string => {
    const lower = text.toLowerCase();
    if (lower.includes('email')) return 'email';
    if (lower.includes('password')) return 'password';
    if (lower.includes('username')) return 'username';
    if (lower.includes('name')) return 'name';
    if (lower.includes('phone')) return 'phone';
    if (lower.includes('message')) return 'message';
    return 'input';
  };

  const generateSelector = (element: string): string => {
    const lower = element.toLowerCase();
    if (lower.includes('button')) {
      return `button:has-text("${element.replace('button', '').trim()}")`;
    }
    if (lower.includes('link')) {
      return `a:has-text("${element.replace('link', '').trim()}")`;
    }
    return `text=${element}`;
  };

  const executeCommand = (command: VoiceCommand) => {
    // Update command status
    setCommands(prev =>
      prev.map(cmd =>
        cmd.id === command.id ? { ...cmd, status: 'processed' } : cmd
      )
    );

    // Append to generated code
    setGeneratedCode(prev => prev + command.playwrightCode + '\n');

    if (onCommandExecuted) {
      onCommandExecuted(command);
    }

    if (onCodeGenerated) {
      onCodeGenerated(command.playwrightCode);
    }

    showToast('Command executed', 'success');
  };

  const deleteCommand = (id: string) => {
    setCommands(prev => prev.filter(cmd => cmd.id !== id));
    showToast('Command deleted', 'success');
  };

  const clearAllCommands = () => {
    setCommands([]);
    setGeneratedCode('');
    setTranscript('');
    showToast('All commands cleared', 'success');
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    showToast('Code copied to clipboard', 'success');
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'voice-generated-test.spec.ts';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Code downloaded', 'success');
  };

  const voiceCommandExamples = [
    '🗣️ "Go to example.com"',
    '🗣️ "Click the login button"',
    '🗣️ "Type user@example.com in email"',
    '🗣️ "Enter password123 in password"',
    '🗣️ "Click submit"',
    '🗣️ "Wait for dashboard"',
    '🗣️ "Verify welcome message"',
    '🗣️ "Take screenshot"',
    '🗣️ "Scroll down"',
    '🗣️ "Select option from dropdown"',
  ];

  return (
    <div className="voice-commands">
      <div className="voice-header">
        <h2>🎤 Voice Commands</h2>
        {onClose && (
          <Button variant="ghost" size="small" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      <Card variant="outlined" className="voice-controls">
        <div className="controls-row">
          <div className="recording-status">
            {isListening && !isPaused && (
              <Badge variant="error" className="recording-badge pulse">
                ⏺ Recording
              </Badge>
            )}
            {isPaused && (
              <Badge variant="warning">⏸ Paused</Badge>
            )}
            {!isListening && (
              <Badge variant="default">⏹ Stopped</Badge>
            )}
          </div>

          <div className="control-buttons">
            {!isListening ? (
              <Button variant="primary" onClick={startListening}>
                🎤 Start Recording
              </Button>
            ) : (
              <>
                {isPaused ? (
                  <Button variant="primary" onClick={resumeListening}>
                    ▶️ Resume
                  </Button>
                ) : (
                  <Button variant="warning" onClick={pauseListening}>
                    ⏸ Pause
                  </Button>
                )}
                <Button variant="error" onClick={stopListening}>
                  ⏹ Stop
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="controls-row">
          <div className="config-group">
            <label>Language:</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              disabled={isListening}
              className="config-select"
            >
              <option value="en-US">English (US)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="ja-JP">Japanese</option>
              <option value="zh-CN">Chinese</option>
            </select>
          </div>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={autoExecute}
              onChange={(e) => setAutoExecute(e.target.checked)}
            />
            Auto-execute commands
          </label>
        </div>
      </Card>

      {transcript && (
        <Card variant="outlined" className="live-transcript">
          <h4>Live Transcript:</h4>
          <p>{transcript}</p>
        </Card>
      )}

      <Card variant="outlined" className="voice-examples">
        <h4>💡 Example Commands:</h4>
        <div className="examples-grid">
          {voiceCommandExamples.map((example, idx) => (
            <div key={idx} className="example-item">
              {example}
            </div>
          ))}
        </div>
      </Card>

      <div className="commands-section">
        <div className="section-header">
          <h3>Commands History ({commands.length})</h3>
          <div>
            <Button variant="ghost" size="small" onClick={clearAllCommands}>
              🗑️ Clear All
            </Button>
          </div>
        </div>

        <div className="commands-list">
          {commands.length === 0 ? (
            <Card variant="outlined" className="empty-state">
              <p>No commands recorded yet. Start recording to capture voice commands!</p>
            </Card>
          ) : (
            commands.map((command) => (
              <Card key={command.id} variant="elevated" className="command-card">
                <div className="command-header">
                  <div>
                    <Badge
                      variant={
                        command.status === 'processed'
                          ? 'success'
                          : command.status === 'error'
                          ? 'error'
                          : 'warning'
                      }
                    >
                      {command.status}
                    </Badge>
                    <Badge variant="info">
                      {Math.round(command.confidence * 100)}% confidence
                    </Badge>
                    <span className="timestamp">
                      {new Date(command.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="command-actions">
                    {command.status === 'pending' && (
                      <Button
                        variant="primary"
                        size="small"
                        onClick={() => executeCommand(command)}
                      >
                        ▶️ Execute
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={() => deleteCommand(command.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>
                <div className="command-content">
                  <div className="command-transcript">
                    <strong>You said:</strong> "{command.transcript}"
                  </div>
                  <div className="command-action">
                    <strong>Action:</strong> {command.action}
                  </div>
                  <div className="command-code">
                    <strong>Playwright Code:</strong>
                    <pre><code>{command.playwrightCode}</code></pre>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {generatedCode && (
        <Card variant="outlined" className="generated-code-section">
          <div className="section-header">
            <h3>Generated Test Code</h3>
            <div>
              <Button variant="ghost" size="small" onClick={copyCode}>
                📋 Copy
              </Button>
              <Button variant="primary" size="small" onClick={downloadCode}>
                💾 Download
              </Button>
            </div>
          </div>
          <pre className="code-output">{generatedCode}</pre>
        </Card>
      )}

      <Toast />
    </div>
  );
};
