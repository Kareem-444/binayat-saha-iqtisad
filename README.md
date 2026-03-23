# بنيات سحابة اقتصاد — Binayat Saha Iqtisad

> نظام متكامل لإدارة شركات المقاولات والبناء — Construction Management System

نظام ويب شامل لإدارة جميع عمليات شركات المقاولات، يشمل إدارة المشاريع، المخزون، المشتريات، الموظفين، المعدات، المستندات، والتقارير المالية.

---

## 🛠 التقنيات المستخدمة — Tech Stack

### Frontend
| التقنية | الوصف |
|---------|-------|
| **React 18** | مكتبة واجهات المستخدم |
| **TypeScript** | لغة البرمجة المُوسّعة |
| **Vite** | أداة البناء والتشغيل السريع |
| **Tailwind CSS** | إطار عمل التنسيقات |
| **shadcn/ui** | مكونات واجهة مستخدم مبنية على Radix UI |
| **React Router v6** | التوجيه والتنقل بين الصفحات |
| **TanStack React Query** | إدارة البيانات والطلبات |
| **Axios** | عميل HTTP للتواصل مع الخادم |
| **Lucide React** | مكتبة الأيقونات |

### Backend
| التقنية | الوصف |
|---------|-------|
| **Node.js** | بيئة التشغيل |
| **Express.js** | إطار عمل الخادم |
| **PostgreSQL** | قاعدة البيانات العلائقية |
| **pg (node-postgres)** | عميل PostgreSQL |
| **JWT (jsonwebtoken)** | المصادقة والتوثيق |
| **bcrypt** | تشفير كلمات المرور |
| **Zod** | التحقق من صحة البيانات |
| **Helmet** | حماية HTTP headers |
| **express-rate-limit** | تحديد معدل الطلبات |
| **Multer** | رفع الملفات |
| **Winston** | تسجيل الأحداث (logging) |

---

## 📁 هيكل المشروع — Project Structure

