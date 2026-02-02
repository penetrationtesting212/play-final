/**
 * Enterprise Backend Server with PostgreSQL Integration
 * Comprehensive Node.js + Express + TypeScript + PostgreSQL Backend
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ===== PostgreSQL Connection =====
export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'playwright_crx',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Database connected successfully at', res.rows[0].now);
  }
});

// ===== Middleware =====
// Security
app.use(helmet({
  contentSecurityPolicy: NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:3000',
  'http://localhost:5173',
  'chrome-extension://*',
];

app.use(cors({
  origin: (origin, callback) => {
    if (NODE_ENV === 'development' || !origin) {
      return callback(null, true);
    }
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.includes('*')) {
        const pattern = new RegExp('^' + allowed.replace('*', '.*') + '$');
        return pattern.test(origin);
      }
      return allowed === origin;
    });
    callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
  },
  credentials: true,
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'production' ? 100 : 1000, // requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ===== Routes =====
// Health check
app.get('/health', async (req: Request, res: Response) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: dbResult.rows[0].now,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// API Info
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'Playwright CRX API',
    version: '1.0.0',
    description: 'Enterprise-grade testing platform with multi-database support',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      scripts: '/api/scripts',
      projects: '/api/projects',
      database: '/api/database',
      testRuns: '/api/test-runs',
    },
    documentation: '/api/docs',
  });
});

// Import and use existing routes
try {
  // Auth routes
  const authRoutes = require('./routes/auth.routes');
  app.use('/api/auth', authRoutes.default || authRoutes);
  
  // Script routes
  const scriptRoutes = require('./routes/script.routes');
  app.use('/api/scripts', scriptRoutes.default || scriptRoutes);
  
  // Project routes  
  const projectRoutes = require('./routes/project.routes');
  app.use('/api/projects', projectRoutes.default || projectRoutes);
  
  // Test Run routes
  const testRunRoutes = require('./routes/testRun.routes');
  app.use('/api/test-runs', testRunRoutes.default || testRunRoutes);
  
  console.log('✅ Core routes loaded successfully');
} catch (error) {
  console.warn('⚠️  Some core routes not found, continuing...');
}

// Database testing routes
try {
  const databaseRoutes = require('../routes/database');
  app.use('/api/database', databaseRoutes);
  console.log('✅ Database testing routes loaded');
} catch (error) {
  console.warn('⚠️  Database testing routes not found');
}

// ===== Error Handling =====
// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
  });
});

// Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(NODE_ENV === 'development' && {
      stack: err.stack,
      details: err,
    }),
  });
});

// ===== Graceful Shutdown =====
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  httpServer.close(() => {
    console.log('HTTP server closed');
  });
  
  try {
    await pool.end();
    console.log('Database connections closed');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ===== Start Server =====
httpServer.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   🚀 Playwright CRX Backend Server Started        ║');
  console.log('╠════════════════════════════════════════════════════╣');
  console.log(`║   Environment: ${NODE_ENV.padEnd(36)} ║`);
  console.log(`║   Port:        ${PORT.toString().padEnd(36)} ║`);
  console.log(`║   URL:         http://localhost:${PORT}${' '.repeat(24-PORT.toString().length)} ║`);
  console.log(`║   Database:    PostgreSQL                          ║`);
  console.log('╠════════════════════════════════════════════════════╣');
  console.log('║   Endpoints:                                       ║');
  console.log(`║   - Health:    http://localhost:${PORT}/health${' '.repeat(17-PORT.toString().length)} ║`);
  console.log(`║   - API Info:  http://localhost:${PORT}/api${' '.repeat(20-PORT.toString().length)} ║`);
  console.log(`║   - Auth:      http://localhost:${PORT}/api/auth${' '.repeat(15-PORT.toString().length)} ║`);
  console.log(`║   - Scripts:   http://localhost:${PORT}/api/scripts${' '.repeat(12-PORT.toString().length)} ║`);
  console.log(`║   - Database:  http://localhost:${PORT}/api/database${' '.repeat(11-PORT.toString().length)} ║`);
  console.log('╚════════════════════════════════════════════════════╝');
  console.log('');
});

export default app;
