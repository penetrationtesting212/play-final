/**
 * Enterprise Database Snapshot Manager
 * Handles database state snapshots and restoration for testing
 */

const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

class DatabaseSnapshot {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.snapshots = new Map();
    this.snapshotDir = path.join(__dirname, '../snapshots');
  }

  /**
   * Initialize snapshot directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.snapshotDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create snapshot directory:', error);
    }
  }

  /**
   * Create a snapshot of current database state
   */
  async createSnapshot(snapshotName, options = {}) {
    const { tables = [], includeData = true, compress = false } = options;
    
    const snapshot = {
      id: snapshotName,
      timestamp: new Date(),
      databaseType: this.db.type,
      database: this.db.config.database,
      tables: [],
      metadata: {},
    };

    try {
      switch (this.db.type) {
        case 'postgresql':
          snapshot.data = await this.createPostgreSQLSnapshot(tables, includeData);
          break;
        case 'mysql':
          snapshot.data = await this.createMySQLSnapshot(tables, includeData);
          break;
        case 'mongodb':
          snapshot.data = await this.createMongoDBSnapshot(tables, includeData);
          break;
        case 'oracle':
          snapshot.data = await this.createOracleSnapshot(tables, includeData);
          break;
      }

      // Save snapshot to memory
      this.snapshots.set(snapshotName, snapshot);

      // Optionally save to disk
      if (options.saveToDisk) {
        await this.saveSnapshotToDisk(snapshotName, snapshot, compress);
      }

      console.log(`✓ Snapshot '${snapshotName}' created successfully`);
      return {
        success: true,
        snapshot: snapshotName,
        tableCount: snapshot.tables.length,
        timestamp: snapshot.timestamp,
      };
    } catch (error) {
      console.error(`✗ Failed to create snapshot '${snapshotName}':`, error);
      throw error;
    }
  }

  /**
   * Create PostgreSQL snapshot
   */
  async createPostgreSQLSnapshot(tables, includeData) {
    const data = {};

    // Get all tables if not specified
    if (tables.length === 0) {
      const result = await this.db.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
      `);
      tables = result.rows.map(row => row.tablename);
    }

    for (const table of tables) {
      try {
        // Get table schema
        const schemaResult = await this.db.query(`
          SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [table]);

        data[table] = {
          schema: schemaResult.rows,
          rowCount: 0,
          data: [],
        };

        // Get table data if requested
        if (includeData) {
          const dataResult = await this.db.query(`SELECT * FROM ${table}`);
          data[table].data = dataResult.rows;
          data[table].rowCount = dataResult.rowCount;
        }
      } catch (error) {
        console.warn(`Warning: Could not snapshot table ${table}:`, error.message);
      }
    }

    return data;
  }

  /**
   * Create MySQL snapshot
   */
  async createMySQLSnapshot(tables, includeData) {
    const data = {};

    // Get all tables if not specified
    if (tables.length === 0) {
      const [rows] = await this.db.connection.query('SHOW TABLES');
      tables = rows.map(row => Object.values(row)[0]);
    }

    for (const table of tables) {
      try {
        // Get table schema
        const [schemaRows] = await this.db.connection.query(`
          SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
          FROM INFORMATION_SCHEMA.COLUMNS
          WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
          ORDER BY ORDINAL_POSITION
        `, [this.db.config.database, table]);

        data[table] = {
          schema: schemaRows,
          rowCount: 0,
          data: [],
        };

        // Get table data if requested
        if (includeData) {
          const [dataRows] = await this.db.connection.query(`SELECT * FROM ${table}`);
          data[table].data = dataRows;
          data[table].rowCount = dataRows.length;
        }
      } catch (error) {
        console.warn(`Warning: Could not snapshot table ${table}:`, error.message);
      }
    }

    return data;
  }

  /**
   * Create MongoDB snapshot
   */
  async createMongoDBSnapshot(collections, includeData) {
    const data = {};
    const db = this.db.connection.db();

    // Get all collections if not specified
    if (collections.length === 0) {
      const collectionsList = await db.listCollections().toArray();
      collections = collectionsList.map(c => c.name);
    }

    for (const collectionName of collections) {
      try {
        const collection = db.collection(collectionName);

        // Get collection stats
        const stats = await collection.stats();

        data[collectionName] = {
          schema: null, // MongoDB is schemaless
          rowCount: stats.count,
          data: [],
          indexes: await collection.indexes(),
        };

        // Get collection data if requested
        if (includeData) {
          data[collectionName].data = await collection.find({}).toArray();
        }
      } catch (error) {
        console.warn(`Warning: Could not snapshot collection ${collectionName}:`, error.message);
      }
    }

    return data;
  }

  /**
   * Create Oracle snapshot
   */
  async createOracleSnapshot(tables, includeData) {
    const data = {};

    // Get all tables if not specified
    if (tables.length === 0) {
      const result = await this.db.query(`
        SELECT table_name FROM user_tables
      `);
      tables = result.rows.map(row => row.TABLE_NAME);
    }

    for (const table of tables) {
      try {
        // Get table schema
        const schemaResult = await this.db.query(`
          SELECT column_name, data_type, data_length, nullable, data_default
          FROM user_tab_columns
          WHERE table_name = :1
          ORDER BY column_id
        `, [table]);

        data[table] = {
          schema: schemaResult.rows,
          rowCount: 0,
          data: [],
        };

        // Get table data if requested
        if (includeData) {
          const dataResult = await this.db.query(`SELECT * FROM ${table}`);
          data[table].data = dataResult.rows;
          data[table].rowCount = dataResult.rowCount;
        }
      } catch (error) {
        console.warn(`Warning: Could not snapshot table ${table}:`, error.message);
      }
    }

    return data;
  }

  /**
   * Restore database from snapshot
   */
  async restoreSnapshot(snapshotName, options = {}) {
    const { tables = [], truncateFirst = true } = options;

    try {
      let snapshot = this.snapshots.get(snapshotName);

      // If not in memory, try to load from disk
      if (!snapshot) {
        snapshot = await this.loadSnapshotFromDisk(snapshotName);
      }

      if (!snapshot) {
        throw new Error(`Snapshot '${snapshotName}' not found`);
      }

      const tablesToRestore = tables.length > 0 ? tables : Object.keys(snapshot.data);
      const results = [];

      for (const table of tablesToRestore) {
        if (!snapshot.data[table]) {
          console.warn(`Table '${table}' not found in snapshot`);
          continue;
        }

        try {
          // Truncate table first if requested
          if (truncateFirst) {
            await this.truncateTable(table);
          }

          // Restore data
          const tableData = snapshot.data[table];
          if (tableData.data && tableData.data.length > 0) {
            await this.restoreTableData(table, tableData.data);
            results.push({
              table,
              success: true,
              rowsRestored: tableData.data.length,
            });
          }
        } catch (error) {
          results.push({
            table,
            success: false,
            error: error.message,
          });
        }
      }

      console.log(`✓ Snapshot '${snapshotName}' restored successfully`);
      return {
        success: true,
        snapshot: snapshotName,
        results,
      };
    } catch (error) {
      console.error(`✗ Failed to restore snapshot '${snapshotName}':`, error);
      throw error;
    }
  }

  /**
   * Restore table data
   */
  async restoreTableData(table, records) {
    switch (this.db.type) {
      case 'postgresql':
      case 'mysql':
        for (const record of records) {
          const columns = Object.keys(record);
          const values = Object.values(record);
          const placeholders = this.db.type === 'postgresql'
            ? columns.map((_, i) => `$${i + 1}`).join(', ')
            : columns.map(() => '?').join(', ');
          
          const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
          await this.db.query(query, values);
        }
        break;

      case 'mongodb':
        const collection = this.db.getCollection(table);
        await collection.insertMany(records);
        break;

      case 'oracle':
        for (const record of records) {
          const columns = Object.keys(record);
          const values = Object.values(record);
          const placeholders = columns.map((_, i) => `:${i + 1}`).join(', ');
          
          const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
          await this.db.query(query, values);
        }
        break;
    }
  }

  /**
   * Truncate table
   */
  async truncateTable(table) {
    switch (this.db.type) {
      case 'postgresql':
        await this.db.query(`TRUNCATE TABLE ${table} CASCADE`);
        break;
      case 'mysql':
        await this.db.query(`TRUNCATE TABLE ${table}`);
        break;
      case 'mongodb':
        const collection = this.db.getCollection(table);
        await collection.deleteMany({});
        break;
      case 'oracle':
        await this.db.query(`TRUNCATE TABLE ${table}`);
        break;
    }
  }

  /**
   * Save snapshot to disk
   */
  async saveSnapshotToDisk(snapshotName, snapshot, compress = false) {
    const filename = `${snapshotName}_${Date.now()}.json`;
    const filepath = path.join(this.snapshotDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(snapshot, null, 2));
    
    if (compress) {
      // Implement compression if needed
      // Using zlib or similar library
    }
    
    return filepath;
  }

  /**
   * Load snapshot from disk
   */
  async loadSnapshotFromDisk(snapshotName) {
    const files = await fs.readdir(this.snapshotDir);
    const snapshotFile = files.find(f => f.startsWith(snapshotName));
    
    if (!snapshotFile) {
      return null;
    }
    
    const filepath = path.join(this.snapshotDir, snapshotFile);
    const content = await fs.readFile(filepath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * List all snapshots
   */
  listSnapshots() {
    return Array.from(this.snapshots.keys()).map(name => ({
      name,
      timestamp: this.snapshots.get(name).timestamp,
      database: this.snapshots.get(name).database,
      tableCount: Object.keys(this.snapshots.get(name).data).length,
    }));
  }

  /**
   * Delete snapshot
   */
  deleteSnapshot(snapshotName) {
    return this.snapshots.delete(snapshotName);
  }

  /**
   * Clear all snapshots
   */
  clearAllSnapshots() {
    this.snapshots.clear();
  }
}

module.exports = DatabaseSnapshot;
