/**
 * User Management Routes
 * Complete CRUD operations for users with PostgreSQL
 */

import { Router, Request, Response } from 'express';
import { pool } from '../config/database.config';
import bcrypt from 'bcryptjs';

const router = Router();

/**
 * GET /api/users
 * Get all users (admin only)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT id, email, name, "createdAt", "updatedAt"
      FROM "User"
      ORDER BY "createdAt" DESC
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rowCount,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/users/:id
 * Get a specific user
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT id, email, name, "createdAt", "updatedAt"
      FROM "User"
      WHERE id = $1
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }
    
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );
    
    if (existingUser.rowCount > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const result = await pool.query(`
      INSERT INTO "User" (email, password, name)
      VALUES ($1, $2, $3)
      RETURNING id, email, name, "createdAt", "updatedAt"
    `, [email, hashedPassword, name || null]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'User created successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/users/:id
 * Update a user
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, password } = req.body;
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (email) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    
    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${paramCount++}`);
      values.push(hashedPassword);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
      });
    }
    
    values.push(id);
    
    const result = await pool.query(`
      UPDATE "User"
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, name, "createdAt", "updatedAt"
    `, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'User updated successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/users/:id
 * Delete a user
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      DELETE FROM "User"
      WHERE id = $1
      RETURNING id
    `, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/users/:id/stats
 * Get user statistics
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM "Project" WHERE "userId" = $1) as "projectCount",
        (SELECT COUNT(*) FROM "Script" WHERE "userId" = $1) as "scriptCount",
        (SELECT COUNT(*) FROM "TestRun" WHERE "userId" = $1) as "testRunCount",
        (SELECT COUNT(*) FROM "TestRun" WHERE "userId" = $1 AND status = 'passed') as "passedTests",
        (SELECT COUNT(*) FROM "TestRun" WHERE "userId" = $1 AND status = 'failed') as "failedTests"
    `, [id]);
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
