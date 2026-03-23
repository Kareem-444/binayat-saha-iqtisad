import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const movementSchema = z.object({
  item_id: z.number().int(),
  type: z.enum(['وارد', 'صادر']),
  quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من صفر'),
  project_id: z.number().optional().nullable(),
  project_name: z.string().optional(),
  contractor_name: z.string().optional(),
  user_name: z.string().optional(),
  source_location: z.string().optional(),
  issued_by: z.string().optional(),
  notes: z.string().optional(),
  movement_date: z.string().optional(),
});

// GET /api/inventory-movements?item_id=X
router.get('/', async (req, res, next) => {
  try {
    const { item_id, project_id, limit = 100 } = req.query;
    let query = `SELECT m.*, i.name as item_name, i.item_code, i.unit, i.warehouse_name
                 FROM inventory_movements m
                 JOIN inventory_items i ON m.item_id = i.id
                 WHERE 1=1`;
    const params = [];

    if (item_id) { params.push(item_id); query += ` AND m.item_id = $${params.length}`; }
    if (project_id) { params.push(project_id); query += ` AND m.project_id = $${params.length}`; }
    query += ' ORDER BY m.movement_date DESC, m.id DESC';
    params.push(Math.min(parseInt(limit), 500));
    query += ` LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/inventory-movements
router.post('/', requireRole('admin', 'manager'), validate(movementSchema), async (req, res, next) => {
  try {
    const { item_id, type, quantity, project_id, project_name, contractor_name, user_name, source_location, issued_by, notes, movement_date } = req.body;

    // Insert movement
    const result = await pool.query(
      `INSERT INTO inventory_movements (item_id, type, quantity, project_id, project_name, contractor_name, user_name, source_location, issued_by, notes, movement_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, COALESCE($11, CURRENT_DATE)) RETURNING *`,
      [item_id, type, quantity, project_id, project_name, contractor_name, user_name, source_location, issued_by, notes, movement_date]
    );

    // Update inventory quantity
    const sign = type === 'وارد' ? '+' : '-';
    await pool.query(
      `UPDATE inventory_items SET quantity = quantity ${sign} $1, last_updated = CURRENT_DATE, updated_at = NOW() WHERE id = $2`,
      [quantity, item_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
