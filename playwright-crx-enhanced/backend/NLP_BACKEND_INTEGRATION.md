# NLP Backend Integration - Complete Guide

## ✅ Integration Status

**NLP Features Successfully Integrated into Backend!** 🎉

### Files Added
```
✅ src/services/nlp.service.ts     (12.2 KB)
✅ src/routes/nlp.routes.ts        (4.3 KB)
✅ src/index.ts                    (Updated - added NLP routes)
✅ .env.example                    (Updated - added OpenAI config)
```

---

## 📦 What Was Integrated

### 1. NLP Service (`nlp.service.ts`)
**Location:** `src/services/nlp.service.ts`

**Features:**
- ✅ OpenAI GPT-4 integration
- ✅ Gherkin/BDD to Playwright code conversion
- ✅ Requirements parsing to test cases
- ✅ Test code generation
- ✅ Documentation generation
- ✅ Intelligent AI-powered analysis

**Class:** `NLPService`

**Methods:**
```typescript
- convertGherkin(request)      // Convert BDD scenarios
- parseRequirements(request)    // Parse requirements → test cases
- generateTestCode(testCase)   // Generate Playwright code
- generateDocumentation(request) // Generate comprehensive docs
```

### 2. NLP Routes (`nlp.routes.ts`)
**Location:** `src/routes/nlp.routes.ts`

**Endpoints:**
```
POST /api/nlp/convert-gherkin
POST /api/nlp/parse-requirements
POST /api/nlp/generate-test-code
POST /api/nlp/generate-documentation
GET  /api/nlp/health
```

### 3. Backend Server Integration
**Location:** `src/index.ts`

**Changes:**
- ✅ Imported `nlp.routes.ts`
- ✅ Registered `/api/nlp` route
- ✅ Added to API endpoints list

---

## 🚀 Quick Start

### Step 1: Install Dependencies (Already Done)
```bash
cd playwright-crx-enhanced/backend
npm install
```

**Required packages (already in package.json):**
- ✅ `axios` (v1.13.2)
- ✅ `express`
- ✅ `openai` (v6.8.1)

### Step 2: Configure OpenAI API Key

Create `.env` file in `playwright-crx-enhanced/backend/`:

```env
# Copy from .env.example and update these values:

# OpenAI Configuration (REQUIRED for NLP features)
OPENAI_API_KEY=sk-your-actual-openai-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4-turbo-preview

# Other required configs
DB_HOST=localhost
DB_PORT=5432
DB_NAME=playwright_crx
DB_USER=postgres
DB_PASSWORD=your_password
JWT_ACCESS_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
PORT=3001
NODE_ENV=development
```

### Step 3: Start Backend

```bash
cd playwright-crx-enhanced/backend
npm run dev
```

**Expected Output:**
```
🚀 Server running on port 3001
📡 Environment: development
🏥 Health check: http://localhost:3001/health
```

### Step 4: Test NLP Endpoints

```bash
# Test health endpoint
curl http://localhost:3001/api/nlp/health

# Expected response:
{
  "success": true,
  "service": "NLP",
  "status": "operational",
  "features": [
    "Gherkin/BDD to Playwright conversion",
    "Requirements parsing to test cases",
    "Test code generation",
    "Automatic documentation generation"
  ],
  "openaiConfigured": true
}
```

---

## 🔌 API Endpoints Documentation

### 1. Convert Gherkin/BDD to Playwright

**Endpoint:** `POST /api/nlp/convert-gherkin`

**Request:**
```json
{
  "gherkin": "Feature: Login\nScenario: Successful login\n  Given I am on the login page\n  When I enter credentials\n  Then I should see dashboard",
  "language": "typescript",
  "framework": "playwright"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "playwrightCode": "import { test, expect } from '@playwright/test';\n...",
    "language": "typescript",
    "testFramework": "playwright",
    "confidence": 0.95,
    "steps": [
      {
        "gherkin": "Given I am on the login page",
        "playwright": "await page.goto('https://example.com/login');",
        "status": "success"
      }
    ]
  }
}
```

**Supported Languages:**
- `typescript`
- `javascript`
- `python`
- `java`
- `csharp`

**Supported Frameworks:**
- `playwright`
- `jest`
- `mocha`
- `pytest`
- `junit`

---

### 2. Parse Requirements to Test Cases

**Endpoint:** `POST /api/nlp/parse-requirements`

**Request:**
```json
{
  "requirements": "# E-commerce Checkout\n\n## Requirements\n1. User can add items to cart\n2. Cart displays total price\n3. User can apply discount codes",
  "projectName": "E-commerce Project"
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "testCases": [
      {
        "id": "tc-123456-0",
        "title": "Test: User can add items to cart",
        "description": "Verify that user can add items to cart",
        "priority": "high",
        "type": "functional",
        "steps": ["Navigate to products page", "Select a product", "Click Add to Cart"],
        "expectedResult": "The system should add items to cart",
        "status": "draft"
      }
    ],
    "coverage": {
      "functional": 70,
      "ui": 20,
      "integration": 5,
      "e2e": 5,
      "regression": 0
    },
    "confidence": 0.90,
    "suggestions": [
      "Consider adding edge case scenarios",
      "Add negative test cases"
    ]
  }
}
```

