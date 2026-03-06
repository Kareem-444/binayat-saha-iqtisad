import { useState } from "react";
import { Plus, Search, AlertTriangle, Package, Warehouse, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventory } from "@/data/mockData";

const categoryColors: Record<string, string> = {
  "مواد": "badge-info",
  "معدات": "badge-warning",
  "أدوات": "badge-neutral",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(v) + " ر.س";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");

  const categories = ["الكل", "مواد", "معدات", "أدوات"];

  const filtered = inventory.filter((item) => {
    const matchSearch = item.name.includes(search) || item.warehouse.includes(search);
    const matchCat = category === "الكل" || item.category === category;
    return matchSearch && matchCat;
  });

  const lowStock = inventory.filter((i) => i.quantity <= i.minStock);
  const totalValue = inventory.reduce((s, i) => s + i.quantity * i.unitPrice, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الأصناف", value: `${inventory.length} صنف`, icon: Package, color: "bg-blue-100 text-blue-700" },
          { label: "إجمالي القيمة", value: formatCurrency(totalValue), icon: BarChart2, color: "bg-green-100 text-green-700" },
          { label: "تنبيهات المخزون", value: `${lowStock.length} أصناف`, icon: AlertTriangle, color: "bg-amber-100 text-amber-700" },
          { label: "عدد المستودعات", value: "3 مستودعات", icon: Warehouse, color: "bg-purple-100 text-purple-700" },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${s.color}`}>
                <s.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-base font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">تنبيه: {lowStock.length} أصناف تحتاج إعادة تخزين</p>
            <p className="text-xs text-amber-700 mt-0.5">{lowStock.map(i => i.name).join("، ")}</p>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في المخزون..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${category === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <Button className="gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" /> إضافة صنف
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["اسم الصنف", "الفئة", "الكمية", "الحد الأدنى", "المستودع", "سعر الوحدة", "القيمة الكلية", "الحالة"].map((h) => (
                  <th key={h} className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const isLow = item.quantity <= item.minStock;
                return (
                  <tr key={item.id} className="border-b border-border/50 table-row-hover last:border-0">
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.lastUpdated}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${categoryColors[item.category] || "badge-neutral"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold ${isLow ? "text-red-500" : "text-foreground"}`}>
                        {item.quantity.toLocaleString("ar-SA")} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{item.minStock.toLocaleString("ar-SA")} {item.unit}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{item.warehouse}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{item.unitPrice.toLocaleString("ar-SA")} ر.س</td>
                    <td className="py-3 px-4 text-xs font-semibold text-foreground">{formatCurrency(item.quantity * item.unitPrice)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${isLow ? "badge-danger" : "badge-success"}`}>
                        {isLow ? "مخزون منخفض" : "متوفر"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
