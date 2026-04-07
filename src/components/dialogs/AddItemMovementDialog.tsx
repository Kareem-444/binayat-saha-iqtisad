import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryMovementsApi, warehousesApi, employeesApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

interface AddItemMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

const defaultForm = {
  type: "وارد" as string,
  source_type: "warehouse" as string,
  quantity: 0,
  source_location: "",
  employee_id: null as number | null,
  issued_by: "",
  project_name: "",
  contractor_name: "",
  movement_date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function AddItemMovementDialog({ open, onOpenChange, item }: AddItemMovementDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ ...defaultForm });
  const [quantityError, setQuantityError] = useState("");

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehousesApi.list().then(r => r.data),
    enabled: open,
  });

  const { data: contractors = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: () => employeesApi.list().then(r => r.data),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => inventoryMovementsApi.create({
      ...data,
      item_id: item.id,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
      toast({ title: form.type === "وارد" ? "تم إضافة الوارد بنجاح" : "تم تسجيل الصادر بنجاح" });
      onOpenChange(false);
      setForm({ ...defaultForm, movement_date: new Date().toISOString().split("T")[0] });
      setQuantityError("");
    },
    onError: (err: any) => toast({ title: err.response?.data?.error || "حدث خطأ", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantity <= 0) {
      setQuantityError("الكمية يجب أن تكون أكبر من صفر");
      toast({ title: "الكمية يجب أن تكون أكبر من صفر", variant: "destructive" });
      return;
    }
    if (form.type === "صادر" && form.quantity > Number(item?.quantity || 0)) {
      setQuantityError(`الكمية المطلوبة أكبر من المتوفر في المخزون (${Number(item?.quantity || 0).toLocaleString("ar-EG")} ${item?.unit})`);
      toast({ title: "الكمية المطلوبة أكبر من المتوفر في المخزون", variant: "destructive" });
      return;
    }
    setQuantityError("");
    mutation.mutate(form);
  };

  const update = (key: string, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === "quantity") {
      if (Number(value) <= 0) {
        setQuantityError("الكمية يجب أن تكون أكبر من صفر");
      } else if (form.type === "صادر" && Number(value) > Number(item?.quantity || 0)) {
        setQuantityError(`الكمية المطلوبة أكبر من المتوفر في المخزون (${Number(item?.quantity || 0).toLocaleString("ar-EG")} ${item?.unit})`);
      } else {
        setQuantityError("");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة حركة صنف: {item?.name}</DialogTitle>
        </DialogHeader>
        
        {/* Item Summary Card */}
        <div className="rounded-lg border border-border bg-card p-4 space-y-2 mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{item?.name}</p>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>الفئة: {item?.category || "—"}</span>
                <span>الوحدة: {item?.unit || "وحدة"}</span>
                {item?.warehouse_name && <span>المستودع: {item.warehouse_name}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
              <p className="text-xl font-black text-primary">{Number(item?.quantity || 0).toLocaleString("ar-EG")} {item?.unit}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type + Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الحركة *</Label>
              <Select value={form.type} onValueChange={v => {
                update("type", v);
                setQuantityError("");
              }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="وارد">وارد (إضافة للمخزون)</SelectItem>
                  <SelectItem value="صادر">صادر (خروج من المخزون)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الكمية *</Label>
              <Input 
                type="number" 
                step="0.01" 
                min={0.01} 
                required 
                value={form.quantity || ""} 
                onChange={e => update("quantity", Number(e.target.value))}
                className={quantityError ? "border-red-500" : ""}
              />
              {quantityError && (
                <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{quantityError}</span>
                </div>
              )}
            </div>
          </div>

          {/* Source Type Selection */}
          <div className="space-y-2">
            <Label>نوع المصدر</Label>
            <Select value={form.source_type} onValueChange={v => {
              update("source_type", v);
              update("source_location", "");
              update("employee_id", null);
              update("contractor_name", "");
            }}>
              <SelectTrigger><SelectValue placeholder="اختر نوع المصدر" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="warehouse">مستودع</SelectItem>
                <SelectItem value="contractor">مقاول</SelectItem>
                <SelectItem value="other">مصدر آخر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Warehouse Source */}
          {form.source_type === "warehouse" && (
            <div className="space-y-2">
              <Label>الموقع المصدر / المستودع *</Label>
              <Select value={form.source_location} onValueChange={v => update("source_location", v)}>
                <SelectTrigger><SelectValue placeholder="اختر المستودع" /></SelectTrigger>
                <SelectContent>
                  {warehouses.map((w: any) => (
                    <SelectItem key={w.id} value={w.name}>{w.name}{w.location ? ` — ${w.location}` : ""}</SelectItem>
                  ))}
                  <SelectItem value="__other__">أخرى (إدخال يدوي)</SelectItem>
                </SelectContent>
              </Select>
              {form.source_location === "__other__" && (
                <Input placeholder="أدخل اسم الموقع..." className="mt-1" onChange={e => update("source_location", e.target.value || "__other__")} />
              )}
            </div>
          )}

          {/* Contractor Source */}
          {form.source_type === "contractor" && (
            <div className="space-y-2">
              <Label>المقاول *</Label>
              <select
                value={form.employee_id || ""}
                onChange={e => update("employee_id", Number(e.target.value) || null)}
                className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                <option value="">— اختر المقاول —</option>
                {contractors.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}

          {/* Other Source */}
          {form.source_type === "other" && (
            <div className="space-y-2">
              <Label>المصدر *</Label>
              <Input 
                required 
                placeholder="اسم المصدر" 
                value={form.source_location} 
                onChange={e => update("source_location", e.target.value)} 
              />
            </div>
          )}

          {/* Issued By */}
          <div className="space-y-2">
            <Label>المسؤول عن الصرف *</Label>
            <Input required placeholder="اسم الشخص المسؤول" value={form.issued_by} onChange={e => update("issued_by", e.target.value)} />
          </div>

          {/* Date + Project */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>التاريخ *</Label>
              <Input type="date" required value={form.movement_date} onChange={e => update("movement_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>المشروع</Label>
              <Input placeholder="اسم المشروع" value={form.project_name} onChange={e => update("project_name", e.target.value)} />
            </div>
          </div>

          {/* Contractor */}
          <div className="space-y-2">
            <Label>المقاول / المستلم</Label>
            <Input placeholder="اسم المقاول أو المستلم" value={form.contractor_name} onChange={e => update("contractor_name", e.target.value)} />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea placeholder="أية ملاحظات إضافية..." value={form.notes} onChange={e => update("notes", e.target.value)} rows={2} />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جاري الحفظ..." : "تأكيد الإضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
