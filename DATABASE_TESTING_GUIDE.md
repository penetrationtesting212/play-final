# 🗄️ Database Testing Features - Complete Guide

## Overview

The Playwright-CRX platform now includes **enterprise-grade database testing features** that support multiple database types, allowing you to seamlessly integrate database operations into your test workflows.

### Supported Databases

- ✅ **PostgreSQL** - Full support with advanced features
- ✅ **MySQL** - Complete compatibility with MySQL 5.7+
- ✅ **MongoDB** - NoSQL database support
- ✅ **Oracle** - Enterprise Oracle database support

---

## 🎯 Core Features

### 1. **Database Seeding**
Populate your database with test data before running tests.

### 2. **SQL Query Execution & Validation**
Execute queries and validate results against expected outcomes.

### 3. **Database State Snapshots**
Capture and restore database states for consistent testing.

### 4. **Multi-Database Support**
Connect and manage multiple databases simultaneously.

---

## 🚀 Quick Start

### Installation

```bash
# Install database drivers (already included in package.json)
npm install

# For Oracle, you may need additional setup:
# Download Oracle Instant Client from:
# https://www.oracle.com/database/technologies/instant-client.html
```

### Basic Usage

```javascript
// 1. Connect to a database
const connectionId = await connectDatabase({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'testdb',
  user: 'postgres',
  password: 'password'
});

// 2. Create a snapshot before tests
await createSnapshot(connectionId, 'before_test');

// 3. Seed test data
await seedData(connectionId, {
  users: [
    { name: 'John Doe', email: 'john@test.com' },
    { name: 'Jane Smith', email: 'jane@test.com' }
  ]
});

// 4. Run your tests...

// 5. Restore to original state
await restoreSnapshot(connectionId, 'before_test');
```

---

## 📚 Detailed Features

### Database Connection

#### Connect to PostgreSQL
```javascript
POST /api/database/connect
{
  "connectionId": "my-postgres-conn",
  "config": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "testdb",
    "user": "postgres",
    "password": "password"
  }
}
```

#### Connect to MySQL
```javascript
POST /api/database/connect
{
  "connectionId": "my-mysql-conn",
  "config": {
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "database": "testdb",
    "user": "root",
    "password": "password"
  }
}
```

#### Connect to MongoDB
```javascript
POST /api/database/connect
{
  "connectionId": "my-mongo-conn",
  "config": {
    "type": "mongodb",
    "host": "localhost",
    "port": 27017,
    "database": "testdb",
    "user": "admin",
    "password": "password"
  }
}
```

#### Connect to Oracle
```javascript
POST /api/database/connect
{
  "connectionId": "my-oracle-conn",
  "config": {
    "type": "oracle",
    "host": "localhost",
    "port": 1521,
    "database": "ORCL",
    "user": "system",
    "password": "password"
  }
}
```

---

### Database Seeding

#### Method 1: Inline Data
```javascript
POST /api/database/seed
{
  "connectionId": "my-conn",
  "source": "inline",
  "data": {
    "users": [
      { "id": 1, "name": "John", "email": "john@test.com" },
      { "id": 2, "name": "Jane", "email": "jane@test.com" }
    ],
    "products": [
      { "id": 1, "name": "Product A", "price": 99.99 }
    ]
  },
  "options": {
    "truncateFirst": true,
    "updateOnConflict": false
  }
}
```

#### Method 2: From JSON File
```javascript
POST /api/database/seed
{
  "connectionId": "my-conn",
  "source": "json",
  "data": {
    "filePath": "/path/to/seed-data.json"
  },
  "options": {
    "truncateFirst": true
  }
}
```

**seed-data.json:**
```json
{
  "users": [
    { "id": 1, "name": "Alice", "email": "alice@test.com" },
    { "id": 2, "name": "Bob", "email": "bob@test.com" }
  ]
}
```

#### Method 3: From SQL File (PostgreSQL/MySQL/Oracle only)
```javascript
POST /api/database/seed
{
  "connectionId": "my-conn",
  "source": "sql",
  "data": {
    "filePath": "/path/to/seed.sql"
  }
}
```

**seed.sql:**
```sql
INSERT INTO users (id, name, email) VALUES (1, 'Alice', 'alice@test.com');
INSERT INTO users (id, name, email) VALUES (2, 'Bob', 'bob@test.com');
INSERT INTO products (id, name, price) VALUES (1, 'Product A', 99.99);
```

#### Method 4: Generate Data Dynamically
```javascript
POST /api/database/seed
{
  "connectionId": "my-conn",
  "source": "generate",
  "data": {
    "table": "users",
    "count": 100,
    "schema": {
      "id": { "type": "id" },
      "name": { "type": "string", "faker": "{{name.firstName}} {{name.lastName}}" },
      "email": { "type": "email" },
      "age": { "type": "number", "options": { "min": 18, "max": 65 } },
      "active": { "type": "boolean" },
      "created_at": { "type": "timestamp" }
    }
  }
}
```

