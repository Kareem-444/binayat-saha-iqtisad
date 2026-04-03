import pool from './config/db.js';

async function updateDb() {
  try {
    console.log("Updating inventory_items...");
    await pool.query(`ALTER TABLE inventory_items ALTER COLUMN item_code TYPE VARCHAR(100);`);

    console.log("Updating inventory_permission_items...");
    await pool.query(`
      ALTER TABLE inventory_permission_items 
      DROP COLUMN IF EXISTS total,
      ADD COLUMN IF NOT EXISTS item_code VARCHAR(100),
      ADD COLUMN IF NOT EXISTS total_price NUMERIC(12,2);
    `);

    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    pool.end();
  }
}

updateDb();
