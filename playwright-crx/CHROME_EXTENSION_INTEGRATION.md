# 🔌 Chrome Extension Integration Guide

## Overview

This guide shows how to integrate the Object Repository (`/home/user/webapp/playwright-crx/`) with your Chrome extension recorder to automatically capture elements during recording and use them in code generation.

---

## 📋 Integration Steps

### Step 1: Add API Client to Chrome Extension

Create a new file in your Chrome extension:

**File:** `examples/recorder-crx/src/services/objectRepositoryClient.ts`

```typescript
// Object Repository API Client for Chrome Extension
interface ElementData {
  pageId?: number;
  name: string;
  selector: string;
  locatorStrategy: 'css' | 'xpath' | 'testid' | 'text' | 'aria';
  elementType: string;
  description?: string;
}

interface PageData {
  name: string;
  urlPattern: string;
  description?: string;
  projectId?: number;
}

class ObjectRepositoryClient {
  private baseURL = 'http://localhost:3001/api/object-repository';
  
  async createPage(data: PageData): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/pages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create page:', error);
      throw error;
    }
  }
  
  async createElement(data: ElementData): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/elements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to create element:', error);
      throw error;
    }
  }
  
  async getPageByUrl(url: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/pages`);
      const pages = await response.json();
      return pages.find((p: any) => url.includes(p.urlPattern));
    } catch (error) {
      console.error('Failed to get page:', error);
      return null;
    }
  }
  
  async generatePageObject(pageId: number, language: string): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/generate/page-object/${pageId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          framework: 'playwright',
          includeComments: true,
        }),
      });
      const result = await response.json();
      return result.code;
    } catch (error) {
      console.error('Failed to generate page object:', error);
      throw error;
    }
  }
}

export const orClient = new ObjectRepositoryClient();
```

---

### Step 2: Update Background Script

Update `examples/recorder-crx/src/background.ts`:

```typescript
import { orClient } from './services/objectRepositoryClient';

// Track current page context
let currentPageId: number | null = null;
let currentPageUrl: string = '';

// Settings
interface RecorderSettings {
  objectRepositoryEnabled: boolean;
  autoSaveElements: boolean;
  usePageObjects: boolean;
}

const defaultSettings: RecorderSettings = {
  objectRepositoryEnabled: true,
  autoSaveElements: true,
  usePageObjects: true,
};

// Load settings
async function getSettings(): Promise<RecorderSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve({ ...defaultSettings, ...result.settings });
    });
  });
}

// Initialize page when navigation occurs
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    const settings = await getSettings();
    if (!settings.objectRepositoryEnabled) return;
    
    currentPageUrl = tab.url;
    
    // Try to find existing page in Object Repository
    const existingPage = await orClient.getPageByUrl(tab.url);
    
    if (existingPage) {
      currentPageId = existingPage.id;
      console.log('📄 Using existing page:', existingPage.name);
    } else {
      // Create new page
      const pageName = generatePageName(tab.url);
      const newPage = await orClient.createPage({
        name: pageName,
        urlPattern: extractUrlPattern(tab.url),
        description: `Auto-generated page for ${tab.title}`,
      });
      currentPageId = newPage.id;
      console.log('📄 Created new page:', newPage.name);
    }
  }
});

// Helper: Generate page name from URL
function generatePageName(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname.split('/').filter(Boolean);
    const name = path[path.length - 1] || 'home';
    return name.charAt(0).toUpperCase() + name.slice(1) + 'Page';
  } catch {
    return 'UnknownPage';
  }
}

// Helper: Extract URL pattern
function extractUrlPattern(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.origin}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

// Intercept recorded actions and save elements
async function onActionRecorded(action: any) {
  const settings = await getSettings();
  if (!settings.objectRepositoryEnabled || !settings.autoSaveElements) {
    return;
  }
  
  if (!currentPageId) {
    console.warn('⚠️ No current page context');
    return;
  }
  
  // Extract element information from action
  const elementInfo = extractElementInfo(action);
  if (!elementInfo) return;
  
  try {
    // Save to Object Repository
    const element = await orClient.createElement({
      pageId: currentPageId,
      name: elementInfo.name,
      selector: elementInfo.selector,
      locatorStrategy: elementInfo.strategy,
      elementType: elementInfo.type,
      description: elementInfo.description,
    });
    
    console.log('✅ Element saved to Object Repository:', element.name);
  } catch (error) {
    console.error('❌ Failed to save element:', error);
  }
}

