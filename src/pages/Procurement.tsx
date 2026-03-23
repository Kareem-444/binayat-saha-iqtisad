import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Star, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { suppliersApi, purchaseOrdersApi } from "@/api/client";
import SupplierDialog from "@/components/dialogs/SupplierDialog";
import PurchaseOrderDialog from "@/components/dialogs/PurchaseOrderDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

const orderStatusColors: Record<string, string> = {
  "تم التسليم": "badge-success",
  "معتمد": "badge-info",
  "قيد الانتظار": "badge-warning",
  "ملغي": "badge-danger",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(v) + " ر.س";

export default function Procurement() {
  const [search, setSearch] = useState("");
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<any>(null);

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: () => suppliersApi.list().then(r => r.data),
  });

  const { data: purchaseOrders = [] } = useQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => purchaseOrdersApi.list().then(r => r.data),
  });

  const openEditSupplier = (s: any) => { setEditSupplier(s); setSupplierDialogOpen(true); };
  const openAddSupplier = () => { setEditSupplier(null); setSupplierDialogOpen(true); };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الموردين", value: `${suppliers.length} موردين` },
          { label: "طلبات الشراء", value: `${purchaseOrders.length} طلبات` },
          { label: "قيد الانتظار", value: `${purchaseOrders.filter((p: any) => p.status === "قيد الانتظار").length} طلبات` },
          { label: "إجمالي قيمة الطلبات", value: formatCurrency(purchaseOrders.reduce((s: number, o: any) => s + Number(o.total), 0)) },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-base font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="suppliers" dir="rtl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <TabsList className="h-9">
            <TabsTrigger value="suppliers" className="text-sm">الموردون</TabsTrigger>
            <TabsTrigger value="orders" className="text-sm">طلبات الشراء</TabsTrigger>
          </TabsList>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
            </div>
            <Button className="gap-2 flex-shrink-0" onClick={openAddSupplier}>
              <Plus className="h-4 w-4" /> مورد جديد
            </Button>
          </div>
        </div>

        <TabsContent value="suppliers" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {suppliers.map((sup: any) => (
              <div key={sup.id} className="rounded-xl border border-border bg-card p-5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{sup.name}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{sup.category}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5">
                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold text-amber-700">{Number(sup.rating).toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground mb-3">
                  <p>👤 {sup.contact_person || "–"}</p>
                  <p>📞 {sup.phone || "–"}</p>
                  <p>✉️ {sup.email || "–"}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                  <span className="text-muted-foreground">{sup.total_orders} طلب</span>
                  <span className="font-bold text-foreground">{formatCurrency(Number(sup.total_value))}</span>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => openEditSupplier(sup)}>
                    <Edit className="h-3 w-3" /> تعديل
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600" onClick={() => setDeleteSupplier(sup)}>
                    <Trash2 className="h-3 w-3" /> حذف
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <div className="flex justify-end mb-3">
            <Button size="sm" className="gap-2" onClick={() => setPoDialogOpen(true)}>
              <Plus className="h-4 w-4" /> طلب شراء جديد
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["رقم الطلب", "المورد", "التاريخ", "عدد الأصناف", "الإجمالي", "الحالة"].map((h) => (
                      <th key={h} className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 table-row-hover last:border-0">
                      <td className="py-3 px-4 text-xs font-mono font-semibold text-primary">{order.order_number}</td>
                      <td className="py-3 px-4 text-xs font-medium text-foreground">{order.supplier_name}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{order.order_date}</td>
                      <td className="py-3 px-4 text-xs text-center text-foreground">{order.items_count}</td>
                      <td className="py-3 px-4 text-xs font-bold text-foreground">{formatCurrency(Number(order.total))}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${orderStatusColors[order.status] || "badge-neutral"}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SupplierDialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen} editItem={editSupplier} />
      <DeleteConfirmDialog
        open={!!deleteSupplier}
        onOpenChange={(open) => !open && setDeleteSupplier(null)}
        title="حذف المورد"
        description={`هل تريد حذف "${deleteSupplier?.name}"؟`}
        deleteFn={() => suppliersApi.delete(deleteSupplier?.id)}
        queryKey={["suppliers"]}
      />
      <PurchaseOrderDialog open={poDialogOpen} onOpenChange={setPoDialogOpen} />
    </div>
  );
}
