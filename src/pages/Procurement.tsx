import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Star, Edit, Trash2, Eye, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { suppliersApi, purchaseOrdersApi } from "@/api/client";
import SupplierDialog from "@/components/dialogs/SupplierDialog";
import PurchaseOrderDialog from "@/components/dialogs/PurchaseOrderDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { generatePurchaseOrderExcel } from "@/utils/generatePurchaseOrderExcel";

const orderStatusColors: Record<string, string> = {
  "تم التسليم": "badge-success",
  "معتمد": "badge-info",
  "قيد الانتظار": "badge-warning",
  "ملغي": "badge-danger",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(v) + " ج.م";

// ─── View Purchase Order Modal ──────────────────────────────────────────────────────────────
function ViewPurchaseOrderModal({
  poId,
  onClose,
}: {
  poId: number;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  const { data: po, isLoading } = useQuery({
    queryKey: ["purchaseOrder", poId],
    queryFn: () => purchaseOrdersApi.get(poId).then((r) => r.data),
    enabled: !!poId,
  });

  const handleExport = async () => {
    if (!po) return;
    setDownloading(true);
    try {
      await generatePurchaseOrderExcel(po);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const grandTotal = po?.total || 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border"
        dir="rtl"
      >
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              عرض طلب شراء — {po?.order_number ?? "…"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              تفاصيل طلب الشراء
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleExport}
              disabled={downloading || isLoading}
            >
              <FileSpreadsheet className="h-4 w-4" />
              {downloading ? "جاري التصدير…" : "تصدير Excel"}
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : po ? (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">رقم الطلب</p>
                <p className="text-sm font-medium bg-muted/40 rounded-lg px-3 py-1.5 min-h-[32px]">{po.order_number}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">تاريخ الطلب</p>
                <p className="text-sm font-medium bg-muted/40 rounded-lg px-3 py-1.5 min-h-[32px]">{new Date(po.order_date).toLocaleDateString("ar-EG")}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">المورد</p>
                <p className="text-sm font-medium bg-muted/40 rounded-lg px-3 py-1.5 min-h-[32px]">{po.supplier_name || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">المشروع</p>
                <p className="text-sm font-medium bg-muted/40 rounded-lg px-3 py-1.5 min-h-[32px]">{po.project_name || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">الحالة</p>
                <p className="text-sm font-medium bg-muted/40 rounded-lg px-3 py-1.5 min-h-[32px]">{po.status}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">ملاحظات</p>
                <p className="text-sm font-medium bg-muted/40 rounded-lg px-3 py-1.5 min-h-[32px]">{po.notes || "—"}</p>
              </div>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">م</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">اسم الصنف</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">الوحدة</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">الكمية</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">سعر الوحدة</th>
                    <th className="text-right py-2 px-3 font-semibold text-muted-foreground">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {(po.items || []).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted-foreground border-b border-border/50">
                        لا توجد أصناف مضافة لهذا الطلب.
                      </td>
                    </tr>
                  ) : (
                    (po.items || []).map((item: any, idx: number) => {
                      const itemTotal = Number(item.quantity || 0) * Number(item.unit_price || 0);
                      return (
                        <tr key={idx} className={`border-b border-border/50 last:border-0 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}>
                          <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium">{item.item_name}</td>
                          <td className="py-2 px-3 text-muted-foreground">{item.unit || "—"}</td>
                          <td className="py-2 px-3 font-bold">{Number(item.quantity || 0).toLocaleString("ar-EG")}</td>
                          <td className="py-2 px-3">{Number(item.unit_price || 0).toLocaleString("ar-EG")}</td>
                          <td className="py-2 px-3 font-semibold text-green-700">{itemTotal > 0 ? itemTotal.toLocaleString("ar-EG") : "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <div className="bg-primary/10 border border-primary/30 rounded-xl px-6 py-3 flex items-center gap-4">
                <span className="font-semibold text-foreground">الإجمالي الكلي:</span>
                <span className="text-xl font-bold text-primary">
                  {grandTotal.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
            </div>
          </div>
        ) : (
          <p className="p-10 text-center text-muted-foreground">لم يتم العثور على طلب الشراء</p>
        )}
      </div>
    </div>
  );
}

export default function Procurement() {
  const [search, setSearch] = useState("");
  
  // Dialogs States
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<any>(null);
  const [deleteSupplier, setDeleteSupplier] = useState<any>(null);

  const [poDialogOpen, setPoDialogOpen] = useState(false);
  const [editPo, setEditPo] = useState<any>(null);
  const [deletePo, setDeletePo] = useState<any>(null);
  const [viewPoId, setViewPoId] = useState<number | null>(null);
  const [exportingPoId, setExportingPoId] = useState<number | null>(null);

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

  const openAddPo = () => { setEditPo(null); setPoDialogOpen(true); };
  const openEditPo = async (po: any) => {
    try {
      // Fetch full PO with items before editing
      const res = await purchaseOrdersApi.get(po.id);
      setEditPo(res.data);
      setPoDialogOpen(true);
    } catch(err) {
      console.error(err);
    }
  };

  const handleExport = async (poId: number) => {
    try {
      setExportingPoId(poId);
      const res = await purchaseOrdersApi.get(poId);
      await generatePurchaseOrderExcel(res.data);
    } catch(err) {
      console.error(err);
    } finally {
      setExportingPoId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Modal */}
      {viewPoId !== null && (
        <ViewPurchaseOrderModal poId={viewPoId} onClose={() => setViewPoId(null)} />
      )}

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
            <Button size="sm" className="gap-2" onClick={openAddPo}>
              <Plus className="h-4 w-4" /> طلب شراء جديد
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    {["رقم الطلب", "المورد", "التاريخ", "عدد الأصناف", "الإجمالي", "الحالة", "الإجراءات"].map((h) => (
                      <th key={h} className={`text-right py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap ${h==="الإجراءات" ? "text-center":""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {purchaseOrders.map((order: any) => (
                    <tr key={order.id} className="border-b border-border/50 table-row-hover last:border-0">
                      <td className="py-3 px-4 text-xs font-mono font-semibold text-primary">{order.order_number}</td>
                      <td className="py-3 px-4 text-xs font-medium text-foreground">{order.supplier_name}</td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">{new Date(order.order_date).toLocaleDateString('ar-EG')}</td>
                      <td className="py-3 px-4 text-xs text-center text-foreground">{order.items_count}</td>
                      <td className="py-3 px-4 text-xs font-bold text-foreground">{formatCurrency(Number(order.total))}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${orderStatusColors[order.status] || "badge-neutral"}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setViewPoId(order.id)} title="عرض">
                            <Eye className="h-4 w-4 text-indigo-500" />
                          </Button>
                          
                          {order.status === "قيد الانتظار" && (
                            <Button variant="ghost" size="sm" onClick={() => openEditPo(order)} title="تعديل">
                              <Edit className="h-4 w-4 text-blue-500" />
                            </Button>
                          )}

                          <Button variant="ghost" size="sm" onClick={() => handleExport(order.id)} title="تصدير Excel" disabled={exportingPoId === order.id}>
                            {exportingPoId === order.id ? (
                              <span className="h-4 w-4 border-2 border-primary border-t-transparent flex rounded-full animate-spin" />
                            ) : (
                              <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            )}
                          </Button>

                          <Button variant="ghost" size="sm" onClick={() => setDeletePo(order)} title="حذف">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
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

      {/* Generic delete for purchase orders can use the same dialog but with a different API */}
      <DeleteConfirmDialog
        open={!!deletePo}
        onOpenChange={(open) => !open && setDeletePo(null)}
        title="حذف طلب الشراء"
        description="هل أنت متأكد من حذف طلب الشراء؟ سيتم حذف جميع البيانات المرتبطة به نهائياً"
        deleteFn={() => purchaseOrdersApi.delete(deletePo?.id)}
        queryKey={["purchaseOrders"]}
      />

      <PurchaseOrderDialog open={poDialogOpen} onOpenChange={setPoDialogOpen} editItem={editPo} />
    </div>
  );
}