// Helper: Extract element info from action
function extractElementInfo(action: any): {
  name: string;
  selector: string;
  strategy: 'css' | 'xpath' | 'testid' | 'text' | 'aria';
  type: string;
  description: string;
} | null {
  if (!action.selector) return null;
  
  // Detect selector strategy
  let strategy: 'css' | 'xpath' | 'testid' | 'text' | 'aria' = 'css';
  if (action.selector.startsWith('//')) strategy = 'xpath';
  else if (action.selector.includes('[data-testid')) strategy = 'testid';
  else if (action.selector.startsWith('text=')) strategy = 'text';
  else if (action.selector.includes('[aria-')) strategy = 'aria';
  
  // Generate element name
  const name = generateElementName(action);
  
  return {
    name,
    selector: action.selector,
    strategy,
    type: action.elementType || 'unknown',
    description: `${action.type} on ${name}`,
  };
}

// Helper: Generate element name from action
function generateElementName(action: any): string {
  const type = action.elementType || 'element';
  const actionType = action.type;
  
  // Try to extract meaningful name from selector
  let name = '';
  
  if (action.selector.includes('id=')) {
    const match = action.selector.match(/id="([^"]+)"/);
    if (match) name = match[1];
  } else if (action.selector.includes('data-testid')) {
    const match = action.selector.match(/data-testid="([^"]+)"/);
    if (match) name = match[1];
  } else if (action.selector.includes('name=')) {
    const match = action.selector.match(/name="([^"]+)"/);
    if (match) name = match[1];
  }
  
  // Fallback to action type + element type
  if (!name) {
    name = `${actionType}${type.charAt(0).toUpperCase() + type.slice(1)}`;
  }
  
  // Convert to camelCase
  return toCamelCase(name);
}

// Helper: Convert string to camelCase
function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
}
```

---

### Step 3: Update Code Generator

Update `examples/recorder-crx/src/codeGenerator.ts`:

```typescript
import { orClient } from './services/objectRepositoryClient';

interface GeneratorOptions {
  language: string;
  usePageObjects: boolean;
  objectRepositoryEnabled: boolean;
}

export async function generateCode(
  actions: Action[],
  options: GeneratorOptions
): Promise<string> {
  if (options.objectRepositoryEnabled && options.usePageObjects) {
    return await generatePOMBasedCode(actions, options);
  } else {
    return await generateStandardCode(actions, options);
  }
}

async function generatePOMBasedCode(
  actions: Action[],
  options: GeneratorOptions
): Promise<string> {
  // Group actions by page
  const actionsByPage = groupActionsByPage(actions);
  
  let code = '';
  
  // Generate imports
  code += generateImports(options.language);
  code += '\n\n';
  
  // Generate Page Object imports
  for (const [pageId, pageActions] of Object.entries(actionsByPage)) {
    const pageObject = await orClient.generatePageObject(
      parseInt(pageId),
      options.language
    );
    code += `// Page Object for page ${pageId}\n`;
    code += pageObject;
    code += '\n\n';
  }
  
  // Generate test using Page Objects
  code += generateTestWithPOM(actionsByPage, options.language);
  
  return code;
}

function generateTestWithPOM(
  actionsByPage: Record<string, Action[]>,
  language: string
): string {
  let testCode = '';
  
  switch (language) {
    case 'typescript':
      testCode = `
import { test, expect } from '@playwright/test';

test('recorded test', async ({ page }) => {
  // Initialize page objects
`;
      
      for (const [pageId, actions] of Object.entries(actionsByPage)) {
        const pageName = `page${pageId}`;
        testCode += `  const ${pageName} = new Page${pageId}(page);\n`;
      }
      
      testCode += '\n  // Test actions\n';
      
      for (const [pageId, actions] of Object.entries(actionsByPage)) {
        const pageName = `page${pageId}`;
        for (const action of actions) {
          testCode += `  await ${pageName}.${action.elementName}.${action.type}(${action.value || ''});\n`;
        }
      }
      
      testCode += '});\n';
      break;
      
    case 'python':
      testCode = `
from playwright.sync_api import Page, expect

def test_recorded_test(page: Page):
    # Initialize page objects
`;
      
      for (const [pageId] of Object.entries(actionsByPage)) {
        const pageName = `page_${pageId}`;
        testCode += `    ${pageName} = Page${pageId}(page)\n`;
      }
      
      testCode += '\n    # Test actions\n';
      
      for (const [pageId, actions] of Object.entries(actionsByPage)) {
        const pageName = `page_${pageId}`;
        for (const action of actions) {
          testCode += `    ${pageName}.${action.elementName}.${action.type}(${action.value || ''})\n`;
        }
      }
      
      break;
      
    // Add other languages...
  }
  
  return testCode;
}

