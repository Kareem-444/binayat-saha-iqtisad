import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inventoryMovementsApi, employeesApi, warehousesApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

interface DispenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

export default function DispenseDialog({ open, onOpenChange, item }: DispenseDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    quantity: 0,
    recipient_type: "" as "" | "employee" | "warehouse" | "other",
    employee_id: null as number | null,
    destination_warehouse_id: null as number | null,
    project_name: "",
    contractor_name: "",
    movement_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeesApi.list().then(r => r.data),
    enabled: open,
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehousesApi.list().then(r => r.data),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => inventoryMovementsApi.create({
      ...data,
      item_id: item.id,
      type: "صادر"
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      toast({ title: "تم صرف الصنف بنجاح" });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => toast({ title: err.response?.data?.error || "حدث خطأ أثناء الصرف", variant: "destructive" }),
  });

  const resetForm = () => setForm({
    quantity: 0, recipient_type: "", employee_id: null, destination_warehouse_id: null,
    project_name: "", contractor_name: "", movement_date: new Date().toISOString().split("T")[0], notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantity <= 0) {
      toast({ title: "الكمية يجب أن تكون أكبر من صفر", variant: "destructive" });
      return;
    }
    if (form.quantity > Number(item?.quantity || 0)) {
      toast({ title: "الكمية المطلوبة أكبر من المتوفر في المخزون", variant: "destructive" });
      return;
    }

    const payload: any = {
      quantity: form.quantity,
      movement_date: form.movement_date,
      notes: form.notes,
      project_name: form.project_name,
      contractor_name: form.contractor_name,
    };

    if (form.recipient_type === "employee" && form.employee_id) {
      payload.employee_id = form.employee_id;
      const emp = employees.find((e: any) => e.id === form.employee_id);
      payload.contractor_name = emp?.name || "";
    } else if (form.recipient_type === "warehouse" && form.destination_warehouse_id) {
      payload.destination_warehouse_id = form.destination_warehouse_id;
      const wh = warehouses.find((w: any) => w.id === form.destination_warehouse_id);
      payload.contractor_name = `نقل إلى: ${wh?.name || ""}`;
    }

    mutation.mutate(payload);
  };

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>صرف مواد: {item?.name}</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg bg-muted/50 p-3 mb-2 flex justify-between items-center text-sm">
          <span className="text-muted-foreground">الرصيد المتاح:</span>
          <span className="font-bold text-primary">{Number(item?.quantity || 0).toLocaleString("ar-SA")} {item?.unit}</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الكمية المصروفة *</Label>
              <Input type="number" step="0.01" min={0.01} max={item ? Number(item.quantity) : 1000000} required value={form.quantity || ""} onChange={e => update("quantity", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الصرف *</Label>
              <Input type="date" required value={form.movement_date} onChange={e => update("movement_date", e.target.value)} />
            </div>
          </div>

          {/* Recipient Type */}
          <div className="space-y-2">
            <Label>نوع المستلم</Label>
            <select
              value={form.recipient_type}
              onChange={e => {
                update("recipient_type", e.target.value);
                update("employee_id", null);
                update("destination_warehouse_id", null);
                update("contractor_name", "");
              }}
              className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— اختر نوع المستلم —</option>
              <option value="employee">صرف على موظف</option>
              <option value="warehouse">نقل إلى مستودع</option>
              <option value="other">مستلم آخر</option>
            </select>
          </div>

          {/* Employee dropdown */}
          {form.recipient_type === "employee" && (
            <div className="space-y-2">
              <Label>الموظف *</Label>
              <select
                value={form.employee_id || ""}
                onChange={e => update("employee_id", Number(e.target.value) || null)}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">— اختر الموظف —</option>
                {employees.map((emp: any) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
          )}

          {/* Warehouse dropdown */}
          {form.recipient_type === "warehouse" && (
            <div className="space-y-2">
              <Label>المستودع الهدف *</Label>
              <select
                value={form.destination_warehouse_id || ""}
                onChange={e => update("destination_warehouse_id", Number(e.target.value) || null)}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">— اختر المستودع —</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
          )}

          {/* Other recipient */}
          {form.recipient_type === "other" && (
            <div className="space-y-2">
              <Label>المقاول / المستلم</Label>
              <Input placeholder="اسم المقاول أو المستلم" value={form.contractor_name} onChange={e => update("contractor_name", e.target.value)} />
            </div>
          )}

          <div className="space-y-2">
            <Label>المشروع الموجه إليه</Label>
            <Input placeholder="اسم المشروع" value={form.project_name} onChange={e => update("project_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea placeholder="سبب الصرف أو أية ملاحظات..." value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جاري الصرف..." : "تأكيد الصرف"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
