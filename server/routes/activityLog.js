import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// GET /api/activity-log
router.get('/', async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    const result = await pool.query(
      'SELECT * FROM activity_log ORDER BY created_at DESC LIMIT $1',
      [Math.min(parseInt(limit), 100)]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

export default router;