function groupActionsByPage(actions: Action[]): Record<string, Action[]> {
  const grouped: Record<string, Action[]> = {};
  
  let currentPageId = 1; // Default page
  
  for (const action of actions) {
    if (action.type === 'navigate') {
      // New page context
      currentPageId++;
    }
    
    if (!grouped[currentPageId]) {
      grouped[currentPageId] = [];
    }
    
    grouped[currentPageId].push(action);
  }
  
  return grouped;
}

function generateImports(language: string): string {
  switch (language) {
    case 'typescript':
      return "import { test, expect } from '@playwright/test';";
    case 'python':
      return 'from playwright.sync_api import Page, expect';
    case 'java':
      return 'import com.microsoft.playwright.*;';
    default:
      return '';
  }
}
```

---

### Step 4: Update Settings UI

Update `examples/recorder-crx/src/settings.ts`:

```typescript
interface Settings {
  // Existing settings...
  targetLanguage: string;
  testIdAttribute: string;
  
  // New Object Repository settings
  objectRepositoryEnabled: boolean;
  autoSaveElements: boolean;
  usePageObjects: boolean;
  orServerUrl: string;
}

const defaultSettings: Settings = {
  targetLanguage: 'typescript',
  testIdAttribute: 'data-testid',
  objectRepositoryEnabled: true,
  autoSaveElements: true,
  usePageObjects: true,
  orServerUrl: 'http://localhost:3001',
};

// Add to settings UI
function renderObjectRepositorySettings() {
  return `
    <div class="settings-section">
      <h3>🗃️ Object Repository</h3>
      
      <label>
        <input type="checkbox" id="objectRepositoryEnabled" />
        Enable Object Repository
      </label>
      
      <label>
        <input type="checkbox" id="autoSaveElements" />
        Auto-save elements during recording
      </label>
      
      <label>
        <input type="checkbox" id="usePageObjects" />
        Generate Page Object Model code
      </label>
      
      <label>
        Server URL:
        <input type="text" id="orServerUrl" placeholder="http://localhost:3001" />
      </label>
      
      <button onclick="testORConnection()">Test Connection</button>
    </div>
  `;
}

async function testORConnection() {
  const settings = await getSettings();
  
  try {
    const response = await fetch(`${settings.orServerUrl}/health`);
    if (response.ok) {
      alert('✅ Connected to Object Repository successfully!');
    } else {
      alert('❌ Failed to connect to Object Repository');
    }
  } catch (error) {
    alert(`❌ Connection error: ${error.message}`);
  }
}
```

---

### Step 5: Update Recorder UI

Update `examples/recorder-crx/src/crxRecorder.tsx`:

```tsx
import React, { useState, useEffect } from 'react';
import { orClient } from './services/objectRepositoryClient';