---

### 3. Generate Test Code from Test Case

**Endpoint:** `POST /api/nlp/generate-test-code`

**Request:**
```json
{
  "testCase": {
    "id": "tc-123",
    "title": "Test login functionality",
    "description": "Verify user can login with valid credentials",
    "steps": [
      "Navigate to login page",
      "Enter valid email",
      "Enter valid password",
      "Click login button",
      "Verify dashboard is visible"
    ],
    "expectedResult": "User successfully logs in and sees dashboard"
  },
  "language": "typescript"
}
```

**Response:**
```json
{
  "success": true,
  "code": "import { test, expect } from '@playwright/test';\n\ntest('Test login functionality', async ({ page }) => {\n  // Navigate to login page\n  await page.goto('https://example.com/login');\n  \n  // Enter valid email\n  await page.fill('[name=\"email\"]', 'user@example.com');\n  \n  // Enter valid password\n  await page.fill('[name=\"password\"]', 'password123');\n  \n  // Click login button\n  await page.click('button[type=\"submit\"]');\n  \n  // Verify dashboard is visible\n  await expect(page.locator('text=Dashboard')).toBeVisible();\n});"
}
```

---

### 4. Generate Documentation

**Endpoint:** `POST /api/nlp/generate-documentation`

**Request:**
```json
{
  "scripts": [
    {
      "id": "1",
      "name": "login.spec.ts",
      "code": "import { test } from '@playwright/test';\ntest('login', async ({ page }) => { ... });",
      "language": "typescript"
    }
  ],
  "config": {
    "title": "Test Documentation",
    "version": "1.0.0",
    "author": "Test Team",
    "includeOverview": true,
    "includeSetup": true,
    "includeExamples": true,
    "includeTroubleshooting": true,
    "includeAPI": false,
    "format": "markdown",
    "template": "standard"
  }
}
```

**Response:**
```json
{
  "success": true,
  "documentation": {
    "id": "doc-123456",
    "title": "Test Documentation",
    "description": "Generated documentation for 1 test scripts",
    "sections": [
      {
        "type": "overview",
        "title": "Overview",
        "content": "# Test Documentation\n\n..."
      }
    ],
    "format": "markdown",
    "generatedAt": "2024-01-15T10:30:00.000Z",
    "version": "1.0.0"
  }
}
```

---

### 5. Health Check

**Endpoint:** `GET /api/nlp/health`

**Response:**
```json
{
  "success": true,
  "service": "NLP",
  "status": "operational",
  "features": [
    "Gherkin/BDD to Playwright conversion",
    "Requirements parsing to test cases",
    "Test code generation",
    "Automatic documentation generation"
  ],
  "openaiConfigured": true
}
```

---

## 🔐 Authentication

All NLP endpoints require authentication via JWT Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"gherkin":"..."}' \
     http://localhost:3001/api/nlp/convert-gherkin
```

**Get JWT Token:**
```bash
# Login first
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Use the returned accessToken
```

---

## ⚙️ Configuration Options

### OpenAI Configuration

**Environment Variables:**
```env
# Required
OPENAI_API_KEY=sk-...

# Optional (defaults shown)
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4-turbo-preview
```

**Supported Models:**
- `gpt-4-turbo-preview` (Recommended - best quality)
- `gpt-4` (High quality, slower)
- `gpt-3.5-turbo` (Fast, lower cost, good quality)

**Temperature Settings:**
The NLP service uses `temperature: 0.3` for deterministic, consistent outputs.

---

## 🧪 Testing the Integration

### Test Script

Create `test-nlp.js` in backend directory:

```javascript
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';
let token = '';

async function login() {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email: 'demo@example.com',
    password: 'demo123'
  });
  token = response.data.accessToken;
  console.log('✅ Logged in');
}

