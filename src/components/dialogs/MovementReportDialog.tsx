import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { inventoryMovementsApi } from "@/api/client";

interface MovementReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: any;
}

export default function MovementReportDialog({ open, onOpenChange, item }: MovementReportDialogProps) {
  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["inventory-movements", item?.id],
    queryFn: () => inventoryMovementsApi.list({ item_id: item?.id }).then(r => r.data),
    enabled: !!item?.id && open,
  });

  const generatePDF = () => {
    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const rows = movements.map((m: any, i: number) =>
      `<tr>
        <td>${i + 1}</td>
        <td>${m.movement_date || "–"}</td>
        <td style="color:${m.type === "وارد" ? "#16a34a" : "#dc2626"};font-weight:bold">${m.type}</td>
        <td>${Number(m.quantity).toLocaleString("ar-SA")} ${m.unit || ""}</td>
        <td>${m.source_location || "–"}</td>
        <td>${m.issued_by || "–"}</td>
        <td>${m.project_name || "–"}</td>
        <td>${m.contractor_name || "–"}</td>
        <td>${m.user_name || "–"}</td>
        <td>${m.notes || "–"}</td>
      </tr>`
    ).join("");

    const totalIn = movements.filter((m: any) => m.type === "وارد").reduce((s: number, m: any) => s + Number(m.quantity), 0);
    const totalOut = movements.filter((m: any) => m.type === "صادر").reduce((s: number, m: any) => s + Number(m.quantity), 0);

    printWin.document.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8"/>
  <title>تقرير حركة المخزون - ${item?.name}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Tajawal', sans-serif; padding: 30px; color: #1a1a2e; background: #fff; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #0d1b3e; padding-bottom: 20px; }
    .header h1 { font-size: 22px; color: #0d1b3e; font-weight: 800; }
    .header p { color: #666; font-size: 13px; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .info-box { background: #f8f9fa; padding: 12px; border-radius: 8px; border: 1px solid #e9ecef; }
    .info-box label { display: block; font-size: 11px; color: #888; margin-bottom: 2px; }
    .info-box span { font-size: 14px; font-weight: 700; color: #0d1b3e; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th { background: #0d1b3e; color: #fff; padding: 10px 12px; font-size: 12px; text-align: right; }
    td { padding: 9px 12px; font-size: 12px; border-bottom: 1px solid #e9ecef; }
    tr:hover td { background: #f4f6f9; }
    .summary { display: flex; gap: 20px; margin-top: 20px; }
    .summary-box { flex: 1; padding: 12px; border-radius: 8px; text-align: center; }
    .summary-box.in { background: #dcfce7; color: #166534; }
    .summary-box.out { background: #fee2e2; color: #991b1b; }
    .summary-box.balance { background: #dbeafe; color: #1e3a5f; }
    .summary-box span { display: block; font-size: 18px; font-weight: 800; }
    .summary-box label { font-size: 11px; }
    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #e9ecef; padding-top: 10px; }
    @media print { body { padding: 15px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>تقرير حركة المخزون</h1>
    <p>تاريخ التقرير: ${new Date().toLocaleDateString("ar-SA")}</p>
  </div>
  <div class="info-grid">
    <div class="info-box"><label>كود الصنف</label><span>${item?.item_code || "–"}</span></div>
    <div class="info-box"><label>اسم الصنف</label><span>${item?.name}</span></div>
    <div class="info-box"><label>الفئة</label><span>${item?.category}</span></div>
    <div class="info-box"><label>الرصيد الحالي</label><span>${Number(item?.quantity).toLocaleString("ar-SA")} ${item?.unit}</span></div>
  </div>
  <div class="summary">
    <div class="summary-box in"><span>${totalIn.toLocaleString("ar-SA")}</span><label>إجمالي الوارد</label></div>
    <div class="summary-box out"><span>${totalOut.toLocaleString("ar-SA")}</span><label>إجمالي الصادر</label></div>
    <div class="summary-box balance"><span>${Number(item?.quantity).toLocaleString("ar-SA")}</span><label>الرصيد الحالي</label></div>
  </div>
  <table>
    <thead><tr>
      <th>#</th><th>التاريخ</th><th>النوع</th><th>الكمية</th><th>الموقع المصدر</th><th>المسؤول</th><th>المشروع</th><th>المقاول</th><th>بواسطة</th><th>ملاحظات</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="10" style="text-align:center;padding:20px;color:#999">لا توجد حركات مسجلة</td></tr>'}</tbody>
  </table>
  <div class="footer">نظام إدارة المقاولات — تقرير تلقائي</div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
    printWin.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>تقرير حركة: {item?.name}</span>
            <Button size="sm" className="gap-1.5" onClick={generatePDF}>
              <FileDown className="h-4 w-4" /> طباعة / PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Item Info */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: "كود الصنف", value: item?.item_code || "–" },
            { label: "الفئة", value: item?.category },
            { label: "الرصيد الحالي", value: `${Number(item?.quantity).toLocaleString("ar-SA")} ${item?.unit}` },
            { label: "سعر الوحدة", value: `${Number(item?.unit_price).toLocaleString("ar-SA")} ر.س` },
          ].map(i => (
            <div key={i.label} className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] text-muted-foreground">{i.label}</p>
              <p className="text-xs font-bold text-foreground mt-0.5">{i.value}</p>
            </div>
          ))}
        </div>

        {/* Movements Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-6 w-6 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["التاريخ", "النوع", "الكمية", "الموقع المصدر", "المسؤول", "المشروع", "المقاول", "بواسطة", "ملاحظات"].map(h => (
                    <th key={h} className="text-right py-2.5 px-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8 text-sm text-muted-foreground">لا توجد حركات مسجلة لهذا الصنف</td></tr>
                ) : movements.map((m: any) => (
                  <tr key={m.id} className="border-b border-border/50 last:border-0">
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{m.movement_date}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${m.type === "وارد" ? "badge-success" : "badge-danger"}`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-bold">{Number(m.quantity).toLocaleString("ar-SA")}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{m.source_location || "–"}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{m.issued_by || "–"}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{m.project_name || "–"}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{m.contractor_name || "–"}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{m.user_name || "–"}</td>
                    <td className="py-2.5 px-3 text-xs text-muted-foreground">{m.notes || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
