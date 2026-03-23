import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const invoiceSchema = z.object({
  invoice_number: z.string().min(1, 'رقم الفاتورة مطلوب'),
  client: z.string().min(1, 'اسم العميل مطلوب'),
  project_id: z.number().optional().nullable(),
  project_name: z.string().optional(),
  amount: z.number().min(0),
  tax_amount: z.number().min(0).default(0),
  due_date: z.string().optional(),
  status: z.enum(['مسودة', 'مستحقة', 'مدفوعة', 'متأخرة', 'ملغية']).default('مسودة'),
  notes: z.string().optional(),
});

// GET /api/invoices
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM invoices WHERE 1=1';
    const params = [];
    if (status && status !== 'الكل') { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// POST /api/invoices
router.post('/', requireRole('admin', 'manager'), validate(invoiceSchema), async (req, res, next) => {
  try {
    const { invoice_number, client, project_id, project_name, amount, tax_amount, due_date, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO invoices (invoice_number, client, project_id, project_name, amount, tax_amount, due_date, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [invoice_number, client, project_id, project_name, amount, tax_amount, due_date, status, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// PUT /api/invoices/:id
router.put('/:id', requireRole('admin', 'manager'), validate(invoiceSchema), async (req, res, next) => {
  try {
    const { invoice_number, client, project_id, project_name, amount, tax_amount, due_date, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE invoices SET invoice_number=$1, client=$2, project_id=$3, project_name=$4, amount=$5, tax_amount=$6, due_date=$7, status=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [invoice_number, client, project_id, project_name, amount, tax_amount, due_date, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// PATCH /api/invoices/:id/status
router.patch('/:id/status', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['مسودة', 'مستحقة', 'مدفوعة', 'متأخرة', 'ملغية'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });
    const result = await pool.query('UPDATE invoices SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/invoices/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM invoices WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'الفاتورة غير موجودة' });
    res.json({ message: 'تم حذف الفاتورة بنجاح' });
  } catch (err) { next(err); }
});

export default router;
