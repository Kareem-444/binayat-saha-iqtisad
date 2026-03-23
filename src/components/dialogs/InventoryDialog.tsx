import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";

interface InventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any;
}

export default function InventoryDialog({ open, onOpenChange, editItem }: InventoryDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    item_code: "",
    name: "",
    category: "مواد" as string,
    unit: "",
    quantity: 0,
    min_stock: 0,
    unit_price: 0,
    warehouse_name: "",
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        item_code: editItem.item_code || "",
        name: editItem.name || "",
        category: editItem.category || "مواد",
        unit: editItem.unit || "",
        quantity: Number(editItem.quantity) || 0,
        min_stock: Number(editItem.min_stock) || 0,
        unit_price: Number(editItem.unit_price) || 0,
        warehouse_name: editItem.warehouse_name || "",
      });
    } else {
      setForm({ item_code: "", name: "", category: "مواد", unit: "", quantity: 0, min_stock: 0, unit_price: 0, warehouse_name: "" });
    }
  }, [editItem, open]);

  const mutation = useMutation({
    mutationFn: (data: any) => editItem ? inventoryApi.update(editItem.id, data) : inventoryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({ title: editItem ? "تم تحديث الصنف بنجاح" : "تم إضافة الصنف بنجاح" });
      onOpenChange(false);
    },
    onError: () => {
      toast({ title: "حدث خطأ", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editItem ? "تعديل صنف" : "إضافة صنف جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>كود الصنف</Label>
              <Input placeholder="مثال: MAT-001" value={form.item_code} onChange={e => update("item_code", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>اسم الصنف *</Label>
              <Input required value={form.name} onChange={e => update("name", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>الفئة *</Label>
              <Select value={form.category} onValueChange={v => update("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="مواد">مواد</SelectItem>
                  <SelectItem value="معدات">معدات</SelectItem>
                  <SelectItem value="أدوات">أدوات</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوحدة *</Label>
              <Input required placeholder="مثال: كجم، متر، قطعة" value={form.unit} onChange={e => update("unit", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>الكمية</Label>
              <Input type="number" min={0} value={form.quantity} onChange={e => update("quantity", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>الحد الأدنى</Label>
              <Input type="number" min={0} value={form.min_stock} onChange={e => update("min_stock", Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>سعر الوحدة</Label>
              <Input type="number" min={0} value={form.unit_price} onChange={e => update("unit_price", Number(e.target.value))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>المستودع</Label>
            <Input placeholder="اسم المستودع" value={form.warehouse_name} onChange={e => update("warehouse_name", e.target.value)} />
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
