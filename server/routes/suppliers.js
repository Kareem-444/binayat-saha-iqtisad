import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const supplierSchema = z.object({
  name: z.string().min(1, 'اسم المورد مطلوب'),
  contact_person: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  category: z.string().optional(),
  rating: z.number().min(0).max(5).default(0),
  address: z.string().optional(),
});

// GET /api/suppliers
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE is_active = true ORDER BY id');
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'المورد غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/suppliers
router.post('/', requireRole('admin', 'manager'), validate(supplierSchema), async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, category, rating, address } = req.body;
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, category, rating, address) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, contact_person, phone, email, category, rating, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/suppliers/:id
router.put('/:id', requireRole('admin', 'manager'), validate(supplierSchema), async (req, res, next) => {
  try {
    const { name, contact_person, phone, email, category, rating, address } = req.body;
    const result = await pool.query(
      `UPDATE suppliers SET name=$1, contact_person=$2, phone=$3, email=$4, category=$5, rating=$6, address=$7, updated_at=NOW() WHERE id=$8 RETURNING *`,
      [name, contact_person, phone, email, category, rating, address, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'المورد غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/suppliers/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('UPDATE suppliers SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'المورد غير موجود' });
    res.json({ message: 'تم حذف المورد بنجاح' });
  } catch (err) { next(err); }
});

export default router;
