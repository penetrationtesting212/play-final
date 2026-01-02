/**
 * Enterprise Database Manager
 * Supports multiple database types: PostgreSQL, MySQL, MongoDB, Oracle
 */

const { Pool: PgPool } = require('pg');
const mysql = require('mysql2/promise');
const { MongoClient } = require('mongodb');
const oracledb = require('oracledb');

class DatabaseManager {
  constructor(config) {
    this.config = config;
    this.type = config.type; // 'postgresql', 'mysql', 'mongodb', 'oracle'
    this.connection = null;
    this.snapshots = new Map();
  }

  /**
   * Connect to database based on type
   */
  async connect() {
    try {
      switch (this.type) {
        case 'postgresql':
          this.connection = new PgPool({
            host: this.config.host,
            port: this.config.port || 5432,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            max: this.config.poolSize || 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          });
          await this.connection.query('SELECT NOW()');
          break;

        case 'mysql':
          this.connection = await mysql.createPool({
            host: this.config.host,
            port: this.config.port || 3306,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            waitForConnections: true,
            connectionLimit: this.config.poolSize || 10,
            queueLimit: 0,
          });
          await this.connection.query('SELECT 1');
          break;

        case 'mongodb':
          const mongoUrl = this.config.url || 
            `mongodb://${this.config.user}:${this.config.password}@${this.config.host}:${this.config.port || 27017}/${this.config.database}`;
          this.connection = new MongoClient(mongoUrl, {
            maxPoolSize: this.config.poolSize || 10,
          });
          await this.connection.connect();
          await this.connection.db().admin().ping();
          break;

        case 'oracle':
          oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
          oracledb.autoCommit = true;
          this.connection = await oracledb.createPool({
            user: this.config.user,
            password: this.config.password,
            connectString: this.config.connectString || `${this.config.host}:${this.config.port || 1521}/${this.config.database}`,
            poolMin: 2,
            poolMax: this.config.poolSize || 10,
            poolIncrement: 1,
          });
          break;

        default:
          throw new Error(`Unsupported database type: ${this.type}`);
      }

      console.log(`✓ Connected to ${this.type} database: ${this.config.database}`);
      return true;
    } catch (error) {
      console.error(`✗ Failed to connect to ${this.type} database:`, error.message);
      throw error;
    }
  }

  /**
   * Execute a query
   */
  async query(sql, params = []) {
    try {
      switch (this.type) {
        case 'postgresql':
          const pgResult = await this.connection.query(sql, params);
          return { rows: pgResult.rows, rowCount: pgResult.rowCount };

        case 'mysql':
          const [mysqlRows] = await this.connection.query(sql, params);
          return { rows: mysqlRows, rowCount: mysqlRows.length };

        case 'mongodb':
          // MongoDB queries should be handled differently
          throw new Error('For MongoDB, use collection-specific methods');

        case 'oracle':
          const oracleConn = await this.connection.getConnection();
          try {
            const oracleResult = await oracleConn.execute(sql, params);
            return { rows: oracleResult.rows, rowCount: oracleResult.rowsAffected };
          } finally {
            await oracleConn.close();
          }

        default:
          throw new Error(`Unsupported database type: ${this.type}`);
      }
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  }

  /**
   * Execute raw SQL/Query with validation
   */
  async executeWithValidation(query, expectedResult = {}) {
    const startTime = Date.now();
    const result = await this.query(query);
    const executionTime = Date.now() - startTime;

    const validation = {
      passed: true,
      errors: [],
      executionTime,
    };

    // Validate row count
    if (expectedResult.rowCount !== undefined && result.rowCount !== expectedResult.rowCount) {
      validation.passed = false;
      validation.errors.push(`Expected ${expectedResult.rowCount} rows, got ${result.rowCount}`);
    }

    // Validate specific values
    if (expectedResult.values && result.rows.length > 0) {
      const firstRow = result.rows[0];
      for (const [key, expectedValue] of Object.entries(expectedResult.values)) {
        if (firstRow[key] !== expectedValue) {
          validation.passed = false;
          validation.errors.push(`Expected ${key} to be ${expectedValue}, got ${firstRow[key]}`);
        }
      }
    }

    return {
      result,
      validation,
    };
  }

  /**
   * Get MongoDB collection (for MongoDB only)
   */
  getCollection(collectionName) {
    if (this.type !== 'mongodb') {
      throw new Error('getCollection is only available for MongoDB');
    }
    return this.connection.db().collection(collectionName);
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    try {
      switch (this.type) {
        case 'postgresql':
          await this.connection.end();
          break;
        case 'mysql':
          await this.connection.end();
          break;
        case 'mongodb':
          await this.connection.close();
          break;
        case 'oracle':
          await this.connection.close();
          break;
      }
      console.log(`✓ Disconnected from ${this.type} database`);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  /**
   * Begin transaction
   */
  async beginTransaction() {
    switch (this.type) {
      case 'postgresql':
        return await this.connection.query('BEGIN');
      case 'mysql':
        const conn = await this.connection.getConnection();
        await conn.beginTransaction();
        return conn;
      case 'mongodb':
        const session = this.connection.startSession();
        session.startTransaction();
        return session;
      case 'oracle':
        // Oracle auto-commits by default, disable it for transactions
        const oracleConn = await this.connection.getConnection();
        oracleConn.autoCommit = false;
        return oracleConn;
    }
  }

  /**
   * Commit transaction
   */
  async commitTransaction(transaction) {
    switch (this.type) {
      case 'postgresql':
        return await this.connection.query('COMMIT');
      case 'mysql':
        await transaction.commit();
        transaction.release();
        break;
      case 'mongodb':
        await transaction.commitTransaction();
        await transaction.endSession();
        break;
      case 'oracle':
        await transaction.commit();
        await transaction.close();
        break;
    }
  }

  /**
   * Rollback transaction
   */
  async rollbackTransaction(transaction) {
    switch (this.type) {
      case 'postgresql':
        return await this.connection.query('ROLLBACK');
      case 'mysql':
        await transaction.rollback();
        transaction.release();
        break;
      case 'mongodb':
        await transaction.abortTransaction();
        await transaction.endSession();
        break;
      case 'oracle':
        await transaction.rollback();
        await transaction.close();
        break;
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      switch (this.type) {
        case 'postgresql':
          await this.connection.query('SELECT 1');
          break;
        case 'mysql':
          await this.connection.query('SELECT 1');
          break;
        case 'mongodb':
          await this.connection.db().admin().ping();
          break;
        case 'oracle':
          const conn = await this.connection.getConnection();
          await conn.execute('SELECT 1 FROM DUAL');
          await conn.close();
          break;
      }
      return { healthy: true, type: this.type, database: this.config.database };
    } catch (error) {
      return { healthy: false, type: this.type, error: error.message };
    }
  }
}

module.exports = DatabaseManager;
