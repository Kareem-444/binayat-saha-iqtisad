import { useState } from "react";
import { Plus, Search, Filter, Download, TrendingUp, TrendingDown, MapPin, Calendar, DollarSign, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projects } from "@/data/mockData";

const statusColors: Record<string, string> = {
  "نشط": "badge-success",
  "مكتمل": "badge-neutral",
  "يكاد يكتمل": "badge-info",
  "متوقف": "badge-danger",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("ar-SA", { maximumFractionDigits: 0 }).format(v) + " ر.س";

export default function Projects() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("الكل");

  const statuses = ["الكل", "نشط", "يكاد يكتمل", "مكتمل"];

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.includes(search) || p.client.includes(search) || p.location.includes(search);
    const matchFilter = filter === "الكل" || p.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المشاريع", value: projects.length, color: "bg-blue-100 text-blue-700" },
          { label: "مشاريع نشطة", value: projects.filter(p => p.status === "نشط").length, color: "bg-green-100 text-green-700" },
          { label: "إجمالي الميزانيات", value: formatCurrency(projects.reduce((s, p) => s + p.budget, 0)), color: "bg-amber-100 text-amber-700" },
          { label: "إجمالي الإنفاق", value: formatCurrency(projects.reduce((s, p) => s + p.spent, 0)), color: "bg-purple-100 text-purple-700" },
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
          <Input
            placeholder="بحث في المشاريع..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                filter === s
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button className="gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" /> مشروع جديد
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((p) => {
          const progressColor = p.progress >= 90 ? "#22c55e" : p.progress >= 50 ? "hsl(221 83% 28%)" : "hsl(38 96% 48%)";
          const budgetUsed = (p.spent / p.budget) * 100;
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 card-hover cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground text-sm leading-snug">{p.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-xs text-muted-foreground">{p.location}</p>
                  </div>
                </div>
                <span className={`flex-shrink-0 mr-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${statusColors[p.status] || "badge-neutral"}`}>
                  {p.status}
                </span>
              </div>

              <div className="space-y-2.5 mb-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>{p.client}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{p.startDate} — {p.endDate}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>م. {p.manager}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">نسبة الإنجاز</span>
                  <span className="text-xs font-bold" style={{ color: progressColor }}>{p.progress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: progressColor }} />
                </div>
              </div>

              {/* Budget */}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">الميزانية المستهلكة</span>
                  <span className={`text-xs font-bold ${budgetUsed > 90 ? "text-red-500" : "text-foreground"}`}>{budgetUsed.toFixed(0)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{formatCurrency(p.spent)}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(p.budget)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
