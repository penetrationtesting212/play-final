# 🔧 Backend API Integration with PostgreSQL - Complete Guide

## Overview

Complete **Node.js + Express + TypeScript + PostgreSQL** backend integration for the Playwright-CRX platform with comprehensive REST API endpoints, database migrations, and multi-database testing support.

---

## 🎯 Architecture

```
Backend Stack:
├── Node.js (v18+)
├── Express.js (Web Framework)
├── TypeScript (Type Safety)
├── PostgreSQL (Primary Database)
├── MySQL / MongoDB / Oracle (Testing Databases)
└── JWT Authentication
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.config.ts      # Database configurations
│   ├── routes/
│   │   ├── users.routes.ts         # User CRUD operations
│   │   ├── auth.routes.ts          # Authentication
│   │   ├── script.routes.ts        # Script management
│   │   ├── project.routes.ts       # Project management
│   │   └── database.ts             # Database testing API
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Database schema
│   ├── scripts/
│   │   └── migrate.ts              # Migration runner
│   └── server.ts                   # Main server file
├── database/
│   ├── DatabaseManager.js          # Multi-DB manager
│   ├── DatabaseSeeder.js           # Data seeding
│   └── DatabaseSnapshot.js         # State snapshots
└── package.json
```

---

## 🚀 Quick Start

### 1. **Prerequisites**

```bash
# Install Node.js 18+
node --version  # Should be >= 18

# Install PostgreSQL
psql --version  # Should be >= 12
```

### 2. **Environment Setup**

Create `.env` file in backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=playwright_crx
DB_USER=postgres
DB_PASSWORD=your_password
DB_POOL_SIZE=20
DB_SSL=false

# MySQL (Optional - for testing)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=playwright_test
MYSQL_USER=root
MYSQL_PASSWORD=password

# MongoDB (Optional - for testing)
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DATABASE=playwright_test
MONGO_USER=admin
MONGO_PASSWORD=password

# Oracle (Optional - for testing)
ORACLE_HOST=localhost
ORACLE_PORT=1521
ORACLE_DATABASE=ORCL
ORACLE_USER=system
ORACLE_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 3. **Install Dependencies**

```bash
cd backend
npm install

# Or from root
npm install
```

### 4. **Setup Database**

```bash
# Create PostgreSQL database
createdb playwright_crx

# Run migrations
npm run migrate

# Or manually with psql
psql -U postgres -d playwright_crx -f src/migrations/001_initial_schema.sql
```

### 5. **Start Server**

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Server will start at: `http://localhost:3001`

---

## 📚 API Endpoints

### Health & Info

#### GET `/health`
Check server and database health

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-01-02T12:00:00.000Z",
  "database": "connected",
  "dbTime": "2026-01-02T12:00:00.000Z",
  "uptime": 123.456,
  "memory": {...}
}
```

#### GET `/api`
API information and available endpoints

---

### User Management

#### GET `/api/users`
Get all users

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2026-01-02T12:00:00.000Z",
      "updatedAt": "2026-01-02T12:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### GET `/api/users/:id`
Get specific user

#### POST `/api/users`
Create new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

#### PUT `/api/users/:id`
Update user

**Request Body:**
```json
{
  "email": "newemail@example.com",
  "name": "Updated Name"
}
```

#### DELETE `/api/users/:id`
Delete user

#### GET `/api/users/:id/stats`
Get user statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "projectCount": 5,
    "scriptCount": 15,
    "testRunCount": 100,
    "passedTests": 85,
    "failedTests": 15
  }
}
```

---

### Authentication

#### POST `/api/auth/register`
Register new user

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### POST `/api/auth/login`
User login

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

---

### Database Testing (See DATABASE_TESTING_GUIDE.md for details)

#### POST `/api/database/connect`
Connect to a database

#### POST `/api/database/query`
Execute SQL query

#### POST `/api/database/seed`
Seed test data

#### POST `/api/database/snapshot/create`
Create database snapshot

#### POST `/api/database/snapshot/restore`
Restore database snapshot

---

## 🗄️ Database Schema

### Tables

1. **User** - User accounts
2. **Project** - Test projects
3. **Script** - Test scripts
4. **TestRun** - Test execution records
5. **DatabaseSnapshot** - Database state snapshots
6. **SeedData** - Test data seeds
7. **ApiRequest** - API test requests
8. **TestData** - Test data management
9. **Session** - User sessions