function CrxRecorder() {
  const [orEnabled, setOrEnabled] = useState(true);
  const [currentPage, setCurrentPage] = useState<any>(null);
  const [savedElements, setSavedElements] = useState<any[]>([]);
  
  // Load Object Repository status
  useEffect(() => {
    loadORStatus();
  }, []);
  
  async function loadORStatus() {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (response.ok) {
        setOrEnabled(true);
        console.log('✅ Object Repository connected');
      } else {
        setOrEnabled(false);
        console.warn('⚠️ Object Repository not available');
      }
    } catch (error) {
      setOrEnabled(false);
      console.warn('⚠️ Object Repository not available:', error);
    }
  }
  
  // Show OR status in UI
  return (
    <div className="crx-recorder">
      {/* Existing recorder UI */}
      
      {/* Object Repository Status */}
      <div className="or-status">
        {orEnabled ? (
          <span className="or-connected">
            🗃️ Object Repository: Connected
          </span>
        ) : (
          <span className="or-disconnected">
            ⚠️ Object Repository: Disconnected
          </span>
        )}
      </div>
      
      {/* Show current page context */}
      {currentPage && (
        <div className="current-page">
          📄 Recording to: <strong>{currentPage.name}</strong>
        </div>
      )}
      
      {/* Show recently saved elements */}
      {savedElements.length > 0 && (
        <div className="saved-elements">
          <h4>Recently Saved Elements:</h4>
          <ul>
            {savedElements.map((el, idx) => (
              <li key={idx}>
                ✅ {el.name} ({el.locatorStrategy})
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Rest of recorder UI */}
    </div>
  );
}
```

---

## 🎨 UI Integration

Add CSS for Object Repository status:

**File:** `examples/recorder-crx/src/crxRecorder.css`

```css
/* Object Repository Status */
.or-status {
  padding: 8px 12px;
  margin: 8px 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.or-connected {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 8px;
  border-radius: 4px;
}

.or-disconnected {
  background: #fff3e0;
  color: #e65100;
  padding: 4px 8px;
  border-radius: 4px;
}

.current-page {
  padding: 8px 12px;
  margin: 8px 0;
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
  font-size: 12px;
}

.saved-elements {
  padding: 8px 12px;
  margin: 8px 0;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 11px;
}

.saved-elements h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
}

.saved-elements ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.saved-elements li {
  padding: 4px 0;
  color: #2e7d32;
}
```

---

## 🚀 Testing the Integration

### 1. Start Object Repository Backend

```bash
cd /home/user/webapp/playwright-crx/backend
npm run dev
```

### 2. Start Object Repository Frontend

```bash
cd /home/user/webapp/playwright-crx/frontend
npm run dev
```

### 3. Build Chrome Extension

```bash
cd /home/user/webapp
npm run build:examples:recorder
```

### 4. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `examples/recorder-crx/dist`

### 5. Test Recording

1. Open the extension popup
2. Check that "🗃️ Object Repository: Connected" is shown
3. Start recording a test
4. Perform actions on a webpage
5. Open Object Repository UI at `http://localhost:3000`
6. Verify elements are being saved

### 6. Generate Page Object Code

1. In Object Repository UI, go to "Code Gen" tab
2. Select a page
3. Choose language (TypeScript, Python, Java, C#)
4. Click "Generate"
5. Copy the generated Page Object code

---

## 📊 Data Flow

```
┌─────────────────────┐
│  Chrome Extension   │
│    (Recording)      │
└──────────┬──────────┘
           │
           │ Element captured
           │
           ▼
┌─────────────────────┐
│  Background Script  │
│  (background.ts)    │
└──────────┬──────────┘
           │
           │ HTTP POST /api/object-repository/elements
           │
           ▼
┌─────────────────────┐
│  Backend API        │
│  (Express Server)   │
└──────────┬──────────┘
           │
           │ Save to database
           │
           ▼
┌─────────────────────┐
│  PostgreSQL         │
│  (or_elements)      │
└─────────────────────┘

           │
           │ Query elements
           │
           ▼
┌─────────────────────┐
│  Code Generator     │
│  (codeGenerator.ts) │
└──────────┬──────────┘
           │
           │ Generate Page Object
           │
           ▼
┌─────────────────────┐
│  Test File          │
│  (LoginPage.ts)     │
└─────────────────────┘
```

---

## 🎯 Benefits of Integration

### 1. Automatic Element Capture
- ✅ No manual element definition needed
- ✅ Elements saved during recording
- ✅ Consistent naming conventions

### 2. Page Object Generation
- ✅ Auto-generate POM classes
- ✅ Multi-language support
- ✅ Ready-to-use test code

### 3. Centralized Management
- ✅ All elements in one place
- ✅ Easy selector updates
- ✅ Team collaboration

### 4. Self-Healing Tests
- ✅ Alternative locators stored
- ✅ Automatic recovery from breaks
- ✅ Increased test stability

---

## 🔧 Troubleshooting

### Extension can't connect to Object Repository

**Check backend is running:**
```bash
curl http://localhost:3001/health
```

**Check CORS configuration:**
```typescript
// backend/src/index.ts
app.use(cors({
  origin: ['http://localhost:3000', 'chrome-extension://*'],
  credentials: true,
}));
```

### Elements not being saved

**Check console in extension:**
```javascript
// In Chrome DevTools > Extensions > Inspect popup
console.log('Saving element:', elementData);
```

**Verify API call:**
```bash
# Check backend logs
npm run dev  # Should show POST requests
```

### Code generation not working

**Verify page has elements:**
```bash
curl http://localhost:3001/api/object-repository/elements/page/1
```

**Check code generator service:**
```bash
curl -X POST http://localhost:3001/api/object-repository/generate/page-object/1 \
  -H "Content-Type: application/json" \
  -d '{"language":"typescript","framework":"playwright"}'
```

---

## 📚 Additional Resources

- [Main README](/home/user/webapp/playwright-crx/README.md)
- [Implementation Complete](/home/user/webapp/playwright-crx/IMPLEMENTATION_COMPLETE.md)
- [Backend API Documentation](#)
- [Frontend Component Documentation](#)

---

**🎭 Integration Complete!**

Your Chrome extension can now automatically capture elements to the Object Repository and generate Page Object Model code!
