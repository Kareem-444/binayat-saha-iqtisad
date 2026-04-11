import { Router } from 'express';
import pool from '../config/db.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// Ensure company_settings table exists
async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS company_settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    )
  `);
}
ensureTable().catch(console.error);

// GET /api/settings/company
router.get('/company', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT key, value FROM company_settings');
    const data = {};
    result.rows.forEach(r => { data[r.key] = r.value; });
    res.json(data);
  } catch (err) { next(err); }
});

// PUT /api/settings/company  (admin only)
router.put('/company', requireRole('admin'), async (req, res, next) => {
  try {
    const fields = req.body; // { company_name, phone, email, address, ... }
    for (const [key, value] of Object.entries(fields)) {
      await pool.query(
        `INSERT INTO company_settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, value]
      );
    }
    const result = await pool.query('SELECT key, value FROM company_settings');
    const data = {};
    result.rows.forEach(r => { data[r.key] = r.value; });
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
