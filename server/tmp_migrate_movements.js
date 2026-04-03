import pool from './config/db.js';

async function migrate() {
  try {
    console.log("Adding employee_id to inventory_movements...");
    await pool.query(`
      ALTER TABLE inventory_movements
      ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS destination_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL;
    `);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

migrate();
