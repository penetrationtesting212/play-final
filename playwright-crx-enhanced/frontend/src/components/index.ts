/**
 * Playwright CRX Frontend - Component Library
 * Enterprise-grade UI components with NLP features
 */

// ============================================
// Core UI Components
// ============================================
export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
export type { CardProps } from './Card';

export { Input, Textarea, Select } from './Input';
export type { InputProps, TextareaProps, SelectProps } from './Input';

export { Modal, ModalFooter } from './Modal';
export type { ModalProps, ModalSize } from './Modal';

export { Toast, showToast, ToastProvider, useToast } from './Toast';
export type { ToastType, ToastPosition } from './Toast';

export { Badge } from './Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './Badge';

export { Tabs, TabPanel } from './Tabs';
export type { TabsProps, Tab, TabPanelProps } from './Tabs';

// ============================================
// NLP Features Components
// ============================================

/**
 * Gherkin/BDD to Playwright Code Converter
 * Convert Gherkin/BDD scenarios to Playwright test code
 * 
 * Features:
 * - Multi-language support (TypeScript, JavaScript, Python, Java, C#)
 * - Multi-framework support (Playwright, Jest, Mocha, Pytest, JUnit)
 * - Step-by-step conversion tracking
 * - Saved scenarios management
 * - Export generated code
 * 
 * @example
 * ```tsx
 * <GherkinConverter
 *   onCodeGenerated={(code, language) => {
 *     console.log('Generated:', code);
 *   }}
 * />
 * ```
 */
export { GherkinConverter } from './GherkinConverter';

/**
 * Requirements to Test Cases Parser
 * Parse requirements documents and generate test cases
 * 
 * Features:
 * - Parse requirements (Markdown, plain text, user stories)
 * - Auto-generate test cases with priorities
 * - Test coverage analysis (Functional, UI, Integration, E2E, Regression)
 * - Playwright code generation from test cases
 * - Export test cases to JSON
 * - Filtering and search
 * 
 * @example
 * ```tsx
 * <RequirementsParser
 *   onTestCasesGenerated={(testCases) => {
 *     console.log('Generated test cases:', testCases);
 *   }}
 * />
 * ```
 */
export { RequirementsParser } from './RequirementsParser';

/**
 * Automatic Documentation Generator
 * Generate comprehensive test documentation
 * 
 * Features:
 * - Multiple output formats (Markdown, HTML, PDF, Confluence)
 * - Multiple templates (Standard, Detailed, Minimal)
 * - Customizable sections
 * - Documentation history
 * - Version management
 * - Script selection
 * 
 * @example
 * ```tsx
 * const scripts = [
 *   { id: '1', name: 'test.spec.ts', code: '...', language: 'typescript' }
 * ];
 * 
 * <DocumentationGenerator
 *   scripts={scripts}
 * />
 * ```
 */
export { DocumentationGenerator } from './DocumentationGenerator';

/**
 * Voice Commands for Test Recording
 * Record tests using voice commands
 * 
 * Features:
 * - Multi-language speech recognition (6 languages)
 * - Natural language command parsing
 * - Real-time transcript display
 * - Auto-generate Playwright code
 * - Command history and management
 * - Pause/resume recording
 * - Auto-execute mode
 * 
 * @example
 * ```tsx
 * <VoiceCommands
 *   onCommandExecuted={(command) => {
 *     console.log('Voice command:', command);
 *   }}
 *   onCodeGenerated={(code) => {
 *     console.log('Generated code:', code);
 *   }}
 * />
 * ```
 */
export { VoiceCommands } from './VoiceCommands';

/**
 * NLP Dashboard
 * Central hub for all NLP features
 * 
 * Features:
 * - Overview of all NLP features
 * - Stats and metrics
 * - Quick access to all tools
 * - Backend API status
 * - Navigation between features
 * 
 * @example
 * ```tsx
 * <NLPDashboard
 *   scripts={[
 *     { id: '1', name: 'test.spec.ts', code: '...', language: 'typescript' }
 *   ]}
 * />
 * ```
 */
export { NLPDashboard } from './NLPDashboard';

// ============================================
// Legacy/Existing Components
// ============================================
export { default as ApiTesting } from './ApiTesting';
export { default as Dashboard } from './Dashboard';
export { default as ErrorAnalysis } from './ErrorAnalysis';
export { default as ImportScriptModal } from './ImportScriptModal';
export { default as ScriptCueCards } from './ScriptCueCards';
export { default as ScriptEnhancementModal } from './ScriptEnhancementModal';
export { default as ScriptValidationModal } from './ScriptValidationModal';
export { default as Signup } from './Signup';
export { default as TestDataManager } from './TestDataManager';
