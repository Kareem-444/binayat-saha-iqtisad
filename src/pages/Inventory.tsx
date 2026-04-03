import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, AlertTriangle, Package, Warehouse, BarChart2, Edit, Trash2, FileText, PackagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventoryApi } from "@/api/client";
import InventoryDialog from "@/components/dialogs/InventoryDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import MovementReportDialog from "@/components/dialogs/MovementReportDialog";
import DispenseDialog from "@/components/dialogs/DispenseDialog";
import AddItemMovementDialog from "@/components/dialogs/AddItemMovementDialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [reportItem, setReportItem] = useState<any>(null);
  const [dispenseItem, setDispenseItem] = useState<any>(null);
  const [addMovementItem, setAddMovementItem] = useState<any>(null);

  const categories = ["الكل", "مواد", "معدات", "أدوات"];

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["inventory", search, category],
    queryFn: () => inventoryApi.list({ search: search || undefined, category: category !== "الكل" ? category : undefined }).then(r => r.data),
  });

  const lowStock = inventory.filter((i: any) => Number(i.quantity) <= Number(i.min_stock));
  const totalValue = inventory.reduce((s: number, i: any) => s + Number(i.quantity) * Number(i.unit_price), 0);

  const openEdit = (item: any) => { setEditItem(item); setDialogOpen(true); };
  const openAdd = () => { setEditItem(null); setDialogOpen(true); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            <p className="text-xs text-amber-700 mt-0.5">{lowStock.map((i: any) => i.name).join("، ")}</p>
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
        <div className="flex gap-2 flex-shrink-0 flex-wrap">
          <Button variant="outline" className="gap-2 text-primary border-primary/20 bg-primary/5 hover:bg-primary/10" onClick={() => window.location.href = '/inventory/permissions'}>
             <FileText className="h-4 w-4" /> أذونات المخزون
          </Button>
          <Button className="gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> إضافة صنف
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["كود الصنف", "اسم الصنف", "الفئة", "الكمية", "الحد الأدنى", "المستودع", "سعر الوحدة", "القيمة الكلية", "الحالة", "الإجراءات"].map((h) => (
                  <th key={h} className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((item: any) => {
                const isLow = Number(item.quantity) <= Number(item.min_stock);
                return (
                  <tr key={item.id} className="border-b border-border/50 table-row-hover last:border-0">
                    <td className="py-3 px-4 text-xs font-mono text-primary font-semibold">{item.item_code || "–"}</td>
                    <td className="py-3 px-4">
                      <p className="text-xs font-semibold text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">{item.last_updated}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${categoryColors[item.category] || "badge-neutral"}`}>
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-bold ${isLow ? "text-red-500" : "text-foreground"}`}>
                        {Number(item.quantity).toLocaleString("ar-SA")} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{Number(item.min_stock).toLocaleString("ar-SA")} {item.unit}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{item.warehouse_name}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{Number(item.unit_price).toLocaleString("ar-SA")} ر.س</td>
                    <td className="py-3 px-4 text-xs font-semibold text-foreground">{formatCurrency(Number(item.quantity) * Number(item.unit_price))}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${isLow ? "badge-danger" : "badge-success"}`}>
                        {isLow ? "مخزون منخفض" : "متوفر"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 font-bold bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800" onClick={() => setDispenseItem(item)}>
                          صرف صنف
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2 font-bold bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:text-blue-800" onClick={() => setAddMovementItem(item)}>
                          <PackagePlus className="h-3 w-3 ml-1" /> إضافة صنف
                        </Button>
                        <button onClick={() => setReportItem(item)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors" title="تقرير الحركة">
                          <FileText className="h-3.5 w-3.5 text-blue-600" />
                        </button>
                        <button onClick={() => openEdit(item)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors" title="تعديل">
                          <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                        <button onClick={() => setDeleteItem(item)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors" title="حذف">
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <InventoryDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="حذف الصنف"
        description={`هل تريد حذف "${deleteItem?.name}"؟`}
        deleteFn={() => inventoryApi.delete(deleteItem?.id)}
        queryKey={["inventory"]}
      />
      <MovementReportDialog
        open={!!reportItem}
        onOpenChange={(open) => !open && setReportItem(null)}
        item={reportItem}
      />
      <DispenseDialog
        open={!!dispenseItem}
        onOpenChange={(open) => !open && setDispenseItem(null)}
        item={dispenseItem}
      />
      <AddItemMovementDialog
        open={!!addMovementItem}
        onOpenChange={(open) => !open && setAddMovementItem(null)}
        item={addMovementItem}
      />
    </div>
  );
}
