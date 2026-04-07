import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log('Connecting to:', process.env.DATABASE_URL?.substring(0, 50) + '...');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const r = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename`);
  console.log('Existing tables in Neon DB:');
  r.rows.forEach(row => console.log('  -', row.tablename));
  
  const expected = ['users','projects','warehouses','inventory_items','inventory_movements','suppliers','contractors',
    'purchase_orders','purchase_order_items','employees','attendance','equipment','maintenance_records',
    'expenses','invoices','documents','notifications','activity_log','financial_monthly',
    'inventory_permissions','inventory_permission_items'];
  
  const existing = r.rows.map(row => row.tablename);
  const missing = expected.filter(t => !existing.includes(t));
  
  if (missing.length > 0) {
    console.log('\nMISSING tables:', missing.join(', '));
  } else {
    console.log('\nAll tables exist!');
  }
} catch(e) {
  console.error('Error:', e.message);
} finally {
  await pool.end();
  process.exit(0);
}
