import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Trash2, ArrowRight, Save, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inventoryPermissionsApi, inventoryApi, projectsApi, warehousesApi, contractorsApi } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const itemSchema = z.object({
  item_id: z.coerce.number().optional(),
  item_code: z.string().optional(),
  item_name: z.string().min(1, 'اسم الصنف مطلوب'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  quantity: z.coerce.number().min(0.01, 'الكمية مطلوبة'),
  price: z.coerce.number().optional().default(0),
});

const formSchema = z.object({
  permission_number: z.string().min(1, 'الرقم مطلوب'),
  type: z.string().min(1, 'النوع مطلوب'),
  direction: z.enum(['add', 'dispense']),
  warehouse_id: z.coerce.number({ required_error: 'المستودع مطلوب' }),
  project_id: z.coerce.number().optional(),
  supplier_name: z.string().optional(),
  external: z.boolean().default(false),
  vehicle_number: z.string().optional(),
  supply_route: z.string().optional(),
  notes: z.string().optional(),
  target_type: z.enum(['contractor', 'warehouse']).optional(),
  contractor_id: z.coerce.number().optional().nullable(),
  target_warehouse_id: z.coerce.number().optional().nullable(),
  date: z.string().optional(),
  items: z.array(itemSchema).min(1, 'يجب إضافة صنف واحد على الأقل')
});

type FormValues = z.infer<typeof formSchema>;

export default function PermissionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const directionParam = searchParams.get('direction') === 'dispense' ? 'dispense' : 'add';

  const { data: warhouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(r => r.data)
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data)
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryApi.list().then(r => r.data)
  });

  const { data: contractors = [] } = useQuery({
     queryKey: ['contractors'],
     queryFn: () => contractorsApi.list().then(r => r.data)
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      direction: directionParam,
      permission_number: `PERM-${Math.floor(Date.now() / 1000)}`,
      type: directionParam === 'add' ? 'إضافة مشتراه' : 'صرف داخلي',
      date: new Date().toISOString().split('T')[0],
      external: false,
      items: [{ item_code: '', item_name: '', unit: '', quantity: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const direction = watch('direction');
  const type = watch('type');
  const targetType = watch('target_type');
  const itemsArray = watch('items');
  
  const addTypes = ['إضافة مشتراه', 'ارتجاع', 'إضافة محولة', 'أول المدة', 'إيجارات'];
  const dispenseTypes = ['صرف داخلي', 'صرف خارجي'];
  
  const currentTypes = direction === 'add' ? addTypes : dispenseTypes;

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.type === 'صرف خارجي') data.external = true;
      else if (data.type === 'صرف داخلي') data.external = false;

      // Map null values
      const payload = {
        ...data,
        project_id: isNaN(data.project_id as number) || !data.project_id ? null : Number(data.project_id),
        contractor_id: isNaN(data.contractor_id as number) || !data.contractor_id ? null : Number(data.contractor_id),
        target_warehouse_id: isNaN(data.target_warehouse_id as number) || !data.target_warehouse_id ? null : Number(data.target_warehouse_id),
        supplier_name: data.supplier_name || null,
      };

      await inventoryPermissionsApi.create(payload);
      toast.success('تم حفظ الإذن بنجاح');
      navigate('/inventory/permissions');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ أثناء الحفظ');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            {direction === 'add' ? 'إنشاء إذن إضافة' : 'إنشاء إذن صرف'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">تعبئة بيانات الإذن وأصناف المخزون</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/inventory/permissions')} className="gap-2">
           الإلغاء والعودة
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        
        {/* Header Section */}
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-6">
          <h2 className="text-lg font-bold border-b pb-2">البيانات الأساسية</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>رقم الإذن</Label>
              <Input {...register('permission_number')} />
              {errors.permission_number && <p className="text-xs text-red-500">{errors.permission_number.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label>نوع الحركة</Label>
              <select 
                {...register('type')} 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {currentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" {...register('date')} />
            </div>

            <div className="space-y-2">
              <Label>المستودع</Label>
              <select 
                {...register('warehouse_id')} 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- اختر المستودع --</option>
                {warhouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              {errors.warehouse_id && <p className="text-xs text-red-500">{errors.warehouse_id.message}</p>}
            </div>

            {(direction === 'dispense' || type === 'ارتجاع' || type === 'إضافة محولة') && (
              <div className="space-y-2">
                <Label>المشروع</Label>
                <select 
                  {...register('project_id')} 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">-- اختر المشروع --</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            {direction === 'dispense' && (
              <>
                 <div className="space-y-2">
                   <Label>نوع جهة الصرف</Label>
                   <select 
                     {...register('target_type')} 
                     onChange={(e) => {
                         register('target_type').onChange(e);
                         setValue('contractor_id', null as any);
                         setValue('target_warehouse_id', null as any);
                     }}
                     className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                   >
                     <option value="">-- غير محدد --</option>
                     <option value="contractor">مقاول</option>
                     <option value="warehouse">مستودع (تحويل)</option>
                   </select>
                   {errors.target_type && <p className="text-xs text-red-500">{errors.target_type.message}</p>}
                 </div>

                 {targetType === 'contractor' && (
                    <div className="space-y-2">
                      <Label className="text-red-500">* المقاول (مطلوب)</Label>
                      <select 
                        {...register('contractor_id', { required: "المقاول مطلوب" })} 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="">-- اختر المقاول --</option>
                        {contractors.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {errors.contractor_id && <p className="text-xs text-red-500">{errors.contractor_id.message as string}</p>}
                    </div>
                 )}

                 {targetType === 'warehouse' && (
                    <div className="space-y-2">
                      <Label className="text-red-500">* المستودع الهدف (مطلوب)</Label>
                      <select 
                        {...register('target_warehouse_id', { required: "المستودع الهدف مطلوب" })} 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="">-- اختر المستودع الهدف --</option>
                        {warhouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      {errors.target_warehouse_id && <p className="text-xs text-red-500">{errors.target_warehouse_id.message as string}</p>}
                    </div>
                 )}
              </>
            )}

            {direction === 'add' && (
              <div className="space-y-2">
                <Label>اسم المورد / الشاحن</Label>
                <Input {...register('supplier_name')} placeholder="اختياري..." />
              </div>
            )}
            
            <div className="space-y-2 md:col-span-3">
              <Label>ملاحظات</Label>
              <Input {...register('notes')} placeholder="أي تفاصيل أخرى..." />
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="p-6 bg-card border border-border rounded-xl shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="text-lg font-bold">الأصناف</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ item_code: '', item_name: '', unit: '', quantity: 1, price: 0 })} className="gap-1">
              <Plus className="h-4 w-4" /> إضافة صنف
            </Button>
          </div>
          
          {errors.items && <p className="text-xs text-red-500 font-bold">{errors.items.root?.message}</p>}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="flex flex-wrap items-end gap-3 p-4 border rounded-lg bg-muted/20 relative">
                
                <div className="w-24 space-y-2">
                  <Label>كود الصنف</Label>
                  <Input {...register(`items.${index}.item_code` as const)} placeholder="اختياري..." />
                </div>

                <div className="flex-1 min-w-[200px] space-y-2 relative group">
                  <Label>اسم الصنف</Label>
                  <Input 
                    {...register(`items.${index}.item_name` as const)} 
                    placeholder="ابحث أو اكتب اسم جديد..." 
                    onChange={(e) => {
                       register(`items.${index}.item_name` as const).onChange(e);
                       const val = e.target.value;
                       const found = inventory.find((i: any) => i.name === val);
                       if (found) {
                          setValue(`items.${index}.item_code` as any, found.item_code || '');
                          setValue(`items.${index}.unit` as any, found.unit || '');
                          if (direction === 'add') setValue(`items.${index}.price` as any, found.unit_price || 0);
                       }
                    }}
                    list={`inventory-items-${index}`}
                  />
                  <datalist id={`inventory-items-${index}`}>
                     {inventory.map((i: any) => <option key={i.id} value={i.name} />)}
                  </datalist>
                  {errors.items?.[index]?.item_name && <p className="text-[10px] text-red-500">{errors.items[index]?.item_name?.message}</p>}
                </div>

                <div className="w-24 space-y-2">
                  <Label>الوحدة</Label>
                  <Input {...register(`items.${index}.unit` as const)} placeholder="حبة، طن..." />
                  {errors.items?.[index]?.unit && <p className="text-[10px] text-red-500">{errors.items[index]?.unit?.message}</p>}
                </div>

                <div className="w-28 space-y-2">
                  <Label>الكمية</Label>
                  <Input type="number" step="any" {...register(`items.${index}.quantity` as const)} />
                  {errors.items?.[index]?.quantity && <p className="text-[10px] text-red-500">{errors.items[index]?.quantity?.message}</p>}
                </div>

                {direction === 'add' && (
                  <div className="w-28 space-y-2">
                    <Label>سعر الوحدة</Label>
                    <Input type="number" step="any" {...register(`items.${index}.price` as const)} />
                  </div>
                )}

                <div className="w-28 space-y-2">
                   <Label className="text-primary font-bold">الإجمالي</Label>
                   <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm font-bold text-primary">
                     {new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 2 }).format((itemsArray?.[index]?.quantity || 0) * (itemsArray?.[index]?.price || 0))} 
                   </div>
                </div>

                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>

              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/inventory/permissions')}>
            إلغاء
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2 px-8">
            {isSubmitting ? (
              <span className="h-4 w-4 border-2 border-current border-t-transparent flex rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            حفظ واعتماد
          </Button>
        </div>

      </form>
    </div>
  );
}