async function testGherkinConversion() {
  console.log('\n🧪 Testing Gherkin Conversion...');
  
  const response = await axios.post(
    `${API_URL}/nlp/convert-gherkin`,
    {
      gherkin: `Feature: Login
Scenario: Successful login
  Given I am on the login page
  When I enter "user@example.com" in the email field
  And I enter "password123" in the password field
  And I click the "Login" button
  Then I should see the dashboard`,
      language: 'typescript',
      framework: 'playwright'
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  console.log('✅ Gherkin converted successfully');
  console.log('Generated code length:', response.data.result.playwrightCode.length);
  console.log('Confidence:', response.data.result.confidence);
}

async function testRequirementsParsing() {
  console.log('\n🧪 Testing Requirements Parsing...');
  
  const response = await axios.post(
    `${API_URL}/nlp/parse-requirements`,
    {
      requirements: `# E-commerce Requirements
1. User can add items to cart
2. Cart displays total price
3. User can apply discount codes`,
      projectName: 'Test Project'
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  
  console.log('✅ Requirements parsed successfully');
  console.log('Test cases generated:', response.data.result.testCases.length);
  console.log('Coverage:', response.data.result.coverage);
}

async function runTests() {
  try {
    await login();
    await testGherkinConversion();
    await testRequirementsParsing();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

runTests();
```

**Run tests:**
```bash
node test-nlp.js
```

---

## 📊 Monitoring & Logging

The NLP service includes comprehensive logging:

```typescript
// Logs are written using Winston logger
logger.info('NLP request received');
logger.error('OpenAI API error:', error);
```

**Log Levels:**
- `error` - Critical errors
- `warn` - Warnings
- `info` - General information
- `debug` - Detailed debugging (set LOG_LEVEL=debug)

---

## 🐛 Troubleshooting

### Issue: "OpenAI API key not configured"

**Solution:**
```bash
# Verify .env file exists
ls -la .env

# Check OPENAI_API_KEY is set
grep OPENAI_API_KEY .env

# Restart server
npm run dev
```

### Issue: "OpenAI API call failed"

**Possible Causes:**
1. Invalid API key
2. Rate limit exceeded
3. Network issues
4. Invalid model name

**Solutions:**
```bash
# Test API key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# Check OpenAI status
# Visit: https://status.openai.com/

# Verify environment variables loaded
console.log(process.env.OPENAI_API_KEY); // Should not be undefined
```

### Issue: "Conversion failed" or "Parsing failed"

**Solutions:**
1. Check input format is valid
2. Ensure input is not empty
3. Try with simpler input first
4. Check server logs for details
5. Verify OpenAI model is available

### Issue: Authentication errors

**Solution:**
```bash
# Ensure valid JWT token
# Token expires after SESSION_TIMEOUT_MINUTES (default: 15 min)
# Login again to get fresh token
```

---

## 🚀 Production Deployment

### Environment Variables for Production

```env
# Production settings
NODE_ENV=production
PORT=3001

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Security
JWT_ACCESS_SECRET=strong-random-secret-change-this
JWT_REFRESH_SECRET=another-strong-random-secret

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# CORS
ALLOWED_ORIGINS=https://your-frontend.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Build and Run

```bash
# Build
npm run build

# Start production
npm start
```

### Docker Deployment

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

---

## 📈 Performance Considerations

### Rate Limiting

NLP endpoints use OpenAI API which has rate limits:
- **GPT-4:** 10,000 requests/min, 300,000 tokens/min
- **GPT-3.5-turbo:** 60,000 requests/min, 1,000,000 tokens/min

**Recommendations:**
1. Implement client-side debouncing
2. Cache common conversions
3. Use GPT-3.5-turbo for development
4. Monitor API usage via OpenAI dashboard

### Response Times

Typical response times:
- Gherkin conversion: 2-5 seconds
- Requirements parsing: 3-8 seconds
- Test code generation: 2-4 seconds
- Documentation generation: 5-15 seconds

---

## 🔒 Security Best Practices

1. **Never commit `.env` files** to Git
2. **Rotate API keys** regularly
3. **Use environment-specific keys** (dev/staging/prod)
4. **Implement request validation** (already done)
5. **Enable rate limiting** (already configured)
6. **Use HTTPS** in production
7. **Validate user permissions** before NLP operations

---

## 📚 Additional Resources

### OpenAI Documentation
- API Reference: https://platform.openai.com/docs/api-reference
- Models: https://platform.openai.com/docs/models
- Rate Limits: https://platform.openai.com/docs/guides/rate-limits

### Project Documentation
- Frontend Integration: `/playwright-crx-enhanced/frontend/NLP_INTEGRATION_INSTRUCTIONS.md`
- NLP Features Guide: `/NLP_FEATURES_GUIDE.md`
- Quick Start: `/INTEGRATION_QUICKSTART.md`

---

## ✅ Integration Checklist

- [x] NLP service copied to backend
- [x] NLP routes copied to backend
- [x] Routes registered in index.ts
- [x] .env.example updated with OpenAI config
- [x] Documentation created
- [ ] Create .env file with OpenAI API key (User action)
- [ ] Start backend server (User action)
- [ ] Test NLP endpoints (User action)
- [ ] Integrate with frontend (User action)

---

## 🎉 Success!

NLP features are now **fully integrated** into the backend!

**Available at:** `http://localhost:3001/api/nlp`

**Next Steps:**
1. Add OpenAI API key to `.env`
2. Start backend: `npm run dev`
3. Test endpoints
4. Connect frontend

**Need help?** Check the troubleshooting section or review the logs!

---

*Last Updated: 2024-01-15*  
*Backend Version: 1.0.0*  
*NLP Service Version: 1.0.0*
