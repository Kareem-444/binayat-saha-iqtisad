import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { purchaseOrdersApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PurchaseOrderDialog({ open, onOpenChange }: PurchaseOrderDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    order_number: "", supplier_name: "", order_date: new Date().toISOString().split("T")[0],
    items_count: 1, total: 0, status: "قيد الانتظار" as string, notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({ order_number: `PO-${Math.floor(Math.random() * 10000)}`, supplier_name: "", order_date: new Date().toISOString().split("T")[0], items_count: 1, total: 0, status: "قيد الانتظار", notes: "" });
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: (data: any) => purchaseOrdersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast({ title: "تم إضافة طلب الشراء بنجاح" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate(form); };
  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة طلب شراء جديد</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم الطلب *</Label>
              <Input required value={form.order_number} onChange={e => update("order_number", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الطلب *</Label>
              <Input type="date" required value={form.order_date} onChange={e => update("order_date", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>اسم المورد *</Label>
            <Input required placeholder="ادخل اسم المورد..." value={form.supplier_name} onChange={e => update("supplier_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>عدد الأصناف</Label>
              <Input type="number" min={1} required value={form.items_count || ""} onChange={e => update("items_count", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>القيمة الإجمالية (ج.م) *</Label>
              <Input type="number" step="0.01" min={0} required value={form.total || ""} onChange={e => update("total", Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>الحالة</Label>
            <Select value={form.status} onValueChange={v => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="قيد الانتظار">قيد الانتظار</SelectItem>
                <SelectItem value="معتمد">معتمد</SelectItem>
                <SelectItem value="تم التسليم">تم التسليم</SelectItem>
                <SelectItem value="ملغي">ملغي</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>تفاصيل الطلب / ملاحظات</Label>
            <Textarea placeholder="أضف الأصناف المطلوبة أو أية تفاصيل أخرى..." value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جاري الإضافة..." : "إضافة الطلب"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
