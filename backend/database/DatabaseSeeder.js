/**
 * Enterprise Database Seeder
 * Handles data seeding for testing with support for multiple databases
 */

const fs = require('fs').promises;
const path = require('path');

class DatabaseSeeder {
  constructor(databaseManager) {
    this.db = databaseManager;
    this.seedHistory = [];
  }

  /**
   * Seed database from JSON file
   */
  async seedFromJSON(filePath, options = {}) {
    try {
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      const results = [];

      for (const [tableName, records] of Object.entries(data)) {
        const result = await this.seedTable(tableName, records, options);
        results.push(result);
      }

      this.seedHistory.push({
        timestamp: new Date(),
        source: filePath,
        results,
      });

      return results;
    } catch (error) {
      console.error('Seed from JSON error:', error);
      throw error;
    }
  }

  /**
   * Seed database from SQL file
   */
  async seedFromSQL(filePath) {
    try {
      const sql = await fs.readFile(filePath, 'utf8');
      
      if (this.db.type === 'mongodb') {
        throw new Error('SQL files not supported for MongoDB');
      }

      // Split SQL statements (simple split by semicolon)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      const results = [];
      for (const statement of statements) {
        try {
          const result = await this.db.query(statement);
          results.push({
            success: true,
            statement: statement.substring(0, 50) + '...',
            rowCount: result.rowCount,
          });
        } catch (error) {
          results.push({
            success: false,
            statement: statement.substring(0, 50) + '...',
            error: error.message,
          });
        }
      }

      this.seedHistory.push({
        timestamp: new Date(),
        source: filePath,
        results,
      });

      return results;
    } catch (error) {
      console.error('Seed from SQL error:', error);
      throw error;
    }
  }

  /**
   * Seed a specific table with records
   */
  async seedTable(tableName, records, options = {}) {
    const { truncateFirst = false, updateOnConflict = false } = options;

    try {
      // Truncate table first if requested
      if (truncateFirst) {
        await this.truncateTable(tableName);
      }

      let insertedCount = 0;
      let updatedCount = 0;
      let errors = [];

      switch (this.db.type) {
        case 'postgresql':
          for (const record of records) {
            try {
              const columns = Object.keys(record);
              const values = Object.values(record);
              const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
              
              let query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
              
              if (updateOnConflict) {
                const updates = columns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
                query += ` ON CONFLICT DO UPDATE SET ${updates}`;
              }

              await this.db.query(query, values);
              insertedCount++;
            } catch (error) {
              errors.push({ record, error: error.message });
            }
          }
          break;

        case 'mysql':
          for (const record of records) {
            try {
              const columns = Object.keys(record);
              const values = Object.values(record);
              const placeholders = columns.map(() => '?').join(', ');
              
              let query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
              
              if (updateOnConflict) {
                const updates = columns.map(col => `${col} = VALUES(${col})`).join(', ');
                query += ` ON DUPLICATE KEY UPDATE ${updates}`;
              }

              await this.db.query(query, values);
              insertedCount++;
            } catch (error) {
              errors.push({ record, error: error.message });
            }
          }
          break;

        case 'mongodb':
          const collection = this.db.getCollection(tableName);
          
          if (updateOnConflict && records.every(r => r._id)) {
            // Use upsert for records with _id
            for (const record of records) {
              try {
                const result = await collection.updateOne(
                  { _id: record._id },
                  { $set: record },
                  { upsert: true }
                );
                if (result.upsertedCount) insertedCount++;
                else if (result.modifiedCount) updatedCount++;
              } catch (error) {
                errors.push({ record, error: error.message });
              }
            }
          } else {
            // Bulk insert
            try {
              const result = await collection.insertMany(records, { ordered: false });
              insertedCount = result.insertedCount;
            } catch (error) {
              if (error.writeErrors) {
                insertedCount = records.length - error.writeErrors.length;
                errors = error.writeErrors.map(e => ({ 
                  record: records[e.index], 
                  error: e.errmsg 
                }));
              } else {
                throw error;
              }
            }
          }
          break;

        case 'oracle':
          for (const record of records) {
            try {
              const columns = Object.keys(record);
              const values = Object.values(record);
              const placeholders = columns.map((_, i) => `:${i + 1}`).join(', ');
              
              const query = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`;
              await this.db.query(query, values);
              insertedCount++;
            } catch (error) {
              // Check if it's a duplicate key error for Oracle
              if (updateOnConflict && error.errorNum === 1) {
                // Implement merge/update logic
                const updates = columns.map((col, i) => `${col} = :${i + 1}`).join(', ');
                const mergeQuery = `MERGE INTO ${tableName} USING DUAL ON (id = :id) WHEN MATCHED THEN UPDATE SET ${updates} WHEN NOT MATCHED THEN INSERT (${columns.join(', ')}) VALUES (${placeholders})`;
                await this.db.query(mergeQuery, values);
                updatedCount++;
              } else {
                errors.push({ record, error: error.message });
              }
            }
          }
          break;
      }

      return {
        table: tableName,
        success: true,
        insertedCount,
        updatedCount,
        errorCount: errors.length,
        errors: errors.slice(0, 10), // Limit error reporting
      };
    } catch (error) {
      return {
        table: tableName,
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Truncate table
   */
  async truncateTable(tableName) {
    switch (this.db.type) {
      case 'postgresql':
        await this.db.query(`TRUNCATE TABLE ${tableName} CASCADE`);
        break;
      case 'mysql':
        await this.db.query(`TRUNCATE TABLE ${tableName}`);
        break;
      case 'mongodb':
        const collection = this.db.getCollection(tableName);
        await collection.deleteMany({});
        break;
      case 'oracle':
        await this.db.query(`TRUNCATE TABLE ${tableName}`);
        break;
    }
  }

  /**
   * Generate seed data dynamically
   */
  generateSeedData(schema, count = 10) {
    const records = [];
    
    for (let i = 0; i < count; i++) {
      const record = {};
      
      for (const [field, config] of Object.entries(schema)) {
        record[field] = this.generateFieldValue(config, i);
      }
      
      records.push(record);
    }
    
    return records;
  }

  /**
   * Generate field value based on type
   */
  generateFieldValue(config, index) {
    const { type, faker, options = {} } = config;
    
    switch (type) {
      case 'id':
        return index + 1;
      case 'uuid':
        return this.generateUUID();
      case 'string':
        return faker || `test_${type}_${index}`;
      case 'email':
        return `user${index}@test.com`;
      case 'number':
        return Math.floor(Math.random() * (options.max || 1000)) + (options.min || 0);
      case 'boolean':
        return Math.random() > 0.5;
      case 'date':
        return new Date();
      case 'timestamp':
        return new Date().toISOString();
      default:
        return null;
    }
  }

  /**
   * Generate UUID
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get seed history
   */
  getSeedHistory() {
    return this.seedHistory;
  }

  /**
   * Clear seed history
   */
  clearSeedHistory() {
    this.seedHistory = [];
  }
}

module.exports = DatabaseSeeder;
