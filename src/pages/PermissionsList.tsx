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

  const filteredPermissions = permissions.filter((p: any) => 
    p.permission_number.includes(search) || 
    (p.supplier_name && p.supplier_name.includes(search)) ||
    (p.project_name && p.project_name.includes(search))
  );

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
            placeholder="بحث برقم الإذن، المورد، أو المشروع..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pr-9 max-w-md" 
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
                  <td className="py-3 px-4 text-foreground">
                    {item.direction === 'add' ? item.supplier_name || '—' : 
                       (item.target_type === 'contractor' ? item.contractor_name + " (مقاول)" :
                        item.target_type === 'warehouse' ? item.target_warehouse_name + " (مستودع تحويل)" : 
                        item.project_name || '—')}
                  </td>
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

    {/* Print View */}
    <div className="hidden print:block p-8 bg-white text-black w-full" dir="rtl">
      {printData && (
        <div>
          <h1 className="text-3xl font-bold text-center mb-6 border-b-2 pb-4">
            {printData.direction === 'add' ? 'إذن إضافة مشتريات' : 'إذن صرف مخزون'} 
             - ({printData.type})
          </h1>
          <div className="grid grid-cols-2 gap-8 mb-8 border border-gray-300 p-4 rounded text-lg">
            <div className="space-y-2">
              <p><strong>رقم الإذن:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">{printData.permission_number}</span></p>
              <p><strong>التاريخ:</strong> {new Date(printData.date).toLocaleDateString("ar-SA")}</p>
            </div>
            <div className="space-y-2">
              <p><strong>المستودع:</strong> {printData.warehouse_name}</p>
              <p><strong>الجهة / المستلم:</strong> {printData.direction === 'add' ? printData.supplier_name || '—' : 
                       (printData.target_type === 'contractor' ? printData.contractor_name + " (مقاول)" :
                        printData.target_type === 'warehouse' ? printData.target_warehouse_name + " (مستودع تحويل)" : 
                        printData.project_name || '—')}</p>
            </div>
            <div className="col-span-2 space-y-2">
              <p><strong>ملاحظات:</strong> {printData.notes || '—'}</p>
            </div>
          </div>
          
          <table className="w-full text-base border-collapse border border-gray-400">
            <thead>
              <tr className="bg-gray-200 text-right">
                <th className="border border-gray-400 p-3">كود الصنف</th>
                <th className="border border-gray-400 p-3">اسم الصنف</th>
                <th className="border border-gray-400 p-3">الوحدة</th>
                <th className="border border-gray-400 p-3 text-center">الكمية</th>
                <th className="border border-gray-400 p-3 text-center">سعر الوحدة</th>
                <th className="border border-gray-400 p-3 text-center">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {printData.items?.map((item: any) => (
                <tr key={item.id} className="border-b border-gray-300">
                  <td className="border border-gray-400 p-3">{item.item_code || '—'}</td>
                  <td className="border border-gray-400 p-3 font-semibold">{item.item_name}</td>
                  <td className="border border-gray-400 p-3">{item.unit}</td>
                  <td className="border border-gray-400 p-3 text-center font-bold">{item.quantity}</td>
                  <td className="border border-gray-400 p-3 text-center">
                     {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(item.price || 0)}
                  </td>
                  <td className="border border-gray-400 p-3 text-center font-bold text-lg bg-gray-50">
                     {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(item.total_price || 0)}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-200">
                <td colSpan={5} className="border border-gray-400 p-4 text-left font-bold text-lg">الإجمالي الكلي</td>
                <td className="border border-gray-400 p-4 text-center font-bold text-xl">
                   {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format(
                      printData.items?.reduce((sum: number, item: any) => sum + Number(item.total_price || 0), 0)
                   )} ر.س
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-16 flex justify-between px-12 pb-16">
             <div className="text-center">
                 <p className="font-bold mb-8">أمين المستودع</p>
                 <p>.......................</p>
             </div>
             <div className="text-center">
                 <p className="font-bold mb-8">المدير / المشرف</p>
                 <p>.......................</p>
             </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
