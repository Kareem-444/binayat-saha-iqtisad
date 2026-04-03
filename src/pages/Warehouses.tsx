import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Eye, Download, Warehouse, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { warehousesApi, inventoryMovementsApi } from "@/api/client";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

export default function Warehouses() {
  const [search, setSearch] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteWarehouse, setDeleteWarehouse] = useState<any>(null);

  const { data: warehouses = [], isLoading } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehousesApi.list().then(r => r.data),
  });

  const filteredWarehouses = warehouses.filter((w: any) =>
    w.name.includes(search) ||
    (w.location && w.location.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Warehouse className="h-6 w-6 text-primary" /> المستودعات
          </h1>
          <p className="text-sm text-muted-foreground mt-1">إدارة المستودعات وحركات نقل المواد</p>
        </div>
        <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" /> إضافة مستودع
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن مستودع..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-9"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-10">جاري التحميل...</div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="col-span-full text-center py-10 text-muted-foreground">لا يوجد مستودعات</div>
        ) : filteredWarehouses.map((warehouse: any) => (
          <div key={warehouse.id} className="p-6 bg-card border rounded-xl shadow-sm hover:shadow-md transition flex flex-col justify-between">
             <div>
                <div className="flex justify-between items-start mb-2">
                   <h3 className="font-bold text-lg">{warehouse.name}</h3>
                   <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">{warehouse.capacity || 'السعة غير محددة'}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">الموقع: {warehouse.location || '—'}</p>
                <p className="text-sm text-muted-foreground">أمين المستودع: {warehouse.manager_name || '—'}</p>
             </div>
             <div className="flex gap-2 mt-4">
               <Button variant="outline" className="flex-1 gap-2" onClick={() => setSelectedWarehouse(warehouse)}>
                  <Eye className="h-4 w-4" /> عرض الحركات والصادرات
               </Button>
               <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteWarehouse(warehouse)}>
                  <Trash2 className="h-4 w-4" />
               </Button>
             </div>
          </div>
        ))}
      </div>

      {/* Add Warehouse Dialog */}
      <AddWarehouseDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteWarehouse}
        onOpenChange={(open) => !open && setDeleteWarehouse(null)}
        title="حذف المستودع"
        description={`هل تريد حذف المستودع "${deleteWarehouse?.name}"؟`}
        deleteFn={() => warehousesApi.delete(deleteWarehouse?.id)}
        queryKey={["warehouses"]}
      />

      {/* Details Dialog */}
      {selectedWarehouse && (
        <WarehouseDetailsDialog
           warehouse={selectedWarehouse}
           onClose={() => setSelectedWarehouse(null)}
        />
      )}
    </div>
  );
}

// TASK 3: Add Warehouse Dialog
function AddWarehouseDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", location: "", manager_name: "", phone: "", capacity: "" });

  const mutation = useMutation({
    mutationFn: (data: any) => warehousesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({ title: "تم إضافة المستودع بنجاح" });
      onOpenChange(false);
      setForm({ name: "", location: "", manager_name: "", phone: "", capacity: "" });
    },
    onError: (err: any) => toast({ title: err.response?.data?.error || "حدث خطأ أثناء الإضافة", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "اسم المستودع مطلوب", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مستودع جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>اسم المستودع *</Label>
            <Input required value={form.name} onChange={e => update("name", e.target.value)} placeholder="مثال: مستودع الرياض الرئيسي" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الموقع</Label>
              <Input value={form.location} onChange={e => update("location", e.target.value)} placeholder="مثال: الرياض - حي العليا" />
            </div>
            <div className="space-y-2">
              <Label>السعة</Label>
              <Input value={form.capacity} onChange={e => update("capacity", e.target.value)} placeholder="مثال: 5000 م²" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم أمين المستودع</Label>
              <Input value={form.manager_name} onChange={e => update("manager_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>رقم الهاتف</Label>
              <Input dir="ltr" value={form.phone} onChange={e => update("phone", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جاري الإضافة..." : "إضافة المستودع"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// TASK 5: Warehouse Details Dialog with movements + Excel export
function WarehouseDetailsDialog({ warehouse, onClose }: { warehouse: any, onClose: () => void }) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["warehouseMovements", warehouse.id],
    queryFn: () => inventoryMovementsApi.list({ warehouse_id: warehouse.id }).then(r => r.data),
  });

  const handleExportExcel = () => {
    if (movements.length === 0) return;
    const exportData = movements.map((m: any) => ({
      'اسم الصنف': m.item_name,
      'الفئة': m.category || '—',
      'الكمية': m.quantity,
      'الوحدة': m.unit,
      'نوع الحركة': m.type,
      'التاريخ': new Date(m.movement_date).toLocaleDateString('ar-SA'),
      'اسم المستلم': m.contractor_name || m.employee_name || '—',
      'المسؤول': m.issued_by || m.user_name || '—',
      'ملاحظات': m.notes || '—'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, warehouse.name);
    XLSX.writeFile(wb, `${warehouse.name}-movements-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <Dialog open={!!warehouse} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">تفاصيل المستودع: {warehouse.name}</DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
           <h3 className="text-lg font-bold">الحركات الواردة والصادرة</h3>
           <Button variant="outline" className="gap-2 border-green-600 text-green-700 hover:bg-green-50" onClick={handleExportExcel} disabled={movements.length === 0}>
              <Download className="h-4 w-4" /> تصدير Excel
           </Button>
        </div>

        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                 <th className="text-right p-3">اسم الصنف</th>
                 <th className="text-right p-3">الكمية</th>
                 <th className="text-right p-3">نوع الحركة</th>
                 <th className="text-right p-3">التاريخ</th>
                 <th className="text-right p-3">اسم المستلم</th>
                 <th className="text-right p-3">المسؤول</th>
                 <th className="text-right p-3">ملاحظات</th>
              </tr>
            </thead>
            <tbody>
               {isLoading ? (
                  <tr><td colSpan={7} className="text-center p-6">جاري التحميل...</td></tr>
               ) : movements.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-6 text-muted-foreground">لا يوجد حركات مسجلة لهذا المستودع</td></tr>
               ) : movements.map((m: any) => (
                 <tr key={m.id} className="border-b last:border-0 hover:bg-muted/10">
                    <td className="p-3 font-bold">{m.item_name}</td>
                    <td className="p-3 font-bold">{m.quantity} {m.unit}</td>
                    <td className="p-3">
                       <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${m.type === 'وارد' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {m.type}
                       </span>
                    </td>
                    <td className="p-3">{new Date(m.movement_date).toLocaleDateString('ar-SA')}</td>
                    <td className="p-3 text-muted-foreground">{m.contractor_name || m.employee_name || '—'}</td>
                    <td className="p-3 text-muted-foreground">{m.issued_by || m.user_name || '—'}</td>
                    <td className="p-3 text-muted-foreground">{m.notes || '—'}</td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