### Relationships

```
User (1) ──── (N) Project
User (1) ──── (N) Script
User (1) ──── (N) TestRun
Project (1) ─ (N) Script
Script (1) ── (N) TestRun
```

---

## 💻 Code Examples

### Basic CRUD Operations

```typescript
import { pool } from './config/database.config';

// Create
async function createUser(email: string, password: string, name: string) {
  const result = await pool.query(`
    INSERT INTO "User" (email, password, name)
    VALUES ($1, $2, $3)
    RETURNING *
  `, [email, password, name]);
  
  return result.rows[0];
}

// Read
async function getUser(id: string) {
  const result = await pool.query(`
    SELECT * FROM "User" WHERE id = $1
  `, [id]);
  
  return result.rows[0];
}

// Update
async function updateUser(id: string, name: string) {
  const result = await pool.query(`
    UPDATE "User"
    SET name = $1
    WHERE id = $2
    RETURNING *
  `, [name, id]);
  
  return result.rows[0];
}

// Delete
async function deleteUser(id: string) {
  await pool.query(`
    DELETE FROM "User" WHERE id = $1
  `, [id]);
}
```

### Transactions

```typescript
async function transferData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Multiple operations
    await client.query('UPDATE ... ');
    await client.query('INSERT ... ');
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

### Complex Queries

```typescript
// Join query
async function getUserWithStats(userId: string) {
  const result = await pool.query(`
    SELECT 
      u.*,
      COUNT(DISTINCT p.id) as project_count,
      COUNT(DISTINCT s.id) as script_count,
      COUNT(DISTINCT tr.id) as test_count
    FROM "User" u
    LEFT JOIN "Project" p ON p."userId" = u.id
    LEFT JOIN "Script" s ON s."userId" = u.id
    LEFT JOIN "TestRun" tr ON tr."userId" = u.id
    WHERE u.id = $1
    GROUP BY u.id
  `, [userId]);
  
  return result.rows[0];
}
```

---

## 🔒 Security

### Best Practices Implemented

1. **Password Hashing** - bcrypt with salt rounds
2. **SQL Injection Prevention** - Parameterized queries
3. **CORS** - Configurable origins
4. **Helmet** - Security headers
5. **Rate Limiting** - Request throttling
6. **JWT Authentication** - Secure tokens
7. **Input Validation** - Type checking
8. **Environment Variables** - Sensitive data protection

---

## 📈 Performance Optimization

### Connection Pooling

```typescript
export const pool = new Pool({
  max: 20,                      // Maximum connections
  idleTimeoutMillis: 30000,    // Close idle connections
  connectionTimeoutMillis: 5000 // Connection timeout
});
```

### Indexes

All tables have proper indexes on:
- Primary keys (UUID)
- Foreign keys
- Frequently queried columns
- Timestamp columns for sorting

### Query Optimization

- Use `SELECT` with specific columns
- Avoid `SELECT *` in production
- Use `EXPLAIN ANALYZE` for slow queries
- Implement pagination for large datasets

---

## 🧪 Testing

### Run Migrations

```bash
npm run migrate
```

### Test Database Connection

```bash
curl http://localhost:3001/health
```

### Test API Endpoints

```bash
# Create user
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Get users
curl http://localhost:3001/api/users
```

---

## 🐛 Troubleshooting

### Connection Issues

**Problem:** `ECONNREFUSED` error

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U postgres -d playwright_crx
```

### Migration Errors

**Problem:** Migration fails

**Solution:**
```bash
# Check current migrations
psql -U postgres -d playwright_crx -c 'SELECT * FROM "Migrations"'

# Reset (CAUTION: Deletes all data)
dropdb playwright_crx
createdb playwright_crx
npm run migrate
```

### Port Already in Use

**Problem:** Port 3001 is already in use

**Solution:**
```bash
# Find process using port
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3002
```

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🎉 Summary

✅ **Complete Node.js + PostgreSQL backend**  
✅ **TypeScript for type safety**  
✅ **RESTful API endpoints**  
✅ **Database migrations**  
✅ **Multi-database support**  
✅ **Authentication & authorization**  
✅ **Security best practices**  
✅ **Performance optimizations**  
✅ **Comprehensive error handling**  
✅ **Production-ready code**

---

**Version**: 1.0.0  
**Last Updated**: January 2, 2026  
**Status**: Production Ready 🚀
