import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, FileText, ArrowUpRight, ArrowDownRight, RefreshCw, Edit, Download, Eye, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventoryPermissionsApi } from "@/api/client";
import { generatePermitWord } from "@/utils/generatePermitWord";

// ─── Toast helper (uses browser alert as fallback if no toast lib present) ───
function toast(msg: string, type: "success" | "error" = "success") {
  // Try shadcn/sonner toast if available
  try {
    const { toast: sooner } = require("sonner");
    if (type === "error") sooner.error(msg);
    else sooner.success(msg);
  } catch {
    // Fallback: simple banner
    const div = document.createElement("div");
    div.textContent = msg;
    div.style.cssText = `
      position:fixed;top:20px;left:50%;transform:translateX(-50%);
      padding:12px 24px;border-radius:8px;z-index:9999;font-size:15px;
      background:${type === "error" ? "#ef4444" : "#22c55e"};color:#fff;
      box-shadow:0 4px 20px rgba(0,0,0,.25);`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }
}

// ─── View Modal ──────────────────────────────────────────────────────────────
function ViewPermitModal({
  permitId,
  onClose,
}: {
  permitId: number;
  onClose: () => void;
}) {
  const [downloading, setDownloading] = useState(false);

  const { data: permit, isLoading } = useQuery({
    queryKey: ["permit", permitId],
    queryFn: () => inventoryPermissionsApi.get(permitId).then((r) => r.data),
    enabled: !!permitId,
  });

  const handleDownload = async () => {
    if (!permit) return;
    setDownloading(true);
    try {
      await generatePermitWord(permit);
    } catch (e) {
      console.error(e);
    } finally {
      setDownloading(false);
    }
  };

  const isAdd = permit?.direction === "add";

  const grandTotal =
    permit?.items?.reduce(
      (s: number, i: any) =>
        s + (Number(i.total_price || 0) || Number(i.quantity || 0) * Number(i.price || 0)),
      0
    ) ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-border"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              عرض الإذن — {permit?.permission_number ?? "…"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAdd ? "إذن إضافة" : "إذن صرف"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleDownload}
              disabled={downloading || isLoading}
            >
              <Download className="h-4 w-4" />
              {downloading ? "جاري التحميل…" : "تحميل Word"}
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
        ) : permit ? (
          <div className="p-5 space-y-6">
            {/* Header fields grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Field label="رقم الإذن" value={permit.permission_number} />
              <Field
                label="التاريخ"
                value={new Date(permit.date).toLocaleDateString("ar-EG")}
              />
              <Field label="المشروع" value={permit.project_name || "—"} />
              <Field
                label="النوع"
                value={`${isAdd ? "إضافة" : "صرف"} — ${permit.type}`}
              />
              <Field label="المستودع" value={permit.warehouse_name} />
              <Field
                label={isAdd ? "اسم المورد" : "اسم المقاول / الجهة"}
                value={
                  isAdd
                    ? permit.supplier_name || "—"
                    : permit.employee_name ||
                      permit.contractor_name ||
                      permit.target_warehouse_name ||
                      "—"
                }
              />
              <Field label="رقم السيارة" value={permit.vehicle_number || "—"} />
              <Field label="اسم السائق" value={permit.driver_name || "—"} />
              <Field label="ملاحظات" value={permit.notes || "—"} />
            </div>

            {/* Items table */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/60 border-b border-border">
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">م</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">كود الصنف</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">اسم الصنف</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">الوحدة</th>
                      <th className="text-right py-2 px-3 font-semibold text-muted-foreground">الكمية</th>
                      {isAdd ? (
                        <>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">سعر الوحدة</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">الإجمالي</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">ملاحظات</th>
                        </>
                      ) : (
                        <>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">الرصيد المتبقي</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">سعر الوحدة</th>
                          <th className="text-right py-2 px-3 font-semibold text-muted-foreground">مكان الصرف</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(permit.items || []).map((item: any, idx: number) => {
                      const total =
                        Number(item.total_price || 0) ||
                        Number(item.quantity || 0) * Number(item.price || 0);
                      return (
                        <tr
                          key={item.id}
                          className={`border-b border-border/50 last:border-0 ${idx % 2 === 1 ? "bg-muted/20" : ""}`}
                        >
                          <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono text-xs">{item.item_code || "—"}</td>
                          <td className="py-2 px-3 font-medium">{item.item_name}</td>
                          <td className="py-2 px-3">{item.unit}</td>
                          <td className="py-2 px-3 font-bold">{Number(item.quantity).toLocaleString("ar-EG")}</td>
                          {isAdd ? (
                            <>
                              <td className="py-2 px-3">{Number(item.price || 0).toLocaleString("ar-EG")}</td>
                              <td className="py-2 px-3 font-semibold text-green-700">{total > 0 ? total.toLocaleString("ar-EG") : "—"}</td>
                              <td className="py-2 px-3 text-muted-foreground">{item.notes || "—"}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-3">{Number(item.remaining_stock || 0).toLocaleString("ar-EG")}</td>
                              <td className="py-2 px-3">{Number(item.price || 0).toLocaleString("ar-EG")}</td>
                              <td className="py-2 px-3 text-muted-foreground">{item.dispatch_location || "—"}</td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-end">
              <div className="bg-primary/10 border border-primary/30 rounded-xl px-6 py-3 flex items-center gap-4">
                <span className="font-semibold text-foreground">الإجمالي:</span>
                <span className="text-xl font-bold text-primary">
                  {grandTotal.toLocaleString("ar-EG")} ج.م
                </span>
              </div>
            </div>

            {/* Signature fields (read-only labels) */}
            {isAdd ? (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <SignatureField label="عضو لجنة الفحص" />
                <SignatureField label="محاسب الموقع" />
                <SignatureField label="أمين المخزن" />
                <SignatureField label="مدير المشروع" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <SignatureField label="المستلم" />
                <SignatureField label="أمين المخزن" />
                <SignatureField label="مدير المشروع" />
              </div>
            )}
          </div>
        ) : (
          <p className="p-10 text-center text-muted-foreground">لم يتم العثور على الإذن</p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground bg-muted/40 rounded-lg px-3 py-1.5 min-h-[32px]">
        {value}
      </p>
    </div>
  );
}

function SignatureField({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-border rounded-xl p-3">
      <p className="text-xs font-semibold text-muted-foreground mb-1">{label}</p>
      <div className="h-8 border-b border-border/60" />
    </div>
  );
}

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────
function DeleteConfirmDialog({
  permitId,
  onClose,
  onDeleted,
}: {
  permitId: number;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await inventoryPermissionsApi.delete(permitId);
      toast("تم حذف الإذن بنجاح", "success");
      onDeleted(permitId);
      onClose();
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || "حدث خطأ أثناء حذف الإذن";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,.55)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-card rounded-2xl shadow-2xl w-full max-w-md border border-border p-6 space-y-5"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <h2 className="text-lg font-bold text-foreground">حذف الإذن</h2>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          هل أنت متأكد من حذف هذا الإذن؟ سيتم حذف جميع البيانات المرتبطة به
          نهائياً وعكس التأثير على المخزون.
        </p>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري الحذف…
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                حذف نهائياً
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PermissionsList() {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const [viewId, setViewId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Local list override so we can remove rows without full reload
  const [localPermissions, setLocalPermissions] = useState<any[] | null>(null);

  const { data: permissions = [], isLoading, refetch } = useQuery({
    queryKey: ["inventoryPermissions", direction],
    queryFn: () =>
      inventoryPermissionsApi
        .list({ direction: direction || undefined })
        .then((r) => r.data),
    onSuccess: (data: any[]) => setLocalPermissions(data),
  });

  // Use local list if available (after delete), else server data
  const displayList = localPermissions ?? permissions;

  const filteredPermissions = displayList.filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (p.permission_number && p.permission_number.toLowerCase().includes(s)) ||
      (p.type && p.type.toLowerCase().includes(s)) ||
      (p.warehouse_name && p.warehouse_name.toLowerCase().includes(s)) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(s)) ||
      (p.contractor_name && p.contractor_name.toLowerCase().includes(s)) ||
      (p.employee_name && p.employee_name.toLowerCase().includes(s)) ||
      (p.project_name && p.project_name.toLowerCase().includes(s)) ||
      (p.target_warehouse_name && p.target_warehouse_name.toLowerCase().includes(s)) ||
      (p.notes && p.notes.toLowerCase().includes(s)) ||
      (p.vehicle_number && p.vehicle_number.toLowerCase().includes(s)) ||
      (p.driver_name && p.driver_name.toLowerCase().includes(s))
    );
  });

  const handleDownload = async (id: number) => {
    try {
      setDownloadingId(id);
      const res = await inventoryPermissionsApi.get(id);
      await generatePermitWord(res.data);
    } catch (err) {
      console.error("Failed to generate Word file:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleted = (id: number) => {
    setLocalPermissions((prev) =>
      (prev ?? permissions).filter((p: any) => p.id !== id)
    );
  };

  const getRecipientName = (item: any) => {
    if (item.direction === "add") return item.supplier_name || "—";
    if (item.target_type === "contractor")
      return (item.employee_name || item.contractor_name || "") + " (مقاول)";
    if (item.target_type === "warehouse")
      return (item.target_warehouse_name || "") + " (مستودع تحويل)";
    return item.project_name || "—";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {viewId !== null && (
        <ViewPermitModal permitId={viewId} onClose={() => setViewId(null)} />
      )}
      {deleteId !== null && (
        <DeleteConfirmDialog
          permitId={deleteId}
          onClose={() => setDeleteId(null)}
          onDeleted={handleDeleted}
        />
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              أذونات المخزون (وارد / منصرف)
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              سجل حركات الأصناف من وإلى المستودعات
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => (window.location.href = "/inventory")}
            >
              العودة للمخزون
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setLocalPermissions(null);
                refetch();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 font-bold"
              onClick={() =>
                (window.location.href =
                  "/inventory/permissions/new?direction=add")
              }
            >
              <ArrowDownRight className="h-4 w-4 ml-1" /> إذن إضافة
            </Button>
            <Button
              variant="outline"
              className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 font-bold"
              onClick={() =>
                (window.location.href =
                  "/inventory/permissions/new?direction=dispense")
              }
            >
              <ArrowUpRight className="h-4 w-4 ml-1" /> إذن صرف
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث برقم الإذن، النوع، المستودع، المورد، المقاول، المشروع، الملاحظات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-9 max-w-xl"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={direction === "" ? "default" : "outline"}
              onClick={() => setDirection("")}
            >
              الكل
            </Button>
            <Button
              variant={direction === "add" ? "default" : "outline"}
              onClick={() => setDirection("add")}
            >
              إضافة
            </Button>
            <Button
              variant={direction === "dispense" ? "default" : "outline"}
              onClick={() => setDirection("dispense")}
            >
              صرف
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                    التاريخ
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                    رقم الإذن
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                    النوع
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                    المستودع
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                    الجهة / المستلم
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredPermissions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      لا يوجد أذونات مطابقة
                    </td>
                  </tr>
                ) : (
                  filteredPermissions.map((item: any) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/50 hover:bg-muted/10 last:border-0"
                    >
                      <td className="py-3 px-4">
                        <span className="text-xs font-medium text-foreground">
                          {new Date(item.date).toLocaleDateString("ar-EG")}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {item.permission_number}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.direction === "add"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {item.direction === "add" ? "إضافة" : "صرف"} —{" "}
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {item.warehouse_name}
                      </td>
                      <td className="py-3 px-4 text-foreground">
                        {getRecipientName(item)}
                      </td>
                      <td className="py-3 px-4">
                        {/* Button order (RTL): عرض | تعديل | تحميل | حذف */}
                        <div className="flex items-center gap-1">
                          {/* عرض */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewId(item.id)}
                            title="عرض"
                          >
                            <Eye className="h-4 w-4 text-indigo-500" />
                          </Button>
                          {/* تعديل */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              (window.location.href = `/inventory/permissions/edit/${item.id}`)
                            }
                            title="تعديل"
                          >
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          {/* تحميل */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item.id)}
                            title="تحميل Word"
                            disabled={downloadingId === item.id}
                          >
                            {downloadingId === item.id ? (
                              <span className="h-4 w-4 border-2 border-primary border-t-transparent flex rounded-full animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          {/* حذف */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteId(item.id)}
                            title="حذف"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
