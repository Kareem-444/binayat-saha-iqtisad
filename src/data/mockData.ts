export const projects = [
  { id: 1, name: "برج سكني الرياض", client: "شركة الأفق العقارية", location: "الرياض", startDate: "2024-01-15", endDate: "2025-06-30", budget: 12500000, spent: 7800000, progress: 62, status: "نشط", manager: "أحمد الشمري" },
  { id: 2, name: "مجمع تجاري جدة", client: "مجموعة البحر الأحمر", location: "جدة", startDate: "2024-03-01", endDate: "2025-09-15", budget: 8900000, spent: 2100000, progress: 23, status: "نشط", manager: "محمد القحطاني" },
  { id: 3, name: "فيلا فاخرة الدمام", client: "السيد خالد العتيبي", location: "الدمام", startDate: "2023-11-01", endDate: "2024-12-31", budget: 3200000, spent: 3100000, progress: 97, status: "يكاد يكتمل", manager: "عبدالله الزهراني" },
  { id: 4, name: "طريق صناعي المدينة", client: "أمانة المدينة المنورة", location: "المدينة المنورة", startDate: "2024-06-01", endDate: "2025-12-01", budget: 22000000, spent: 1500000, progress: 7, status: "نشط", manager: "فيصل الغامدي" },
  { id: 5, name: "مستودع لوجستي الخبر", client: "شركة الخليج للتوزيع", location: "الخبر", startDate: "2024-02-10", endDate: "2024-10-30", budget: 4500000, spent: 4500000, progress: 100, status: "مكتمل", manager: "أحمد الشمري" },
];

export const inventory = [
  { id: 1, name: "أسمنت بورتلاندي", category: "مواد", unit: "كيس", quantity: 1250, minStock: 500, warehouse: "مستودع الرياض الرئيسي", unitPrice: 18, lastUpdated: "2024-11-15" },
  { id: 2, name: "حديد تسليح 16mm", category: "مواد", unit: "طن", quantity: 45, minStock: 20, warehouse: "مستودع الرياض الرئيسي", unitPrice: 3200, lastUpdated: "2024-11-14" },
  { id: 3, name: "رمل ناعم", category: "مواد", unit: "م³", quantity: 380, minStock: 100, warehouse: "مستودع جدة", unitPrice: 85, lastUpdated: "2024-11-13" },
  { id: 4, name: "طابوق بناء", category: "مواد", unit: "قطعة", quantity: 28000, minStock: 5000, warehouse: "مستودع الرياض الرئيسي", unitPrice: 0.8, lastUpdated: "2024-11-12" },
  { id: 5, name: "بويا خارجية بيضاء", category: "مواد", unit: "دلو", quantity: 85, minStock: 50, warehouse: "مستودع جدة", unitPrice: 95, lastUpdated: "2024-11-11" },
  { id: 6, name: "شفرة بوجي 20 طن", category: "معدات", unit: "قطعة", quantity: 2, minStock: 1, warehouse: "ساحة المعدات", unitPrice: 85000, lastUpdated: "2024-11-10" },
  { id: 7, name: "مولد كهرباء 50kW", category: "معدات", unit: "وحدة", quantity: 3, minStock: 2, warehouse: "ساحة المعدات", unitPrice: 42000, lastUpdated: "2024-11-09" },
  { id: 8, name: "قفازات عمل", category: "أدوات", unit: "زوج", quantity: 120, minStock: 200, warehouse: "مستودع الرياض الرئيسي", unitPrice: 12, lastUpdated: "2024-11-15" },
  { id: 9, name: "خوذة سلامة", category: "أدوات", unit: "قطعة", quantity: 65, minStock: 100, warehouse: "مستودع الرياض الرئيسي", unitPrice: 35, lastUpdated: "2024-11-10" },
];

