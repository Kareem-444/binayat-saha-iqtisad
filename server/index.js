import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { authenticateToken } from './middleware/auth.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import projectRoutes from './routes/projects.js';
import inventoryRoutes from './routes/inventory.js';
import warehouseRoutes from './routes/warehouses.js';
import supplierRoutes from './routes/suppliers.js';
import purchaseOrderRoutes from './routes/purchaseOrders.js';
import employeeRoutes from './routes/employees.js';
import attendanceRoutes from './routes/attendance.js';
import equipmentRoutes from './routes/equipment.js';
import maintenanceRoutes from './routes/maintenance.js';
import expenseRoutes from './routes/expenses.js';
import invoiceRoutes from './routes/invoices.js';
import documentRoutes from './routes/documents.js';
import notificationRoutes from './routes/notifications.js';
import activityLogRoutes from './routes/activityLog.js';
import inventoryMovementRoutes from './routes/inventoryMovements.js';
import inventoryPermissionsRoutes from './routes/inventoryPermissions.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { error: 'طلبات كثيرة جداً، حاول لاحقاً' },
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Public routes (no auth)
app.use('/api/auth', authRoutes);

// Protected routes (require auth)
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/inventory', authenticateToken, inventoryRoutes);
app.use('/api/warehouses', authenticateToken, warehouseRoutes);
app.use('/api/suppliers', authenticateToken, supplierRoutes);
app.use('/api/purchase-orders', authenticateToken, purchaseOrderRoutes);
app.use('/api/employees', authenticateToken, employeeRoutes);
app.use('/api/attendance', authenticateToken, attendanceRoutes);
app.use('/api/equipment', authenticateToken, equipmentRoutes);
app.use('/api/maintenance', authenticateToken, maintenanceRoutes);
app.use('/api/expenses', authenticateToken, expenseRoutes);
app.use('/api/invoices', authenticateToken, invoiceRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/notifications', authenticateToken, notificationRoutes);
app.use('/api/activity-log', authenticateToken, activityLogRoutes);
app.use('/api/inventory-movements', authenticateToken, inventoryMovementRoutes);
app.use('/api/inventory-permissions', authenticateToken, inventoryPermissionsRoutes);

// Error handling
app.use(errorHandler);

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'المسار غير موجود' });
});

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;
