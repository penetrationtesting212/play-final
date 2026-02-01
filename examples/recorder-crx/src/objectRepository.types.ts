/**
 * Copyright (c) Rui Figueira.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Object Repository Types
 * 
 * Centralized element repository with Page Object Model support
 */

export type ElementLocatorType = 
  | 'id' 
  | 'css' 
  | 'xpath' 
  | 'text' 
  | 'testId' 
  | 'role' 
  | 'placeholder'
  | 'label'
  | 'altText'
  | 'title';

export type ElementCategory = 
  | 'button' 
  | 'input' 
  | 'link' 
  | 'checkbox' 
  | 'radio' 
  | 'select' 
  | 'textarea'
  | 'image'
  | 'heading'
  | 'text'
  | 'container'
  | 'navigation'
  | 'form'
  | 'table'
  | 'modal'
  | 'custom';

/**
 * Represents a single UI element in the repository
 */
export interface UIElement {
  id: string;
  name: string; // Logical name (e.g., "loginButton", "emailInput")
  displayName: string; // Human-readable name (e.g., "Login Button", "Email Input")
  description?: string;
  
  // Page context
  pageObjectId: string; // Reference to parent page object
  
  // Locator strategies (multiple fallback options)
  locators: ElementLocator[];
  primaryLocator: ElementLocator; // The preferred locator
  
  // Element metadata
  category: ElementCategory;
  tagName: string;
  attributes: Record<string, string>;
  
  // Visual info
  xpath?: string;
  cssSelector?: string;
  
  // Context
  url?: string;
  screenshotPath?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
  
  // Usage tracking
  usageCount: number;
  
  // Self-healing
  isHealthy: boolean;
  healingHistory?: HealingHistoryEntry[];
}

/**
 * Element locator with strategy and value
 */
export interface ElementLocator {
  type: ElementLocatorType;
  value: string;
  confidence: number; // 0-1 confidence score
  isActive: boolean; // Whether this locator is currently valid
  lastValidated?: Date;
}

/**
 * Self-healing history entry
 */
export interface HealingHistoryEntry {
  timestamp: Date;
  oldLocator: ElementLocator;
  newLocator: ElementLocator;
  reason: string;
  autoApplied: boolean;
}

/**
 * Page Object Model representation
 */
export interface PageObject {
  id: string;
  name: string; // Class name (e.g., "LoginPage", "DashboardPage")
  displayName: string; // Human-readable (e.g., "Login Page", "Dashboard Page")
  description?: string;
  
  // URL matching
  url: string; // Base URL or pattern
  urlPattern?: string; // Regex pattern for URL matching
  
  // Elements in this page
  elements: UIElement[];
  
  // Page metadata
  projectId?: string;
  
  // Code generation settings
  codeLanguage?: string; // Default language for this page
  namespace?: string; // Package/namespace for generated code
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Usage tracking
  testCount: number; // Number of tests using this page
}

/**
 * Project-level object repository
 */
export interface ObjectRepository {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  
  // Pages in this repository
  pages: PageObject[];
  
  // Global elements (not tied to specific pages)
  globalElements?: UIElement[];
  
  // Configuration
  settings: RepositorySettings;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository configuration settings
 */
export interface RepositorySettings {
  // Locator preferences
  preferredLocatorOrder: ElementLocatorType[];
  
  // Naming conventions
  namingConvention: 'camelCase' | 'PascalCase' | 'snake_case' | 'kebab-case';
  
  // Code generation
  defaultLanguage: string;
  defaultFramework: string;
  
  // Self-healing
  autoHealingEnabled: boolean;
  autoHealingThreshold: number; // Confidence threshold for auto-healing
  
  // Version control
  versioning: boolean;
}

/**
 * Element capture event during recording
 */
export interface ElementCaptureEvent {
  element: Partial<UIElement>;
  action: 'click' | 'fill' | 'check' | 'select' | 'hover' | 'custom';
  pageUrl: string;
  timestamp: Date;
}

/**
 * Search/filter criteria for elements
 */
export interface ElementSearchCriteria {
  query?: string;
  pageObjectId?: string;
  category?: ElementCategory;
  locatorType?: ElementLocatorType;
  isHealthy?: boolean;
  tags?: string[];
}

/**
 * Statistics for the object repository
 */
export interface RepositoryStatistics {
  totalPages: number;
  totalElements: number;
  healthyElements: number;
  unhealthyElements: number;
  mostUsedElements: UIElement[];
  recentlyUpdated: UIElement[];
  coverage: {
    locatorTypes: Record<ElementLocatorType, number>;
    categories: Record<ElementCategory, number>;
  };
}

/**
 * Bulk update operation
 */
export interface BulkUpdateOperation {
  elementIds: string[];
  updates: Partial<UIElement>;
}

/**
 * Import/Export format
 */
export interface RepositoryExport {
  version: string;
  exportDate: Date;
  repository: ObjectRepository;
  metadata?: Record<string, any>;
}
