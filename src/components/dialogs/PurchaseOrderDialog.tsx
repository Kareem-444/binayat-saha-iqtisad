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
import { Plus, Trash2 } from "lucide-react";

interface PurchaseOrderItem {
  id?: number;
  item_name: string;
  unit?: string;
  quantity: number;
  unit_price: number;
  total?: number;
}

interface PurchaseOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem?: any | null;
}

export default function PurchaseOrderDialog({ open, onOpenChange, editItem }: PurchaseOrderDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState({
    order_number: "", supplier_name: "", order_date: new Date().toISOString().split("T")[0],
    items_count: 0, total: 0, status: "قيد الانتظار" as string, notes: "",
  });
  
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  useEffect(() => {
    if (open) {
      if (editItem) {
        setForm({
          order_number: editItem.order_number || "",
          supplier_name: editItem.supplier_name || "",
          order_date: (editItem.order_date && editItem.order_date.split("T")[0]) || new Date().toISOString().split("T")[0],
          items_count: editItem.items_count || 0,
          total: editItem.total || 0,
          status: editItem.status || "قيد الانتظار",
          notes: editItem.notes || ""
        });
        
        // Robust fallback for items array name
        const poItems = editItem.items || editItem.purchase_order_items || editItem.order_items || editItem.purchaseOrderItems || [];
        
        if (poItems.length > 0) {
          const mappedItems = poItems.map((item: any) => ({
            id: item.id,
            item_name: item.item_name || item.name || item.product_name || "",
            unit: item.unit || "",
            quantity: Number(item.quantity || item.qty || 1),
            unit_price: Number(item.unit_price || item.price || item.total_price || 0)
          }));
          setItems(mappedItems);
        } else {
          setItems([]);
        }
      } else {
        setForm({ order_number: `PO-${Math.floor(Math.random() * 10000)}`, supplier_name: "", order_date: new Date().toISOString().split("T")[0], items_count: 0, total: 0, status: "قيد الانتظار", notes: "" });
        setItems([]);
      }
    }
  }, [open, editItem]);

  // Recalculate totals
  useEffect(() => {
    if (items.length > 0) {
      const calculatedTotal = items.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0);
      if (calculatedTotal !== form.total || items.length !== form.items_count) {
        setForm(f => ({ ...f, total: calculatedTotal, items_count: items.length }));
      }
    }
  }, [items]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
      const payload = { ...data, items };
      return editItem 
        ? purchaseOrdersApi.update(editItem.id, payload)
        : purchaseOrdersApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchaseOrders"] });
      toast({ title: editItem ? "تم تعديل طلب الشراء بنجاح" : "تم إضافة طلب الشراء بنجاح" });
      onOpenChange(false);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); mutation.mutate(form); };
  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const addItemRow = () => {
    setItems([...items, { item_name: "", quantity: 1, unit_price: 0 }]);
  };

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    if (items.length === 1) { setForm(f => ({ ...f, total: 0, items_count: 0 })); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle>{editItem ? "تعديل طلب الشراء" : "إضافة طلب شراء جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto px-1">
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>اسم المورد *</Label>
              <Input required placeholder="ادخل اسم المورد..." value={form.supplier_name} onChange={e => update("supplier_name", e.target.value)} />
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
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-bold">الأصناف</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItemRow} className="gap-1">
                <Plus className="h-4 w-4" /> إضافة صنف
              </Button>
            </div>
            
            {items.length > 0 ? (
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="py-2 px-3 text-right">اسم الصنف</th>
                      <th className="py-2 px-3 text-right w-24">الكمية</th>
                      <th className="py-2 px-3 text-right w-28">السعر</th>
                      <th className="py-2 px-3 text-right w-28">الإجمالي</th>
                      <th className="py-2 px-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-t border-border">
                        <td className="p-2"><Input value={item.item_name} onChange={e => updateItem(idx, 'item_name', e.target.value)} required placeholder="اسم الصنف" /></td>
                        <td className="p-2"><Input type="number" min="0" step="0.01" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} required /></td>
                        <td className="p-2"><Input type="number" min="0" step="0.01" value={item.unit_price} onChange={e => updateItem(idx, 'unit_price', Number(e.target.value))} required /></td>
                        <td className="p-2 font-bold bg-muted/30">
                           {(item.quantity * item.unit_price).toLocaleString('ar-EG')} ج.م
                        </td>
                        <td className="p-2">
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground bg-muted/20 border border-dashed border-border rounded-lg">
                لا توجد أصناف مضافة. أضف أصناف لطلب الشراء للحساب التلقائي.
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>عدد الأصناف</Label>
              <Input type="number" min={0} value={form.items_count || ""} readOnly className="bg-muted/50" />
            </div>
            <div className="space-y-2">
              <Label>القيمة الإجمالية (ج.م) *</Label>
              <Input type="number" step="0.01" min={0} required value={form.total || ""} readOnly={items.length > 0} onChange={e => items.length === 0 && update("total", Number(e.target.value))} className={items.length > 0 ? "bg-muted/50 font-bold" : ""} />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>تفاصيل الطلب / ملاحظات</Label>
            <Textarea placeholder="أضف الأصناف المطلوبة أو أية تفاصيل أخرى..." value={form.notes} onChange={e => update("notes", e.target.value)} rows={3} />
          </div>
          <div className="flex gap-2 justify-end pt-2 sticky bottom-0 bg-background/90 backdrop-blur pb-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "جاري الحفظ..." : (editItem ? "حفظ التعديلات" : "إضافة الطلب")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
