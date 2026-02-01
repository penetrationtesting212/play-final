# 🎭 Playwright CRX - Object Repository Integration

## 📍 Project Location
**Primary Path:** `/home/user/webapp/playwright-crx/`

```
playwright-crx/
├── backend/                    # Backend API Server
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   │   └── objectRepository.controller.ts
│   │   ├── services/          # Business logic
│   │   │   └── objectRepository.service.ts
│   │   ├── routes/            # API routes
│   │   │   └── objectRepository.routes.ts
│   │   ├── types/             # TypeScript types
│   │   │   └── objectRepository.types.ts
│   │   ├── migrations/        # Database migrations
│   │   │   └── 006_create_object_repository.sql
│   │   └── index.ts           # Main server file
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── frontend/                   # React Frontend
    ├── src/
    │   ├── components/        # React components
    │   │   ├── ObjectRepository.tsx
    │   │   └── ObjectRepository.css
    │   ├── services/          # Frontend services
    │   │   └── pageObjectCodeGenerator.ts
    │   ├── types/             # TypeScript types
    │   │   └── objectRepository.types.ts
    │   ├── App.tsx
    │   ├── App.css
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── tsconfig.json
    └── vite.config.ts
```

## 🎯 Overview

The Object Repository is a centralized system for managing UI elements across your Playwright tests. It provides:

- **✅ Centralized Element Storage** - Store all UI elements in one place
- **🔄 Page Object Model (POM)** - Auto-generate Page Object classes
- **🌐 Multi-Language Support** - TypeScript, JavaScript, Python, Java, C#
- **🔍 Multiple Locator Strategies** - CSS, XPath, TestID, Text, ARIA
- **🔧 Self-Healing** - Automatic recovery from broken selectors
- **📊 Usage Analytics** - Track element usage across tests
- **🎨 Modern UI** - Beautiful React interface

## 🚀 Quick Start

### 1️⃣ Backend Setup

```bash
cd /home/user/webapp/playwright-crx/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run database migration
psql -U postgres -d playwright_crx -f src/migrations/006_create_object_repository.sql

# Start backend server
npm run dev
```

Backend will be available at: `http://localhost:3001`

### 2️⃣ Frontend Setup

```bash
cd /home/user/webapp/playwright-crx/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### 3️⃣ Verify Installation

```bash
# Check backend health
curl http://localhost:3001/health

