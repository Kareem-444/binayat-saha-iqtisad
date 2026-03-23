import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const expenseSchema = z.object({
  project_id: z.number().optional().nullable(),
  category: z.string().min(1, 'التصنيف مطلوب'),
  description: z.string().optional(),
  amount: z.number().min(0, 'المبلغ مطلوب'),
  expense_date: z.string().optional(),
  payment_method: z.string().optional(),
  receipt_number: z.string().optional(),
  approved_by: z.string().optional(),
  status: z.enum(['قيد المراجعة', 'معتمد', 'مرفوض']).default('معتمد'),
});

// GET /api/expenses
router.get('/', async (req, res, next) => {
  try {
    const { project_id, category } = req.query;
    let query = 'SELECT e.*, p.name as project_name FROM expenses e LEFT JOIN projects p ON e.project_id = p.id WHERE 1=1';
    const params = [];
    if (project_id) { params.push(project_id); query += ` AND e.project_id = $${params.length}`; }
    if (category && category !== 'الكل') { params.push(category); query += ` AND e.category = $${params.length}`; }
    query += ' ORDER BY e.expense_date DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/expenses
router.post('/', requireRole('admin', 'manager'), validate(expenseSchema), async (req, res, next) => {
  try {
    const { project_id, category, description, amount, expense_date, payment_method, receipt_number, approved_by, status } = req.body;
    const result = await pool.query(
      `INSERT INTO expenses (project_id, category, description, amount, expense_date, payment_method, receipt_number, approved_by, status)
       VALUES ($1,$2,$3,$4,COALESCE($5, CURRENT_DATE),$6,$7,$8,$9) RETURNING *`,
      [project_id, category, description, amount, expense_date, payment_method, receipt_number, approved_by, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/expenses/:id
router.put('/:id', requireRole('admin', 'manager'), validate(expenseSchema), async (req, res, next) => {
  try {
    const { project_id, category, description, amount, expense_date, payment_method, receipt_number, approved_by, status } = req.body;
    const result = await pool.query(
      `UPDATE expenses SET project_id=$1, category=$2, description=$3, amount=$4, expense_date=COALESCE($5, expense_date), payment_method=$6, receipt_number=$7, approved_by=$8, status=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [project_id, category, description, amount, expense_date, payment_method, receipt_number, approved_by, status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'المصروف غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/expenses/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'المصروف غير موجود' });
    res.json({ message: 'تم حذف المصروف بنجاح' });
  } catch (err) { next(err); }
});

export default router;
