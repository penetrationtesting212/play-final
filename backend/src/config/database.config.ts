/**
 * Database Configuration
 * Centralized database configuration for all database types
 */

import { Pool, PoolConfig } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// PostgreSQL Configuration
export const postgresConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'playwright_crx',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: parseInt(process.env.DB_POOL_SIZE || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // SSL configuration for production
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : undefined,
};

// MySQL Configuration (for multi-database testing)
export const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  database: process.env.MYSQL_DATABASE || 'playwright_test',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'password',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// MongoDB Configuration
export const mongoConfig = {
  url: process.env.MONGO_URL || 
       `mongodb://${process.env.MONGO_USER || 'admin'}:${process.env.MONGO_PASSWORD || 'password'}@${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || '27017'}/${process.env.MONGO_DATABASE || 'playwright_test'}`,
  options: {
    maxPoolSize: 10,
  },
};

// Oracle Configuration
export const oracleConfig = {
  user: process.env.ORACLE_USER || 'system',
  password: process.env.ORACLE_PASSWORD || 'password',
  connectString: process.env.ORACLE_CONNECTION_STRING || 
                 `${process.env.ORACLE_HOST || 'localhost'}:${process.env.ORACLE_PORT || '1521'}/${process.env.ORACLE_DATABASE || 'ORCL'}`,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
};

// Database URLs for migrations
export const databaseUrls = {
  postgres: `postgresql://${postgresConfig.user}:${postgresConfig.password}@${postgresConfig.host}:${postgresConfig.port}/${postgresConfig.database}`,
  mysql: `mysql://${mysqlConfig.user}:${mysqlConfig.password}@${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`,
  mongodb: mongoConfig.url,
};

// Create PostgreSQL pool (default)
export const pool = new Pool(postgresConfig);

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ PostgreSQL connection established');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL error:', err);
  process.exit(-1);
});

export default {
  postgres: postgresConfig,
  mysql: mysqlConfig,
  mongo: mongoConfig,
  oracle: oracleConfig,
  pool,
};
