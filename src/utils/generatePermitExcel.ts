import ExcelJS from "exceljs";

// ===== Color Constants =====
const NAVY = "0D2B6E";
const LIGHT_BLUE = "EEF2FB";
const WHITE = "FFFFFF";
const BLACK = "000000";
const GOLD = "C9A84C";

// ===== Column widths (characters) =====
const COL_WIDTHS = [
  { col: 1, width: 1.5 },
  { col: 2, width: 6 },
  { col: 3, width: 14 },
  { col: 4, width: 5 },
  { col: 5, width: 5 },
  { col: 6, width: 7 },
  { col: 7, width: 7 },
  { col: 8, width: 7 },
  { col: 9, width: 12 },
  { col: 10, width: 1.5 },
];

function nb() {
  return {
    top: { style: "thin" as const, color: { argb: NAVY } },
    left: { style: "thin" as const, color: { argb: NAVY } },
    bottom: { style: "thin" as const, color: { argb: NAVY } },
    right: { style: "thin" as const, color: { argb: NAVY } },
  };
}

function wb() {
  return {
    top: { style: "thin" as const, color: { argb: WHITE } },
    left: { style: "thin" as const, color: { argb: WHITE } },
    bottom: { style: "thin" as const, color: { argb: WHITE } },
    right: { style: "thin" as const, color: { argb: WHITE } },
  };
}

// ===== Apply style to cell =====
function style(cell: ExcelJS.Cell, opts: {
  font?: Partial<ExcelJS.Font>;
  fill?: string;
  border?: ExcelJS.Borders;
  alignment?: Partial<ExcelJS.Alignment>;
}) {
  if (opts.font) cell.font = { name: "Arial", size: 11, ...opts.font };
  if (opts.fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opts.fill }, bgColor: { argb: opts.fill } };
  if (opts.border) cell.border = opts.border;
  if (opts.alignment) cell.alignment = { vertical: "middle", ...opts.alignment };
}

// ===== Get logo as base64 (browser-compatible) =====
async function getLogoBase64(): Promise<{ base64: string; extension: string } | null> {
  const paths = ["/Watford_FC.svg.png", "/logo.png", "/logo.jpeg"];
  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (!res.ok) continue;
      const blob = await res.blob();
      const b64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });
      const ext = p.endsWith(".png") ? "png" : "jpeg";
      return { base64: b64, extension: ext };
    } catch {
      // continue
    }
  }
  return null;
}

