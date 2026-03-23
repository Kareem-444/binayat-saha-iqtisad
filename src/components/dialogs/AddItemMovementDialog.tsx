import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryMovementsApi, warehousesApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

interface AddItemMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

const defaultForm = {
  type: "وارد" as string,
  quantity: 0,
  source_location: "",
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

  const { data: warehouses = [] } = useQuery({
    queryKey: ["warehouses"],
    queryFn: () => warehousesApi.list().then(r => r.data),
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
    },
    onError: (err: any) => toast({ title: err.response?.data?.error || "حدث خطأ", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.quantity <= 0) {
      toast({ title: "الكمية يجب أن تكون أكبر من صفر", variant: "destructive" });
      return;
    }
    if (form.type === "صادر" && form.quantity > Number(item?.quantity || 0)) {
      toast({ title: "الكمية المطلوبة أكبر من المتوفر في المخزون", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة حركة صنف: {item?.name}</DialogTitle>
        </DialogHeader>
        <div className="rounded-lg bg-muted/50 p-3 mb-2 flex justify-between items-center text-sm">
          <span className="text-muted-foreground">الرصيد الحالي:</span>
          <span className="font-bold text-primary">{Number(item?.quantity || 0).toLocaleString("ar-SA")} {item?.unit}</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type + Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نوع الحركة *</Label>
              <Select value={form.type} onValueChange={v => update("type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="وارد">وارد (إضافة للمخزون)</SelectItem>
                  <SelectItem value="صادر">صادر (خروج من المخزون)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الكمية *</Label>
              <Input type="number" step="0.01" min={0.01} required value={form.quantity || ""} onChange={e => update("quantity", Number(e.target.value))} />
            </div>
          </div>

          {/* Source Location + Issued By */}
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>المسؤول عن الصرف *</Label>
              <Input required placeholder="اسم الشخص المسؤول" value={form.issued_by} onChange={e => update("issued_by", e.target.value)} />
            </div>
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
