import { useQuery } from "@tanstack/react-query";
import { 
  FolderKanban, Package, Users, Wrench, DollarSign, 
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, Activity, BarChart3, ArrowUpRight
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { dashboardApi } from "@/api/client";

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string; value: string; subtitle: string; icon: any; color: string; trend?: { value: string; up: boolean };
}) => (
  <div className="stat-card card-hover animate-fade-in">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs text-muted-foreground font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color} flex-shrink-0`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
    {trend && (
      <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend.up ? "text-green-600" : "text-red-500"}`}>
        {trend.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>{trend.value}</span>
      </div>
    )}
  </div>
);

const formatCurrency = (v: number) => new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR", maximumFractionDigits: 0 }).format(v);

const projectStatusColors: Record<string, string> = {
  "نشط": "badge-success",
  "مكتمل": "badge-neutral",
  "يكاد يكتمل": "badge-info",
};

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get().then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-500">حدث خطأ في تحميل البيانات</p>
      </div>
    );
  }

  const { projects, inventory, employees, finances, lowStockItems, recentActivities, notifications } = data;
  const activeProjects = projects.filter((p: any) => p.status === "نشط").length;
  const totalInventoryValue = inventory.reduce((sum: number, i: any) => sum + Number(i.quantity) * Number(i.unit_price), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl p-6 gradient-hero text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/20" />
          <div className="absolute -bottom-10 left-20 h-60 w-60 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <p className="text-primary-foreground/70 text-sm">مرحباً بك في</p>
          <h1 className="text-2xl font-black mt-0.5">نظام إدارة المقاولات</h1>
          <p className="text-primary-foreground/60 text-sm mt-1">لديك {notifications.filter((n: any) => !n.is_read).length} إشعارات غير مقروءة و {lowStockItems.length} تنبيهات مخزون</p>
        </div>
        <div className="relative z-10 mt-4 flex gap-3 flex-wrap">
          <div className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-sm">
            {new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="المشاريع النشطة"
          value={`${activeProjects}`}
          subtitle={`من إجمالي ${projects.length} مشاريع`}
          icon={FolderKanban}
          color="bg-blue-100 text-blue-700"
          trend={{ value: "+2 هذا الشهر", up: true }}
        />
        <StatCard
          title="قيمة المخزون"
          value={formatCurrency(totalInventoryValue).replace("ر.س.", "").trim() + " ر.س"}
          subtitle={`${inventory.length} صنف مخزني`}
          icon={Package}
          color="bg-amber-100 text-amber-700"
          trend={{ value: "+8.2% هذا الشهر", up: true }}
        />
        <StatCard
          title="إجمالي الموظفين"
          value={`${employees.length}`}
          subtitle={`${employees.filter((e: any) => e.status === "نشط").length} موظف نشط`}
          icon={Users}
          color="bg-green-100 text-green-700"
        />
        <StatCard
          title="الإيرادات (نوفمبر)"
          value="2.0M ر.س"
          subtitle="صافي الربح: 650K ر.س"
          icon={DollarSign}
          color="bg-purple-100 text-purple-700"
          trend={{ value: "-12% عن أكتوبر", up: false }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">الإيرادات والمصروفات</h3>
              <p className="text-xs text-muted-foreground">يناير – نوفمبر 2024</p>
            </div>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={finances.monthlyData.slice(0, 11)}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(221 83% 28%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(221 83% 28%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38 96% 48%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(38 96% 48%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "Tajawal" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fontFamily: "Tajawal" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
              <Tooltip
                contentStyle={{ fontFamily: "Tajawal", fontSize: "12px", borderRadius: "8px", border: "1px solid hsl(220 13% 88%)" }}
                formatter={(value: number, name: string) => [formatCurrency(value), name === "revenue" ? "الإيرادات" : "المصروفات"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(221 83% 28%)" strokeWidth={2} fill="url(#revGrad)" name="revenue" />
              <Area type="monotone" dataKey="expenses" stroke="hsl(38 96% 48%)" strokeWidth={2} fill="url(#expGrad)" name="expenses" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-navy-600" style={{ background: "hsl(221 83% 28%)" }} />
              الإيرادات
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full" style={{ background: "hsl(38 96% 48%)" }} />
              المصروفات
            </div>
          </div>
        </div>

        {/* Project Progress */}
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground">تقدم المشاريع</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {projects.slice(0, 5).map((p: any) => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-foreground truncate flex-1 ml-2">{p.name.split(" ").slice(0, 3).join(" ")}</p>
                  <span className="text-xs font-bold text-foreground">{p.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${p.progress}%`,
                      background: p.progress >= 90 ? "hsl(142 71% 40%)" : p.progress >= 50 ? "hsl(221 83% 28%)" : "hsl(38 96% 48%)"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Projects */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card card-shadow overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">المشاريع الأخيرة</h3>
            <a href="/projects" className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              عرض الكل <ArrowUpRight className="h-3 w-3" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground">المشروع</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">العميل</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">التقدم</th>
                  <th className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any) => (
                  <tr key={p.id} className="border-b border-border/50 table-row-hover last:border-0">
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-foreground">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.location}</p>
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground hidden sm:table-cell">{p.client}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs font-medium">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${projectStatusColors[p.status] || "badge-neutral"}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts & Activity */}
        <div className="space-y-4">
          {/* Low Stock Alerts */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">تنبيهات المخزون</h3>
              <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">{lowStockItems.length}</span>
            </div>
            <div className="space-y-2">
              {lowStockItems.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-amber-100 px-3 py-1.5">
                  <p className="text-xs font-medium text-amber-900 truncate">{item.name}</p>
                  <span className="text-[10px] font-bold text-amber-700 mr-2">{item.quantity}/{item.min_stock}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-xl border border-border bg-card p-4 card-shadow">
            <h3 className="text-sm font-bold text-foreground mb-3">آخر الأنشطة</h3>
            <div className="space-y-3">
              {recentActivities.slice(0, 4).map((a: any) => (
                <div key={a.id} className="flex gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{a.action}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{a.user_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
