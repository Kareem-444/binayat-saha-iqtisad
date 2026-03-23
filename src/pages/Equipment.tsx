import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, AlertTriangle, Clock, Wrench, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { equipmentApi } from "@/api/client";
import EquipmentDialog from "@/components/dialogs/EquipmentDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

const statusColors: Record<string, string> = {
  "يعمل": "badge-success",
  "صيانة": "badge-warning",
  "معطل": "badge-danger",
  "مؤجر": "badge-neutral",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(v) + " ر.س";

export default function Equipment() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ["equipment", search],
    queryFn: () => equipmentApi.list({ search: search || undefined }).then(r => r.data),
  });

  const openEdit = (item: any) => { setEditItem(item); setDialogOpen(true); };
  const openAdd = () => { setEditItem(null); setDialogOpen(true); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const inMaintenance = equipment.filter((e: any) => e.status === "صيانة").length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المعدات", value: `${equipment.length} معدات` },
          { label: "معدات تعمل", value: `${equipment.filter((e: any) => e.status === "يعمل").length} معدات` },
          { label: "قيد الصيانة", value: `${inMaintenance} معدات` },
          { label: "تكلفة يومية إجمالية", value: formatCurrency(equipment.filter((e: any) => e.status === "يعمل").reduce((s: number, e: any) => s + Number(e.daily_cost), 0)) },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-base font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في المعدات..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Button className="gap-2 flex-shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" /> تسجيل معدة
        </Button>
      </div>

      {/* Equipment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {equipment.map((eq: any) => (
          <div key={eq.id} className="rounded-xl border border-border bg-card p-5 card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">{eq.name}</h3>
                <p className="text-xs text-muted-foreground">{eq.type} · {eq.model}</p>
              </div>
              <span className={`flex-shrink-0 mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusColors[eq.status] || "badge-neutral"}`}>
                {eq.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { label: "سنة الصنع", value: eq.year },
                { label: "ساعات العمل", value: `${Number(eq.hours_used).toLocaleString("ar-SA")} ساعة` },
                { label: "التكلفة اليومية", value: formatCurrency(Number(eq.daily_cost)) },
                { label: "المشروع", value: eq.project_name || "–" },
              ].map((d) => (
                <div key={d.label} className="rounded-lg bg-muted/50 p-2">
                  <p className="text-[10px] text-muted-foreground">{d.label}</p>
                  <p className="text-xs font-semibold text-foreground mt-0.5 truncate">{d.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 pt-3 border-t border-border text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Wrench className="h-3 w-3" />
                  <span>آخر صيانة: {eq.last_maintenance || "–"}</span>
                </div>
              </div>
              <div className={`flex items-center gap-1.5 ${
                eq.next_maintenance && new Date(eq.next_maintenance) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) ? "text-amber-600" : "text-muted-foreground"
              }`}>
                <Clock className="h-3 w-3" />
                <span>الصيانة القادمة: {eq.next_maintenance || "–"}</span>
                {eq.next_maintenance && new Date(eq.next_maintenance) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-border">
              <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => openEdit(eq)}>
                <Edit className="h-3 w-3" /> تعديل
              </Button>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600" onClick={() => setDeleteItem(eq)}>
                <Trash2 className="h-3 w-3" /> حذف
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialogs */}
      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="حذف المعدة"
        description={`هل تريد حذف "${deleteItem?.name}"؟`}
        deleteFn={() => equipmentApi.delete(deleteItem?.id)}
        queryKey={["equipment"]}
      />
    </div>
  );
}
