import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const equipmentSchema = z.object({
  name: z.string().min(1, 'اسم المعدة مطلوب'),
  type: z.string().optional(),
  model: z.string().optional(),
  year: z.number().optional(),
  status: z.enum(['يعمل', 'صيانة', 'معطل', 'مؤجر']).default('يعمل'),
  project_id: z.number().optional().nullable(),
  project_name: z.string().optional(),
  hours_used: z.number().min(0).default(0),
  last_maintenance: z.string().optional(),
  next_maintenance: z.string().optional(),
  daily_cost: z.number().min(0).default(0),
});

// GET /api/equipment
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM equipment WHERE 1=1';
    const params = [];
    if (status && status !== 'الكل') { params.push(status); query += ` AND status = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE $${params.length} OR type ILIKE $${params.length} OR model ILIKE $${params.length})`; }
    query += ' ORDER BY id';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/equipment/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM equipment WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'المعدة غير موجودة' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/equipment
router.post('/', requireRole('admin', 'manager'), validate(equipmentSchema), async (req, res, next) => {
  try {
    const { name, type, model, year, status, project_id, project_name, hours_used, last_maintenance, next_maintenance, daily_cost } = req.body;
    const result = await pool.query(
      `INSERT INTO equipment (name, type, model, year, status, project_id, project_name, hours_used, last_maintenance, next_maintenance, daily_cost)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, type, model, year, status, project_id, project_name, hours_used, last_maintenance, next_maintenance, daily_cost]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/equipment/:id
router.put('/:id', requireRole('admin', 'manager'), validate(equipmentSchema), async (req, res, next) => {
  try {
    const { name, type, model, year, status, project_id, project_name, hours_used, last_maintenance, next_maintenance, daily_cost } = req.body;
    const result = await pool.query(
      `UPDATE equipment SET name=$1, type=$2, model=$3, year=$4, status=$5, project_id=$6, project_name=$7, hours_used=$8, last_maintenance=$9, next_maintenance=$10, daily_cost=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, type, model, year, status, project_id, project_name, hours_used, last_maintenance, next_maintenance, daily_cost, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'المعدة غير موجودة' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/equipment/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM equipment WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'المعدة غير موجودة' });
    res.json({ message: 'تم حذف المعدة بنجاح' });
  } catch (err) { next(err); }
});

export default router;
