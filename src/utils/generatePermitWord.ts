import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  TextRun,
  ImageRun,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  HeightRule,
  convertInchesToTwip,
  TableLayoutType,
} from "docx";

// ===== Colors =====
const NAVY = "0D2B6E";
const LIGHT_BLUE = "EEF2FB";
const WHITE = "FFFFFF";
const GOLD = "C9A84C";

// ===== Fetch logo as ArrayBuffer =====
async function getLogoBuffer(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch("/Devcon_logo.png");
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

// ===== Helper: navy border on all sides =====
function navyBorder() {
  return {
    top: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
    left: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
    right: { style: BorderStyle.SINGLE, size: 6, color: NAVY },
  };
}

// ===== Helper: make a shaded cell with optional colspan/rowspan =====
interface CellOpts {
  paragraphs: Paragraph[];
  shade?: string;
  columnSpan?: number;
  rowSpan?: number;
  width?: { size: number; type: WidthType };
}

function makeCell(opts: CellOpts): TableCell {
  return new TableCell({
    children: opts.paragraphs,
    shading: opts.shade ? { type: ShadingType.CLEAR, fill: opts.shade } : undefined,
    columnSpan: opts.columnSpan,
    rowSpan: opts.rowSpan,
    width: opts.width,
    borders: navyBorder(),
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 40, bottom: 40, left: 80, right: 80 },
  });
}

// ===== Helper: text paragraph =====
interface TextOpts {
  text: string;
  bold?: boolean;
  size?: number; // half-points
  color?: string;
  alignment?: AlignmentType;
  rtl?: boolean;
}

function textPara(opts: TextOpts): Paragraph {
  return new Paragraph({
    alignment: opts.alignment ?? AlignmentType.CENTER,
    bidirectional: opts.rtl !== false,
    children: [
      new TextRun({
        text: opts.text,
        bold: opts.bold ?? false,
        size: opts.size ?? 20,
        color: opts.color ?? "000000",
        font: "Arial",
        rtl: opts.rtl !== false,
      }),
    ],
  });
}

// ===== Helper: label cell (navy bg, white bold text) =====
function headerLabelCell(text: string, columnSpan?: number): TableCell {
  return makeCell({
    paragraphs: [textPara({ text, bold: true, color: WHITE, size: 20 })],
    shade: NAVY,
    columnSpan,
  });
}

// ===== Helper: field label cell (light blue) =====
function labelCell(text: string, columnSpan?: number): TableCell {
  return makeCell({
    paragraphs: [textPara({ text, bold: true, size: 20 })],
    shade: LIGHT_BLUE,
    columnSpan,
  });
}

// ===== Helper: value cell (white) =====
function valueCell(text: string, columnSpan?: number, shade?: string): TableCell {
  return makeCell({
    paragraphs: [textPara({ text, size: 20 })],
    shade: shade ?? WHITE,
    columnSpan,
  });
}

// ===== Helper: table row with fixed height =====
function row(cells: TableCell[], heightTwips?: number): TableRow {
  return new TableRow({
    children: cells,
    height: heightTwips ? { value: heightTwips, rule: HeightRule.EXACT } : undefined,
    tableHeader: false,
  });
}

// ===== Total columns = 8 (matching template) =====
const NUM_COLS = 8;

// Each column as a fraction of page width (page = ~9072 twips usable)
// Approx col widths in twips (~6.5" usable at 1440 twips/inch = 9360 total)
const PAGE_WIDTH_TWIP = 9072; // with 0.5" margins each side on A4
const COL_WIDTHS_PCT = [5, 10, 22, 8, 8, 10, 10, 27]; // percentages, sum=100

function colWidth(pct: number) {
  return Math.round((pct / 100) * PAGE_WIDTH_TWIP);
}

