import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, ArrowUpRight, ArrowDownRight, RefreshCw, Edit, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventoryPermissionsApi } from "@/api/client";
import { generatePermitWord } from "@/utils/generatePermitWord";

export default function PermissionsList() {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("");
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data: permissions = [], isLoading, refetch } = useQuery({
    queryKey: ["inventoryPermissions", direction],
    queryFn: () => inventoryPermissionsApi.list({ direction: direction || undefined }).then(r => r.data),
  });

  const filteredPermissions = permissions.filter((p: any) => {
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

  const getRecipientName = (item: any) => {
    if (item.direction === 'add') return item.supplier_name || '—';
    if (item.target_type === 'contractor') return (item.employee_name || item.contractor_name || '') + " (مقاول)";
    if (item.target_type === 'warehouse') return (item.target_warehouse_name || '') + " (مستودع تحويل)";
    return item.project_name || '—';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">أذونات المخزون (وارد / منصرف)</h1>
          <p className="text-sm text-muted-foreground mt-1">سجل حركات الأصناف من وإلى المستودعات</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => window.location.href = '/inventory'}>
            العودة للمخزون
          </Button>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 font-bold" onClick={() => window.location.href = '/inventory/permissions/new?direction=add'}>
            <ArrowDownRight className="h-4 w-4 ml-1" /> إذن إضافة
          </Button>
          <Button variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 font-bold" onClick={() => window.location.href = '/inventory/permissions/new?direction=dispense'}>
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
          <Button variant={direction === "" ? "default" : "outline"} onClick={() => setDirection("")}>الكل</Button>
          <Button variant={direction === "add" ? "default" : "outline"} onClick={() => setDirection("add")}>إضافة</Button>
          <Button variant={direction === "dispense" ? "default" : "outline"} onClick={() => setDirection("dispense")}>صرف</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">التاريخ</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">رقم الإذن</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">النوع</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">المستودع</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">الجهة / المستلم</th>
                <th className="text-right py-3 px-4 font-semibold text-muted-foreground">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPermissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    لا يوجد أذونات مطابقة
                  </td>
                </tr>
              ) : filteredPermissions.map((item: any) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/10 last:border-0">
                  <td className="py-3 px-4">
                    <span className="text-xs font-medium text-foreground">{new Date(item.date).toLocaleDateString("ar-EG")}</span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">{item.permission_number}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${item.direction === 'add' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {item.direction === 'add' ? 'إضافة' : 'صرف'} - {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{item.warehouse_name}</td>
                  <td className="py-3 px-4 text-foreground">{getRecipientName(item)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => window.location.href = `/inventory/permissions/edit/${item.id}`} title="تعديل">
                        <Edit className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDownload(item.id)} title="تحميل Word" disabled={downloadingId === item.id}>
                        {downloadingId === item.id ? <span className="h-4 w-4 border-2 border-primary border-t-transparent flex rounded-full animate-spin" /> : <Download className="h-4 w-4 text-green-600" />}
                      </Button>
                    </div>
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