export const employees = [
  { id: 1, name: "أحمد محمد الشمري", role: "مدير مشروع", department: "المشاريع", salary: 18000, salaryType: "شهري", phone: "0501234567", project: "برج سكني الرياض", startDate: "2022-03-01", status: "نشط" },
  { id: 2, name: "محمد علي القحطاني", role: "مدير مشروع", department: "المشاريع", salary: 16500, salaryType: "شهري", phone: "0509876543", project: "مجمع تجاري جدة", startDate: "2021-07-15", status: "نشط" },
  { id: 3, name: "عبدالله سالم الزهراني", role: "مهندس موقع", department: "الهندسة", salary: 12000, salaryType: "شهري", phone: "0507654321", project: "فيلا فاخرة الدمام", startDate: "2023-01-10", status: "نشط" },
  { id: 4, name: "خالد ناصر العتيبي", role: "مشرف بناء", department: "التشييد", salary: 8500, salaryType: "شهري", phone: "0503456789", project: "برج سكني الرياض", startDate: "2022-05-20", status: "نشط" },
  { id: 5, name: "فيصل أحمد الغامدي", role: "مدير مشروع", department: "المشاريع", salary: 17000, salaryType: "شهري", phone: "0502345678", project: "طريق صناعي المدينة", startDate: "2020-09-01", status: "نشط" },
  { id: 6, name: "سلطان محمد الدوسري", role: "عامل بناء", department: "التشييد", salary: 220, salaryType: "يومي", phone: "0506789012", project: "برج سكني الرياض", startDate: "2024-02-01", status: "نشط" },
  { id: 7, name: "حسن علي التميمي", role: "كهربائي", department: "الكهرباء", salary: 9000, salaryType: "شهري", phone: "0508901234", project: "مجمع تجاري جدة", startDate: "2023-06-15", status: "إجازة" },
];

export const suppliers = [
  { id: 1, name: "شركة الخليج للمواد البنائية", contact: "عبدالرحمن السعدون", phone: "0112345678", email: "info@gulf-materials.sa", category: "مواد بناء", rating: 4.5, totalOrders: 28, totalValue: 1250000 },
  { id: 2, name: "مؤسسة الحديد الذهبي", contact: "فهد الحربي", phone: "0123456789", email: "sales@golden-steel.sa", category: "حديد وصلب", rating: 4.8, totalOrders: 15, totalValue: 890000 },
  { id: 3, name: "شركة الرمال والبحص", contact: "ناصر المطيري", phone: "0134567890", email: "orders@sand-co.sa", category: "رمل وحصى", rating: 4.2, totalOrders: 42, totalValue: 320000 },
  { id: 4, name: "مؤسسة الأدوات الصناعية", contact: "سعد العجمي", phone: "0145678901", email: "info@tools-est.sa", category: "أدوات ومعدات", rating: 3.9, totalOrders: 18, totalValue: 450000 },
];

export const purchaseOrders = [
  { id: "PO-2024-001", supplier: "شركة الخليج للمواد البنائية", date: "2024-11-10", total: 45000, status: "تم التسليم", items: 3 },
  { id: "PO-2024-002", supplier: "مؤسسة الحديد الذهبي", date: "2024-11-12", total: 128000, status: "معتمد", items: 1 },
  { id: "PO-2024-003", supplier: "شركة الرمال والبحص", date: "2024-11-14", total: 12500, status: "قيد الانتظار", items: 2 },
  { id: "PO-2024-004", supplier: "مؤسسة الأدوات الصناعية", date: "2024-11-15", total: 8900, status: "قيد الانتظار", items: 5 },
];

export const equipment = [
  { id: 1, name: "حفارة كوماتسو PC350", type: "حفارة", model: "PC350-8", year: 2020, status: "يعمل", project: "طريق صناعي المدينة", hoursUsed: 1240, lastMaintenance: "2024-10-01", nextMaintenance: "2024-12-01", dailyCost: 2500 },
  { id: 2, name: "رافعة تاور 80 طن", type: "رافعة", model: "Liebherr 200EC", year: 2019, status: "يعمل", project: "برج سكني الرياض", hoursUsed: 2850, lastMaintenance: "2024-09-15", nextMaintenance: "2024-12-15", dailyCost: 3800 },
  { id: 3, name: "خلاطة خرسانة متنقلة", type: "خلاطة", model: "Schwing Stetter AM8", year: 2022, status: "صيانة", project: "–", hoursUsed: 680, lastMaintenance: "2024-11-10", nextMaintenance: "2025-02-10", dailyCost: 1200 },
  { id: 4, name: "شاحنة قلابة 20 طن", type: "شاحنة", model: "Mercedes Arocs 3348", year: 2021, status: "يعمل", project: "مجمع تجاري جدة", hoursUsed: 3200, lastMaintenance: "2024-10-20", nextMaintenance: "2024-12-20", dailyCost: 1800 },
  { id: 5, name: "رافعة شوكية 5 طن", type: "رافعة شوكية", model: "Toyota 8FG50", year: 2023, status: "يعمل", project: "مستودع لوجستي الخبر", hoursUsed: 420, lastMaintenance: "2024-11-01", nextMaintenance: "2025-01-01", dailyCost: 800 },
];

