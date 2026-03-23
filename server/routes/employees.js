import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const employeeSchema = z.object({
  name: z.string().min(1, 'اسم الموظف مطلوب'),
  role: z.string().optional(),
  department: z.string().optional(),
  salary: z.number().optional().nullable().default(0),
  salary_type: z.string().optional().default('شهري'),
  phone: z.string().optional(),
  project_id: z.number().optional().nullable(),
  project_name: z.string().optional(),
  start_date: z.string().optional(),
  status: z.string().optional().default('نشط'),
  national_id: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/employees
router.get('/', async (req, res, next) => {
  try {
    const { status, search, department } = req.query;
    let query = 'SELECT * FROM employees WHERE 1=1';
    const params = [];
    if (status && status !== 'الكل') { params.push(status); query += ` AND status = $${params.length}`; }
    if (department && department !== 'الكل') { params.push(department); query += ` AND department = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND (name ILIKE $${params.length} OR role ILIKE $${params.length})`; }
    query += ' ORDER BY id';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/employees/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'الموظف غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/employees
router.post('/', requireRole('admin', 'manager'), validate(employeeSchema), async (req, res, next) => {
  try {
    const { name, role, department, salary, salary_type, phone, project_id, project_name, start_date, status, national_id, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO employees (name, role, department, salary, salary_type, phone, project_id, project_name, start_date, status, national_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [name, role, department, salary, salary_type, phone, project_id, project_name, start_date, status, national_id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/employees/:id
router.put('/:id', requireRole('admin', 'manager'), validate(employeeSchema), async (req, res, next) => {
  try {
    const { name, role, department, salary, salary_type, phone, project_id, project_name, start_date, status, national_id, notes } = req.body;
    const result = await pool.query(
      `UPDATE employees SET name=$1, role=$2, department=$3, salary=$4, salary_type=$5, phone=$6, project_id=$7, project_name=$8, start_date=$9, status=$10, national_id=$11, notes=$12, updated_at=NOW()
       WHERE id=$13 RETURNING *`,
      [name, role, department, salary, salary_type, phone, project_id, project_name, start_date, status, national_id, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'الموظف غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/employees/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM employees WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'الموظف غير موجود' });
    res.json({ message: 'تم حذف الموظف بنجاح' });
  } catch (err) { next(err); }
});

export default router;
