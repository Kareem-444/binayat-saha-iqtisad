-- =============================================
-- بنيات سحابة اقتصاد - Construction Management System
-- PostgreSQL Database Schema
-- =============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. USERS & ROLES
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin','manager','viewer')),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =============================================
-- 2. PROJECTS
-- =============================================
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    client VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    start_date DATE,
    end_date DATE,
    budget NUMERIC(15,2) DEFAULT 0,
    spent NUMERIC(15,2) DEFAULT 0,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status VARCHAR(30) DEFAULT 'نشط' CHECK (status IN ('نشط','يكاد يكتمل','مكتمل','متوقف','ملغي')),
    manager_name VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- =============================================
-- 3. WAREHOUSES
-- =============================================
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    capacity VARCHAR(100),
    manager_name VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. INVENTORY ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(100) UNIQUE,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('مواد','معدات','أدوات')),
    unit VARCHAR(30) NOT NULL,
    quantity NUMERIC(12,2) DEFAULT 0,
    min_stock NUMERIC(12,2) DEFAULT 0,
    unit_price NUMERIC(12,2) DEFAULT 0,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    warehouse_name VARCHAR(200),
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse ON inventory_items(warehouse_id);

-- =============================================
-- 4b. INVENTORY MOVEMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_movements (
    id SERIAL PRIMARY KEY,
    item_id INTEGER REFERENCES inventory_items(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('وارد','صادر')),
    quantity NUMERIC(12,2) NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    project_name VARCHAR(200),
    contractor_name VARCHAR(200),
    user_name VARCHAR(100),
    source_location VARCHAR(200),
    issued_by VARCHAR(200),
    notes TEXT,
    movement_date DATE DEFAULT CURRENT_DATE,
    reference_type VARCHAR(50), 
    reference_id INTEGER,
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE SET NULL,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    target_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_movements_item ON inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_movements_date ON inventory_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_movements_ref ON inventory_movements(reference_type, reference_id);

-- =============================================
-- 5. SUPPLIERS
-- =============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(30),
    email VARCHAR(150),
    category VARCHAR(100),
    rating NUMERIC(3,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_orders INTEGER DEFAULT 0,
    total_value NUMERIC(15,2) DEFAULT 0,
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category);

-- =============================================
-- 5b. CONTRACTORS
-- =============================================
CREATE TABLE IF NOT EXISTS contractors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    specialty VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. PURCHASE ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(30) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(200),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    order_date DATE DEFAULT CURRENT_DATE,
    total NUMERIC(15,2) DEFAULT 0,
    items_count INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'قيد الانتظار' CHECK (status IN ('قيد الانتظار','معتمد','تم التسليم','ملغي')),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);

-- =============================================
-- 7. PURCHASE ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    total NUMERIC(15,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);
CREATE INDEX IF NOT EXISTS idx_poi_po ON purchase_order_items(purchase_order_id);

-- =============================================
-- 8. EMPLOYEES
-- =============================================
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(100),
    department VARCHAR(100),
    salary NUMERIC(12,2) DEFAULT 0,
    salary_type VARCHAR(20) DEFAULT 'شهري' CHECK (salary_type IN ('شهري','يومي','بالساعة')),
    phone VARCHAR(20),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    project_name VARCHAR(200),
    start_date DATE,
    status VARCHAR(20) DEFAULT 'نشط' CHECK (status IN ('نشط','إجازة','منتهي')),
    national_id VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_project ON employees(project_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);

-- =============================================
-- 9. ATTENDANCE
-- =============================================
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIME,
    check_out TIME,
    status VARCHAR(20) DEFAULT 'حاضر' CHECK (status IN ('حاضر','غائب','إجازة','متأخر')),
    overtime_hours NUMERIC(4,1) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_unique ON attendance(employee_id, date);

-- =============================================
-- 10. EQUIPMENT
-- =============================================
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    status VARCHAR(20) DEFAULT 'يعمل' CHECK (status IN ('يعمل','صيانة','معطل','مؤجر')),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    project_name VARCHAR(200),
    hours_used NUMERIC(10,1) DEFAULT 0,
    last_maintenance DATE,
    next_maintenance DATE,
    daily_cost NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_project ON equipment(project_id);

