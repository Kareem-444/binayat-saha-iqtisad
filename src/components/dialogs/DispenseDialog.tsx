import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { inventoryMovementsApi } from "@/api/client";
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
    project_name: "",
    contractor_name: "",
    movement_date: new Date().toISOString().split("T")[0],
    notes: "",
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
      setForm({ quantity: 0, project_name: "", contractor_name: "", movement_date: new Date().toISOString().split("T")[0], notes: "" });
    },
    onError: (err: any) => toast({ title: err.response?.data?.error || "حدث خطأ أثناء الصرف", variant: "destructive" }),
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
    mutation.mutate(form);
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
          <div className="space-y-2">
            <Label>المشروع الموجه إليه</Label>
            <Input placeholder="اسم المشروع" value={form.project_name} onChange={e => update("project_name", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>المقاول / المستلم</Label>
            <Input placeholder="اسم المقاول أو المستلم" value={form.contractor_name} onChange={e => update("contractor_name", e.target.value)} />
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