```
binayat-saha-iqtisad/
├── public/                      # ملفات ثابتة
├── uploads/                     # ملفات مرفوعة (مستندات)
├── logs/                        # سجلات الخادم
│
├── src/                         # الواجهة الأمامية (Frontend)
│   ├── api/
│   │   └── client.ts            # عميل Axios + جميع دوال API
│   ├── components/
│   │   ├── ui/                  # مكونات shadcn/ui (Button, Input, Dialog, etc.)
│   │   ├── dialogs/             # نوافذ الحوار
│   │   │   ├── InventoryDialog.tsx          # إضافة/تعديل صنف مخزون
│   │   │   ├── DispenseDialog.tsx           # صرف مواد من المخزون
│   │   │   ├── AddItemMovementDialog.tsx    # إضافة حركة صنف (وارد/صادر)
│   │   │   ├── MovementReportDialog.tsx     # تقرير حركة الصنف + طباعة PDF
│   │   │   ├── ProjectDialog.tsx            # إضافة/تعديل مشروع
│   │   │   ├── EquipmentDialog.tsx          # إضافة/تعديل معدة
│   │   │   ├── ContractorDialog.tsx         # إضافة/تعديل مقاول
│   │   │   ├── SupplierDialog.tsx           # إضافة/تعديل مورد
│   │   │   ├── PurchaseOrderDialog.tsx      # إنشاء أمر شراء
│   │   │   └── DeleteConfirmDialog.tsx      # تأكيد الحذف
│   │   ├── Header.tsx           # شريط علوي
│   │   ├── Sidebar.tsx          # القائمة الجانبية
│   │   ├── Layout.tsx           # التخطيط الرئيسي
│   │   ├── NavLink.tsx          # رابط تنقل
│   │   └── ProtectedRoute.tsx   # حماية المسارات
│   ├── contexts/
│   │   └── AuthContext.tsx       # سياق المصادقة (JWT)
│   ├── hooks/
│   │   └── use-toast.ts         # إشعارات Toast
│   ├── pages/
│   │   ├── Dashboard.tsx        # لوحة التحكم الرئيسية
│   │   ├── Projects.tsx         # إدارة المشاريع
│   │   ├── Inventory.tsx        # إدارة المخزون
│   │   ├── Procurement.tsx      # المشتريات وأوامر الشراء
│   │   ├── Employees.tsx        # إدارة الموظفين
│   │   ├── Equipment.tsx        # إدارة المعدات
│   │   ├── Finance.tsx          # التقارير المالية
│   │   ├── Documents.tsx        # إدارة المستندات
│   │   ├── Settings.tsx         # الإعدادات
│   │   ├── Login.tsx            # تسجيل الدخول
│   │   └── NotFound.tsx         # صفحة 404
│   ├── App.tsx                  # المكون الجذري والتوجيه
│   ├── main.tsx                 # نقطة الدخول
│   └── index.css                # الأنماط الأساسية
│
├── server/                      # الخادم الخلفي (Backend)
│   ├── config/
│   │   └── db.js                # اتصال PostgreSQL
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── rbac.js              # صلاحيات الأدوار (admin, manager, viewer)
│   │   ├── validate.js          # Zod validation middleware
│   │   └── errorHandler.js      # معالجة الأخطاء
│   ├── routes/
│   │   ├── auth.js              # تسجيل الدخول / إنشاء حساب
│   │   ├── dashboard.js         # إحصائيات لوحة التحكم
│   │   ├── projects.js          # CRUD المشاريع
│   │   ├── inventory.js         # CRUD أصناف المخزون
│   │   ├── inventoryMovements.js # حركات المخزون (وارد/صادر)
│   │   ├── warehouses.js        # إدارة المستودعات
│   │   ├── suppliers.js         # إدارة الموردين
│   │   ├── purchaseOrders.js    # أوامر الشراء
│   │   ├── employees.js         # إدارة الموظفين
│   │   ├── attendance.js        # الحضور والغياب
│   │   ├── equipment.js         # إدارة المعدات
│   │   ├── maintenance.js       # سجلات الصيانة
│   │   ├── expenses.js          # إدارة المصروفات
│   │   ├── invoices.js          # الفواتير
│   │   ├── documents.js         # رفع/إدارة المستندات
│   │   ├── notifications.js     # الإشعارات
│   │   └── activityLog.js       # سجل النشاطات
│   ├── db/
│   │   ├── schema.sql           # مخطط قاعدة البيانات (17 جدول)
│   │   └── seed.sql             # بيانات تجريبية
│   ├── utils/
│   │   └── logger.js            # Winston logger
│   ├── index.js                 # نقطة الدخول للخادم
│   └── package.json             # اعتماديات الخادم
│
├── .env                         # متغيرات البيئة
├── .env.example                 # مثال متغيرات البيئة
├── package.json                 # اعتماديات الواجهة الأمامية
├── vite.config.ts               # إعدادات Vite + proxy
├── tailwind.config.ts           # إعدادات Tailwind
├── tsconfig.json                # إعدادات TypeScript
└── README.md                    # هذا الملف
```

---

## 🚀 الميزات — Features

### 1. لوحة التحكم (Dashboard)
- إحصائيات سريعة: عدد المشاريع، الموظفين، المعدات، الأصناف
- ملخص مالي: الإيرادات والمصروفات
- المشاريع النشطة مع نسب الإنجاز
- سجل آخر النشاطات
- تنبيهات المخزون المنخفض

### 2. إدارة المشاريع (Projects)
- إنشاء وتعديل وحذف المشاريع
- تتبع الميزانية والمصروفات ونسبة الإنجاز
- حالات المشروع: نشط، يكاد يكتمل، مكتمل، متوقف، ملغي
- ربط الموظفين والمعدات بالمشاريع

