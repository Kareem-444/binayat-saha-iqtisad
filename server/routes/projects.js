import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const projectSchema = z.object({
  name: z.string().min(1, 'اسم المشروع مطلوب'),
  client: z.string().min(1, 'اسم العميل مطلوب'),
  location: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.number().min(0).default(0),
  spent: z.number().min(0).default(0),
  progress: z.number().min(0).max(100).default(0),
  status: z.enum(['نشط', 'يكاد يكتمل', 'مكتمل', 'متوقف', 'ملغي']).default('نشط'),
  manager_name: z.string().optional(),
  description: z.string().optional(),
});

// GET /api/projects
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (status && status !== 'الكل') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR client ILIKE $${params.length} OR location ILIKE $${params.length})`;
    }
    query += ' ORDER BY id DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'المشروع غير موجود' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects
router.post('/', requireRole('admin', 'manager'), validate(projectSchema), async (req, res, next) => {
  try {
    const { name, client, location, start_date, end_date, budget, spent, progress, status, manager_name, description } = req.body;
    const result = await pool.query(
      `INSERT INTO projects (name, client, location, start_date, end_date, budget, spent, progress, status, manager_name, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [name, client, location, start_date, end_date, budget, spent, progress, status, manager_name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id
router.put('/:id', requireRole('admin', 'manager'), validate(projectSchema), async (req, res, next) => {
  try {
    const { name, client, location, start_date, end_date, budget, spent, progress, status, manager_name, description } = req.body;
    const result = await pool.query(
      `UPDATE projects SET name=$1, client=$2, location=$3, start_date=$4, end_date=$5, budget=$6, spent=$7, progress=$8, status=$9, manager_name=$10, description=$11, updated_at=NOW()
       WHERE id=$12 RETURNING *`,
      [name, client, location, start_date, end_date, budget, spent, progress, status, manager_name, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'المشروع غير موجود' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'المشروع غير موجود' });
    res.json({ message: 'تم حذف المشروع بنجاح' });
  } catch (err) {
    next(err);
  }
});

export default router;
