import pool from './server/config/db.js';

async function run() {
  try {
    console.log('Connecting to db...');
    
    await pool.query(`ALTER TABLE inventory_permissions ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS driver_name VARCHAR(150)`);
    console.log('Added employee_id, driver_name to inventory_permissions');
    
    await pool.query(`ALTER TABLE inventory_permission_items ADD COLUMN IF NOT EXISTS notes TEXT, ADD COLUMN IF NOT EXISTS remaining_stock NUMERIC(12,2), ADD COLUMN IF NOT EXISTS dispatch_location VARCHAR(200)`);
    console.log('Added notes, remaining_stock, dispatch_location to inventory_permission_items');
    
    await pool.query(`ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL`);
    console.log('Added employee_id to inventory_movements');
    
  } catch (e) {
    console.error('Error altering tables:', e);
  } finally {
    await pool.end();
    console.log('Pool ended');
  }
}

run();