// ===== Main function =====
export async function generatePermitWord(permitData: any): Promise<void> {
  const isAdd = permitData.direction === "add";
  const logoBuffer = await getLogoBuffer();

  // Format date
  const dateStr = permitData.date
    ? new Date(permitData.date).toLocaleDateString("ar-EG")
    : "____  /  ____  /  20____";

  // Contractor / Supplier value
  const contractorVal =
    permitData.contractor_name || permitData.employee_name || permitData.dispatch_location || "";
  const supplierContractorVal = isAdd
    ? permitData.supplier_name || ""
    : contractorVal;

  // ===== Title row (logo + title merged) =====
  // We'll put logo in one cell and the title in the rest

  const logoCell = makeCell({
    paragraphs: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: logoBuffer
          ? [
              new ImageRun({
                data: logoBuffer,
                transformation: { width: 100, height: 45 },
                type: "png",
              }),
            ]
          : [new TextRun({ text: "DEVCON", bold: true, size: 24, color: NAVY, font: "Arial" })],
      }),
    ],
    shade: WHITE,
    columnSpan: 2,
  });

  const titleText = isAdd
    ? "مستند إضـافـة\n(مشتراه – محوّلة – ارتجاع)"
    : "مستند صـرف\n(داخلي – خارجي – تكهين – مقاولين)";

  const titleCell = makeCell({
    paragraphs: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        bidirectional: true,
        children: titleText.split("\n").flatMap((line, i) => [
          new TextRun({
            text: line,
            bold: true,
            size: 28,
            color: WHITE,
            font: "Arial",
            rtl: true,
            break: i > 0 ? 1 : 0,
          }),
        ]),
      }),
    ],
    shade: NAVY,
    columnSpan: 6,
  });

  const titleRow = row([titleCell, logoCell], convertInchesToTwip(0.7));

  // ===== SER row =====
  const serRow = row([
    labelCell(`SER: ${permitData.permission_number || "___________"}`, 3),
    makeCell({
      paragraphs: [textPara({ text: "شركة ديفكون للمقاولات", bold: true, color: NAVY, size: 24 })],
      shade: WHITE,
      columnSpan: 3,
    }),
    makeCell({ paragraphs: [textPara({ text: "" })], shade: WHITE, columnSpan: 2 }),
  ], convertInchesToTwip(0.3));

  // ===== Date row =====
  const dateRow = row([
    labelCell(`التاريخ:  ${dateStr}`, NUM_COLS),
  ], convertInchesToTwip(0.3));

  // ===== Project row =====
  const projectRow = row([
    labelCell("المشروع:", 3),
    valueCell(permitData.project_name || "", 5),
  ], convertInchesToTwip(0.3));

  // ===== Type + Warehouse row =====
  const typeWarehouseRow = row([
    labelCell(isAdd ? "نوع الاضافة:" : "نوع الصرف:", 2),
    valueCell(permitData.type || "", 3),
    labelCell("المخزن:", 1),
    valueCell(permitData.warehouse_name || "", 2),
  ], convertInchesToTwip(0.3));

  // ===== Supplier / Contractor row =====
  const supplierRow = row([
    labelCell(isAdd ? "اسم المورد:" : "اسم المقاول:", 2),
    valueCell(supplierContractorVal, 6),
  ], convertInchesToTwip(0.3));

  // ===== Vehicle + Driver row =====
  const vehicleRow = row([
    labelCell("رقم السياسة:", 2),
    valueCell(permitData.vehicle_number || "", 2),
    labelCell("اسم السائق:", 2),
    valueCell(permitData.driver_name || "", 2),
  ], convertInchesToTwip(0.3));

  // ===== Table header row =====
  const addHeaders = ["م", "كود الصنف", "اسم الصنف", "الوحدة", "الكمية", "سعر الوحدة", "إجمالي السعر", "ملاحظات"];
  const dispHeaders = ["م", "كود الصنف", "اسم الصنف", "الوحدة", "الكمية", "الرصيد المتبقي", "سعر الوحدة", "مكان الصرف"];
  const headers = isAdd ? addHeaders : dispHeaders;

  const tableHeaderRow = row(
    headers.map((h) => headerLabelCell(h)),
    convertInchesToTwip(0.28)
  );

  // ===== Data rows (15 rows) =====
  const items: any[] = permitData.items || [];
  const dataRows: TableRow[] = [];
  for (let i = 0; i < 15; i++) {
    const item = items[i] || null;
    const shade = i % 2 === 1 ? LIGHT_BLUE : WHITE;
    const totalPrice = item
      ? Number(item.total_price || 0) || Number(item.quantity || 0) * Number(item.price || 0)
      : 0;

    let cells: TableCell[];
    if (item) {
      if (isAdd) {
        cells = [
          makeCell({ paragraphs: [textPara({ text: String(i + 1), bold: true, size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: item.item_code || "", size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: item.item_name || "", size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: item.unit || "", size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: String(item.quantity || ""), size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: String(item.price || ""), size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: totalPrice > 0 ? String(totalPrice) : "", size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: item.notes || "", size: 18 })], shade }),
        ];
      } else {
        cells = [
          makeCell({ paragraphs: [textPara({ text: String(i + 1), bold: true, size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: item.item_code || "", size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: item.item_name || "", size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: item.unit || "", size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: String(item.quantity || ""), size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: String(item.remaining_stock || ""), size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: String(item.price || ""), size: 18 })], shade }),
          makeCell({ paragraphs: [textPara({ text: item.dispatch_location || "", size: 18 })], shade }),
        ];
      }
    } else {
      cells = Array.from({ length: NUM_COLS }, (_, ci) =>
        makeCell({
          paragraphs: [textPara({ text: ci === 0 ? String(i + 1) : "", size: 18, bold: ci === 0 })],
          shade,
        })
      );
    }

    dataRows.push(row(cells, convertInchesToTwip(0.27)));
  }

  // ===== Total row =====
  const grandTotal = items.reduce(
    (sum: number, item: any) =>
      sum + (Number(item.total_price || 0) || Number(item.quantity || 0) * Number(item.price || 0)),
    0
  );

  const totalRow = row([
    makeCell({
      paragraphs: [textPara({ text: "الإجمالي", bold: true, color: WHITE, size: 22 })],
      shade: NAVY,
      columnSpan: 6,
    }),
    makeCell({
      paragraphs: [textPara({ text: `${grandTotal.toLocaleString("ar-EG")} ج.م`, bold: true, size: 22 })],
      shade: GOLD,
      columnSpan: 2,
    }),
  ], convertInchesToTwip(0.3));

  // ===== Footer rows =====
  let footerRows: TableRow[] = [];

  if (isAdd) {
    footerRows = [
      // قرار لجنة الفحص
      row([
        labelCell("قرار لجنة الفحص:  □ مطابق     □ غير مطابق", NUM_COLS),
      ], convertInchesToTwip(0.3)),

      // ملاحظات لجنة الفحص
      row([
        makeCell({
          paragraphs: [textPara({ text: "ملاحظات لجنة الفحص:", bold: true, size: 20 })],
          shade: WHITE,
          columnSpan: NUM_COLS,
        }),
      ], convertInchesToTwip(0.3)),

      // عضو لجنة الفحص | value | محاسب الموقع | value
      row([
        labelCell("عضو لجنة الفحص:", 2),
        valueCell("", 2),
        labelCell("محاسب الموقع:", 2),
        valueCell("", 2),
      ], convertInchesToTwip(0.3)),

      // استلمت الأصناف أعلاه
      row([
        makeCell({
          paragraphs: [textPara({ text: "استلمت الأصناف أعلاه وأصبحت عهدتي", bold: true, color: NAVY, size: 22 })],
          shade: LIGHT_BLUE,
          columnSpan: NUM_COLS,
        }),
      ], convertInchesToTwip(0.35)),

      // أمين المخزن | value | مدير المشروع | value
      row([
        labelCell("أمين المخزن:", 2),
        valueCell("", 2),
        labelCell("مدير المشروع:", 2),
        valueCell("", 2),
      ], convertInchesToTwip(0.3)),
    ];
  } else {
    footerRows = [
      // المستلم | value | أمين المخزن | value
      row([
        labelCell("المستلم:", 2),
        valueCell("", 2),
        labelCell("أمين المخزن:", 2),
        valueCell("", 2),
      ], convertInchesToTwip(0.3)),

      // مدير المشروع | value
      row([
        labelCell("مدير المشروع:", 2),
        valueCell("", 6),
      ], convertInchesToTwip(0.3)),
    ];
  }

  // ===== Assemble main table =====
  const mainTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [
      titleRow,
      serRow,
      dateRow,
      projectRow,
      typeWarehouseRow,
      supplierRow,
      vehicleRow,
      tableHeaderRow,
      ...dataRows,
      totalRow,
      ...footerRows,
    ],
    columnWidths: COL_WIDTHS_PCT.map((p) => colWidth(p)),
  });

  // ===== Build document =====
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: convertInchesToTwip(8.27), height: convertInchesToTwip(11.69) },
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.5),
              right: convertInchesToTwip(0.5),
            },
          },
        },
        children: [mainTable],
      },
    ],
    styles: {
      default: {
        document: {
          run: { font: "Arial", rtl: true },
          paragraph: { bidirectional: true },
        },
      },
    },
  });

  // ===== Download =====
  const filename = isAdd
    ? `اذن-اضافة-${permitData.permission_number}.docx`
    : `اذن-صرف-${permitData.permission_number}.docx`;

  const buffer = await Packer.toBlob(doc);
  const url = URL.createObjectURL(buffer);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
