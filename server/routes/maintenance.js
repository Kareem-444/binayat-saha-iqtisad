import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const maintenanceSchema = z.object({
  equipment_id: z.number().int(),
  maintenance_date: z.string().optional(),
  type: z.enum(['دوري', 'طارئ', 'إصلاح']).default('دوري'),
  description: z.string().optional(),
  cost: z.number().min(0).default(0),
  performed_by: z.string().optional(),
  next_scheduled: z.string().optional(),
  status: z.enum(['مجدول', 'قيد التنفيذ', 'مكتمل']).default('مكتمل'),
});

// GET /api/maintenance
router.get('/', async (req, res, next) => {
  try {
    const { equipment_id } = req.query;
    let query = `SELECT m.*, e.name as equipment_name FROM maintenance_records m JOIN equipment e ON m.equipment_id = e.id WHERE 1=1`;
    const params = [];
    if (equipment_id) { params.push(equipment_id); query += ` AND m.equipment_id = $${params.length}`; }
    query += ' ORDER BY m.maintenance_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/maintenance
router.post('/', requireRole('admin', 'manager'), validate(maintenanceSchema), async (req, res, next) => {
  try {
    const { equipment_id, maintenance_date, type, description, cost, performed_by, next_scheduled, status } = req.body;
    const result = await pool.query(
      `INSERT INTO maintenance_records (equipment_id, maintenance_date, type, description, cost, performed_by, next_scheduled, status)
       VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6, $7, $8) RETURNING *`,
      [equipment_id, maintenance_date, type, description, cost, performed_by, next_scheduled, status]
    );
    // Update equipment next_maintenance
    if (next_scheduled) {
      await pool.query('UPDATE equipment SET next_maintenance = $1, last_maintenance = COALESCE($2, CURRENT_DATE) WHERE id = $3', [next_scheduled, maintenance_date, equipment_id]);
    }
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/maintenance/:id
router.put('/:id', requireRole('admin', 'manager'), validate(maintenanceSchema), async (req, res, next) => {
  try {
    const { equipment_id, maintenance_date, type, description, cost, performed_by, next_scheduled, status } = req.body;
    const result = await pool.query(
      `UPDATE maintenance_records SET equipment_id=$1, maintenance_date=COALESCE($2, maintenance_date), type=$3, description=$4, cost=$5, performed_by=$6, next_scheduled=$7, status=$8
       WHERE id=$9 RETURNING *`,
      [equipment_id, maintenance_date, type, description, cost, performed_by, next_scheduled, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'سجل الصيانة غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
