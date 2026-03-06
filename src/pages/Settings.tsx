import { Shield, Users, Building, Bell, Database, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const roles = [
  { name: "مدير النظام", description: "صلاحيات كاملة لجميع الوحدات", users: 1, color: "bg-red-100 text-red-700" },
  { name: "مدير مشروع", description: "إدارة المشاريع والموظفين والتقارير", users: 3, color: "bg-blue-100 text-blue-700" },
  { name: "محاسب", description: "الوصول إلى الوحدة المالية والفواتير", users: 2, color: "bg-green-100 text-green-700" },
  { name: "مهندس موقع", description: "عرض المشاريع وإدارة المعدات والمخزون", users: 4, color: "bg-purple-100 text-purple-700" },
  { name: "أمين مخزن", description: "إدارة المخزون والمستودعات فقط", users: 2, color: "bg-amber-100 text-amber-700" },
];

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Company Info */}
        <div className="rounded-xl border border-border bg-card p-5 card-shadow">
          <div className="flex items-center gap-2 mb-4">
            <Building className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">معلومات الشركة</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: "اسم الشركة", value: "شركة البناء الذهبي للمقاولات" },
              { label: "رقم السجل التجاري", value: "1010123456" },
              { label: "رقم الجوال", value: "+966 11 234 5678" },
              { label: "البريد الإلكتروني", value: "info@golden-build.sa" },
              { label: "المدينة", value: "الرياض، المملكة العربية السعودية" },
            ].map((field) => (
              <div key={field.label} className="flex flex-col gap-0.5">
                <label className="text-xs text-muted-foreground">{field.label}</label>
                <div className="rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground">{field.value}</div>
              </div>
            ))}
          </div>
          <Button className="w-full mt-4" variant="outline" size="sm">تعديل معلومات الشركة</Button>
        </div>

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

      {/* Roles Table */}
      <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">إدارة الأدوار والصلاحيات</h3>
        </div>
        <div className="p-5 space-y-3">
          {roles.map((role) => (
            <div key={role.name} className="flex items-center gap-3 rounded-xl border border-border p-4">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${role.color} flex-shrink-0`}>
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">{role.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground">{role.users}</p>
                  <p className="text-[10px] text-muted-foreground">مستخدم</p>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs">تعديل</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
