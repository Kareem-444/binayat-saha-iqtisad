import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Phone, Briefcase, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { employeesApi, inventoryMovementsApi } from "@/api/client";
import ContractorDialog from "@/components/dialogs/ContractorDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

export default function Employees() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [movementsEmployee, setMovementsEmployee] = useState<any>(null);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees", search],
    queryFn: () => employeesApi.list({ search: search || undefined }).then(r => r.data),
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "إجمالي المقاولين", value: employees.length },
          { label: "مقاولون نشطون", value: employees.filter((e: any) => e.status === "نشط").length },
          { label: "في إجازة", value: employees.filter((e: any) => e.status === "إجازة").length },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-lg font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في المقاولين..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Button className="gap-2 flex-shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" /> مقاول جديد
        </Button>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {employees.map((emp: any) => {
          const initials = emp.name.split(" ").slice(0, 2).map((n: string) => n[0]).join("");
          const colors = ["bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-red-100 text-red-700", "bg-teal-100 text-teal-700"];
          const color = colors[emp.id % colors.length];
          return (
            <div key={emp.id} className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-start gap-3 mb-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${color}`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{emp.name}</h3>
                  <p className="text-xs text-muted-foreground">{emp.role || "—"}</p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3 w-3" />
                  <span>{emp.department || "–"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{emp.phone || "–"}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => setMovementsEmployee(emp)}>
                  <Eye className="h-3 w-3" /> المواد المصروفة للمقاول
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openEdit(emp)}>
                  <Edit className="h-3 w-3" /> تعديل
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600" onClick={() => setDeleteItem(emp)}>
                  <Trash2 className="h-3 w-3" /> حذف
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <ContractorDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="حذف المقاول"
        description={`هل تريد حذف "${deleteItem?.name}"؟`}
        deleteFn={() => employeesApi.delete(deleteItem?.id)}
        queryKey={["employees"]}
      />
      {movementsEmployee && (
        <EmployeeMovementsDialog employee={movementsEmployee} onClose={() => setMovementsEmployee(null)} />
      )}
    </div>
  );
}

// TASK 5: Employee movements dialog
function EmployeeMovementsDialog({ employee, onClose }: { employee: any; onClose: () => void }) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["employeeMovements", employee.id],
    queryFn: () => inventoryMovementsApi.list({ employee_id: employee.id }).then(r => r.data),
  });

  return (
    <Dialog open={!!employee} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">المواد المصروفة للمقاول: {employee.name}</DialogTitle>
        </DialogHeader>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="text-right p-3">اسم الصنف</th>
                <th className="text-right p-3">الكمية</th>
                <th className="text-right p-3">الوحدة</th>
                <th className="text-right p-3">التاريخ</th>
                <th className="text-right p-3">ملاحظات</th>
                <th className="text-right p-3">المسؤول</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center p-6">جاري التحميل...</td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={6} className="text-center p-6 text-muted-foreground">لا يوجد مواد مصروفة لهذا الموظف</td></tr>
              ) : movements.map((m: any) => (
                <tr key={m.id} className="border-b last:border-0 hover:bg-muted/10">
                  <td className="p-3 font-bold">{m.item_name}</td>
                  <td className="p-3 font-bold text-red-600">{m.quantity}</td>
                  <td className="p-3">{m.unit}</td>
                  <td className="p-3">{new Date(m.movement_date).toLocaleDateString('ar-SA')}</td>
                  <td className="p-3 text-muted-foreground">{m.notes || "—"}</td>
                  <td className="p-3 text-muted-foreground">{m.issued_by || m.user_name || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