---

### Query Execution & Validation

#### Simple Query
```javascript
POST /api/database/query
{
  "connectionId": "my-conn",
  "query": "SELECT * FROM users WHERE id = $1",
  "params": [1]
}
```

**Response:**
```json
{
  "success": true,
  "result": {
    "rows": [
      { "id": 1, "name": "Alice", "email": "alice@test.com" }
    ],
    "rowCount": 1
  },
  "validation": {
    "passed": true,
    "errors": [],
    "executionTime": 45
  }
}
```

#### Query with Validation
```javascript
POST /api/database/query
{
  "connectionId": "my-conn",
  "query": "SELECT * FROM users WHERE email = $1",
  "params": ["alice@test.com"],
  "validate": {
    "rowCount": 1,
    "values": {
      "name": "Alice",
      "email": "alice@test.com"
    }
  }
}
```

**Response with Validation:**
```json
{
  "success": true,
  "result": {
    "rows": [
      { "id": 1, "name": "Alice", "email": "alice@test.com" }
    ],
    "rowCount": 1
  },
  "validation": {
    "passed": true,
    "errors": [],
    "executionTime": 32
  }
}
```

---

### Database Snapshots

#### Create Snapshot
```javascript
POST /api/database/snapshot/create
{
  "connectionId": "my-conn",
  "snapshotName": "before_critical_test",
  "options": {
    "tables": ["users", "products"],  // Optional: specify tables, empty = all tables
    "includeData": true,               // Include actual data
    "saveToDisk": true,                // Save to disk for persistence
    "compress": false                  // Compress snapshot
  }
}
```

**Response:**
```json
{
  "success": true,
  "snapshot": "before_critical_test",
  "tableCount": 5,
  "timestamp": "2026-01-02T10:30:00.000Z"
}
```

#### Restore Snapshot
```javascript
POST /api/database/snapshot/restore
{
  "connectionId": "my-conn",
  "snapshotName": "before_critical_test",
  "options": {
    "tables": [],              // Optional: specific tables to restore
    "truncateFirst": true      // Clear tables before restoring
  }
}
```

**Response:**
```json
{
  "success": true,
  "snapshot": "before_critical_test",
  "results": [
    { "table": "users", "success": true, "rowsRestored": 10 },
    { "table": "products", "success": true, "rowsRestored": 5 }
  ]
}
```

#### List Snapshots
```javascript
GET /api/database/snapshot/list?connectionId=my-conn
```

**Response:**
```json
{
  "success": true,
  "snapshots": [
    {
      "name": "before_critical_test",
      "timestamp": "2026-01-02T10:30:00.000Z",
      "database": "testdb",
      "tableCount": 5
    }
  ]
}
```

#### Delete Snapshot
```javascript
DELETE /api/database/snapshot/before_critical_test?connectionId=my-conn
```

---

## 🎨 UI Component Usage

### Using the DatabaseTesting Component

```tsx
import { DatabaseTesting } from './components/DatabaseTesting';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <ToastProvider position="top-right">
      <DatabaseTesting />
    </ToastProvider>
  );
}
```

The UI provides:
- **Connection Manager**: Create and manage multiple database connections
- **Query Editor**: Execute SQL queries with syntax highlighting
- **Data Seeder**: Seed tables with JSON data
- **Snapshot Manager**: Create and restore database snapshots

---

## 🔧 Advanced Usage

### Transaction Support

```javascript
const transaction = await beginTransaction(connectionId);

try {
  // Execute operations
  await query(connectionId, 'INSERT INTO users ...', [], transaction);
  await query(connectionId, 'INSERT INTO orders ...', [], transaction);
  
  // Commit
  await commitTransaction(connectionId, transaction);
} catch (error) {
  // Rollback on error
  await rollbackTransaction(connectionId, transaction);
}
```

### MongoDB-Specific Operations

```javascript
// For MongoDB, you can access collections directly
POST /api/database/query
{
  "connectionId": "mongo-conn",
  "operation": "insertMany",
  "collection": "users",
  "data": [
    { "name": "Alice", "age": 30 },
    { "name": "Bob", "age": 25 }
  ]
}
```

### Health Checks

```javascript
GET /api/database/health?connectionId=my-conn
```

**Response:**
```json
{
  "success": true,
  "health": {
    "healthy": true,
    "type": "postgresql",
    "database": "testdb"
  }
}
```

---

## 📊 Best Practices

### 1. **Use Snapshots for Test Isolation**
```javascript
beforeAll(async () => {
  await createSnapshot(connectionId, 'initial_state');
});

afterEach(async () => {
  await restoreSnapshot(connectionId, 'initial_state');
});
```

### 2. **Seed Data in Stages**
```javascript
// Seed base data
await seedData(connectionId, { users: baseUsers });

// Seed test-specific data
await seedData(connectionId, { orders: testOrders });
```

