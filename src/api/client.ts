import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ============ API Functions ============

// Auth
export const authApi = {
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// Projects
export const projectsApi = {
  list: (params?: any) => api.get('/projects', { params }),
  get: (id: number) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: number, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: number) => api.delete(`/projects/${id}`),
};

// Inventory
export const inventoryApi = {
  list: (params?: any) => api.get('/inventory', { params }),
  lowStock: () => api.get('/inventory/low-stock'),
  get: (id: number) => api.get(`/inventory/${id}`),
  create: (data: any) => api.post('/inventory', data),
  update: (id: number, data: any) => api.put(`/inventory/${id}`, data),
  delete: (id: number) => api.delete(`/inventory/${id}`),
};

// Suppliers
export const suppliersApi = {
  list: () => api.get('/suppliers'),
  get: (id: number) => api.get(`/suppliers/${id}`),
  create: (data: any) => api.post('/suppliers', data),
  update: (id: number, data: any) => api.put(`/suppliers/${id}`, data),
  delete: (id: number) => api.delete(`/suppliers/${id}`),
};

// Contractors
export const contractorsApi = {
  list: () => api.get('/contractors'),
  get: (id: number) => api.get(`/contractors/${id}`),
  create: (data: any) => api.post('/contractors', data),
  update: (id: number, data: any) => api.put(`/contractors/${id}`, data),
  delete: (id: number) => api.delete(`/contractors/${id}`),
};

// Purchase Orders
export const purchaseOrdersApi = {
  list: (params?: any) => api.get('/purchase-orders', { params }),
  get: (id: number) => api.get(`/purchase-orders/${id}`),
  create: (data: any) => api.post('/purchase-orders', data),
  update: (id: number, data: any) => api.put(`/purchase-orders/${id}`, data),
  updateStatus: (id: number, status: string) => api.patch(`/purchase-orders/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/purchase-orders/${id}`),
};

// Employees
export const employeesApi = {
  list: (params?: any) => api.get('/employees', { params }),
  get: (id: number) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: number, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: number) => api.delete(`/employees/${id}`),
};

// Attendance
export const attendanceApi = {
  list: (params?: any) => api.get('/attendance', { params }),
  create: (data: any) => api.post('/attendance', data),
  update: (id: number, data: any) => api.put(`/attendance/${id}`, data),
};

// Equipment
export const equipmentApi = {
  list: (params?: any) => api.get('/equipment', { params }),
  get: (id: number) => api.get(`/equipment/${id}`),
  create: (data: any) => api.post('/equipment', data),
  update: (id: number, data: any) => api.put(`/equipment/${id}`, data),
  delete: (id: number) => api.delete(`/equipment/${id}`),
};

// Maintenance
export const maintenanceApi = {
  list: (params?: any) => api.get('/maintenance', { params }),
  create: (data: any) => api.post('/maintenance', data),
  update: (id: number, data: any) => api.put(`/maintenance/${id}`, data),
};

// Expenses
export const expensesApi = {
  list: (params?: any) => api.get('/expenses', { params }),
  create: (data: any) => api.post('/expenses', data),
  update: (id: number, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: number) => api.delete(`/expenses/${id}`),
};

// Invoices
export const invoicesApi = {
  list: (params?: any) => api.get('/invoices', { params }),
  get: (id: number) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: number, data: any) => api.put(`/invoices/${id}`, data),
  updateStatus: (id: number, status: string) => api.patch(`/invoices/${id}/status`, { status }),
  delete: (id: number) => api.delete(`/invoices/${id}`),
};

// Warehouses
export const warehousesApi = {
  list: () => api.get('/warehouses'),
  create: (data: any) => api.post('/warehouses', data),
  update: (id: number, data: any) => api.put(`/warehouses/${id}`, data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
};

// Documents
export const documentsApi = {
  list: (params?: any) => api.get('/documents', { params }),
  create: (data: any) => {
    if (data instanceof FormData) {
      return api.post('/documents', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    return api.post('/documents', data);
  },
  delete: (id: number) => api.delete(`/documents/${id}`),
};

// Notifications
export const notificationsApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};

// Activity Log
export const activityLogApi = {
  list: (params?: any) => api.get('/activity-log', { params }),
};

// Inventory Movements
export const inventoryMovementsApi = {
  list: (params?: any) => api.get('/inventory-movements', { params }),
  create: (data: any) => api.post('/inventory-movements', data),
};

// Inventory Permissions
export const inventoryPermissionsApi = {
  list: (params?: any) => api.get('/inventory-permissions', { params }),
  get: (id: number) => api.get(`/inventory-permissions/${id}`),
  create: (data: any) => api.post('/inventory-permissions', data),
  update: (id: number, data: any) => api.put(`/inventory-permissions/${id}`, data),
};