### 3. إدارة المخزون (Inventory)
- إدارة أصناف المخزون (مواد، معدات، أدوات)
- **صرف مواد** — تسجيل صرف الأصناف مع تحديد المشروع والمقاول
- **إضافة حركة صنف** — تسجيل الوارد والصادر من/إلى مستودعات أخرى مع:
  - نوع الحركة (وارد / صادر)
  - الموقع المصدر / المستودع
  - المسؤول عن الصرف
  - المشروع والمقاول والملاحظات
- **تقرير حركة الصنف** — عرض جميع الحركات مع تفاصيل الموقع المصدر والمسؤول
- طباعة تقرير PDF لحركة كل صنف
- تنبيهات المخزون المنخفض (أقل من الحد الأدنى)
- حساب القيمة الكلية تلقائياً
- بحث وتصفية حسب الفئة

### 4. إدارة المستودعات (Warehouses)
- إنشاء وإدارة المستودعات
- ربط الأصناف بالمستودعات
- بيانات المسؤول ورقم التواصل

### 5. المشتريات (Procurement)
- إنشاء أوامر الشراء
- ربط أوامر الشراء بالموردين والمشاريع
- حالات أمر الشراء: قيد الانتظار، معتمد، تم التسليم، ملغي
- إدارة الموردين مع التقييم

### 6. إدارة الموظفين (Employees)
- بيانات الموظفين الكاملة
- أنواع الرواتب: شهري، يومي، بالساعة
- ربط الموظفين بالمشاريع
- حالات: نشط، إجازة، منتهي

### 7. الحضور والغياب (Attendance)
- تسجيل الحضور والانصراف يومياً
- حساب ساعات العمل الإضافية
- حالات: حاضر، غائب، إجازة، متأخر

### 8. إدارة المعدات (Equipment)
- تسجيل المعدات مع النوع والموديل وسنة الصنع
- تتبع ساعات الاستخدام والتكلفة اليومية
- حالات: يعمل، صيانة، معطل، مؤجر
- جدولة الصيانة الدورية والطوارئ

### 9. سجلات الصيانة (Maintenance)
- أنواع: دوري، طارئ، إصلاح
- ربط الصيانة بالمعدات
- تتبع التكلفة والمسؤول

### 10. الإدارة المالية (Finance)
- إدارة المصروفات حسب الفئة والمشروع
- الفواتير: مسودة، مستحقة، مدفوعة، متأخرة، ملغية
- حساب الضريبة تلقائياً
- ملخص مالي شهري

### 11. إدارة المستندات (Documents)
- رفع الملفات (PDF, صور, مستندات)
- تصنيف المستندات حسب الفئة والمشروع
- معاينة الملفات المرفوعة

### 12. الإشعارات وسجل النشاطات
- إشعارات فورية (معلومات، نجاح، تحذير، خطأ)
- سجل كامل لجميع العمليات على النظام

---

## 🗄 قاعدة البيانات — Database Schema

يتكون المخطط من **17 جدولاً**:

| الجدول | الوصف |
|--------|-------|
| `users` | المستخدمون والأدوار (admin, manager, viewer) |
| `projects` | المشاريع |
| `warehouses` | المستودعات |
| `inventory_items` | أصناف المخزون |
| `inventory_movements` | حركات المخزون (وارد/صادر) مع الموقع المصدر والمسؤول |
| `suppliers` | الموردون |
| `purchase_orders` | أوامر الشراء |
| `purchase_order_items` | بنود أوامر الشراء |
| `employees` | الموظفون |
| `attendance` | سجلات الحضور |
| `equipment` | المعدات |
| `maintenance_records` | سجلات الصيانة |
| `expenses` | المصروفات |
| `invoices` | الفواتير |
| `documents` | المستندات المرفوعة |
| `notifications` | الإشعارات |
| `activity_log` | سجل النشاطات |
| `financial_monthly` | الملخص المالي الشهري |

---

## 🔐 نظام الصلاحيات — Role-Based Access

| الدور | الصلاحيات |
|-------|-----------|
| **admin** | كامل الصلاحيات: إنشاء، تعديل، حذف، إدارة المستخدمين |
| **manager** | إنشاء وتعديل العمليات دون الحذف |
| **viewer** | عرض البيانات فقط |