-- =============================================
-- 11. MAINTENANCE RECORDS
-- =============================================
CREATE TABLE IF NOT EXISTS maintenance_records (
    id SERIAL PRIMARY KEY,
    equipment_id INTEGER REFERENCES equipment(id) ON DELETE CASCADE,
    maintenance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type VARCHAR(30) DEFAULT 'دوري' CHECK (type IN ('دوري','طارئ','إصلاح')),
    description TEXT,
    cost NUMERIC(12,2) DEFAULT 0,
    performed_by VARCHAR(150),
    next_scheduled DATE,
    status VARCHAR(20) DEFAULT 'مكتمل' CHECK (status IN ('مجدول','قيد التنفيذ','مكتمل')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_maintenance_equipment ON maintenance_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON maintenance_records(maintenance_date);

-- =============================================
-- 12. EXPENSES
-- =============================================
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(15,2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50),
    receipt_number VARCHAR(50),
    approved_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'معتمد' CHECK (status IN ('قيد المراجعة','معتمد','مرفوض')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- =============================================
-- 13. INVOICES
-- =============================================
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(30) UNIQUE NOT NULL,
    client VARCHAR(200) NOT NULL,
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    project_name VARCHAR(200),
    amount NUMERIC(15,2) NOT NULL,
    tax_amount NUMERIC(15,2) DEFAULT 0,
    total_amount NUMERIC(15,2) GENERATED ALWAYS AS (amount + tax_amount) STORED,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'مسودة' CHECK (status IN ('مسودة','مستحقة','مدفوعة','متأخرة','ملغية')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- =============================================
-- 14. DOCUMENTS
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_size INTEGER,
    file_path TEXT,
    category VARCHAR(100) DEFAULT 'عام',
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_project ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

-- =============================================
-- 15. NOTIFICATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info','success','warning','error')),
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- =============================================
-- 16. ACTIVITY LOG
-- =============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    action TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(50),
    icon VARCHAR(30) DEFAULT 'activity',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC);

-- =============================================
-- 17. FINANCIAL SUMMARY (monthly cache)
-- =============================================
CREATE TABLE IF NOT EXISTS financial_monthly (
    id SERIAL PRIMARY KEY,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    month_name VARCHAR(20),
    revenue NUMERIC(15,2) DEFAULT 0,
    expenses NUMERIC(15,2) DEFAULT 0,
    UNIQUE(year, month)
);

-- =============================================
-- 18. INVENTORY PERMISSIONS (STOCK IN/OUT)
-- =============================================
CREATE TABLE IF NOT EXISTS inventory_permissions (
    id SERIAL PRIMARY KEY,
    permission_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('add', 'dispense')),
    project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
    supplier_name VARCHAR(200),
    external BOOLEAN DEFAULT false,
    vehicle_number VARCHAR(100),
    supply_route VARCHAR(200),
    notes TEXT,
    date DATE DEFAULT CURRENT_DATE,
    month INTEGER,
    target_type VARCHAR(20) CHECK (target_type IN ('contractor', 'warehouse')),
    contractor_id INTEGER REFERENCES contractors(id) ON DELETE SET NULL,
    employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    driver_name VARCHAR(150),
    target_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_perm_dir ON inventory_permissions(direction);

CREATE TABLE IF NOT EXISTS inventory_permission_items (
    id SERIAL PRIMARY KEY,
    permission_id INTEGER REFERENCES inventory_permissions(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES inventory_items(id) ON DELETE SET NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity NUMERIC(12,2) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(30) NOT NULL,
    price NUMERIC(12,2) DEFAULT 0,
    item_code VARCHAR(100),
    total_price NUMERIC(12,2),
    notes TEXT,
    remaining_stock NUMERIC(12,2),
    dispatch_location VARCHAR(200)
);

