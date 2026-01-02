/**
 * Database Testing API Routes
 * Provides endpoints for database seeding, snapshots, and query execution
 */

const express = require('express');
const router = express.Router();
const DatabaseManager = require('../database/DatabaseManager');
const DatabaseSeeder = require('../database/DatabaseSeeder');
const DatabaseSnapshot = require('../database/DatabaseSnapshot');
const { authenticate } = require('../middleware/auth');

// Store database instances by connection ID
const dbInstances = new Map();

/**
 * POST /api/database/connect
 * Connect to a database
 */
router.post('/connect', authenticate, async (req, res) => {
  try {
    const { connectionId, config } = req.body;

    if (!connectionId || !config) {
      return res.status(400).json({ error: 'Connection ID and config are required' });
    }

    // Create database manager
    const dbManager = new DatabaseManager(config);
    await dbManager.connect();

    // Store instance
    dbInstances.set(connectionId, {
      db: dbManager,
      seeder: new DatabaseSeeder(dbManager),
      snapshot: new DatabaseSnapshot(dbManager),
      userId: req.user.id,
    });

    res.json({
      success: true,
      connectionId,
      type: config.type,
      database: config.database,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/database/disconnect
 * Disconnect from a database
 */
router.post('/disconnect', authenticate, async (req, res) => {
  try {
    const { connectionId } = req.body;

    const instance = dbInstances.get(connectionId);
    if (!instance) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (instance.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await instance.db.disconnect();
    dbInstances.delete(connectionId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/database/query
 * Execute a database query
 */
router.post('/query', authenticate, async (req, res) => {
  try {
    const { connectionId, query, params = [], validate = {} } = req.body;

    const instance = dbInstances.get(connectionId);
    if (!instance) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (instance.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await instance.db.executeWithValidation(query, validate);

    res.json({
      success: true,
      result: result.result,
      validation: result.validation,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/database/seed
 * Seed database with test data
 */
router.post('/seed', authenticate, async (req, res) => {
  try {
    const { connectionId, source, data, options = {} } = req.body;

    const instance = dbInstances.get(connectionId);
    if (!instance) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (instance.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let results;

    switch (source) {
      case 'inline':
        // Seed directly from provided data
        results = [];
        for (const [table, records] of Object.entries(data)) {
          const result = await instance.seeder.seedTable(table, records, options);
          results.push(result);
        }
        break;

      case 'json':
        // Seed from JSON file path
        results = await instance.seeder.seedFromJSON(data.filePath, options);
        break;

      case 'sql':
        // Seed from SQL file path
        results = await instance.seeder.seedFromSQL(data.filePath);
        break;

      case 'generate':
        // Generate and seed data
        const generated = instance.seeder.generateSeedData(data.schema, data.count || 10);
        const result = await instance.seeder.seedTable(data.table, generated, options);
        results = [result];
        break;

      default:
        return res.status(400).json({ error: 'Invalid seed source' });
    }

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/database/snapshot/create
 * Create a database snapshot
 */
router.post('/snapshot/create', authenticate, async (req, res) => {
  try {
    const { connectionId, snapshotName, options = {} } = req.body;

    const instance = dbInstances.get(connectionId);
    if (!instance) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (instance.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await instance.snapshot.initialize();
    const result = await instance.snapshot.createSnapshot(snapshotName, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/database/snapshot/restore
 * Restore database from a snapshot
 */
router.post('/snapshot/restore', authenticate, async (req, res) => {
  try {
    const { connectionId, snapshotName, options = {} } = req.body;

    const instance = dbInstances.get(connectionId);
    if (!instance) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (instance.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await instance.snapshot.restoreSnapshot(snapshotName, options);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/database/snapshot/list
 * List all snapshots for a connection
 */
router.get('/snapshot/list', authenticate, async (req, res) => {
  try {
    const { connectionId } = req.query;

    const instance = dbInstances.get(connectionId);
    if (!instance) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (instance.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const snapshots = instance.snapshot.listSnapshots();

    res.json({
      success: true,
      snapshots,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/database/snapshot/:name
 * Delete a snapshot
 */
router.delete('/snapshot/:name', authenticate, async (req, res) => {
  try {
    const { connectionId } = req.query;
    const { name } = req.params;

    const instance = dbInstances.get(connectionId);
    if (!instance) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (instance.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const deleted = instance.snapshot.deleteSnapshot(name);

    res.json({
      success: deleted,
      message: deleted ? 'Snapshot deleted' : 'Snapshot not found',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/database/health
 * Check database connection health
 */
router.get('/health', authenticate, async (req, res) => {
  try {
    const { connectionId } = req.query;

    const instance = dbInstances.get(connectionId);
    if (!instance) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (instance.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const health = await instance.db.healthCheck();

    res.json({
      success: true,
      health,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/database/connections
 * List all active connections for the user
 */
router.get('/connections', authenticate, async (req, res) => {
  try {
    const userConnections = [];

    for (const [connectionId, instance] of dbInstances.entries()) {
      if (instance.userId === req.user.id) {
        userConnections.push({
          connectionId,
          type: instance.db.type,
          database: instance.db.config.database,
        });
      }
    }

    res.json({
      success: true,
      connections: userConnections,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cleanup inactive connections periodically
setInterval(() => {
  // Implement cleanup logic if needed
}, 60000);

module.exports = router;
