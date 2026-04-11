import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { requireRole } from '../middleware/rbac.js';

const router = Router();

// GET /api/users  — list all users (admin only)
router.get('/', requireRole('admin'), async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, phone, is_active, created_at, last_login
       FROM users ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/users  — create new user (admin only)
router.post('/', requireRole('admin'), async (req, res, next) => {
  try {
    const { full_name, email, password, role, phone } = req.body;
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'الاسم والبريد وكلمة المرور مطلوبة' });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, full_name, email, role, phone, is_active, created_at`,
      [full_name, email, password_hash, role || 'viewer', phone || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل' });
    }
    next(err);
  }
});

// PUT /api/users/:id/role  — update user role (admin only)
router.put('/:id/role', requireRole('admin'), async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['admin', 'manager', 'viewer'].includes(role)) {
      return res.status(400).json({ error: 'الدور غير صالح' });
    }
    const result = await pool.query(
      `UPDATE users SET role = $1 WHERE id = $2
       RETURNING id, full_name, email, role, phone, is_active`,
      [role, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/users/:id  — deactivate (soft delete) user (admin only)
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    // Prevent admin from deleting themselves
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'لا يمكنك حذف حسابك الخاص' });
    }
    const result = await pool.query(
      `UPDATE users SET is_active = false WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });
    res.json({ message: 'تم تعطيل المستخدم بنجاح' });
  } catch (err) { next(err); }
});

export default router;
