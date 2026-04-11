import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Shield, Users, Building, Bell, Pencil, Check, X,
  Plus, Trash2, UserCheck, UserX, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { settingsApi, usersApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  admin: "مدير النظام",
  manager: "مدير مشروع",
  viewer: "مشاهد",
};
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-blue-100 text-blue-700",
  viewer: "bg-gray-100 text-gray-600",
};

const COMPANY_FIELDS = [
  { key: "company_name", label: "اسم الشركة" },
  { key: "phone", label: "رقم الجوال" },
  { key: "email", label: "البريد الإلكتروني" },
  { key: "address", label: "العنوان" },
  { key: "cr_number", label: "رقم السجل التجاري" },
];

// ─── Company Info Section ────────────────────────────────────────────────────
function CompanyInfoSection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const { data: company = {}, isLoading } = useQuery({
    queryKey: ["company-settings"],
    queryFn: () => settingsApi.getCompany().then(r => r.data),
  });

  useEffect(() => {
    if (company && !editMode) setForm(company as Record<string, string>);
  }, [company]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => settingsApi.updateCompany(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-settings"] });
      toast({ title: "تم حفظ معلومات الشركة بنجاح ✅" });
      setEditMode(false);
    },
    onError: () => toast({ title: "حدث خطأ أثناء الحفظ", variant: "destructive" }),
  });

  const handleEdit = () => {
    setForm({ ...company });
    setEditMode(true);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 card-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">معلومات الشركة</h3>
        </div>
        {!editMode ? (
          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={handleEdit}>
            <Pencil className="h-3 w-3" /> تعديل
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs text-red-600" onClick={() => setEditMode(false)}>
              <X className="h-3 w-3" /> إلغاء
            </Button>
            <Button size="sm" className="h-7 gap-1.5 text-xs" disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate(form)}>
              <Check className="h-3 w-3" /> {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-6">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {COMPANY_FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-0.5">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              {editMode ? (
                <Input
                  value={form[f.key] || ""}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="h-8 text-sm"
                  dir="rtl"
                />
              ) : (
                <div className="rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground min-h-[34px]">
                  {(company as any)[f.key] || <span className="text-muted-foreground italic text-xs">غير محدد</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Users Section ────────────────────────────────────────────────────────────
function UsersSection() {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ full_name: "", email: "", password: "", role: "viewer", phone: "" });

  const { data: users = [], isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersApi.list().then(r => r.data),
    enabled: isAdmin,
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "تم تحديث الدور بنجاح ✅" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "تم إنشاء المستخدم بنجاح ✅" });
      setCreateOpen(false);
      setNewUser({ full_name: "", email: "", password: "", role: "viewer", phone: "" });
    },
    onError: (err: any) => toast({
      title: err.response?.data?.error || "حدث خطأ",
      variant: "destructive",
    }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => usersApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "تم تعطيل المستخدم" });
    },
    onError: (err: any) => toast({
      title: err.response?.data?.error || "حدث خطأ",
      variant: "destructive",
    }),
  });

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 card-shadow text-center text-sm text-muted-foreground py-10">
        هذا القسم متاح للمسؤولين فقط
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">إدارة المستخدمين والصلاحيات</h3>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7" onClick={() => refetch()}>
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> مستخدم جديد
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="divide-y divide-border">
          {users.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">لا توجد مستخدمون</p>
          )}
          {users.map((u: any) => (
            <div key={u.id} className={`flex items-center gap-3 px-5 py-3 ${!u.is_active ? "opacity-50" : ""}`}>
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${ROLE_COLORS[u.role] || "bg-gray-100 text-gray-600"}`}>
                {u.full_name?.[0] || "م"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {u.full_name}
                  {!u.is_active && <span className="mr-2 text-xs text-red-500">(معطّل)</span>}
                  {u.id === currentUser?.id && <span className="mr-2 text-xs text-primary">(أنت)</span>}
                </p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <Select
                value={u.role}
                disabled={u.id === currentUser?.id || !u.is_active}
                onValueChange={(role) => updateRoleMutation.mutate({ id: u.id, role })}
              >
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="manager">مدير مشروع</SelectItem>
                  <SelectItem value="viewer">مشاهد</SelectItem>
                </SelectContent>
              </Select>
              {u.id !== currentUser?.id && u.is_active && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                  title="تعطيل المستخدم"
                  onClick={() => deactivateMutation.mutate(u.id)}
                >
                  <UserX className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create User Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm" dir="rtl">
          <DialogHeader>
            <DialogTitle>مستخدم جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {[
              { key: "full_name", label: "الاسم الكامل *", type: "text" },
              { key: "email", label: "البريد الإلكتروني *", type: "email" },
              { key: "password", label: "كلمة المرور *", type: "password" },
              { key: "phone", label: "رقم الجوال", type: "tel" },
            ].map((f) => (
              <div key={f.key} className="space-y-1">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  type={f.type}
                  value={(newUser as any)[f.key]}
                  onChange={e => setNewUser(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
            ))}
            <div className="space-y-1">
              <Label className="text-xs">الدور</Label>
              <Select value={newUser.role} onValueChange={v => setNewUser(prev => ({ ...prev, role: v }))}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">مدير النظام</SelectItem>
                  <SelectItem value="manager">مدير مشروع</SelectItem>
                  <SelectItem value="viewer">مشاهد</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>إلغاء</Button>
            <Button size="sm" disabled={createMutation.isPending}
              onClick={() => createMutation.mutate(newUser)}>
              {createMutation.isPending ? "جاري الإنشاء..." : "إنشاء المستخدم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Settings Page ────────────────────────────────────────────────────────
export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Company Info */}
        <CompanyInfoSection />

        {/* Notification Settings */}
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">إعدادات الإشعارات</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "تنبيهات المخزون المنخفض", desc: "إشعار عند وصول المخزون للحد الأدنى", enabled: true },
              { label: "صيانة المعدات", desc: "تذكير بمواعيد الصيانة الدورية", enabled: true },
              { label: "اعتماد طلبات الشراء", desc: "إشعار عند تقديم طلب شراء جديد", enabled: true },
              { label: "الفواتير المتأخرة", desc: "تنبيه عند تجاوز تاريخ استحقاق الفاتورة", enabled: true },
              { label: "تقدم المشاريع", desc: "تقرير أسبوعي عن تقدم المشاريع", enabled: false },
            ].map((setting) => (
              <div key={setting.label} className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{setting.label}</p>
                  <p className="text-[10px] text-muted-foreground">{setting.desc}</p>
                </div>
                <Switch defaultChecked={setting.enabled} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users & Roles */}
      <UsersSection />
    </div>
  );
}
