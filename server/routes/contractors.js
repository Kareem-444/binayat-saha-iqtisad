import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { requireRole } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const contractorSchema = z.object({
  name: z.string().min(1, 'اسم المقاول مطلوب'),
  phone: z.string().optional().nullable(),
  email: z.string().email('البريد الإلكتروني غير صالح').optional().nullable().or(z.literal('')),
  specialty: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

// GET /api/contractors
router.get('/', requireRole('admin', 'manager', 'viewer'), async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM contractors ORDER BY name ASC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// GET /api/contractors/:id
router.get('/:id', requireRole('admin', 'manager', 'viewer'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM contractors WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المقاول غير موجود' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// POST /api/contractors
router.post('/', requireRole('admin', 'manager'), validate(contractorSchema), async (req, res, next) => {
  try {
    const { name, phone, email, specialty, is_active } = req.body;
    const result = await pool.query(
      `INSERT INTO contractors (name, phone, email, specialty, is_active)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, phone, email, specialty, is_active]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// PUT /api/contractors/:id
router.put('/:id', requireRole('admin', 'manager'), validate(contractorSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, phone, email, specialty, is_active } = req.body;
    
    const result = await pool.query(
      `UPDATE contractors 
       SET name = $1, phone = $2, email = $3, specialty = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6 RETURNING *`,
      [name, phone, email, specialty, is_active, id]
    );

    if (result.rows.length === 0) {
       return res.status(404).json({ error: 'المقاول غير موجود' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/contractors/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM contractors WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'المقاول غير موجود' });
    }
    
    res.status(204).send();
  } catch (error) {
    // If there is a foreign key constraint violation (e.g. they have permissions attached)
    if (error.code === '23503') {
       return res.status(400).json({ error: 'لا يمكن حذف المقاول لارتباطه بعمليات وسجلات أخرى في النظام' });
    }
    next(error);
  }
});

export default router;
