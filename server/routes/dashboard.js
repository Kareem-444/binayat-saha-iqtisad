import { Router } from 'express';
import pool from '../config/db.js';

const router = Router();

// GET /api/dashboard
router.get('/', async (req, res, next) => {
  try {
    const [
      projectsRes,
      inventoryRes,
      employeesRes,
      financialRes,
      lowStockRes,
      invoicesRes,
      activityRes,
      notificationsRes,
    ] = await Promise.all([
      pool.query('SELECT * FROM projects ORDER BY id'),
      pool.query('SELECT * FROM inventory_items ORDER BY id'),
      pool.query('SELECT * FROM employees ORDER BY id'),
      pool.query('SELECT * FROM financial_monthly ORDER BY year, month'),
      pool.query('SELECT * FROM inventory_items WHERE quantity <= min_stock'),
      pool.query('SELECT * FROM invoices ORDER BY id DESC'),
      pool.query('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 10'),
      pool.query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10", [req.user.id]),
    ]);

    const projects = projectsRes.rows;
    const inventory = inventoryRes.rows;
    const employees = employeesRes.rows;
    const monthlyData = financialRes.rows;

    const totalRevenue = monthlyData.reduce((s, m) => s + Number(m.revenue), 0);
    const totalExpenses = monthlyData.reduce((s, m) => s + Number(m.expenses), 0);
    const netProfit = totalRevenue - totalExpenses;
    const outstandingInvoices = invoicesRes.rows
      .filter(i => i.status !== 'مدفوعة' && i.status !== 'ملغية')
      .reduce((s, i) => s + Number(i.amount), 0);

    res.json({
      projects,
      inventory,
      employees,
      finances: {
        totalRevenue,
        totalExpenses,
        netProfit,
        outstandingInvoices,
        monthlyData: monthlyData.map(m => ({
          month: m.month_name,
          revenue: Number(m.revenue),
          expenses: Number(m.expenses),
        })),
        invoices: invoicesRes.rows,
      },
      lowStockItems: lowStockRes.rows,
      recentActivities: activityRes.rows,
      notifications: notificationsRes.rows,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
