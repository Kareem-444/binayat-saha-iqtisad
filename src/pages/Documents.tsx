import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Search, Eye, Download, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { documentsApi } from "@/api/client";
import { useToast } from "@/hooks/use-toast";
import DeleteConfirmDialog from "@/components/dialogs/DeleteConfirmDialog";

const typeColors: Record<string, string> = {
  "عقد": "badge-info",
  "مخطط هندسي": "badge-neutral",
  "فاتورة": "badge-success",
  "تقرير": "badge-warning",
  "صور": "badge-neutral",
  "جدول": "badge-neutral",
  "تصريح": "badge-info",
  "عام": "badge-neutral",
};

const extIcons: Record<string, string> = {
  pdf: "🔴", dwg: "🔵", xlsx: "🟢", zip: "🟡", doc: "🔵", docx: "🔵", png: "🟣", jpg: "🟣",
};

export default function Documents() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("الكل");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const types = ["الكل", "عقد", "مخطط هندسي", "فاتورة", "تقرير", "تصريح", "عام"];

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", search, type],
    queryFn: () => documentsApi.list({ search: search || undefined, category: type !== "الكل" ? type : undefined }).then(r => r.data),
  });

  const [uploadForm, setUploadForm] = useState<{
    file: File | null;
    title: string; category: string; description: string;
  }>({
    file: null, title: "", category: "عام", description: "",
  });

  const uploadMutation = useMutation({
    mutationFn: (data: any) => documentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast({ title: "تم رفع الملف بنجاح" });
      setUploadOpen(false);
      setUploadForm({ file: null, title: "", category: "عام", description: "" });
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop() || "";
      setUploadForm(prev => ({
        ...prev,
        file,
        title: prev.title || file.name.replace(`.${ext}`, ""),
      }));
    }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.file) {
      toast({ title: "الرجاء اختيار ملف", variant: "destructive" });
      return;
    }
    const formData = new FormData();
    formData.append("file", uploadForm.file);
    formData.append("title", uploadForm.title);
    formData.append("category", uploadForm.category);
    formData.append("description", uploadForm.description);
    
    uploadMutation.mutate(formData);
  };

  const filtered = documents;

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
          { label: "إجمالي الملفات", value: `${documents.length} ملف` },
          { label: "العقود", value: `${documents.filter((d: any) => d.category === "عقد").length} عقود` },
          { label: "التقارير", value: `${documents.filter((d: any) => d.category === "تقرير").length} تقارير` },
          { label: "الفواتير", value: `${documents.filter((d: any) => d.category === "فاتورة").length} فواتير` },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className="text-base font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="بحث في المستندات..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all ${type === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <Button className="gap-2 flex-shrink-0" onClick={() => setUploadOpen(true)}>
          <Upload className="h-4 w-4" /> رفع ملف
        </Button>
      </div>

      {/* Drop Zone */}
      <div
        className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => { setUploadOpen(true); }}
      >
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">اضغط هنا لرفع ملف جديد</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DWG, XLSX, ZIP حتى 50 ميجابايت</p>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["اسم الملف", "النوع", "الحجم", "التاريخ", "الوصف", "الإجراءات"].map((h) => (
                  <th key={h} className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc: any) => (
                <tr key={doc.id} className="border-b border-border/50 table-row-hover last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{extIcons[doc.file_type] || "📄"}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground">{doc.title || doc.file_name}</p>
                        <p className="text-[10px] text-muted-foreground">{doc.file_name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${typeColors[doc.category] || "badge-neutral"}`}>
                      {doc.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {doc.file_size ? `${(doc.file_size / 1048576).toFixed(1)} MB` : "–"}
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{doc.created_at?.split("T")[0]}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-[150px]">{doc.description || "–"}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      {doc.file_path && (
                        <button
                          onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${doc.file_path}`, '_blank')}
                          className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted transition-colors"
                          title="استعراض / تحميل"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                        </button>
                      )}
                      <button onClick={() => setDeleteDoc(doc)} className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted transition-colors" title="حذف">
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>رفع ملف جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>اختر الملف</Label>
              <Input ref={fileInputRef} type="file" onChange={handleFileSelect} accept=".pdf,.dwg,.xlsx,.xls,.zip,.doc,.docx,.png,.jpg,.jpeg" />
            </div>
            <div className="space-y-2">
              <Label>عنوان الملف *</Label>
              <Input required value={uploadForm.title} onChange={e => setUploadForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select value={uploadForm.category} onValueChange={v => setUploadForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["عام", "عقد", "مخطط هندسي", "فاتورة", "تقرير", "تصريح"].map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={uploadForm.description} onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))} rows={2} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={uploadMutation.isPending}>
                {uploadMutation.isPending ? "جاري الرفع..." : "رفع الملف"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={!!deleteDoc}
        onOpenChange={(open) => !open && setDeleteDoc(null)}
        title="حذف الملف"
        description={`هل تريد حذف "${deleteDoc?.title || deleteDoc?.file_name}"؟`}
        deleteFn={() => documentsApi.delete(deleteDoc?.id)}
        queryKey={["documents"]}
      />
    </div>
  );
}
