import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { projectsApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
}

export default function ProjectDialog({ open, onOpenChange, editItem }: ProjectDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", client: "", location: "", start_date: "", end_date: "",
    budget: 0, spent: 0, progress: 0,
    status: "نشط" as string, manager_name: "", description: "",
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "", client: editItem.client || "", location: editItem.location || "",
        start_date: editItem.start_date?.split("T")[0] || "", end_date: editItem.end_date?.split("T")[0] || "",
        budget: Number(editItem.budget) || 0, spent: Number(editItem.spent) || 0, progress: Number(editItem.progress) || 0,
        status: editItem.status || "نشط", manager_name: editItem.manager_name || "", description: editItem.description || "",
      });
    } else {
      setForm({ name: "", client: "", location: "", start_date: "", end_date: "", budget: 0, spent: 0, progress: 0, status: "نشط", manager_name: "", description: "" });
    }
  }, [editItem, open]);

  const mutation = useMutation({
    mutationFn: (data: any) => editItem ? projectsApi.update(editItem.id, data) : projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast({ title: editItem ? "تم تحديث المشروع بنجاح" : "تم إضافة المشروع بنجاح" });
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
          <DialogTitle>{editItem ? "تعديل مشروع" : "إضافة مشروع جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المشروع *</Label>
              <Input required value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>العميل *</Label>
              <Input required value={form.client} onChange={e => update("client", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الموقع</Label>
              <Input value={form.location} onChange={e => update("location", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>مدير المشروع</Label>
              <Input value={form.manager_name} onChange={e => update("manager_name", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>تاريخ البدء</Label>
              <Input type="date" value={form.start_date} onChange={e => update("start_date", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ الانتهاء</Label>
              <Input type="date" value={form.end_date} onChange={e => update("end_date", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>الميزانية</Label>
              <Input type="number" min={0} value={form.budget} onChange={e => update("budget", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>المصروف</Label>
              <Input type="number" min={0} value={form.spent} onChange={e => update("spent", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>نسبة الإنجاز %</Label>
              <Input type="number" min={0} max={100} value={form.progress} onChange={e => update("progress", Number(e.target.value))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Select value={form.status} onValueChange={v => update("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["نشط", "يكاد يكتمل", "مكتمل", "متوقف", "ملغي"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>الوصف</Label>
            <Textarea value={form.description} onChange={e => update("description", e.target.value)} rows={2} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جاري الحفظ..." : editItem ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