### 3. **Validate Query Results**
```javascript
const result = await executeQuery(connectionId, query, params, {
  rowCount: expectedCount,
  values: { status: 'active' }
});

if (!result.validation.passed) {
  throw new Error(result.validation.errors.join(', '));
}
```

### 4. **Clean Up Connections**
```javascript
afterAll(async () => {
  await disconnectDatabase(connectionId);
});
```

---

## 🐛 Troubleshooting

### Connection Issues

**PostgreSQL:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U postgres -d testdb
```

**MySQL:**
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check connection
mysql -h localhost -u root -p testdb
```

**MongoDB:**
```bash
# Check MongoDB is running
sudo systemctl status mongod

# Check connection
mongosh mongodb://localhost:27017/testdb
```

**Oracle:**
```bash
# Check Oracle listener
lsnrctl status

# Check connection
sqlplus system/password@localhost:1521/ORCL
```

### Common Errors

#### "Connection timeout"
- Check database is running
- Verify firewall allows connections
- Check host/port configuration

#### "Authentication failed"
- Verify username and password
- Check user has necessary permissions
- For PostgreSQL: check `pg_hba.conf`

#### "Table not found"
- Verify table name spelling
- Check schema/database name
- Ensure user has table access

---

## 📈 Performance Considerations

### Optimization Tips

1. **Use Connection Pooling** (Already implemented)
   - PostgreSQL: Max 10 connections
   - MySQL: Max 10 connections
   - MongoDB: Max 10 connections

2. **Limit Snapshot Size**
   ```javascript
   // Only snapshot necessary tables
   await createSnapshot(connectionId, 'test_snapshot', {
     tables: ['users', 'orders']
   });
   ```

3. **Use Batch Operations**
   ```javascript
   // Seed in batches instead of individual inserts
   await seedData(connectionId, { users: largeUserArray });
   ```

4. **Clean Up Old Snapshots**
   ```javascript
   // Periodically delete old snapshots
   await deleteSnapshot(connectionId, 'old_snapshot');
   ```

---

## 🔐 Security

### Best Practices

1. **Never commit database credentials**
   ```javascript
   // Use environment variables
   const config = {
     type: 'postgresql',
     host: process.env.DB_HOST,
     port: process.env.DB_PORT,
     database: process.env.DB_NAME,
     user: process.env.DB_USER,
     password: process.env.DB_PASSWORD
   };
   ```

2. **Use read-only users for query validation**

3. **Limit snapshot disk storage**

4. **Implement connection timeouts**

5. **Use SSL/TLS for production databases**

---

## 📝 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/database/connect` | Connect to database |
| POST | `/api/database/disconnect` | Disconnect from database |
| POST | `/api/database/query` | Execute query |
| POST | `/api/database/seed` | Seed data |
| POST | `/api/database/snapshot/create` | Create snapshot |
| POST | `/api/database/snapshot/restore` | Restore snapshot |
| GET | `/api/database/snapshot/list` | List snapshots |
| DELETE | `/api/database/snapshot/:name` | Delete snapshot |
| GET | `/api/database/health` | Health check |
| GET | `/api/database/connections` | List connections |

---

## 🎉 Examples

### Complete Test Workflow

```javascript
const { DatabaseManager, DatabaseSeeder, DatabaseSnapshot } = require('./database');

async function runDatabaseTest() {
  // 1. Connect
  const db = new DatabaseManager({
    type: 'postgresql',
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    user: 'postgres',
    password: 'password'
  });
  
  await db.connect();
  
  // 2. Create snapshot
  const snapshot = new DatabaseSnapshot(db);
  await snapshot.initialize();
  await snapshot.createSnapshot('before_test');
  
  // 3. Seed data
  const seeder = new DatabaseSeeder(db);
  await seeder.seedTable('users', [
    { id: 1, name: 'Test User', email: 'test@example.com' }
  ]);
  
  // 4. Run tests
  const result = await db.query('SELECT * FROM users WHERE id = $1', [1]);
  console.log('User found:', result.rows[0]);
  
  // 5. Restore snapshot
  await snapshot.restoreSnapshot('before_test');
  
  // 6. Disconnect
  await db.disconnect();
}

runDatabaseTest().catch(console.error);
```

---

## 🚀 Next Steps

1. **Integrate with CI/CD**: Add database seeding to your test pipeline
2. **Create reusable seed files**: Build a library of test data
3. **Automate snapshot management**: Schedule regular snapshots
4. **Monitor performance**: Track query execution times

---

## 📞 Support

For issues or questions:
- Check [GitHub Issues](https://github.com/yourusername/playwright-crx/issues)
- Read [API Documentation](./API_DOCS.md)
- Contact support team

---

**Last Updated**: January 2, 2026
**Version**: 1.0.0
