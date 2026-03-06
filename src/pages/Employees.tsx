import { useState } from "react";
import { Plus, Search, Phone, Briefcase, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { employees } from "@/data/mockData";

const statusColors: Record<string, string> = {
  "نشط": "badge-success",
  "إجازة": "badge-warning",
  "منتهي العقد": "badge-neutral",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(v) + " ر.س";

export default function Employees() {
  const [search, setSearch] = useState("");

  const filtered = employees.filter(
    (e) => e.name.includes(search) || e.role.includes(search) || e.department.includes(search)
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الموظفين", value: employees.length },
          { label: "موظفون نشطون", value: employees.filter((e) => e.status === "نشط").length },
          { label: "في إجازة", value: employees.filter((e) => e.status === "إجازة").length },
          {
            label: "إجمالي الرواتب",
            value: formatCurrency(employees.filter((e) => e.salaryType === "شهري").reduce((s, e) => s + e.salary, 0)),
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-lg font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في الموظفين..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <Button className="gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" /> موظف جديد
        </Button>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((emp) => {
          const initials = emp.name.split(" ").slice(0, 2).map((n) => n[0]).join("");
          const colors = ["bg-blue-100 text-blue-700", "bg-green-100 text-green-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-red-100 text-red-700", "bg-teal-100 text-teal-700"];
          const color = colors[emp.id % colors.length];
          return (
            <div key={emp.id} className="rounded-xl border border-border bg-card p-5 card-hover">
              <div className="flex items-start gap-3 mb-4">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${color}`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate">{emp.name}</h3>
                  <p className="text-xs text-muted-foreground">{emp.role}</p>
                </div>
                <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusColors[emp.status] || "badge-neutral"}`}>
                  {emp.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-3 w-3" />
                  <span>{emp.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3" />
                  <span dir="ltr">{emp.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3" />
                  <span>{formatCurrency(emp.salary)} / {emp.salaryType}</span>
                </div>
              </div>

              {emp.project && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-[10px] text-muted-foreground">مشروع حالي:</p>
                  <p className="text-xs font-semibold text-primary mt-0.5">{emp.project}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
