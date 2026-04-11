import pool from './config/db.js';

async function updatePermitTypes() {
  try {
    console.log("Updating inventory_permissions type constraint...");
    await pool.query(`
      ALTER TABLE inventory_permissions
        DROP CONSTRAINT IF EXISTS inventory_permissions_type_check;
      
      ALTER TABLE inventory_permissions
        ADD CONSTRAINT inventory_permissions_type_check 
        CHECK (type IN ('إضافة مشتراه', 'ارتجاع', 'إضافة محولة', 'أول المدة', 'إيجارات', 'صرف داخلي', 'صرف خارجي', 'صرف تكهين'));
    `);
    console.log("Type constraint updated successfully!");

    // Also check if remaining_stock and dispatch_location columns exist
    console.log("Adding missing columns if needed...");
    await pool.query(`
      ALTER TABLE inventory_permission_items
        ADD COLUMN IF NOT EXISTS item_code VARCHAR(100),
        ADD COLUMN IF NOT EXISTS total_price NUMERIC(15,2),
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS remaining_stock NUMERIC(12,2),
        ADD COLUMN IF NOT EXISTS dispatch_location VARCHAR(200);
    `);
    console.log("Columns added/verified!");

    // Drop old total column if exists (it was generated, we now store total_price manually)
    try {
      await pool.query(`ALTER TABLE inventory_permission_items DROP COLUMN IF EXISTS total`);
      console.log("Dropped old 'total' column");
    } catch {
      // Column may not exist
    }

    // Drop old total_price generated column if it was generated
    try {
      await pool.query(`ALTER TABLE inventory_permission_items DROP COLUMN IF EXISTS total_price`);
      await pool.query(`ALTER TABLE inventory_permission_items ADD COLUMN total_price NUMERIC(15,2) DEFAULT 0`);
    } catch {
      // Already exists as non-generated
    }

    console.log("Migration complete!");
  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    pool.end();
  }
}

updatePermitTypes();