// ===== Main function =====
export async function generatePermitExcel(permitData: any): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const isAdd = permitData.direction === "add";
  const ws = workbook.addWorksheet(isAdd ? "إذن إضافة" : "إذن صرف", {
    views: [{ rightToLeft: true, showGridLines: false }],
  });

  // RTL, no gridlines
  ws.properties.rightToLeft = true;
  ws.properties.showGridLines = false;
  ws.pageSetup.orientation = "portrait";
  ws.pageSetup.paperSize = 9;
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 1;
  ws.pageSetup.margins = { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };

  COL_WIDTHS.forEach((c) => { ws.getColumn(c.col).width = c.width; });

  // Row heights
  ws.getRow(1).height = 10;
  ws.getRow(2).height = 38;
  ws.getRow(3).height = 18;
  ws.getRow(4).height = 22;
  ws.getRow(5).height = 22;
  ws.getRow(6).height = 22;
  ws.getRow(7).height = 22;
  ws.getRow(8).height = 22;
  ws.getRow(9).height = 20;
  for (let r = 10; r <= 24; r++) ws.getRow(r).height = 20;
  ws.getRow(25).height = 20;
  ws.getRow(26).height = 22;
  ws.getRow(27).height = 22;
  if (isAdd) {
    ws.getRow(28).height = 22;
    ws.getRow(29).height = 28;
    ws.getRow(30).height = 15;
  } else {
    ws.getRow(28).height = 22;
    ws.getRow(29).height = 28;
  }

  const border = nb();

  // ===== Embed Logo =====
  const logo = await getLogoBase64();
  let logoId: number | null = null;
  if (logo) {
    logoId = workbook.addImage({ base64: logo.base64, extension: logo.extension as "png" | "jpeg" });
  }

  // ===== ROW 2: Title (with line break) =====
  ws.mergeCells("B2:I2");
  const tc = ws.getCell("B2");
  tc.value = isAdd
    ? "مستند إضـافـة\n(مشتراه – محوّلة – ارتجاع)"
    : "مستند صـرف\n(داخلي – خارجي – تكهين – مقاولين)";
  style(tc, {
    font: { bold: true, size: 14, color: { argb: WHITE } },
    fill: NAVY,
    border,
    alignment: { horizontal: "center", vertical: "middle", wrapText: true },
  });

  // ===== ROW 3: SER + Company =====
  ws.mergeCells("B3:C3");
  const serCell = ws.getCell("B3");
  serCell.value = `SER: ${permitData.permission_number || "___________"}`;
  style(serCell, {
    font: { bold: true, size: 10, color: { argb: BLACK } },
    fill: LIGHT_BLUE,
    border,
    alignment: { horizontal: "right", vertical: "middle" },
  });

  ws.mergeCells("D3:F3");
  style(ws.getCell("D3"), {
    value: "شركة ديفكون للمقاولات",
    font: { bold: true, size: 12, color: { argb: NAVY } },
    fill: WHITE,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });

  ws.mergeCells("G3:I3");
  style(ws.getCell("G3"), {
    fill: WHITE,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });

  // Add logo image
  if (logoId !== null) {
    ws.addImage(logoId, {
      tl: { col: 6.5, row: 2.1 },
      ext: { width: 130, height: 35 },
    });
  }

  // ===== ROW 4: Date =====
  ws.mergeCells("B4:I4");
  const dateVal = permitData.date ? new Date(permitData.date).toLocaleDateString("ar-EG") : "____  /  ____  /  20____";
  style(ws.getCell("B4"), {
    value: `التاريخ:  ${dateVal}`,
    font: { bold: true, size: 11, color: { argb: BLACK } },
    fill: LIGHT_BLUE,
    border,
    alignment: { horizontal: "right", vertical: "middle" },
  });

  // ===== ROW 5: Project =====
  ws.mergeCells("B5:D5");
  style(ws.getCell("B5"), {
    value: "المشروع:",
    font: { bold: true, size: 11, color: { argb: BLACK } },
    fill: LIGHT_BLUE,
    border,
    alignment: { horizontal: "right", vertical: "middle" },
  });
  ws.mergeCells("E5:I5");
  style(ws.getCell("E5"), {
    value: permitData.project_name || "",
    fill: WHITE,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });

  // ===== ROW 6: Type + Warehouse =====
  ws.mergeCells("B6:C6");
  style(ws.getCell("B6"), {
    value: isAdd ? "نوع الاضافة:" : "نوع الصرف:",
    font: { bold: true, size: 11, color: { argb: BLACK } },
    fill: LIGHT_BLUE,
    border,
    alignment: { horizontal: "right", vertical: "middle" },
  });
  ws.mergeCells("D6:F6");
  style(ws.getCell("D6"), {
    value: permitData.type || "",
    fill: WHITE,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });
  ws.getCell("G6").value = "المخزن:";
  style(ws.getCell("G6"), {
    font: { bold: true, size: 11, color: { argb: BLACK } },
    fill: LIGHT_BLUE,
    border,
    alignment: { horizontal: "right", vertical: "middle" },
  });
  ws.mergeCells("H6:I6");
  style(ws.getCell("H6"), {
    value: permitData.warehouse_name || "",
    fill: WHITE,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });

  // ===== ROW 7: Supplier / Contractor =====
  ws.mergeCells("B7:C7");
  style(ws.getCell("B7"), {
    value: isAdd ? "اسم المورد:" : "اسم المقاول:",
    font: { bold: true, size: 11, color: { argb: BLACK } },
    fill: LIGHT_BLUE,
    border,
    alignment: { horizontal: "right", vertical: "middle" },
  });
  ws.mergeCells("D7:I7");
  // For dispense, try multiple possible field names from the API response
  const contractorVal = permitData.contractor_name || permitData.employee_name || permitData.dispatch_location || "";
  style(ws.getCell("D7"), {
    value: isAdd ? (permitData.supplier_name || "") : contractorVal,
    fill: WHITE,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });

  // ===== ROW 8: Vehicle + Driver =====
  ws.mergeCells("B8:C8");
  style(ws.getCell("B8"), {
    value: "رقم السياسة:",
    font: { bold: true, size: 11, color: { argb: BLACK } },
    fill: LIGHT_BLUE,
    border,
    alignment: { horizontal: "right", vertical: "middle" },
  });
  ws.mergeCells("D8:E8");
  style(ws.getCell("D8"), {
    value: permitData.vehicle_number || "",
    fill: WHITE,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });
  ws.getCell("F8").value = "اسم السائق:";
  style(ws.getCell("F8"), {
    font: { bold: true, size: 11, color: { argb: BLACK } },
    fill: LIGHT_BLUE,
    border,
    alignment: { horizontal: "right", vertical: "middle" },
  });
  ws.mergeCells("G8:I8");
  style(ws.getCell("G8"), {
    value: permitData.driver_name || "",
    fill: WHITE,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });

  // ===== ROW 9: Table Header =====
  const hdrs = isAdd
    ? ["م", "كود الصنف", "اسم الصنف", "الوحدة", "الكمية", "سعر الوحدة", "اجمالي السعر", "ملاحظات"]
    : ["م", "كود الصنف", "اسم الصنف", "الوحدة", "الكمية", "الرصيد المتبقي", "سعر الوحدة", "مكان الصرف"];
  ["B9", "C9", "D9", "E9", "F9", "G9", "H9", "I9"].forEach((addr, i) => {
    style(ws.getCell(addr), {
      value: hdrs[i],
      font: { bold: true, size: 10, color: { argb: WHITE } },
      fill: NAVY,
      border: wb(),
      alignment: { horizontal: "center", vertical: "middle" },
    });
  });

  // ===== ROWS 10-24: Data rows (15 rows) =====
  const items = permitData.items || [];
  for (let row = 0; row < 15; row++) {
    const r = row + 10;
    const item = items[row] || null;
    const even = row % 2 === 1;
    const bg = even ? LIGHT_BLUE : WHITE;

    // Column B: row number
    style(ws.getCell(`B${r}`), {
      value: row + 1,
      font: { bold: true, size: 10, color: { argb: BLACK } },
      fill: bg,
      border,
      alignment: { horizontal: "center", vertical: "middle" },
    });

    if (item) {
      // For addition: C=code, D=name, E=unit, F=qty, G=unit_price, H=total_price, I=notes
      // For dispense:  C=code, D=name, E=unit, F=qty, G=remaining_stock, H=unit_price, I=dispatch_location
      const totalPrice = Number(item.total_price || 0) || (Number(item.quantity || 0) * Number(item.price || 0));

      if (isAdd) {
        style(ws.getCell(`C${r}`), { value: item.item_code || "—", font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`D${r}`), { value: item.item_name || "—", font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`E${r}`), { value: item.unit || "—", font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`F${r}`), { value: Number(item.quantity || 0), font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`G${r}`), { value: Number(item.price || 0), font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`H${r}`), { value: totalPrice, font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`I${r}`), { value: item.notes || "—", font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
      } else {
        style(ws.getCell(`C${r}`), { value: item.item_code || "—", font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`D${r}`), { value: item.item_name || "—", font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`E${r}`), { value: item.unit || "—", font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`F${r}`), { value: Number(item.quantity || 0), font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`G${r}`), { value: Number(item.remaining_stock || 0), font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`H${r}`), { value: Number(item.price || 0), font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
        style(ws.getCell(`I${r}`), { value: item.dispatch_location || "—", font: { size: 10, color: { argb: BLACK } }, fill: bg, border, alignment: { horizontal: "center", vertical: "middle" } });
      }
    } else {
      ["C", "D", "E", "F", "G", "H", "I"].forEach((col) => {
        style(ws.getCell(`${col}${r}`), {
          fill: bg,
          border,
          alignment: { horizontal: "center", vertical: "middle" },
        });
      });
    }
  }

  // ===== ROW 25: Total =====
  ws.mergeCells("B25:G25");
  style(ws.getCell("B25"), {
    value: "الاجمالي",
    font: { bold: true, size: 11, color: { argb: WHITE } },
    fill: NAVY,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });

  const grandTotal = items.reduce(
    (sum: number, item: any) => sum + (Number(item.total_price || 0) || (Number(item.quantity || 0) * Number(item.price || 0))),
    0
  );

  ws.mergeCells("H25:I25");
  style(ws.getCell("H25"), {
    value: `${grandTotal.toLocaleString("ar-EG")} ج.م`,
    font: { bold: true, size: 11, color: { argb: BLACK } },
    fill: GOLD,
    border,
    alignment: { horizontal: "center", vertical: "middle" },
  });

  // ===== FOOTER: Addition permit =====
  if (isAdd) {
    ws.mergeCells("B26:I26");
    style(ws.getCell("B26"), {
      value: "قرار لجنة الفحص:  □ مطابق     □ غير مطابق",
      font: { bold: true, size: 11, color: { argb: BLACK } },
      fill: LIGHT_BLUE,
      border,
      alignment: { horizontal: "right", vertical: "middle" },
    });

    ws.mergeCells("B27:I27");
    style(ws.getCell("B27"), {
      value: "ملاحظات لجنة الفحص:",
      font: { bold: true, size: 11, color: { argb: BLACK } },
      fill: WHITE,
      border,
      alignment: { horizontal: "right", vertical: "middle" },
    });

    ws.mergeCells("B28:C28");
    style(ws.getCell("B28"), {
      value: "عضو لجنة الفحص:",
      font: { bold: true, size: 10, color: { argb: BLACK } },
      fill: LIGHT_BLUE,
      border,
      alignment: { horizontal: "center", vertical: "middle" },
    });
    ws.mergeCells("D28:E28");
    style(ws.getCell("D28"), { fill: WHITE, border, alignment: { horizontal: "center", vertical: "middle" } });
    ws.mergeCells("F28:G28");
    style(ws.getCell("F28"), {
      value: "محاسب الموقع:",
      font: { bold: true, size: 10, color: { argb: BLACK } },
      fill: LIGHT_BLUE,
      border,
      alignment: { horizontal: "center", vertical: "middle" },
    });
    ws.mergeCells("H28:I28");
    style(ws.getCell("H28"), { fill: WHITE, border, alignment: { horizontal: "center", vertical: "middle" } });

    ws.mergeCells("B29:I29");
    style(ws.getCell("B29"), {
      value: "استلمت الاصناف اعلاه واصبحت عهدتي",
      font: { bold: true, size: 11, color: { argb: NAVY } },
      fill: LIGHT_BLUE,
      border,
      alignment: { horizontal: "center", vertical: "middle" },
    });

    ws.mergeCells("B30:C30");
    style(ws.getCell("B30"), {
      value: "امين المخزن:",
      font: { bold: true, size: 10, color: { argb: BLACK } },
      fill: LIGHT_BLUE,
      border,
      alignment: { horizontal: "center", vertical: "middle" },
    });
    ws.mergeCells("D30:E30");
    style(ws.getCell("D30"), { fill: WHITE, border, alignment: { horizontal: "center", vertical: "middle" } });
    ws.mergeCells("F30:G30");
    style(ws.getCell("F30"), {
      value: "مدير المشروع:",
      font: { bold: true, size: 10, color: { argb: BLACK } },
      fill: LIGHT_BLUE,
      border,
      alignment: { horizontal: "center", vertical: "middle" },
    });
    ws.mergeCells("H30:I30");
    style(ws.getCell("H30"), { fill: WHITE, border, alignment: { horizontal: "center", vertical: "middle" } });

    ws.pageSetup.printArea = "A1:J30";
  } else {
    // ===== FOOTER: Dispense permit =====
    ws.mergeCells("B26:C26");
    style(ws.getCell("B26"), {
      value: "المستلم:",
      font: { bold: true, size: 10, color: { argb: BLACK } },
      fill: LIGHT_BLUE,
      border,
      alignment: { horizontal: "center", vertical: "middle" },
    });
    ws.mergeCells("D26:E26");
    style(ws.getCell("D26"), { fill: WHITE, border, alignment: { horizontal: "center", vertical: "middle" } });
    ws.mergeCells("F26:G26");
    style(ws.getCell("F26"), {
      value: "امين المخزن:",
      font: { bold: true, size: 10, color: { argb: BLACK } },
      fill: LIGHT_BLUE,
      border,
      alignment: { horizontal: "center", vertical: "middle" },
    });
    ws.mergeCells("H26:I26");
    style(ws.getCell("H26"), { fill: WHITE, border, alignment: { horizontal: "center", vertical: "middle" } });

    ws.mergeCells("B27:C27");
    style(ws.getCell("B27"), {
      value: "مدير المشروع:",
      font: { bold: true, size: 10, color: { argb: BLACK } },
      fill: LIGHT_BLUE,
      border,
      alignment: { horizontal: "center", vertical: "middle" },
    });
    ws.mergeCells("D27:I27");
    style(ws.getCell("D27"), { fill: WHITE, border, alignment: { horizontal: "center", vertical: "middle" } });

    ws.pageSetup.printArea = "A1:J27";
  }

  // ===== Download =====
  const filename = isAdd
    ? `اذن-اضافة-${permitData.permission_number}.xlsx`
    : `اذن-صرف-${permitData.permission_number}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
