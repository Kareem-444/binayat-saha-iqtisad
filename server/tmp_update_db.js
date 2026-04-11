import pool from './config/db.js';

async function updateDb() {
  try {
    console.log("Adding columns to inventory_movements...");
    await pool.query(`
      ALTER TABLE inventory_movements 
      ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS reference_id INTEGER;
    `);

    console.log("Creating inventory_permissions table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_permissions (
          id SERIAL PRIMARY KEY,
          permission_number VARCHAR(50) UNIQUE NOT NULL,
          type VARCHAR(50) NOT NULL CHECK (type IN ('إضافة مشتراه', 'ارتجاع', 'إضافة محولة', 'أول المدة', 'إيجارات', 'صرف داخلي', 'صرف خارجي', 'صرف تكهين')),
          direction VARCHAR(20) NOT NULL CHECK (direction IN ('add', 'dispense')),
          project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
          warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
          supplier_name VARCHAR(200),
          external BOOLEAN DEFAULT false,
          vehicle_number VARCHAR(100),
          supply_route VARCHAR(200),
          notes TEXT,
          date DATE DEFAULT CURRENT_DATE,
          month INTEGER,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_inv_perm_dir ON inventory_permissions(direction);
    `);

    console.log("Creating inventory_permission_items table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS inventory_permission_items (
          id SERIAL PRIMARY KEY,
          permission_id INTEGER REFERENCES inventory_permissions(id) ON DELETE CASCADE,
          item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
          item_name VARCHAR(200) NOT NULL,
          quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
          unit VARCHAR(30) NOT NULL,
          price NUMERIC(12,2) DEFAULT 0,
          total NUMERIC(15,2) GENERATED ALWAYS AS (quantity * price) STORED
      );
    `);

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

updateDb();
