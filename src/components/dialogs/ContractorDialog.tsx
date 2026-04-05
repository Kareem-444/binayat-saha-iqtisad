import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { employeesApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

interface ContractorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
}

export default function ContractorDialog({ open, onOpenChange, editItem }: ContractorDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", start_date: "", department: "", role: "", phone: "", notes: "",
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "", start_date: editItem.start_date?.split("T")[0] || "",
        department: editItem.department || "", role: editItem.role || "",
        phone: editItem.phone || "", notes: editItem.notes || "",
      });
    } else {
      setForm({ name: "", start_date: "", department: "", role: "", phone: "", notes: "" });
    }
  }, [editItem, open]);

  const mutation = useMutation({
    mutationFn: (data: any) => editItem ? employeesApi.update(editItem.id, data) : employeesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast({ title: editItem ? "تم تحديث المقاول بنجاح" : "تم إضافة المقاول بنجاح" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: "الاسم بالكامل مطلوب", variant: "destructive" });
      return;
    }
    mutation.mutate(form);
  };
  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editItem ? "تعديل بيانات المقاول" : "إضافة مقاول جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المقاول *</Label>
              <Input required value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>تاريخ البدء</Label>
              <Input type="date" value={form.start_date} onChange={e => update("start_date", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>القسم</Label>
              <Input value={form.department} onChange={e => update("department", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>المسمى الوظيفي</Label>
              <Input placeholder="مثال: مهندس موقع" value={form.role} onChange={e => update("role", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>رقم الجوال</Label>
            <Input dir="ltr" value={form.phone} onChange={e => update("phone", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>ملاحظات</Label>
            <Textarea placeholder="أضف ملاحظات إضافية..." value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} />
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