export const finances = {
  totalRevenue: 28500000,
  totalExpenses: 19200000,
  netProfit: 9300000,
  outstandingInvoices: 3800000,
  monthlyData: [
    { month: "يناير", revenue: 1800000, expenses: 1200000 },
    { month: "فبراير", revenue: 2100000, expenses: 1450000 },
    { month: "مارس", revenue: 2400000, expenses: 1600000 },
    { month: "أبريل", revenue: 2200000, expenses: 1550000 },
    { month: "مايو", revenue: 2800000, expenses: 1900000 },
    { month: "يونيو", revenue: 3100000, expenses: 2100000 },
    { month: "يوليو", revenue: 2900000, expenses: 1950000 },
    { month: "أغسطس", revenue: 3400000, expenses: 2300000 },
    { month: "سبتمبر", revenue: 3200000, expenses: 2150000 },
    { month: "أكتوبر", revenue: 2600000, expenses: 1750000 },
    { month: "نوفمبر", revenue: 2000000, expenses: 1350000 },
    { month: "ديسمبر", revenue: 0, expenses: 0 },
  ],
  invoices: [
    { id: "INV-2024-045", client: "شركة الأفق العقارية", project: "برج سكني الرياض", amount: 850000, dueDate: "2024-11-30", status: "مستحقة" },
    { id: "INV-2024-044", client: "مجموعة البحر الأحمر", project: "مجمع تجاري جدة", amount: 320000, dueDate: "2024-12-15", status: "مسودة" },
    { id: "INV-2024-043", client: "أمانة المدينة المنورة", project: "طريق صناعي المدينة", amount: 500000, dueDate: "2024-11-20", status: "متأخرة" },
    { id: "INV-2024-042", client: "شركة الخليج للتوزيع", project: "مستودع لوجستي الخبر", amount: 2130000, dueDate: "2024-10-31", status: "مدفوعة" },
  ],
};

export const notifications = [
  { id: 1, type: "warning", title: "مخزون منخفض", message: "قفازات العمل أقل من الحد الأدنى (65 / 100)", time: "منذ ساعة", read: false },
  { id: 2, type: "warning", title: "مخزون منخفض", message: "خوذة السلامة أقل من الحد الأدنى (65 / 100)", time: "منذ ساعتين", read: false },
  { id: 3, type: "info", title: "صيانة معدة", message: "خلاطة الخرسانة في مرحلة الصيانة", time: "منذ 3 ساعات", read: false },
  { id: 4, type: "success", title: "طلب شراء معتمد", message: "تم اعتماد PO-2024-002 بقيمة 128,000 جنيه", time: "منذ 5 ساعات", read: true },
  { id: 5, type: "error", title: "فاتورة متأخرة", message: "الفاتورة INV-2024-043 متأخرة بقيمة 500,000 جنيه", time: "منذ يوم", read: true },
];

export const recentActivities = [
  { id: 1, user: "أحمد الشمري", action: "أضاف 500 كيس أسمنت للمخزون", time: "منذ 30 دقيقة", icon: "package" },
  { id: 2, user: "محمد القحطاني", action: "حدّث تقدم مشروع مجمع تجاري جدة إلى 23%", time: "منذ ساعة", icon: "briefcase" },
  { id: 3, user: "فاطمة الراشد", action: "أصدرت فاتورة INV-2024-044", time: "منذ 2 ساعة", icon: "file-text" },
  { id: 4, user: "عبدالله الزهراني", action: "أضاف سجل حضور لـ 15 عاملاً", time: "منذ 3 ساعات", icon: "users" },
  { id: 5, user: "خالد العتيبي", action: "جدول صيانة لحفارة كوماتسو PC350", time: "منذ 4 ساعات", icon: "tool" },
];
