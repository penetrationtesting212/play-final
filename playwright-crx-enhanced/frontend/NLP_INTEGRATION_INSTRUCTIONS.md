# NLP Features Integration Instructions

## ✅ Files Successfully Copied

All NLP features have been copied from `examples/recorder-crx` to `playwright-crx-enhanced/frontend`:

### Components (11 files)
```
✅ src/components/
   ├── GherkinConverter.tsx          (17.5 KB)
   ├── RequirementsParser.tsx        (21.2 KB)
   ├── DocumentationGenerator.tsx    (19.6 KB)
   ├── VoiceCommands.tsx             (17.6 KB)
   ├── NLPDashboard.tsx              (15 KB) - NEW
   ├── NLPIntegration.tsx            (0.5 KB) - NEW
   ├── Button.tsx                    (3.3 KB)
   ├── Card.tsx                      (2.6 KB)
   ├── Input.tsx                     (6.1 KB)
   ├── Modal.tsx                     (3.4 KB)
   ├── Toast.tsx                     (Updated)
   ├── Badge.tsx                     (Updated)
   ├── Tabs.tsx                      (3.1 KB)
   └── index.ts                      (4.3 KB) - Updated with exports
```

### CSS Files (3 files)
```
✅ src/
   ├── nlp-components.css            (14.6 KB)
   ├── enterprise-ui.css             (11.8 KB)
   └── theme.ts                      (Theme configuration)
```

---

## 🚀 Integration Steps

### Step 1: Import CSS in main.tsx

Add to `src/main.tsx`:

```typescript
import './index.css';
import './nlp-components.css';
import './enterprise-ui.css';
```

### Step 2: Add NLP View to Dashboard

Update `src/components/Dashboard.tsx`:

**A. Update type definition:**
```typescript
type ActiveView = 
  | 'overview' 
  | 'scripts' 
  | 'runs' 
  | 'testdata' 
  | 'apitesting' 
  | 'nlp'          // ← ADD THIS
  | 'allure'
  | 'analytics'
  | 'settings';
```

**B. Import NLP components:**
```typescript
import { NLPDashboard } from './NLPDashboard';
// OR
import NLPIntegration from './NLPIntegration';
```

**C. Add navigation menu item:**

Find the sidebar menu and add:
```tsx
<button
  className={`menu-item ${activeView === 'nlp' ? 'active' : ''}`}
  onClick={() => setActiveView('nlp')}
>
  <span className="icon">🤖</span>
  <span className="label">NLP Features</span>
  <span className="badge">AI</span>
</button>
```

**D. Add view rendering:**

Find where views are rendered and add:
```tsx
{activeView === 'nlp' && (
  <div className="nlp-view">
    <NLPDashboard scripts={scripts} />
  </div>
)}
```

### Step 3: Format Scripts Data

Ensure scripts have the required structure:
```typescript
const formattedScripts = scripts.map(script => ({
  id: script.id,
  name: script.name,
  code: script.code || '', // Add code if available
  language: script.language
}));

<NLPDashboard scripts={formattedScripts} />
```

---

## 📝 Complete Integration Example

Here's a complete example of how to integrate into Dashboard.tsx:

```typescript
// At the top of Dashboard.tsx
import { NLPDashboard } from './NLPDashboard';
import '../nlp-components.css';
import '../enterprise-ui.css';

// In the component
type ActiveView = 
  | 'overview' 
  | 'scripts' 
  | 'runs' 
  | 'testdata' 
  | 'apitesting' 
  | 'nlp'  // ← ADD THIS
  | 'allure'
  | 'analytics'
  | 'settings';

// In the sidebar navigation
<nav className="sidebar">
  {/* ... existing menu items ... */}
  
  <button
    className={`menu-item ${activeView === 'nlp' ? 'active' : ''}`}
    onClick={() => setActiveView('nlp')}
  >
    <span className="icon">🤖</span>
    <span className="label">NLP Features</span>
    <span className="badge new">AI</span>
  </button>
  
  {/* ... other menu items ... */}
</nav>

// In the main content area
<main className="main-content">
  {activeView === 'overview' && (
    // ... overview content
  )}
  
  {activeView === 'scripts' && (
    // ... scripts content
  )}
  
  {activeView === 'nlp' && (
    <NLPDashboard scripts={scripts} />
  )}
  
  {/* ... other views ... */}
</main>
```

---

## 🎨 Styling Integration

### Option 1: Use Existing CSS (Recommended)
The NLP components use VS Code theme variables that should work with your existing theme:
```css
var(--vscode-editor-background)
var(--vscode-editor-foreground)
var(--vscode-button-background)
/* etc. */
```

