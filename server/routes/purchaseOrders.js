import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const poSchema = z.object({
  order_number: z.string().min(1, 'رقم الطلب مطلوب'),
  supplier_id: z.number().optional().nullable(),
  supplier_name: z.string().optional(),
  project_id: z.number().optional().nullable(),
  order_date: z.string().optional(),
  total: z.number().min(0).default(0),
  items_count: z.number().min(0).default(0),
  status: z.enum(['قيد الانتظار', 'معتمد', 'تم التسليم', 'ملغي']).default('قيد الانتظار'),
  notes: z.string().optional(),
});

// GET /api/purchase-orders
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM purchase_orders WHERE 1=1';
    const params = [];
    if (status && status !== 'الكل') { params.push(status); query += ` AND status = $${params.length}`; }
    query += ' ORDER BY id DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /api/purchase-orders/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM purchase_orders WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'طلب الشراء غير موجود' });
    
    // Fetch items
    const itemsRes = await pool.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1 ORDER BY id', [req.params.id]);
    
    res.json({ ...result.rows[0], items: itemsRes.rows });
  } catch (err) { next(err); }
});

// POST /api/purchase-orders
router.post('/', requireRole('admin', 'manager'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { order_number, supplier_id, supplier_name, project_id, order_date, total, items_count, status, notes, items } = req.body;
    
    const result = await client.query(
      `INSERT INTO purchase_orders (order_number, supplier_id, supplier_name, project_id, order_date, total, items_count, status, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [order_number, supplier_id, supplier_name, project_id, order_date, total, items_count, status, notes, req.user.id]
    );
    const po = result.rows[0];

    const insertedItems = [];
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const itemRes = await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id, item_name, quantity, unit_price)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [po.id, item.item_name, item.quantity, item.unit_price]
        );
        insertedItems.push(itemRes.rows[0]);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ ...po, items: insertedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// PUT /api/purchase-orders/:id
router.put('/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { order_number, supplier_id, supplier_name, project_id, order_date, total, items_count, status, notes, items } = req.body;
    
    const result = await client.query(
      `UPDATE purchase_orders SET order_number=$1, supplier_id=$2, supplier_name=$3, project_id=$4, order_date=$5, total=$6, items_count=$7, status=$8, notes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [order_number, supplier_id, supplier_name, project_id, order_date, total, items_count, status, notes, req.params.id]
    );
    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'طلب الشراء غير موجود' });
    }
    const po = result.rows[0];

    // Replace items
    await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [po.id]);
    
    const insertedItems = [];
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const itemRes = await client.query(
          `INSERT INTO purchase_order_items (purchase_order_id, item_name, quantity, unit_price)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [po.id, item.item_name, item.quantity, item.unit_price]
        );
        insertedItems.push(itemRes.rows[0]);
      }
    }

    await client.query('COMMIT');
    res.json({ ...po, items: insertedItems });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// PATCH /api/purchase-orders/:id/status
router.patch('/:id/status', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    // ... logic remains same ...
    const { status } = req.body;
    const validStatuses = ['قيد الانتظار', 'معتمد', 'تم التسليم', 'ملغي'];
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'حالة غير صالحة' });

    const result = await pool.query(
      'UPDATE purchase_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'طلب الشراء غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/purchase-orders/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const poResult = await client.query('SELECT status FROM purchase_orders WHERE id = $1', [req.params.id]);
    if (poResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'طلب الشراء غير موجود' });
    }
    
    if (poResult.rows[0].status === 'تم التسليم') {
      console.warn(`Warning: Deleting a delivered purchase order (ID: ${req.params.id})`);
    }

    await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [req.params.id]);
    const result = await client.query('DELETE FROM purchase_orders WHERE id = $1 RETURNING id', [req.params.id]);
    
    await client.query('COMMIT');
    res.json({ message: 'تم حذف طلب الشراء بنجاح' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

export default router;
