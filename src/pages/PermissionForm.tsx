import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLocation, useNavigate, useSearchParams, useParams } from "react-router-dom";
import { Plus, Trash2, Save, Package, Truck, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inventoryPermissionsApi, inventoryApi, projectsApi, warehousesApi, employeesApi } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ItemSelector from "@/components/dialogs/ItemSelector";

const itemSchema = z.object({
  item_id: z.coerce.number().optional().nullable(),
  item_code: z.string().optional(),
  item_name: z.string().min(1, 'اسم الصنف مطلوب'),
  unit: z.string().min(1, 'الوحدة مطلوبة'),
  quantity: z.coerce.number().min(0.01, 'الكمية مطلوبة'),
  price: z.coerce.number().optional().default(0),
  stock_quantity: z.coerce.number().optional().default(0),
  stock_error: z.string().optional(),
  notes: z.string().optional(),
});

const formSchema = z.object({
  permission_number: z.string().min(1, 'الرقم مطلوب'),
  type: z.string().min(1, 'النوع مطلوب'),
  direction: z.enum(['add', 'dispense']),
  warehouse_id: z.coerce.number({ required_error: 'المستودع مطلوب' }).min(1, 'المستودع مطلوب'),
  project_id: z.coerce.number().optional(),
  supplier_name: z.string().optional(),
  external: z.boolean().default(false),
  vehicle_number: z.string().optional(),
  driver_name: z.string().optional(),
  supply_route: z.string().optional(),
  notes: z.string().optional(),
  target_type: z.enum(['contractor', 'warehouse']).optional().nullable().or(z.literal('')),
  employee_id: z.coerce.number().optional().nullable(),
  target_warehouse_id: z.coerce.number().optional().nullable(),
  date: z.string().optional(),
  items: z.array(itemSchema).min(1, 'يجب إضافة صنف واحد على الأقل')
}).superRefine((data, ctx) => {
  if (data.direction === 'dispense') {
    if (data.target_type === 'contractor' && (!data.employee_id || data.employee_id <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "المقاول مطلوب", path: ['employee_id'] });
    }
    if (data.target_type === 'warehouse' && (!data.target_warehouse_id || data.target_warehouse_id <= 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "المستودع الهدف مطلوب", path: ['target_warehouse_id'] });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

export default function PermissionForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const isEdit = !!id;
  
  const directionParam = searchParams.get('direction') === 'dispense' ? 'dispense' : 'add';

  const { data: warhouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehousesApi.list().then(r => r.data)
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then(r => r.data)
  });

  const { data: employees = [] } = useQuery({
     queryKey: ['employees'],
     queryFn: () => employeesApi.list().then(r => r.data)
  });

  const { data: editData, isLoading: isLoadingEdit } = useQuery({
    queryKey: ['permission', id],
    queryFn: () => inventoryPermissionsApi.get(Number(id)).then(r => r.data),
    enabled: isEdit
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      direction: directionParam,
      permission_number: `PERM-${Math.floor(Date.now() / 1000)}`,
      type: directionParam === 'add' ? 'إضافة مشتراه' : 'صرف داخلي',
      date: new Date().toISOString().split('T')[0],
      external: false,
      target_type: '',
      items: [{ item_id: null, item_code: '', item_name: '', unit: '', quantity: 1, price: 0, stock_quantity: 0, stock_error: '', notes: '' }]
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
  const currentWarehouseId = watch('warehouse_id');
  
  // Auto-set warehouse for dispense mode so the DB isn't broken but the field is safely hidden
  useEffect(() => {
    if (direction === 'dispense' && warhouses.length > 0 && (!currentWarehouseId || currentWarehouseId === 0) && !isEdit) {
      setValue('warehouse_id', warhouses[0].id);
    }
  }, [direction, warhouses, currentWarehouseId, isEdit, setValue]);

  // Load Edit Data
  useEffect(() => {
    if (editData && isEdit) {
      setValue('direction', editData.direction);
      setValue('permission_number', editData.permission_number);
      setValue('type', editData.type);
      setValue('date', new Date(editData.date).toISOString().split('T')[0]);
      setValue('warehouse_id', editData.warehouse_id);
      
      if (editData.project_id) setValue('project_id', editData.project_id);
      if (editData.supplier_name) setValue('supplier_name', editData.supplier_name);
      if (editData.vehicle_number) setValue('vehicle_number', editData.vehicle_number);
      if (editData.driver_name) setValue('driver_name', editData.driver_name);
      if (editData.notes) setValue('notes', editData.notes);
      
      if (editData.target_type) setValue('target_type', editData.target_type);
      if (editData.employee_id) setValue('employee_id', editData.employee_id);
      else if (editData.contractor_id) setValue('employee_id', editData.contractor_id);
      
      if (editData.target_warehouse_id) setValue('target_warehouse_id', editData.target_warehouse_id);

      const mappedItems = editData.items.map((item: any) => ({
        item_id: item.item_id,
        item_code: item.item_code || '',
        item_name: item.item_name || '',
        unit: item.unit || '',
        quantity: item.quantity,
        price: item.price || 0,
        notes: item.notes || ''
      }));
      setValue('items', mappedItems);
    }
  }, [editData, isEdit, setValue]);

  const addTypes = ['إضافة مشتراه', 'ارتجاع', 'إضافة محولة', 'أول المدة', 'إيجارات'];
  const dispenseTypes = ['صرف داخلي', 'صرف خارجي'];
  const currentTypes = direction === 'add' ? addTypes : dispenseTypes;

  const onSubmit = async (data: FormValues) => {
    try {
      if (data.type === 'صرف خارجي') data.external = true;
      else if (data.type === 'صرف داخلي') data.external = false;

      const payload = {
        ...data,
        project_id: isNaN(data.project_id as number) || !data.project_id ? null : Number(data.project_id),
        employee_id: isNaN(data.employee_id as number) || !data.employee_id ? null : Number(data.employee_id),
        target_warehouse_id: isNaN(data.target_warehouse_id as number) || !data.target_warehouse_id ? null : Number(data.target_warehouse_id),
        supplier_name: data.supplier_name || null,
        vehicle_number: data.vehicle_number || null,
        driver_name: data.driver_name || null,
        target_type: data.target_type || null,
      };

      if (isEdit) {
        await inventoryPermissionsApi.update(Number(id), payload);
        toast.success('تم تعديل الإذن بنجاح');
      } else {
        await inventoryPermissionsApi.create(payload);
        toast.success('تم حفظ الإذن بنجاح');
      }
      navigate('/inventory/permissions');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'حدث خطأ أثناء الحفظ');
    }
  };

  const grandTotal = useMemo(() => {
    if (direction !== 'add') return 0;
    return (itemsArray || []).reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0);
  }, [itemsArray, direction]);

  if (isEdit && isLoadingEdit) {
     return <div className="p-20 text-center">جاري تحميل بيانات الإذن...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {isEdit ? <Edit3 className="h-6 w-6 text-blue-500" /> : <Package className="h-6 w-6 text-primary" />}
            {isEdit ? 'تعديل الإذن' : (direction === 'add' ? 'إنشاء إذن إضافة' : 'إنشاء إذن صرف')}
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
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                {currentTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input type="date" {...register('date')} />
            </div>

            {/* Warehouse depends on direction: Show only for Add */}
            {direction === 'add' && (
              <div className="space-y-2">
                <Label>المستودع (المصدر)</Label>
                <select 
                  {...register('warehouse_id')} 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">-- اختر المستودع --</option>
                  {warhouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
                {errors.warehouse_id && <p className="text-xs text-red-500">{errors.warehouse_id.message}</p>}
              </div>
            )}

            {(direction === 'dispense' || type === 'ارتجاع' || type === 'إضافة محولة') && (
              <div className="space-y-2">
                <Label>المشروع</Label>
                <select 
                  {...register('project_id')} 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="">-- اختر المشروع --</option>
                  {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}

            {direction === 'dispense' && (
              <>
                 <div className="space-y-2">
                   <Label>نوع جهة الصرف (المستلم)</Label>
                   <select 
                     {...register('target_type', {
                        onChange: () => {
                           setValue('employee_id', null as any);
                           setValue('target_warehouse_id', null as any);
                        }
                     })} 
                     className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                   >
                     <option value="">-- غير محدد --</option>
                     <option value="contractor">مقاول</option>
                     <option value="warehouse">مستودع (تحويل)</option>
                   </select>
                 </div>

                 {targetType === 'contractor' && (
                    <div className="space-y-2">
                      <Label className="text-red-500">* المقاول (الجهة المستلمة)</Label>
                      <select 
                        {...register('employee_id')} 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background border-red-200 focus:border-red-500"
                      >
                        <option value="">-- اختر المقاول --</option>
                        {employees.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                      {errors.employee_id && <p className="text-xs text-red-600 font-bold">{errors.employee_id.message as string}</p>}
                    </div>
                 )}

                 {targetType === 'warehouse' && (
                    <div className="space-y-2">
                      <Label className="text-blue-500">* المستودع الهدف (الجهة المستلمة)</Label>
                      <select 
                        {...register('target_warehouse_id')} 
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background border-blue-200 focus:border-blue-500"
                      >
                        <option value="">-- اختر المستودع الهدف --</option>
                        {warhouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      {errors.target_warehouse_id && <p className="text-xs text-red-600 font-bold">{errors.target_warehouse_id.message as string}</p>}
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

            {direction === 'dispense' && (
              <>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> رقم السيارة</Label>
                  <Input {...register('vehicle_number')} placeholder="رقم السيارة..." />
                </div>
                <div className="space-y-2">
                  <Label>اسم السائق</Label>
                  <Input {...register('driver_name')} placeholder="اسم السائق..." />
                </div>
              </>
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
            <Button type="button" variant="outline" size="sm" onClick={() => append({ item_id: null, item_code: '', item_name: '', unit: '', quantity: 1, price: 0, stock_quantity: 0, stock_error: '', notes: '' })} className="gap-1">
              <Plus className="h-4 w-4" /> إضافة صنف
            </Button>
          </div>
          
          {errors.items && <p className="text-xs text-red-500 font-bold">{errors.items.root?.message}</p>}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg bg-muted/20 relative space-y-3">
                
                {direction === 'add' && (
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="w-32 space-y-2">
                      <Label>كود الصنف</Label>
                      <Input {...register(`items.${index}.item_code` as const)} placeholder="الكود..." />
                    </div>

                    <div className="flex-1 min-w-[180px] space-y-2">
                      <Label>اسم الصنف *</Label>
                      <Input {...register(`items.${index}.item_name` as const)} placeholder="اسم الصنف..." />
                      {errors.items?.[index]?.item_name && <p className="text-[10px] text-red-500">{errors.items[index]?.item_name?.message}</p>}
                    </div>

                    <div className="w-24 space-y-2">
                      <Label>الوحدة *</Label>
                      <Input {...register(`items.${index}.unit` as const)} placeholder="حبة، طن..." />
                      {errors.items?.[index]?.unit && <p className="text-[10px] text-red-500">{errors.items[index]?.unit?.message}</p>}
                    </div>

                    <div className="w-24 space-y-2">
                      <Label>الكمية *</Label>
                      <Input type="number" step="any" {...register(`items.${index}.quantity` as const)} />
                      {errors.items?.[index]?.quantity && <p className="text-[10px] text-red-500">{errors.items[index]?.quantity?.message}</p>}
                    </div>

                    <div className="w-28 space-y-2">
                      <Label>سعر الوحدة</Label>
                      <Input type="number" step="any" {...register(`items.${index}.price` as const)} />
                    </div>

                    <div className="w-28 space-y-2">
                       <Label className="text-primary font-bold">الإجمالي</Label>
                       <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 text-sm font-bold text-primary">
                         {new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format((itemsArray?.[index]?.quantity || 0) * (itemsArray?.[index]?.price || 0))} 
                       </div>
                    </div>

                    <div className="flex-1 min-w-[140px] space-y-2">
                      <Label>ملاحظات</Label>
                      <Input {...register(`items.${index}.notes` as const)} placeholder="ملاحظات..." />
                    </div>

                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {direction === 'dispense' && (
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[250px] space-y-2">
                      <Label>الصنف</Label>
                      <ItemSelector
                        value={itemsArray[index]?.item_id || null}
                        onChange={(itemId, item) => {
                          if (item) {
                            setValue(`items.${index}.item_id` as any, itemId);
                            setValue(`items.${index}.item_code` as any, item.item_code || '');
                            setValue(`items.${index}.item_name` as any, item.name || '');
                            setValue(`items.${index}.unit` as any, item.unit || '');
                            setValue(`items.${index}.stock_quantity` as any, Number(item.quantity || 0));
                          }
                        }}
                        showStockValidation={true}
                        movementType="صادر"
                      />
                      {errors.items?.[index]?.item_name && <p className="text-[10px] text-red-500">{errors.items[index]?.item_name?.message}</p>}
                    </div>

                    <div className="w-28 space-y-2">
                      <Label>الوحدة</Label>
                      <Input {...register(`items.${index}.unit` as const)} placeholder="حبة، طن..." />
                      {errors.items?.[index]?.unit && <p className="text-[10px] text-red-500">{errors.items[index]?.unit?.message}</p>}
                    </div>

                    <div className="w-28 space-y-2">
                      <Label>الكمية</Label>
                      <Input type="number" step="any" {...register(`items.${index}.quantity` as const)} />
                      {errors.items?.[index]?.quantity && <p className="text-[10px] text-red-500">{errors.items[index]?.quantity?.message}</p>}
                    </div>

                    <div className="flex-1 min-w-[160px] space-y-2">
                      <Label>ملاحظات</Label>
                      <Input {...register(`items.${index}.notes` as const)} placeholder="ملاحظات..." />
                    </div>

                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}

              </div>
            ))}
          </div>

          {direction === 'add' && itemsArray && itemsArray.length > 0 && (
            <div className="flex justify-end items-center gap-4 pt-4 border-t">
              <span className="text-base font-bold text-foreground">الإجمالي الكلي:</span>
              <span className="text-xl font-black text-primary bg-primary/5 border border-primary/20 rounded-lg px-6 py-2">
                {new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(grandTotal)} ج.م
              </span>
            </div>
          )}
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
            {isEdit ? 'تحديث الإذن' : 'حفظ واعتماد'}
          </Button>
        </div>

      </form>
    </div>
  );
}
