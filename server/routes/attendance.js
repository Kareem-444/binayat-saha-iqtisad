import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const attendanceSchema = z.object({
  employee_id: z.number().int(),
  date: z.string().optional(),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  status: z.enum(['حاضر', 'غائب', 'إجازة', 'متأخر']).default('حاضر'),
  overtime_hours: z.number().min(0).default(0),
  notes: z.string().optional(),
});

// GET /api/attendance
router.get('/', async (req, res, next) => {
  try {
    const { date, employee_id } = req.query;
    let query = `SELECT a.*, e.name as employee_name FROM attendance a JOIN employees e ON a.employee_id = e.id WHERE 1=1`;
    const params = [];
    if (date) { params.push(date); query += ` AND a.date = $${params.length}`; }
    if (employee_id) { params.push(employee_id); query += ` AND a.employee_id = $${params.length}`; }
    query += ' ORDER BY a.date DESC, a.id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/attendance
router.post('/', requireRole('admin', 'manager'), validate(attendanceSchema), async (req, res, next) => {
  try {
    const { employee_id, date, check_in, check_out, status, overtime_hours, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO attendance (employee_id, date, check_in, check_out, status, overtime_hours, notes)
       VALUES ($1, COALESCE($2, CURRENT_DATE), $3, $4, $5, $6, $7) RETURNING *`,
      [employee_id, date, check_in, check_out, status, overtime_hours, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/attendance/:id
router.put('/:id', requireRole('admin', 'manager'), validate(attendanceSchema), async (req, res, next) => {
  try {
    const { employee_id, date, check_in, check_out, status, overtime_hours, notes } = req.body;
    const result = await pool.query(
      `UPDATE attendance SET employee_id=$1, date=COALESCE($2, date), check_in=$3, check_out=$4, status=$5, overtime_hours=$6, notes=$7 WHERE id=$8 RETURNING *`,
      [employee_id, date, check_in, check_out, status, overtime_hours, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'سجل الحضور غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
