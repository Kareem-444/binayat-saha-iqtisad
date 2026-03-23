import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const warehouseSchema = z.object({
  name: z.string().min(1, 'اسم المستودع مطلوب'),
  location: z.string().optional(),
  capacity: z.string().optional(),
  manager_name: z.string().optional(),
  phone: z.string().optional(),
});

// GET /api/warehouses
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM warehouses WHERE is_active = true ORDER BY id');
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/warehouses
router.post('/', requireRole('admin', 'manager'), validate(warehouseSchema), async (req, res, next) => {
  try {
    const { name, location, capacity, manager_name, phone } = req.body;
    const result = await pool.query(
      'INSERT INTO warehouses (name, location, capacity, manager_name, phone) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, location, capacity, manager_name, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/warehouses/:id
router.put('/:id', requireRole('admin', 'manager'), validate(warehouseSchema), async (req, res, next) => {
  try {
    const { name, location, capacity, manager_name, phone } = req.body;
    const result = await pool.query(
      'UPDATE warehouses SET name=$1, location=$2, capacity=$3, manager_name=$4, phone=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
      [name, location, capacity, manager_name, phone, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'المستودع غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/warehouses/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('UPDATE warehouses SET is_active = false WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'المستودع غير موجود' });
    res.json({ message: 'تم حذف المستودع بنجاح' });
  } catch (err) { next(err); }
});

export default router;