---

## ⚡ واجهة API — API Endpoints

جميع المسارات محمية بـ JWT ما عدا `/api/auth/*`.

| المجموعة | المسار | العمليات |
|----------|--------|----------|
| المصادقة | `/api/auth` | `POST /login`, `POST /register`, `GET /me` |
| لوحة التحكم | `/api/dashboard` | `GET /` |
| المشاريع | `/api/projects` | `GET`, `GET/:id`, `POST`, `PUT/:id`, `DELETE/:id` |
| المخزون | `/api/inventory` | `GET`, `GET/low-stock`, `GET/:id`, `POST`, `PUT/:id`, `DELETE/:id` |
| حركات المخزون | `/api/inventory-movements` | `GET?item_id=X`, `POST` |
| المستودعات | `/api/warehouses` | `GET`, `POST`, `PUT/:id`, `DELETE/:id` |
| الموردون | `/api/suppliers` | `GET`, `GET/:id`, `POST`, `PUT/:id`, `DELETE/:id` |
| أوامر الشراء | `/api/purchase-orders` | `GET`, `GET/:id`, `POST`, `PUT/:id`, `PATCH/:id/status`, `DELETE/:id` |
| الموظفون | `/api/employees` | `GET`, `GET/:id`, `POST`, `PUT/:id`, `DELETE/:id` |
| الحضور | `/api/attendance` | `GET`, `POST`, `PUT/:id` |
| المعدات | `/api/equipment` | `GET`, `GET/:id`, `POST`, `PUT/:id`, `DELETE/:id` |
| الصيانة | `/api/maintenance` | `GET`, `POST`, `PUT/:id` |
| المصروفات | `/api/expenses` | `GET`, `POST`, `PUT/:id`, `DELETE/:id` |
| الفواتير | `/api/invoices` | `GET`, `GET/:id`, `POST`, `PUT/:id`, `PATCH/:id/status`, `DELETE/:id` |
| المستندات | `/api/documents` | `GET`, `POST` (multipart), `DELETE/:id` |
| الإشعارات | `/api/notifications` | `GET`, `GET/unread-count`, `PATCH/:id/read`, `PATCH/read-all` |
| سجل النشاط | `/api/activity-log` | `GET` |
| الصحة | `/api/health` | `GET` (بدون مصادقة) |

---

## 🏗 التثبيت والتشغيل — Setup & Installation

### المتطلبات
- **Node.js** v18 أو أحدث
- **PostgreSQL** v14 أو أحدث
- **npm** أو **bun**

### 1. استنساخ المشروع
```bash
git clone <YOUR_GIT_URL>
cd binayat-saha-iqtisad
```

### 2. إعداد متغيرات البيئة
```bash
cp .env.example .env
```
عدّل ملف `.env`:
```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/YOUR_DB_NAME
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8080
```

### 3. إنشاء قاعدة البيانات
```bash
# إنشاء القاعدة
createdb YOUR_DB_NAME

# تشغيل المخطط
psql -U postgres -d YOUR_DB_NAME -f server/db/schema.sql

# (اختياري) إضافة بيانات تجريبية
psql -U postgres -d YOUR_DB_NAME -f server/db/seed.sql
```

### 4. تثبيت الاعتماديات
```bash
# الواجهة الأمامية
npm install

# الخادم
cd server && npm install && cd ..
```

### 5. التشغيل
```bash
# تشغيل الخادم والواجهة معاً
npm run dev:all

# أو بشكل منفصل:
# الواجهة الأمامية (المنفذ 8080)
npm run dev

# الخادم (المنفذ 5000)
cd server && node index.js
```

### 6. الوصول
- **الواجهة الأمامية**: `http://localhost:8080`
- **API الخادم**: `http://localhost:5000/api`
- **فحص الصحة**: `http://localhost:5000/api/health`

---

## 📜 الرخصة — License

هذا المشروع مخصص للاستخدام الخاص.
