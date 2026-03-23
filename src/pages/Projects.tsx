import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, MapPin, Calendar, User, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectsApi } from "@/api/client";
import ProjectDialog from "@/components/dialogs/ProjectDialog";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const statuses = ["الكل", "نشط", "يكاد يكتمل", "مكتمل"];

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["projects", search, filter],
    queryFn: () => projectsApi.list({ search: search || undefined, status: filter !== "الكل" ? filter : undefined }).then(r => r.data),
  });

  const openEdit = (item: any) => { setEditItem(item); setDialogOpen(true); };
  const openAdd = () => { setEditItem(null); setDialogOpen(true); };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي المشاريع", value: projects.length },
          { label: "مشاريع نشطة", value: projects.filter((p: any) => p.status === "نشط").length },
          { label: "إجمالي الميزانيات", value: formatCurrency(projects.reduce((s: number, p: any) => s + Number(p.budget), 0)) },
          { label: "إجمالي الإنفاق", value: formatCurrency(projects.reduce((s: number, p: any) => s + Number(p.spent), 0)) },
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
          <Input placeholder="بحث في المشاريع..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                filter === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <Button className="gap-2 flex-shrink-0" onClick={openAdd}>
          <Plus className="h-4 w-4" /> مشروع جديد
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p: any) => {
          const progressColor = p.progress >= 90 ? "#22c55e" : p.progress >= 50 ? "hsl(221 83% 28%)" : "hsl(38 96% 48%)";
          const budgetUsed = Number(p.budget) > 0 ? (Number(p.spent) / Number(p.budget)) * 100 : 0;
          return (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5 card-hover">
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
                  <span>{p.start_date} — {p.end_date}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>م. {p.manager_name}</span>
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
                  <span className="text-muted-foreground">{formatCurrency(Number(p.spent))}</span>
                  <span className="font-semibold text-foreground">{formatCurrency(Number(p.budget))}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                <Button size="sm" variant="outline" className="flex-1 h-7 text-xs gap-1" onClick={() => openEdit(p)}>
                  <Edit className="h-3 w-3" /> تعديل
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-red-500 hover:text-red-600" onClick={() => setDeleteItem(p)}>
                  <Trash2 className="h-3 w-3" /> حذف
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialogs */}
      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />
      <DeleteConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="حذف المشروع"
        description={`هل تريد حذف "${deleteItem?.name}"؟`}
        deleteFn={() => projectsApi.delete(deleteItem?.id)}
        queryKey={["projects"]}
      />
    </div>
  );
}