# Check Object Repository API
curl http://localhost:3001/api/object-repository/statistics
```

## 📊 Database Schema

The Object Repository uses PostgreSQL with the following tables:

### `or_pages` - Page definitions
```sql
CREATE TABLE or_pages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  url_pattern TEXT,
  description TEXT,
  project_id INTEGER REFERENCES projects(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `or_elements` - UI element definitions
```sql
CREATE TABLE or_elements (
  id SERIAL PRIMARY KEY,
  page_id INTEGER REFERENCES or_pages(id),
  name VARCHAR(255) NOT NULL,
  selector TEXT NOT NULL,
  locator_strategy VARCHAR(50),
  element_type VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `or_element_usages` - Usage tracking
```sql
CREATE TABLE or_element_usages (
  id SERIAL PRIMARY KEY,
  element_id INTEGER REFERENCES or_elements(id),
  script_id INTEGER REFERENCES scripts(id),
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

### Pages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/object-repository/pages` | Get all pages |
| `POST` | `/api/object-repository/pages` | Create new page |
| `GET` | `/api/object-repository/pages/:id` | Get page by ID |
| `PUT` | `/api/object-repository/pages/:id` | Update page |
| `DELETE` | `/api/object-repository/pages/:id` | Delete page |

### Elements

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/object-repository/elements` | Get all elements |
| `POST` | `/api/object-repository/elements` | Create new element |
| `GET` | `/api/object-repository/elements/:id` | Get element by ID |
| `PUT` | `/api/object-repository/elements/:id` | Update element |
| `DELETE` | `/api/object-repository/elements/:id` | Delete element |
| `GET` | `/api/object-repository/elements/page/:pageId` | Get elements by page |

### Code Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/object-repository/generate/page-object/:pageId` | Generate Page Object code |
| `POST` | `/api/object-repository/generate/all-page-objects` | Generate all Page Objects |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/object-repository/statistics` | Get repository statistics |
| `POST` | `/api/object-repository/validate-selector` | Validate a selector |
| `POST` | `/api/object-repository/import` | Bulk import elements |
| `POST` | `/api/object-repository/export` | Export repository data |

## 💻 Frontend Component Usage

### Basic Usage

```tsx
import ObjectRepository from '@/components/ObjectRepository';

function App() {
  return (
    <div>
      <h1>My Test Management</h1>
      <ObjectRepository />
    </div>
  );
}
```

### With Custom API URL

```tsx
import ObjectRepository from '@/components/ObjectRepository';

function App() {
  return (
    <ObjectRepository 
      apiBaseUrl="http://your-backend:3001/api/object-repository"
    />
  );
}
```

## 🔧 Code Generation Examples

### TypeScript Page Object

```typescript
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  // Elements
  get usernameInput() {
    return this.page.locator('#username');
  }

  get passwordInput() {
    return this.page.locator('#password');
  }

  get loginButton() {
    return this.page.locator('button[type="submit"]');
  }

  // Actions
  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

### Python Page Object

```python
class LoginPage:
    def __init__(self, page):
        self.page = page
    
    @property
    def username_input(self):
        return self.page.locator('#username')
    
    @property
    def password_input(self):
        return self.page.locator('#password')
    
    @property
    def login_button(self):
        return self.page.locator('button[type="submit"]')
    
    async def login(self, username: str, password: str):
        await self.username_input.fill(username)
        await self.password_input.fill(password)
        await self.login_button.click()
```

## 🎨 Features

### 1. Centralized Element Management
- Store all UI elements in a central database
- Organize elements by pages
- Update selectors in one place, affect all tests

### 2. Page Object Model Generation
- Automatically generate Page Object classes
- Support for multiple programming languages
- Include common actions and validations

### 3. Multiple Locator Strategies
- **CSS Selectors**: `#id`, `.class`, `[attribute]`
- **XPath**: `//div[@class="example"]`
- **Test ID**: `data-testid="submit-button"`
- **Text Content**: `text=Login`
- **ARIA Labels**: `aria-label="Submit"`

### 4. Self-Healing Locators
- Track broken selectors
- Suggest alternative locators
- Maintain fallback strategies

### 5. Usage Analytics
- Track which elements are used in tests
- Identify unused elements
- Monitor selector changes

### 6. Import/Export
- Import elements from existing tests
- Export repository for backup
- Bulk operations support

## 🔌 Integration with Chrome Extension

### Recording Elements During Codegen

When you use the Playwright CRX recorder to record tests, elements are automatically captured and stored in the Object Repository:

```typescript
// In background.ts or recorder
async function captureElement(element: Element) {
  const elementData = {
    name: generateElementName(element),
    selector: generateSelector(element),
    locatorStrategy: 'css',
    elementType: element.tagName.toLowerCase(),
    description: element.getAttribute('aria-label') || '',
  };

  // Send to backend
  await fetch('http://localhost:3001/api/object-repository/elements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(elementData),
  });
}
```

### Using Repository in Generated Code

```typescript
// Generated test using Object Repository
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test('user login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await page.goto('https://example.com/login');
  await loginPage.login('user@example.com', 'password123');
  
  await expect(page).toHaveURL(/dashboard/);
});
```

## 🛠️ Configuration

### Backend Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=playwright_crx
DB_USER=postgres
DB_PASSWORD=your_password

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000,chrome-extension://*

# Object Repository
OR_MAX_ELEMENTS=10000
OR_MAX_PAGES=1000
OR_CACHE_TTL=3600
```

### Frontend Vite Configuration

```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
```

## 📈 Best Practices

### 1. Naming Conventions
```
Page Names: LoginPage, CheckoutPage, DashboardPage
Element Names: usernameInput, submitButton, errorMessage
```

### 2. Selector Priority
1. Test IDs (`data-testid`)
2. ARIA labels
3. Unique CSS selectors
4. Text content (for static text)
5. XPath (as last resort)

### 3. Organize by Pages
Group related elements together:
- LoginPage: username, password, submit, forgotPassword
- CheckoutPage: cardNumber, cvv, submitPayment, billingAddress

### 4. Include Descriptions
Add helpful descriptions to elements:
```
"Submit login form button - primary CTA"
"Error message displayed on validation failure"
```

### 5. Track Usage
Regularly review unused elements:
```sql
SELECT e.name, e.selector
FROM or_elements e
LEFT JOIN or_element_usages u ON e.id = u.element_id
WHERE u.id IS NULL;
```

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check if port 3001 is available
lsof -i :3001

# Check database connection
psql -U postgres -d playwright_crx -c "SELECT 1"

# View logs
npm run dev 2>&1 | tee server.log
```

### Frontend won't start
```bash
# Check if port 3000 is available
lsof -i :3000

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build
```

### Database migration fails
```bash
# Check if database exists
psql -U postgres -l | grep playwright_crx

# Create database if needed
psql -U postgres -c "CREATE DATABASE playwright_crx"

# Re-run migration
psql -U postgres -d playwright_crx -f src/migrations/006_create_object_repository.sql
```

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev)
- [Page Object Model Pattern](https://martinfowler.com/bliki/PageObject.html)
- [React Documentation](https://react.dev)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## 📝 License

Apache License 2.0 - see LICENSE file for details

## 🙋 Support

For issues, questions, or contributions:
- GitHub Issues: [Create an issue]
- Documentation: Check this README and inline code comments
- Email: [Your support email]

---

**Built with ❤️ using Playwright, React, and PostgreSQL**
