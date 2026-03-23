import { Router } from 'express';
import { z } from 'zod';
import pool from '../config/db.js';
import { validate } from '../middleware/validate.js';
import { requireRole } from '../middleware/rbac.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Ensure uploads dir exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /api/documents
router.get('/', async (req, res, next) => {
  try {
    const { project_id, category } = req.query;
    let query = 'SELECT d.*, p.name as project_name FROM documents d LEFT JOIN projects p ON d.project_id = p.id WHERE 1=1';
    const params = [];
    if (project_id) { params.push(project_id); query += ` AND d.project_id = $${params.length}`; }
    if (category && category !== 'الكل') { params.push(category); query += ` AND d.category = $${params.length}`; }
    query += ' ORDER BY d.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /api/documents
router.post('/', requireRole('admin', 'manager'), upload.single('file'), async (req, res, next) => {
  try {
    const { title, category, project_id, description } = req.body;
    const file = req.file;

    if (!title) return res.status(400).json({ error: 'عنوان المستند مطلوب' });

    let file_name = null;
    let file_type = null;
    let file_size = null;
    let file_path = null;

    if (file) {
      file_name = file.originalname;
      file_type = path.extname(file.originalname).replace('.', '').toLowerCase();
      file_size = file.size;
      file_path = `/uploads/${file.filename}`;
    }

    const result = await pool.query(
      `INSERT INTO documents (title, file_name, file_type, file_size, file_path, category, project_id, uploaded_by, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [title, file_name, file_type, file_size, file_path, category || 'عام', project_id || null, req.user.id, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// DELETE /api/documents/:id
router.delete('/:id', requireRole('admin', 'manager'), async (req, res, next) => {
  try {
    const result = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'المستند غير موجود' });
    res.json({ message: 'تم حذف المستند بنجاح' });
  } catch (err) { next(err); }
});

export default router;