### Option 2: Add Custom Theme Variables
If your app doesn't have VS Code theme variables, add to `index.css`:
```css
:root {
  --vscode-editor-background: #1e1e1e;
  --vscode-editor-foreground: #d4d4d4;
  --vscode-button-background: #0e639c;
  --vscode-button-foreground: #ffffff;
  --vscode-input-background: #3c3c3c;
  --vscode-input-border: #3c3c3c;
  --vscode-input-foreground: #cccccc;
  --vscode-panel-border: #3c3c3c;
  --vscode-descriptionForeground: #9d9d9d;
  --vscode-textLink-foreground: #3794ff;
  --vscode-textLink-activeForeground: #4daafc;
  --vscode-focusBorder: #007acc;
}
```

---

## 🔧 Backend Configuration

### 1. Ensure Backend is Running
```bash
cd backend
npm install
npm run dev
```

Backend should run on: `http://localhost:3001`

### 2. Configure OpenAI (Required for Full AI Features)
Create `backend/.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4-turbo-preview
PORT=3001
NODE_ENV=development
```

### 3. Add NLP Routes to Backend

Ensure `backend/src/index.ts` (or your main server file) includes:
```typescript
import nlpRoutes from './routes/nlp.routes';

app.use('/api/nlp', nlpRoutes);
```

---

## 🧪 Testing the Integration

### 1. Test Import
```typescript
import { 
  NLPDashboard,
  GherkinConverter,
  RequirementsParser,
  DocumentationGenerator,
  VoiceCommands 
} from './components';

// Should work without errors
```

### 2. Test Individual Components
```tsx
// Test Gherkin Converter
<GherkinConverter 
  onCodeGenerated={(code, language) => {
    console.log('Generated:', code);
  }}
/>

// Test Requirements Parser
<RequirementsParser
  onTestCasesGenerated={(cases) => {
    console.log('Test cases:', cases);
  }}
/>

// Test Documentation Generator
<DocumentationGenerator
  scripts={[
    { id: '1', name: 'test.spec.ts', code: '...', language: 'typescript' }
  ]}
/>

// Test Voice Commands
<VoiceCommands
  onCodeGenerated={(code) => {
    console.log('Voice code:', code);
  }}
/>
```

### 3. Test Full Dashboard
```tsx
<NLPDashboard
  scripts={[
    { id: '1', name: 'login.spec.ts', code: 'test code', language: 'typescript' },
    { id: '2', name: 'signup.spec.ts', code: 'test code', language: 'typescript' }
  ]}
/>
```

---

## 📱 Mobile Responsiveness

All NLP components are responsive and work on mobile. They include:
- Flexible grid layouts
- Touch-friendly buttons
- Mobile-optimized modals
- Responsive navigation

---

## ♿ Accessibility

All components include:
- Keyboard navigation
- Screen reader support
- Focus indicators
- ARIA labels
- Semantic HTML

---

## 🎯 Quick Start Checklist

- [ ] Import CSS files in `main.tsx`
- [ ] Add 'nlp' to ActiveView type in Dashboard
- [ ] Import NLPDashboard component
- [ ] Add NLP menu item to sidebar
- [ ] Add NLP view rendering
- [ ] Configure backend OpenAI API key
- [ ] Test NLP features tab
- [ ] Test Gherkin converter
- [ ] Test Requirements parser
- [ ] Test Documentation generator
- [ ] Test Voice commands

---

## 🐛 Troubleshooting

### Issue: Components not rendering
**Solution:** Ensure CSS files are imported in `main.tsx`

### Issue: Backend API errors
**Solution:** Check backend is running on port 3001

### Issue: OpenAI errors
**Solution:** Verify `OPENAI_API_KEY` in backend `.env`

### Issue: Voice recognition not working
**Solution:** 
- Use Chrome, Edge, or Safari
- Grant microphone permissions
- Check browser console for errors

### Issue: Styling looks wrong
**Solution:** Add VS Code theme variables to your CSS (see Styling Integration section)

---

## 📚 Documentation

For complete documentation, see:
- **[NLP_FEATURES_GUIDE.md](/NLP_FEATURES_GUIDE.md)** - Complete feature guide
- **[INTEGRATION_QUICKSTART.md](/INTEGRATION_QUICKSTART.md)** - Quick integration guide
- **Component JSDoc** - Inline documentation in components

---

## 🎉 You're Done!

All NLP features are now available in your frontend:

✅ **Gherkin Converter** - Convert BDD to Playwright  
✅ **Requirements Parser** - Auto-generate test cases  
✅ **Doc Generator** - Create documentation  
✅ **Voice Commands** - Speak your tests  
✅ **Unified Dashboard** - Central NLP hub

**Need help?** Check the complete documentation or review the example code!

---

**Files Location:**
- Frontend: `playwright-crx-enhanced/frontend/src/`
- Backend: `backend/src/services/nlp.service.ts` & `backend/src/routes/nlp.routes.ts`
- Docs: Root directory `.md` files
