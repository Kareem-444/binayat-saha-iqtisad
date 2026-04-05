import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const movementSchema = z.object({
  item_id: z.number().int(),
  type: z.enum(['وارد', 'صادر']),
  quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من صفر'),
  project_id: z.number().optional().nullable(),
  project_name: z.string().optional(),
  contractor_name: z.string().optional(),
  user_name: z.string().optional(),
  source_location: z.string().optional(),
  issued_by: z.string().optional(),
  notes: z.string().optional(),
  movement_date: z.string().optional(),
  employee_id: z.number().optional().nullable(),
  destination_warehouse_id: z.number().optional().nullable(),
});

// GET /api/inventory-movements?item_id=X
router.get('/', async (req, res, next) => {
  try {
    const { item_id, project_id, contractor_id, warehouse_id, employee_id, limit = 100 } = req.query;
    let query = `SELECT m.*, 
                        i.name as item_name, i.item_code, i.unit, i.unit_price, i.warehouse_name, i.quantity as current_stock,
                        c.name as contractor_name_join,
                        tw.name as target_warehouse_name,
                        e.name as employee_name,
                        dw.name as destination_warehouse_name,
                        p.permission_number
                 FROM inventory_movements m
                 JOIN inventory_items i ON m.item_id = i.id
                 LEFT JOIN contractors c ON m.contractor_id = c.id
                 LEFT JOIN warehouses tw ON m.target_warehouse_id = tw.id
                 LEFT JOIN employees e ON m.employee_id = e.id
                 LEFT JOIN warehouses dw ON m.destination_warehouse_id = dw.id
                 LEFT JOIN inventory_permissions p ON m.reference_type = 'permission' AND m.reference_id = p.id
                 WHERE 1=1`;
    const params = [];

    if (item_id) { params.push(item_id); query += ` AND m.item_id = $${params.length}`; }
    if (project_id) { params.push(project_id); query += ` AND m.project_id = $${params.length}`; }
    if (contractor_id) { params.push(contractor_id); query += ` AND m.contractor_id = $${params.length}`; }
    if (employee_id) { params.push(employee_id); query += ` AND m.employee_id = $${params.length}`; }
    if (warehouse_id) { params.push(warehouse_id); query += ` AND (i.warehouse_id = $${params.length} OR m.target_warehouse_id = $${params.length} OR m.destination_warehouse_id = $${params.length})`; }
    query += ' ORDER BY m.movement_date DESC, m.id DESC';
    params.push(Math.min(parseInt(limit), 500));
    query += ` LIMIT $${params.length}`;

    const result = await pool.query(query, params);
    const rows = result.rows.map(row => ({
      ...row,
      contractor_name: row.contractor_name_join || row.contractor_name,
    }));
    res.json(rows);
  } catch (err) { next(err); }
});

// POST /api/inventory-movements
router.post('/', requireRole('admin', 'manager'), validate(movementSchema), async (req, res, next) => {
  try {
    const { item_id, type, quantity, project_id, project_name, contractor_name, user_name, source_location, issued_by, notes, movement_date, employee_id, destination_warehouse_id } = req.body;

    // Insert movement
    const result = await pool.query(
      `INSERT INTO inventory_movements (item_id, type, quantity, project_id, project_name, contractor_name, user_name, source_location, issued_by, notes, movement_date, employee_id, destination_warehouse_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, COALESCE($11, CURRENT_DATE), $12, $13) RETURNING *`,
      [item_id, type, quantity, project_id, project_name, contractor_name, user_name, source_location, issued_by, notes, movement_date, employee_id || null, destination_warehouse_id || null]
    );

    // Update inventory quantity
    const sign = type === 'وارد' ? '+' : '-';
    await pool.query(
      `UPDATE inventory_items SET quantity = quantity ${sign} $1, last_updated = CURRENT_DATE, updated_at = NOW() WHERE id = $2`,
      [quantity, item_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

export default router;
