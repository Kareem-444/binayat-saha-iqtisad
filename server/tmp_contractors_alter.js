import pool from './config/db.js';

async function updateDb() {
  try {
    console.log("Creating contractors table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contractors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        phone VARCHAR(30),
        email VARCHAR(150),
        specialty VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log("Updating inventory_permissions...");
    await pool.query(`
      ALTER TABLE inventory_permissions
      ADD COLUMN IF NOT EXISTS target_type VARCHAR(20) CHECK (target_type IN ('contractor', 'warehouse')),
      ADD COLUMN IF NOT EXISTS contractor_id INTEGER REFERENCES contractors(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS target_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL;
    `);

    console.log("Updating inventory_movements...");
    await pool.query(`
      ALTER TABLE inventory_movements
      ADD COLUMN IF NOT EXISTS contractor_id INTEGER REFERENCES contractors(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS target_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL;
    `);

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

updateDb();
