import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const inventorySchema = z.object({
  item_code: z.string().optional(),
  name: z.string().min(1, 'اسم الصنف مطلوب'),
  category: z.enum(['مواد', 'معدات', 'أدوات']),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  quantity: z.number().min(0).default(0),
  min_stock: z.number().min(0).default(0),
  unit_price: z.number().min(0).default(0),
  warehouse_id: z.number().optional().nullable(),
  warehouse_name: z.string().optional(),
});

// GET /api/inventory
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM inventory_items WHERE 1=1';
    const params = [];

    if (category && category !== 'الكل') {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR warehouse_name ILIKE $${params.length})`;
    }
    query += ' ORDER BY id';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM inventory_items WHERE quantity <= min_stock ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory/:id
router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM inventory_items WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'الصنف غير موجود' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory
router.post('/', requireRole('admin', 'manager'), validate(inventorySchema), async (req, res, next) => {
  try {
    const { item_code, name, category, unit, quantity, min_stock, unit_price, warehouse_id, warehouse_name } = req.body;
    const code = item_code === "" ? null : item_code;
    const result = await pool.query(
      `INSERT INTO inventory_items (item_code, name, category, unit, quantity, min_stock, unit_price, warehouse_id, warehouse_name)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [code, name, category, unit, quantity, min_stock, unit_price, warehouse_id, warehouse_name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/inventory/:id
router.put('/:id', requireRole('admin', 'manager'), validate(inventorySchema), async (req, res, next) => {
  try {
    const { item_code, name, category, unit, quantity, min_stock, unit_price, warehouse_id, warehouse_name } = req.body;
    const code = item_code === "" ? null : item_code;
    const result = await pool.query(
      `UPDATE inventory_items SET item_code=$1, name=$2, category=$3, unit=$4, quantity=$5, min_stock=$6, unit_price=$7, warehouse_id=$8, warehouse_name=$9, last_updated=CURRENT_DATE, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [code, name, category, unit, quantity, min_stock, unit_price, warehouse_id, warehouse_name, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'الصنف غير موجود' });
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM inventory_items WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'الصنف غير موجود' });
    res.json({ message: 'تم حذف الصنف بنجاح' });
  } catch (err) {
    next(err);
  }
});

export default router;
