import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, FileText, ArrowUpRight, ArrowDownRight, Printer, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inventoryPermissionsApi } from "@/api/client";

export default function PermissionsList() {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("");

  const { data: permissions = [], isLoading, refetch } = useQuery({
    queryKey: ["inventoryPermissions", direction],
    queryFn: () => inventoryPermissionsApi.list({ direction: direction || undefined }).then(r => r.data),
  });

  // Enhanced search: permission number, type, warehouse, supplier, contractor, project, notes, employee
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

  const [printingId, setPrintingId] = useState<number | null>(null);

  const { data: printData, isFetching: isPrintingData } = useQuery({
    queryKey: ["printPermission", printingId],
    queryFn: () => printingId ? inventoryPermissionsApi.get(printingId).then(r => r.data) : null,
    enabled: !!printingId
  });

  useEffect(() => {
    const handleAfterPrint = () => setPrintingId(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  useEffect(() => {
    if (printData && printingId && !isPrintingData) {
      setTimeout(() => window.print(), 500);
    }
  }, [printData, printingId, isPrintingData]);

  const handlePrint = (id: number) => {
    setPrintingId(id);
  };

  // Helper to get recipient name
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
    <>
    <div className="space-y-6 print:hidden">
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
                    <span className="text-xs font-medium text-foreground">{new Date(item.date).toLocaleDateString("ar-SA")}</span>
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
                      <Button variant="ghost" size="sm" onClick={() => handlePrint(item.id)} title="طباعة" disabled={printingId === item.id}>
                        {printingId === item.id ? <span className="h-4 w-4 border-2 border-primary border-t-transparent flex rounded-full animate-spin" /> : <Printer className="h-4 w-4" />}
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

    {/* ============ PRINT VIEW ============ */}
    <div className="hidden print:block p-6 bg-white text-black w-full" dir="rtl">
      {printData && (
        <>
          {/* ===== ADDITION PERMISSION PRINT ===== */}
          {printData.direction === 'add' && (
            <div style={{ fontFamily: 'Arial, sans-serif' }}>
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold mb-2">إذن إضافة مخزون</h1>
                <p className="text-base text-gray-600">({printData.type})</p>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4 mb-6 text-sm border border-gray-300 p-4 rounded">
                <div className="space-y-2">
                  <p><strong>رقم الإذن:</strong> <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{printData.permission_number}</span></p>
                  <p><strong>المستودع:</strong> {printData.warehouse_name}</p>
                  {printData.supplier_name && <p><strong>المورد / الشاحن:</strong> {printData.supplier_name}</p>}
                </div>
                <div className="space-y-2">
                  <p><strong>التاريخ:</strong> {new Date(printData.date).toLocaleDateString("ar-SA")}</p>
                  {printData.project_name && <p><strong>المشروع:</strong> {printData.project_name}</p>}
                  {printData.notes && <p><strong>ملاحظات:</strong> {printData.notes}</p>}
                </div>
              </div>

              {/* Items Table - Matches Word Template: م | كود الصنف | اسم الصنف | الوحدة | الكمية | سعر الوحدة | إجمالي السعر | ملاحظات */}
              <table className="w-full text-sm border-collapse border border-gray-400 mb-6">
                <thead>
                  <tr className="bg-gray-200 text-right">
                    <th className="border border-gray-400 p-2 w-10 text-center">م</th>
                    <th className="border border-gray-400 p-2">كود الصنف</th>
                    <th className="border border-gray-400 p-2">اسم الصنف</th>
                    <th className="border border-gray-400 p-2 w-20">الوحدة</th>
                    <th className="border border-gray-400 p-2 w-20 text-center">الكمية</th>
                    <th className="border border-gray-400 p-2 w-24 text-center">سعر الوحدة</th>
                    <th className="border border-gray-400 p-2 w-28 text-center">إجمالي السعر</th>
                    <th className="border border-gray-400 p-2">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.items?.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b border-gray-300">
                      <td className="border border-gray-400 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-gray-400 p-2 font-mono">{item.item_code || '—'}</td>
                      <td className="border border-gray-400 p-2 font-semibold">{item.item_name}</td>
                      <td className="border border-gray-400 p-2">{item.unit}</td>
                      <td className="border border-gray-400 p-2 text-center font-bold">{item.quantity}</td>
                      <td className="border border-gray-400 p-2 text-center">
                        {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(item.price || 0)}
                      </td>
                      <td className="border border-gray-400 p-2 text-center font-bold bg-gray-50">
                        {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(item.total_price || 0)}
                      </td>
                      <td className="border border-gray-400 p-2 text-gray-600">{item.notes || '—'}</td>
                    </tr>
                  ))}
                  {/* Fill empty rows to match Word template (up to 15) */}
                  {Array.from({ length: Math.max(0, 15 - (printData.items?.length || 0)) }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="border-b border-gray-300">
                      <td className="border border-gray-400 p-2 text-center text-gray-400">{(printData.items?.length || 0) + idx + 1}</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                    </tr>
                  ))}
                  {/* Grand Total Row */}
                  <tr className="bg-gray-200 font-bold">
                    <td colSpan={6} className="border border-gray-400 p-3 text-left text-base">الإجمالي الكلي</td>
                    <td className="border border-gray-400 p-3 text-center text-lg">
                      {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(
                        printData.items?.reduce((sum: number, item: any) => sum + Number(item.total_price || 0), 0)
                      )} ر.س
                    </td>
                    <td className="border border-gray-400 p-3">&nbsp;</td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="mt-16 flex justify-between px-10 pb-12">
                <div className="text-center">
                  <p className="font-bold mb-10">أمين المستودع</p>
                  <p>.......................</p>
                </div>
                <div className="text-center">
                  <p className="font-bold mb-10">المدير / المشرف</p>
                  <p>.......................</p>
                </div>
              </div>
            </div>
          )}

          {/* ===== DISPATCH PERMISSION PRINT ===== */}
          {printData.direction === 'dispense' && (
            <div style={{ fontFamily: 'Arial, sans-serif' }}>
              {/* Header - Matches Word Template */}
              <div className="text-center mb-4">
                <p className="text-xs text-gray-500 mb-1">SER:</p>
                <h2 className="text-xl font-bold mb-1">شــــــركة ديفكون للمقاولات</h2>
              </div>

              <div className="text-center mb-4">
                <h1 className="text-2xl font-bold mb-1">مستند صـــــــــــــرف</h1>
                <p className="text-sm text-gray-600">(داخلي ـ خارجي ـ تكهين ـ مقاولين)</p>
              </div>

              {/* Date */}
              <div className="text-left mb-4">
                <p className="text-sm">التاريخ: {new Date(printData.date).toLocaleDateString("ar-SA")}</p>
              </div>

              {/* Meta Fields - Matches Word Template */}
              <div className="space-y-2 text-sm mb-6 border-b border-gray-300 pb-4">
                {printData.project_name && (
                  <p>المشروع: <span className="font-semibold">{printData.project_name}</span></p>
                )}
                <div className="flex gap-8">
                  <p>نوع الصرف: <span className="font-semibold">{printData.type}</span></p>
                  <p>المخزن: <span className="font-semibold">{printData.warehouse_name}</span></p>
                </div>
                <p>اسم المقاول: <span className="font-semibold">{printData.employee_name || printData.contractor_name || '—'}</span></p>
                <div className="flex gap-8">
                  <p>رقم السيارة: <span className="font-semibold">{printData.vehicle_number || '...................'}</span></p>
                  <p>اسم السائق: <span className="font-semibold">{printData.driver_name || '...................'}</span></p>
                </div>
                {printData.notes && <p>ملاحظات: <span className="text-gray-600">{printData.notes}</span></p>}
              </div>

              {/* Items Table - Matches Word Template: م | كود الصنف | اسم الصنف | الوحدة | الكمية | الرصيد المتبقي | سعر الوحدة | مكان الصرف */}
              <table className="w-full text-sm border-collapse border border-gray-400 mb-6">
                <thead>
                  <tr className="bg-gray-200 text-right">
                    <th className="border border-gray-400 p-2 w-10 text-center">م</th>
                    <th className="border border-gray-400 p-2">كود الصنف</th>
                    <th className="border border-gray-400 p-2">اسم الصنف</th>
                    <th className="border border-gray-400 p-2 w-20">الوحدة</th>
                    <th className="border border-gray-400 p-2 w-20 text-center">الكمية</th>
                    <th className="border border-gray-400 p-2 w-24 text-center">الرصيد المتبقي</th>
                    <th className="border border-gray-400 p-2 w-24 text-center">سعر الوحدة</th>
                    <th className="border border-gray-400 p-2">مكان الصرف</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.items?.map((item: any, idx: number) => (
                    <tr key={item.id} className="border-b border-gray-300">
                      <td className="border border-gray-400 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-gray-400 p-2 font-mono">{item.item_code || '—'}</td>
                      <td className="border border-gray-400 p-2 font-semibold">{item.item_name}</td>
                      <td className="border border-gray-400 p-2">{item.unit}</td>
                      <td className="border border-gray-400 p-2 text-center font-bold">{item.quantity}</td>
                      <td className="border border-gray-400 p-2 text-center font-bold text-blue-700">
                        {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(item.remaining_stock || 0)}
                      </td>
                      <td className="border border-gray-400 p-2 text-center">
                        {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(item.price || 0)}
                      </td>
                      <td className="border border-gray-400 p-2 text-gray-600">
                        {item.dispatch_location || printData.employee_name || printData.contractor_name || printData.target_warehouse_name || '—'}
                      </td>
                    </tr>
                  ))}
                  {/* Fill empty rows to match Word template (up to 15) */}
                  {Array.from({ length: Math.max(0, 15 - (printData.items?.length || 0)) }).map((_, idx) => (
                    <tr key={`empty-${idx}`} className="border-b border-gray-300">
                      <td className="border border-gray-400 p-2 text-center text-gray-400">{(printData.items?.length || 0) + idx + 1}</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                      <td className="border border-gray-400 p-2">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures - Matches Word Template */}
              <div className="mt-12 flex justify-between px-6 pb-12">
                <div className="text-center">
                  <p className="font-bold mb-10">المستلم/</p>
                  <p>.......................</p>
                </div>
                <div className="text-center">
                  <p className="font-bold mb-10">أمين المخزن/</p>
                  <p>.......................</p>
                </div>
                <div className="text-center">
                  <p className="font-bold mb-10">مدير المشروع/</p>
                  <p>.......................</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
