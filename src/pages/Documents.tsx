import { useState } from "react";
import { Upload, Search, FileText, File, Image, Download, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const documents = [
  { id: 1, name: "عقد مشروع برج الرياض.pdf", type: "عقد", project: "برج سكني الرياض", size: "2.4 MB", date: "2024-01-15", uploadedBy: "أحمد الشمري", ext: "pdf" },
  { id: 2, name: "مخططات الطابق الأرضي.dwg", type: "مخطط هندسي", project: "برج سكني الرياض", size: "15.8 MB", date: "2024-01-20", uploadedBy: "عبدالله الزهراني", ext: "dwg" },
  { id: 3, name: "فاتورة مواد نوفمبر.pdf", type: "فاتورة", project: "مجمع تجاري جدة", size: "0.8 MB", date: "2024-11-01", uploadedBy: "فاطمة الراشد", ext: "pdf" },
  { id: 4, name: "تقرير فحص السلامة.pdf", type: "تقرير", project: "طريق صناعي المدينة", size: "3.2 MB", date: "2024-10-25", uploadedBy: "خالد العتيبي", ext: "pdf" },
  { id: 5, name: "صور موقع العمل.zip", type: "صور", project: "برج سكني الرياض", size: "45.0 MB", date: "2024-11-10", uploadedBy: "سلطان الدوسري", ext: "zip" },
  { id: 6, name: "جدول أعمال الصيانة.xlsx", type: "جدول", project: "فيلا فاخرة الدمام", size: "0.5 MB", date: "2024-09-30", uploadedBy: "فيصل الغامدي", ext: "xlsx" },
  { id: 7, name: "عقد المورد - شركة الخليج.pdf", type: "عقد", project: "–", size: "1.1 MB", date: "2024-03-01", uploadedBy: "محمد القحطاني", ext: "pdf" },
  { id: 8, name: "موافقة البلدية.pdf", type: "تصريح", project: "مجمع تجاري جدة", size: "0.3 MB", date: "2024-02-28", uploadedBy: "أحمد الشمري", ext: "pdf" },
];

const typeColors: Record<string, string> = {
  "عقد": "badge-info",
  "مخطط هندسي": "badge-neutral",
  "فاتورة": "badge-success",
  "تقرير": "badge-warning",
  "صور": "badge-neutral",
  "جدول": "badge-neutral",
  "تصريح": "badge-info",
};

const extIcons: Record<string, string> = {
  pdf: "🔴",
  dwg: "🔵",
  xlsx: "🟢",
  zip: "🟡",
};

export default function Documents() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("الكل");

  const types = ["الكل", "عقد", "مخطط هندسي", "فاتورة", "تقرير", "تصريح"];

  const filtered = documents.filter((d) => {
    const matchSearch = d.name.includes(search) || d.project.includes(search) || d.uploadedBy.includes(search);
    const matchType = type === "الكل" || d.type === type;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "إجمالي الملفات", value: `${documents.length} ملف` },
          { label: "العقود", value: `${documents.filter(d => d.type === "عقد").length} عقود` },
          { label: "المخططات الهندسية", value: `${documents.filter(d => d.type === "مخطط هندسي").length} مخططات` },
          { label: "حجم التخزين", value: "68.1 MB" },
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
        <Button className="gap-2 flex-shrink-0">
          <Upload className="h-4 w-4" /> رفع ملف
        </Button>
      </div>

      {/* Drop Zone */}
      <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm font-medium text-foreground">اسحب الملفات هنا أو انقر للرفع</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DWG, XLSX, ZIP حتى 50 ميجابايت</p>
      </div>

      {/* Documents Table */}
      <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["اسم الملف", "النوع", "المشروع", "الحجم", "التاريخ", "رُفع بواسطة", "الإجراءات"].map((h) => (
                  <th key={h} className="text-right py-2.5 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr key={doc.id} className="border-b border-border/50 table-row-hover last:border-0">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{extIcons[doc.ext] || "📄"}</span>
                      <p className="text-xs font-medium text-foreground">{doc.name}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${typeColors[doc.type] || "badge-neutral"}`}>
                      {doc.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{doc.project}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{doc.size}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{doc.date}</td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">{doc.uploadedBy}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted transition-colors">
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted transition-colors">
                        <Download className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
