import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

const permissionItemSchema = z.object({
  item_id: z.number().optional().nullable(),
  item_code: z.string().optional().nullable(),
  item_name: z.string().min(1, 'اسم الصنف مطلوب'),
  quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من الصفر'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  price: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
});

const permissionSchema = z.object({
  permission_number: z.string().min(1, 'رقم الإذن مطلوب'),
  type: z.enum(['إضافة مشتراه', 'ارتجاع', 'إضافة محولة', 'أول المدة', 'إيجارات', 'صرف داخلي', 'صرف خارجي', 'صرف تكهين']),
  direction: z.enum(['add', 'dispense']),
  project_id: z.number().optional().nullable(),
  warehouse_id: z.number({ required_error: 'المستودع مطلوب' }).min(1, 'المستودع مطلوب'),
  supplier_name: z.string().optional().nullable(),
  external: z.boolean().default(false),
  vehicle_number: z.string().optional().nullable(),
  driver_name: z.string().optional().nullable(),
  supply_route: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  target_type: z.enum(['contractor', 'warehouse']).optional().nullable(),
  contractor_id: z.number().optional().nullable(),
  employee_id: z.number().optional().nullable(),
  target_warehouse_id: z.number().optional().nullable(),
  items: z.array(permissionItemSchema).min(1, 'يجب إضافة صنف واحد على الأقل'),
});

