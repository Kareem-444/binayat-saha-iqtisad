import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { suppliersApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
}

export default function SupplierDialog({ open, onOpenChange, editItem }: SupplierDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", contact_person: "", phone: "", email: "",
    category: "", address: "",
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || "", contact_person: editItem.contact_person || "",
        phone: editItem.phone || "", email: editItem.email || "",
        category: editItem.category || "", address: editItem.address || "",
      });
    } else {
      setForm({ name: "", contact_person: "", phone: "", email: "", category: "", address: "" });
    }
  }, [editItem, open]);

  const mutation = useMutation({
    mutationFn: (data: any) => editItem ? suppliersApi.update(editItem.id, data) : suppliersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: editItem ? "تم تحديث المورد بنجاح" : "تم إضافة المورد بنجاح" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate(form); };
  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editItem ? "تعديل مورد" : "إضافة مورد جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المورد *</Label>
              <Input required value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>الشخص المسؤول</Label>
              <Input value={form.contact_person} onChange={e => update("contact_person", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>رقم الجوال</Label>
              <Input dir="ltr" value={form.phone} onChange={e => update("phone", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input type="email" dir="ltr" value={form.email} onChange={e => update("email", e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>التصنيف</Label>
            <Input placeholder="مثال: مواد بناء، معدات" value={form.category} onChange={e => update("category", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>العنوان</Label>
            <Textarea value={form.address} onChange={e => update("address", e.target.value)} rows={2} />
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
