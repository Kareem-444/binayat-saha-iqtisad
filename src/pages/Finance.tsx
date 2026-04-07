import { useQuery } from "@tanstack/react-query";
import { Plus, TrendingUp, TrendingDown, DollarSign, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardApi, invoicesApi } from "@/api/client";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(v) + " ج.م";

const invoiceStatusColors: Record<string, string> = {
  "مدفوعة": "badge-success",
  "مستحقة": "badge-warning",
  "متأخرة": "badge-danger",
  "مسودة": "badge-neutral",
};

export default function Finance() {
  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get().then(r => r.data),
  });

  const { data: invoices = [], isLoading: invLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => invoicesApi.list().then(r => r.data),
  });

  if (dashLoading || invLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const finances = dashboard?.finances || { totalRevenue: 0, totalExpenses: 0, netProfit: 0, outstandingInvoices: 0, monthlyData: [] };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الإيرادات", value: formatCurrency(finances.totalRevenue), icon: TrendingUp, color: "bg-green-100 text-green-700", sub: "2024" },
          { label: "إجمالي المصروفات", value: formatCurrency(finances.totalExpenses), icon: TrendingDown, color: "bg-red-100 text-red-700", sub: "2024" },
          { label: "صافي الربح", value: formatCurrency(finances.netProfit), icon: DollarSign, color: "bg-blue-100 text-blue-700", sub: finances.totalRevenue > 0 ? `هامش ${((finances.netProfit / finances.totalRevenue) * 100).toFixed(1)}%` : "–" },
          { label: "فواتير معلقة", value: formatCurrency(finances.outstandingInvoices), icon: AlertCircle, color: "bg-amber-100 text-amber-700", sub: "تحتاج متابعة" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-base font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="rounded-xl border border-border bg-card p-5 card-shadow">
        <h3 className="text-sm font-bold text-foreground mb-4">الإيرادات والمصروفات الشهرية</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={(finances.monthlyData || []).slice(0, 11)} barSize={12} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fontFamily: "Tajawal" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fontFamily: "Tajawal" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
            <Tooltip
              contentStyle={{ fontFamily: "Tajawal", fontSize: "12px", borderRadius: "8px" }}
              formatter={(value: number, name: string) => [formatCurrency(value), name === "revenue" ? "الإيرادات" : "المصروفات"]}
            />
            <Bar dataKey="revenue" fill="hsl(221 83% 28%)" radius={[4, 4, 0, 0]} name="revenue" />
            <Bar dataKey="expenses" fill="hsl(38 96% 48%)" radius={[4, 4, 0, 0]} name="expenses" />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-2 w-3 rounded-sm" style={{ background: "hsl(221 83% 28%)" }} />
            الإيرادات
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="h-2 w-3 rounded-sm" style={{ background: "hsl(38 96% 48%)" }} />
            المصروفات
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">الفواتير</h3>
          <Button size="sm" className="gap-1.5 h-7 text-xs">
            <Plus className="h-3 w-3" /> فاتورة جديدة
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["رقم الفاتورة", "العميل", "المشروع", "المبلغ", "تاريخ الاستحقاق", "الحالة", "الإجراءات"].map((h) => (
                  <th key={h} className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b border-border/50 table-row-hover last:border-0">
                  <td className="py-3 px-4 text-xs font-mono font-semibold text-primary">{inv.invoice_number}</td>
                  <td className="py-3 px-4 text-xs font-medium text-foreground">{inv.client}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{inv.project_name}</td>
                  <td className="py-3 px-4 text-xs font-bold text-foreground">{formatCurrency(Number(inv.amount))}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{inv.due_date}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${invoiceStatusColors[inv.status] || "badge-neutral"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button className="text-xs text-primary hover:underline">عرض</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