// GET /api/inventory-permissions
router.get('/', async (req, res, next) => {
  try {
    const { type, warehouse_id, start_date, end_date } = req.query;
    let query = `SELECT p.*, w.name as warehouse_name, pr.name as project_name,
                        c.name as contractor_name, tw.name as target_warehouse_name,
                        e.name as employee_name
                 FROM inventory_permissions p 
                 JOIN warehouses w ON p.warehouse_id = w.id 
                 LEFT JOIN projects pr ON p.project_id = pr.id
                 LEFT JOIN contractors c ON p.contractor_id = c.id
                 LEFT JOIN warehouses tw ON p.target_warehouse_id = tw.id
                 LEFT JOIN employees e ON p.employee_id = e.id
                 WHERE 1=1`;
    const params = [];

    if (type && type !== 'الكل') {
      params.push(type);
      query += ` AND p.type = $${params.length}`;
    }
    if (warehouse_id && warehouse_id !== 'الكل') {
      params.push(warehouse_id);
      query += ` AND p.warehouse_id = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      query += ` AND p.date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND p.date <= $${params.length}`;
    }
    query += ' ORDER BY p.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/inventory-permissions/:id
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const permResult = await pool.query(
      `SELECT p.*, w.name as warehouse_name, pr.name as project_name, 
              c.name as contractor_name, tw.name as target_warehouse_name,
              e.name as employee_name
       FROM inventory_permissions p 
       JOIN warehouses w ON p.warehouse_id = w.id 
       LEFT JOIN projects pr ON p.project_id = pr.id 
       LEFT JOIN contractors c ON p.contractor_id = c.id
       LEFT JOIN warehouses tw ON p.target_warehouse_id = tw.id
       LEFT JOIN employees e ON p.employee_id = e.id
       WHERE p.id = $1`,
      [id]
    );

    if (permResult.rows.length === 0) {
      return res.status(404).json({ error: 'الإذن غير موجود' });
    }

    const itemsResult = await pool.query(
      'SELECT * FROM inventory_permission_items WHERE permission_id = $1',
      [id]
    );

    res.json({
      ...permResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/inventory-permissions
router.post('/', requireRole('admin', 'manager'), validate(permissionSchema), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      permission_number, type, direction, project_id, warehouse_id,
      supplier_name, external, vehicle_number, driver_name, supply_route, notes, items,
      target_type, contractor_id, employee_id, target_warehouse_id
    } = req.body;

    // Resolve effective employee_id: use employee_id if provided, otherwise fall back to contractor_id
    const effectiveEmployeeId = employee_id || null;
    const effectiveContractorId = contractor_id || null;

    if (direction === 'dispense') {
      if (!target_type) throw new Error("نوع جهة الصرف مطلوب");
      if (target_type === 'contractor' && !effectiveEmployeeId && !effectiveContractorId) throw new Error("المقاول مطلوب");
      if (target_type === 'warehouse' && !target_warehouse_id) throw new Error("المستودع الهدف مطلوب");
    }

    const current_date = new Date();
    const month = current_date.getMonth() + 1;

    // Check if permission number exists
    const existingCheck = await client.query('SELECT id FROM inventory_permissions WHERE permission_number = $1', [permission_number]);
    if (existingCheck.rows.length > 0) {
      throw new Error('رقم الإذن موجود بالفعل');
    }

    // 1. Insert Permission
    const permResult = await client.query(
      `INSERT INTO inventory_permissions (permission_number, type, direction, project_id, warehouse_id, supplier_name, external, vehicle_number, driver_name, supply_route, notes, date, month, target_type, contractor_id, employee_id, target_warehouse_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_DATE, $12, $13, $14, $15, $16, $17) RETURNING *`,
      [permission_number, type, direction, project_id, warehouse_id, supplier_name, external, vehicle_number || null, driver_name || null, supply_route, notes, month, target_type || null, effectiveContractorId, effectiveEmployeeId, target_warehouse_id || null, req.user?.id || null]
    );
    const permission = permResult.rows[0];

    // Get warehouse name and project name for movements logic
    const warehouseRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [warehouse_id]);
    const warehouse_name = warehouseRes.rows[0]?.name;
    let project_name = null;
    if (project_id) {
      const projectRes = await client.query('SELECT name FROM projects WHERE id = $1', [project_id]);
      project_name = projectRes.rows[0]?.name;
    }

    // Determine dispatch location for print
    let dispatchLocation = '';
    if (direction === 'dispense') {
      if (target_type === 'contractor' && effectiveEmployeeId) {
        const empRes = await client.query('SELECT name FROM employees WHERE id = $1', [effectiveEmployeeId]);
        dispatchLocation = empRes.rows[0]?.name || '';
      } else if (target_type === 'contractor' && effectiveContractorId) {
        const conRes = await client.query('SELECT name FROM contractors WHERE id = $1', [effectiveContractorId]);
        dispatchLocation = conRes.rows[0]?.name || '';
      } else if (target_type === 'warehouse' && target_warehouse_id) {
        const whRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [target_warehouse_id]);
        dispatchLocation = whRes.rows[0]?.name || '';
      }
    }

    let total_quantity = 0;
    let total_value = 0;
    const insertedItems = [];

    // 2. Process Items
    for (const item of items) {
      let currentItemId = item.item_id;
      let finalItemCode = item.item_code || null;
      const finalTotalPrice = Number(item.quantity) * Number(item.price);
      let remainingStock = 0;

      // Ensure new item exists or create it
      if (!currentItemId) {
        // Create new inventory item
        const newItemRes = await client.query(
          `INSERT INTO inventory_items (item_code, name, category, unit, quantity, min_stock, unit_price, warehouse_id, warehouse_name)
           VALUES ($1, $2, 'مواد', $3, 0, 0, $4, $5, $6) RETURNING id`,
          [finalItemCode, item.item_name, item.unit, item.price, warehouse_id, warehouse_name]
        );
        currentItemId = newItemRes.rows[0].id;
      } else {
        const existingItemRes = await client.query('SELECT item_code FROM inventory_items WHERE id = $1', [currentItemId]);
        if (existingItemRes.rows.length > 0) {
          finalItemCode = existingItemRes.rows[0].item_code || finalItemCode;
        }
      }

      // Check current stock for dispense & calculate remaining
      if (direction === 'dispense') {
        const stockRes = await client.query('SELECT quantity FROM inventory_items WHERE id = $1', [currentItemId]);
        const currentStock = Number(stockRes.rows[0]?.quantity || 0);
        if (currentStock < Number(item.quantity)) {
          throw new Error(`الكمية المتوفرة للصنف ${item.item_name} غير كافية (${currentStock})`);
        }
        remainingStock = currentStock - Number(item.quantity);
      }

      // Insert Permission Item with notes, remaining_stock, and dispatch_location
      const permItemRes = await client.query(
        `INSERT INTO inventory_permission_items (permission_id, item_id, item_code, item_name, quantity, unit, price, total_price, notes, remaining_stock, dispatch_location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [permission.id, currentItemId, finalItemCode, item.item_name, item.quantity, item.unit, item.price, finalTotalPrice, item.notes || null, remainingStock, dispatchLocation]
      );
      insertedItems.push(permItemRes.rows[0]);

      total_quantity += Number(item.quantity);
      total_value += Number(item.quantity) * Number(item.price);

      // Update Inventory Stock
      if (direction === 'add') {
        await client.query(
          'UPDATE inventory_items SET quantity = quantity + $1, last_updated = CURRENT_DATE, updated_at = NOW() WHERE id = $2',
          [item.quantity, currentItemId]
        );
      } else {
        await client.query(
          'UPDATE inventory_items SET quantity = quantity - $1, last_updated = CURRENT_DATE, updated_at = NOW() WHERE id = $2',
          [item.quantity, currentItemId]
        );
      }

      // Insert Movement (Source)
      const movementType = direction === 'add' ? 'وارد' : 'صادر';
      await client.query(
        `INSERT INTO inventory_movements (item_id, type, quantity, project_id, project_name, notes, reference_type, reference_id, contractor_id, target_warehouse_id, employee_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'permission', $7, $8, $9, $10)`,
        [currentItemId, movementType, item.quantity, project_id, project_name, `إذن ${permission_number}`, permission.id, effectiveContractorId, target_warehouse_id || null, effectiveEmployeeId]
      );

      // Warehouse Transfer Logic
      if (direction === 'dispense' && target_type === 'warehouse' && target_warehouse_id) {
        let targetItemId;
        const targetItemRes = await client.query('SELECT id FROM inventory_items WHERE name = $1 AND warehouse_id = $2', [item.item_name, target_warehouse_id]);
        const targetWHR = await client.query('SELECT name FROM warehouses WHERE id = $1', [target_warehouse_id]);
        const target_warehouse_name = targetWHR.rows[0]?.name;

        if (targetItemRes.rows.length > 0) {
          targetItemId = targetItemRes.rows[0].id;
          await client.query('UPDATE inventory_items SET quantity = quantity + $1, last_updated = CURRENT_DATE, updated_at = NOW() WHERE id = $2', [item.quantity, targetItemId]);
        } else {
          const newItemTarget = await client.query(
            `INSERT INTO inventory_items (item_code, name, category, unit, quantity, min_stock, unit_price, warehouse_id, warehouse_name)
                VALUES ($1, $2, 'مواد', $3, $4, 0, $5, $6, $7) RETURNING id`,
            [finalItemCode, item.item_name, item.unit, item.quantity, item.price, target_warehouse_id, target_warehouse_name]
          );
          targetItemId = newItemTarget.rows[0].id;
        }

        // IN Movement for Target Warehouse
        await client.query(
          `INSERT INTO inventory_movements (item_id, type, quantity, notes, reference_type, reference_id, source_location)
             VALUES ($1, 'وارد', $2, $3, 'permission', $4, $5)`,
          [targetItemId, item.quantity, `تحويل من مستودع ${warehouse_name} (إذن ${permission_number})`, permission.id, warehouse_name]
        );
      }
    }

    await client.query('COMMIT');

    // Return unified response
    res.status(201).json({
      ...permission,
      total_quantity,
      total_value,
      items: insertedItems
    });
  } catch (err) {
    await client.query('ROLLBACK');
    // If our manual errors were thrown, return 400
    if (err.message.includes('رقم الإذن') || err.message.includes('غير كافية') || err.message.includes('مطلوب') || err.message.includes('لا يمكن')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  } finally {
    client.release();
  }
});

// PUT /api/inventory-permissions/:id
router.put('/:id', requireRole('admin', 'manager'), validate(permissionSchema), async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      permission_number, type, direction, project_id, warehouse_id,
      supplier_name, external, vehicle_number, driver_name, supply_route, notes, items,
      target_type, contractor_id, employee_id, target_warehouse_id
    } = req.body;

    const existingPerm = await client.query('SELECT * FROM inventory_permissions WHERE id = $1', [id]);
    if (existingPerm.rows.length === 0) throw new Error('الإذن غير موجود');
    const oldPermission = existingPerm.rows[0];

    const effectiveEmployeeId = employee_id || null;
    const effectiveContractorId = contractor_id || null;

    if (direction === 'dispense') {
      if (!target_type) throw new Error("نوع جهة الصرف مطلوب");
      if (target_type === 'contractor' && !effectiveEmployeeId && !effectiveContractorId) throw new Error("المقاول مطلوب");
      if (target_type === 'warehouse' && !target_warehouse_id) throw new Error("المستودع الهدف مطلوب");
    }

    const dupCheck = await client.query('SELECT id FROM inventory_permissions WHERE permission_number = $1 AND id != $2', [permission_number, id]);
    if (dupCheck.rows.length > 0) throw new Error('رقم الإذن موجود بالفعل لإذن آخر');

    // REVERSAL SECTION
    const oldItems = await client.query('SELECT * FROM inventory_permission_items WHERE permission_id = $1', [id]);
    for (const oldItem of oldItems.rows) {
      if (oldPermission.direction === 'add') {
        await client.query('UPDATE inventory_items SET quantity = quantity - $1 WHERE id = $2', [oldItem.quantity, oldItem.item_id]);
      } else {
        await client.query('UPDATE inventory_items SET quantity = quantity + $1 WHERE id = $2', [oldItem.quantity, oldItem.item_id]);
        if (oldPermission.target_type === 'warehouse' && oldPermission.target_warehouse_id) {
          const targetItemRes = await client.query('SELECT id FROM inventory_items WHERE name = $1 AND warehouse_id = $2', [oldItem.item_name, oldPermission.target_warehouse_id]);
          if (targetItemRes.rows.length > 0) {
            await client.query('UPDATE inventory_items SET quantity = quantity - $1 WHERE id = $2 AND quantity >= $1', [oldItem.quantity, targetItemRes.rows[0].id]);
          }
        }
      }
    }

    await client.query(`DELETE FROM inventory_movements WHERE reference_type = 'permission' AND reference_id = $1`, [id]);
    await client.query('DELETE FROM inventory_permission_items WHERE permission_id = $1', [id]);

    // UPDATE Permission
    const permResult = await client.query(
      `UPDATE inventory_permissions 
       SET permission_number=$1, type=$2, direction=$3, project_id=$4, warehouse_id=$5, supplier_name=$6, external=$7, 
           vehicle_number=$8, driver_name=$9, supply_route=$10, notes=$11, target_type=$12, contractor_id=$13, 
           employee_id=$14, target_warehouse_id=$15, updated_at=NOW()
       WHERE id=$16 RETURNING *`,
      [permission_number, type, direction, project_id, warehouse_id, supplier_name, external, vehicle_number || null, driver_name || null, supply_route, notes, target_type || null, effectiveContractorId, effectiveEmployeeId, target_warehouse_id || null, id]
    );
    const permission = permResult.rows[0];

    const warehouseRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [warehouse_id]);
    const warehouse_name = warehouseRes.rows[0]?.name;
    let project_name = null;
    if (project_id) {
      const projectRes = await client.query('SELECT name FROM projects WHERE id = $1', [project_id]);
      project_name = projectRes.rows[0]?.name;
    }

    let dispatchLocation = '';
    if (direction === 'dispense') {
      if (target_type === 'contractor' && effectiveEmployeeId) {
        const empRes = await client.query('SELECT name FROM employees WHERE id = $1', [effectiveEmployeeId]);
        dispatchLocation = empRes.rows[0]?.name || '';
      } else if (target_type === 'contractor' && effectiveContractorId) {
        const conRes = await client.query('SELECT name FROM contractors WHERE id = $1', [effectiveContractorId]);
        dispatchLocation = conRes.rows[0]?.name || '';
      } else if (target_type === 'warehouse' && target_warehouse_id) {
        const whRes = await client.query('SELECT name FROM warehouses WHERE id = $1', [target_warehouse_id]);
        dispatchLocation = whRes.rows[0]?.name || '';
      }
    }

    let total_quantity = 0;
    let total_value = 0;
    const insertedItems = [];

    for (const item of items) {
      let currentItemId = item.item_id;
      let finalItemCode = item.item_code || null;
      const finalTotalPrice = Number(item.quantity) * Number(item.price);
      let remainingStock = 0;

      if (!currentItemId) {
        const newItemRes = await client.query(
          `INSERT INTO inventory_items (item_code, name, category, unit, quantity, min_stock, unit_price, warehouse_id, warehouse_name)
           VALUES ($1, $2, 'مواد', $3, 0, 0, $4, $5, $6) RETURNING id`,
          [finalItemCode, item.item_name, item.unit, item.price, warehouse_id, warehouse_name]
        );
        currentItemId = newItemRes.rows[0].id;
      } else {
        const existingItemRes = await client.query('SELECT item_code FROM inventory_items WHERE id = $1', [currentItemId]);
        if (existingItemRes.rows.length > 0) finalItemCode = existingItemRes.rows[0].item_code || finalItemCode;
      }

      if (direction === 'dispense') {
        const stockRes = await client.query('SELECT quantity FROM inventory_items WHERE id = $1', [currentItemId]);
        const currentStock = Number(stockRes.rows[0]?.quantity || 0);
        if (currentStock < Number(item.quantity)) throw new Error(`الكمية المتوفرة للصنف ${item.item_name} غير كافية (${currentStock})`);
        remainingStock = currentStock - Number(item.quantity);
      }

      const permItemRes = await client.query(
        `INSERT INTO inventory_permission_items (permission_id, item_id, item_code, item_name, quantity, unit, price, total_price, notes, remaining_stock, dispatch_location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [permission.id, currentItemId, finalItemCode, item.item_name, item.quantity, item.unit, item.price, finalTotalPrice, item.notes || null, remainingStock, dispatchLocation]
      );
      insertedItems.push(permItemRes.rows[0]);

      total_quantity += Number(item.quantity);
      total_value += Number(item.quantity) * Number(item.price);

      if (direction === 'add') {
        await client.query('UPDATE inventory_items SET quantity = quantity + $1, last_updated = CURRENT_DATE, updated_at = NOW() WHERE id = $2', [item.quantity, currentItemId]);
      } else {
        await client.query('UPDATE inventory_items SET quantity = quantity - $1, last_updated = CURRENT_DATE, updated_at = NOW() WHERE id = $2', [item.quantity, currentItemId]);
      }

      const movementType = direction === 'add' ? 'وارد' : 'صادر';
      await client.query(
        `INSERT INTO inventory_movements (item_id, type, quantity, project_id, project_name, notes, reference_type, reference_id, contractor_id, target_warehouse_id, employee_id)
         VALUES ($1, $2, $3, $4, $5, $6, 'permission', $7, $8, $9, $10)`,
        [currentItemId, movementType, item.quantity, project_id, project_name, `إذن معدّل ${permission_number}`, permission.id, effectiveContractorId, target_warehouse_id || null, effectiveEmployeeId]
      );

      if (direction === 'dispense' && target_type === 'warehouse' && target_warehouse_id) {
        let targetItemId;
        const targetItemRes = await client.query('SELECT id FROM inventory_items WHERE name = $1 AND warehouse_id = $2', [item.item_name, target_warehouse_id]);
        const targetWHR = await client.query('SELECT name FROM warehouses WHERE id = $1', [target_warehouse_id]);
        const target_warehouse_name = targetWHR.rows[0]?.name;

        if (targetItemRes.rows.length > 0) {
          targetItemId = targetItemRes.rows[0].id;
          await client.query('UPDATE inventory_items SET quantity = quantity + $1, last_updated = CURRENT_DATE, updated_at = NOW() WHERE id = $2', [item.quantity, targetItemId]);
        } else {
          const newItemTarget = await client.query(
            `INSERT INTO inventory_items (item_code, name, category, unit, quantity, min_stock, unit_price, warehouse_id, warehouse_name)
                VALUES ($1, $2, 'مواد', $3, $4, 0, $5, $6, $7) RETURNING id`,
            [finalItemCode, item.item_name, item.unit, item.quantity, item.price, target_warehouse_id, target_warehouse_name]
          );
          targetItemId = newItemTarget.rows[0].id;
        }

        await client.query(
          `INSERT INTO inventory_movements (item_id, type, quantity, notes, reference_type, reference_id, source_location)
             VALUES ($1, 'وارد', $2, $3, 'permission', $4, $5)`,
          [targetItemId, item.quantity, `تعديل تحويل من مستودع ${warehouse_name} (إذن ${permission_number})`, permission.id, warehouse_name]
        );
      }
    }

    await client.query('COMMIT');
    res.json({
      ...permission,
      total_quantity,
      total_value,
      items: insertedItems
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.message.includes('رقم الإذن') || err.message.includes('غير كافية') || err.message.includes('مطلب') || err.message.includes('لا يمكن')) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  } finally {
    client.release();
  }
});

export default router;
