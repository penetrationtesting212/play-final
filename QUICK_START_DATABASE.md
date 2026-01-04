# 🚀 Quick Start: Database Setup (5 Minutes)

## Prerequisites Checklist

- ✅ PostgreSQL 15+ installed
- ✅ Node.js 20+ installed
- ✅ Git repository cloned
- ✅ Backend dependencies installed (`npm install`)

---

## 🎯 3-Step Setup

### Step 1: Configure Environment (1 minute)

```bash
cd /home/user/webapp/playwright-crx-enhanced/backend
cp .env.example .env
nano .env  # or use your preferred editor
```

**Update these values:**
```env
DB_PASSWORD=your_secure_password_here
OPENAI_API_KEY=sk-your-openai-api-key-here
JWT_SECRET=your-jwt-secret-change-this
JWT_REFRESH_SECRET=your-refresh-secret-change-this
```

### Step 2: Setup Database (2 minutes)

```bash
npm run db:setup
```

**This will:**
- ✅ Create `playwright_crx` database
- ✅ Run all migrations (base + NLP tables)
- ✅ Verify 16+ tables created
- ✅ Test database connection
- ✅ Show success confirmation

### Step 3: Start Backend (1 minute)

```bash
npm run dev
```

**Backend will start on:** http://localhost:3001

---

## ✅ Verification (1 minute)

### Test 1: Database Health
```bash
curl http://localhost:3001/db/health
```
**Expected:** `{"status":"ok","database":{"ok":"1"},"timestamp":"..."}`

### Test 2: NLP Health
```bash
curl http://localhost:3001/api/nlp/health
```
**Expected:**
```json
{
  "status": "healthy",
  "openai": { "configured": true },
  "database": { "connected": true },
  "features": ["gherkin-conversion", "requirements-parsing", ...]
}
```

### Test 3: Check Tables
```bash
psql -h localhost -U postgres -d playwright_crx -c "\dt"
```
**Expected:** List of 16+ tables

---

## 🎉 You're Done!

**Database is ready with:**
- ✅ 11 core tables (users, projects, scripts, test_runs, etc.)
- ✅ 5 NLP tables (gherkin, requirements, test_cases, docs, voice)
- ✅ All indexes and foreign keys configured
- ✅ Health check endpoints working
- ✅ Backend server running

---

## 🔧 Troubleshooting

### Issue: PostgreSQL not running
```bash
# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Issue: Password authentication failed
```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'your_password';"
# Then update .env file
```

### Issue: Database already exists
```bash
# Drop and recreate
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS playwright_crx;"
npm run db:setup
```

### Issue: Port 3001 already in use
```bash
# Find and kill process
lsof -ti:3001 | xargs kill -9
# Or change PORT in .env
```

---

## 📚 More Information

| Document | Purpose |
|----------|---------|
| [DATABASE_README.md](playwright-crx-enhanced/backend/DATABASE_README.md) | Comprehensive setup guide |
| [DATABASE_SCHEMA.md](playwright-crx-enhanced/backend/DATABASE_SCHEMA.md) | Database architecture & ERD |
| [DATABASE_IMPLEMENTATION_SUMMARY.md](DATABASE_IMPLEMENTATION_SUMMARY.md) | Complete implementation details |
| [NLP_BACKEND_INTEGRATION.md](playwright-crx-enhanced/backend/NLP_BACKEND_INTEGRATION.md) | NLP API integration |

---

## 💡 Quick Commands

```bash
# Setup database
npm run db:setup

# Reset database (WARNING: deletes all data)
npm run db:reset

# Generate Prisma client
npm run prisma:generate

# Open Prisma Studio (GUI)
npm run prisma:studio

# Start backend
npm run dev

# Build for production
npm run build
npm start
```

---

## 🆘 Need Help?

1. Check [DATABASE_README.md](playwright-crx-enhanced/backend/DATABASE_README.md) troubleshooting section
2. Review logs: `tail -f logs/app.log` (if logging is configured)
3. Check backend console output for errors
4. Verify .env configuration: `cat .env`
5. Test database connection: `psql -h localhost -U postgres -d playwright_crx`

---

**Total Setup Time:** ~5 minutes  
**Status:** Production Ready  
**Repository:** https://github.com/penetrationtesting212/play-final  
**Branch:** feature/play-final-complete-sync  
**Latest Commit:** 59c02a9

---

**🎯 Next:** Start using NLP features!
- Convert Gherkin to Playwright code
- Parse requirements automatically
- Generate test cases from requirements
- Create documentation
- Use voice commands for testing

**API Endpoint:** http://localhost:3001/api/nlp/
