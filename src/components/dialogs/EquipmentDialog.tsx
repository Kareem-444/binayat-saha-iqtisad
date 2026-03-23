import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { equipmentApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

interface EquipmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
}

export default function EquipmentDialog({ open, onOpenChange, editItem }: EquipmentDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", type: "", model: "", year: new Date().getFullYear(),
    status: "يعمل" as string, project_name: "",
    hours_used: 0, last_maintenance: "", next_maintenance: "", daily_cost: 0,
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "", type: editItem.type || "", model: editItem.model || "",
        year: editItem.year || new Date().getFullYear(), status: editItem.status || "يعمل",
        project_name: editItem.project_name || "", hours_used: Number(editItem.hours_used) || 0,
        last_maintenance: editItem.last_maintenance?.split("T")[0] || "",
        next_maintenance: editItem.next_maintenance?.split("T")[0] || "",
        daily_cost: Number(editItem.daily_cost) || 0,
      });
    } else {
      setForm({ name: "", type: "", model: "", year: new Date().getFullYear(), status: "يعمل", project_name: "", hours_used: 0, last_maintenance: "", next_maintenance: "", daily_cost: 0 });
    }
  }, [editItem, open]);

  const mutation = useMutation({
    mutationFn: (data: any) => editItem ? equipmentApi.update(editItem.id, data) : equipmentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast({ title: editItem ? "تم تحديث المعدة بنجاح" : "تم تسجيل المعدة بنجاح" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate(form); };
  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editItem ? "تعديل معدة" : "تسجيل معدة جديدة"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المعدة *</Label>
              <Input required value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>النوع</Label>
              <Input placeholder="مثال: حفارة، رافعة" value={form.type} onChange={e => update("type", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>الموديل</Label>
              <Input value={form.model} onChange={e => update("model", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>سنة الصنع</Label>
              <Input type="number" value={form.year} onChange={e => update("year", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["يعمل", "صيانة", "معطل", "مؤجر"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ساعات العمل</Label>
              <Input type="number" min={0} value={form.hours_used} onChange={e => update("hours_used", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>التكلفة اليومية</Label>
              <Input type="number" min={0} value={form.daily_cost} onChange={e => update("daily_cost", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>آخر صيانة</Label>
              <Input type="date" value={form.last_maintenance} onChange={e => update("last_maintenance", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الصيانة القادمة</Label>
              <Input type="date" value={form.next_maintenance} onChange={e => update("next_maintenance", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>المشروع</Label>
            <Input placeholder="اسم المشروع" value={form.project_name} onChange={e => update("project_name", e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جاري الحفظ..." : editItem ? "تحديث" : "تسجيل"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
